use rand::seq::IndexedRandom;
use serde::{Deserialize, Serialize};
use std::{
    collections::VecDeque,
    time::{Duration, Instant},
};
use tetris_lib::{Board, FallingBlock, StepError, Tetrimino};

use crate::ws_world::model::WsId;
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum TetrisGameActionType {
    Setup {
        next: Vec<Tetrimino>,
    },
    End {
        //
    },
    NextAdd {
        next: Tetrimino,
    },
    SpawnFromNext {
        spawn: Tetrimino,
    },
    SpawnFromHold {
        spawn: Tetrimino,
        hold: Option<Tetrimino>,
    },
    RemoveFalling,
    MoveRight,
    MoveLeft,
    RotateRight,
    RotateLeft,
    Step,
    Placing,
    LineClear,
    HardDrop,
    SoftDrop,
    HoldFalling {
        hold: Tetrimino,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TetrisGameAction {
    elapsed: u128,
    action: TetrisGameActionType,
}

impl TetrisGameAction {
    //
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TetrisGame {
    pub ws_id: WsId,
    pub board: Board,
    pub hold: Option<Tetrimino>,
    pub score: u32,
    pub clear_line: u32,
    pub level: u32,
    pub next: VecDeque<Tetrimino>,
    pub is_can_hold: bool,
    pub is_started: bool,
    pub is_game_over: bool,
    #[serde(skip)]
    #[serde(default = "std::time::Instant::now")]
    pub last_step_at: Instant, // started: Instant,
    // elapsed: Duration,
    pub actions: Vec<TetrisGameAction>,
    pub actions_buffer: Vec<TetrisGameAction>,
    pub elapsed: u128,

    #[serde(skip)]
    #[serde(default = "std::time::Instant::now")]
    pub placing_delay_at: Instant,
    pub is_placing_delay: bool,
    pub placing_reset_cnt: u8,
}

impl TetrisGame {
    pub fn new(ws_id: WsId) -> Self {
        Self {
            ws_id,
            board: Board::new_common(),
            hold: None,
            clear_line: 0,
            score: 0,
            next: VecDeque::new(),
            level: 0,
            is_can_hold: true,
            is_started: false,
            is_game_over: false,
            last_step_at: Instant::now(),
            actions: vec![],
            actions_buffer: vec![],
            elapsed: 0,
            placing_delay_at: Instant::now(),
            is_placing_delay: false,
            placing_reset_cnt: 10,
        }
    }

    fn push_action_buffer(&mut self, action: TetrisGameActionType) {
        self.actions_buffer.push(TetrisGameAction {
            elapsed: self.elapsed,
            action: action,
        });
    }

    pub fn get_action_buffer(&mut self) -> Vec<TetrisGameAction> {
        self.actions.extend(self.actions_buffer.clone());
        let s = self.actions_buffer.clone();
        self.actions_buffer.clear();
        return s;
    }

    fn rand_tetrimino() -> Tetrimino {
        *[
            Tetrimino::I,
            Tetrimino::J,
            Tetrimino::L,
            Tetrimino::O,
            Tetrimino::S,
            Tetrimino::T,
            Tetrimino::Z,
        ]
        .choose(&mut rand::rng())
        .unwrap()
    }

    pub fn setup(&mut self) {
        for _ in 0..5 {
            let tetrimino = Self::rand_tetrimino();
            self.next.push_back(tetrimino);
        }
        self.push_action_buffer(TetrisGameActionType::Setup {
            next: self.next.clone().into(),
        });
    }

    pub fn try_step(&mut self) -> Result<(), StepError> {
        match self.board.try_step() {
            Ok(_) => Ok(()),
            Err(err) => Err(err),
        }
    }

    pub fn step(&mut self) -> Result<(), StepError> {
        match self.board.try_step() {
            Ok(step) => {
                self.board.apply_step(step);
                self.push_action_buffer(TetrisGameActionType::Step);
            }
            Err(err) => Err(err)?,
        };
        Ok(())
    }

    pub fn delayed_place_falling(&mut self) {
        if !self.is_placing_delay {
            self.is_placing_delay = true;
            self.placing_delay_at = Instant::now();
            return;
        }

        if Instant::now() - self.placing_delay_at < Duration::from_millis(1000) {
            // not yet
            return;
        }

        // delay at
        self.board.place_falling();
        self.push_action_buffer(TetrisGameActionType::Placing);

        if self.board.has_placed_above(3) {
            self.is_game_over = true;
            self.push_action_buffer(TetrisGameActionType::End {});
            return;
        }

        let clear = self.board.try_line_clear();
        if !clear.is_empty() {
            self.clear_line += clear.len() as u32;
            self.push_action_buffer(TetrisGameActionType::LineClear);
            self.board.apply_line_clear(clear);
        }

        self.spawn_next();
        self.is_can_hold = true;

        self.is_placing_delay = false;
    }

    pub fn place_falling(&mut self) {
        self.board.place_falling();
        self.push_action_buffer(TetrisGameActionType::Placing);

        if self.board.has_placed_above(3) {
            self.is_game_over = true;
            self.push_action_buffer(TetrisGameActionType::End {});
            return;
        }

        let clear = self.board.try_line_clear();
        if !clear.is_empty() {
            self.clear_line += clear.len() as u32;
            self.push_action_buffer(TetrisGameActionType::LineClear);
            self.board.apply_line_clear(clear);
        }

        self.spawn_next();
        self.is_can_hold = true;
    }

    pub fn spawn_next(&mut self) -> anyhow::Result<()> {
        let Some(next_tetr) = self.next.pop_front() else {
            return Ok(());
        };
        let added_next = Self::rand_tetrimino();
        self.next.push_back(added_next);
        self.push_action_buffer(TetrisGameActionType::NextAdd { next: added_next });

        let new_tile = self.board.try_spawn_falling(next_tetr)?;
        self.board.apply_spawn_falling(new_tile);
        self.push_action_buffer(TetrisGameActionType::SpawnFromNext { spawn: next_tetr });

        Ok(())
    }

    pub fn action_move_left(&mut self) -> anyhow::Result<()> {
        let plan = self
            .board
            .try_move_falling(tetris_lib::MoveDirection::Left)?;
        self.board.apply_move_falling(plan);

        self.push_action_buffer(TetrisGameActionType::MoveLeft);

        if self.placing_reset_cnt > 0 {
            self.placing_delay_at = Instant::now();
            self.placing_reset_cnt -= 1;
        }
        Ok(())
    }

    pub fn action_move_right(&mut self) -> anyhow::Result<()> {
        let plan = self
            .board
            .try_move_falling(tetris_lib::MoveDirection::Right)?;
        self.board.apply_move_falling(plan);

        self.push_action_buffer(TetrisGameActionType::MoveRight);

        if self.placing_reset_cnt > 0 {
            self.placing_delay_at = Instant::now();
            self.placing_reset_cnt -= 1;
        }
        Ok(())
    }

    pub fn action_rotate_right(&mut self) -> anyhow::Result<()> {
        let plan = self
            .board
            .try_rotate_falling(tetris_lib::RotateDirection::Right)?;
        self.board.apply_rotate_falling(plan);

        self.push_action_buffer(TetrisGameActionType::RotateRight);

        if self.placing_reset_cnt > 0 {
            self.placing_delay_at = Instant::now();
            self.placing_reset_cnt -= 1;
        }
        Ok(())
    }

    pub fn action_roatet_left(&mut self) -> anyhow::Result<()> {
        let plan = self
            .board
            .try_rotate_falling(tetris_lib::RotateDirection::Left)?;
        self.board.apply_rotate_falling(plan);

        self.push_action_buffer(TetrisGameActionType::RotateLeft);

        if self.placing_reset_cnt > 0 {
            self.placing_delay_at = Instant::now();
            self.placing_reset_cnt -= 1;
        }
        Ok(())
    }

    pub fn action_hard_drop(&mut self) -> anyhow::Result<()> {
        let _ = self.board.hard_drop();
        self.push_action_buffer(TetrisGameActionType::HardDrop);
        // self.step()?;
        self.is_placing_delay = false;
        self.place_falling();
        Ok(())
    }

    pub fn action_soft_drop(&mut self) -> anyhow::Result<()> {
        self.push_action_buffer(TetrisGameActionType::SoftDrop);
        self.step()?;
        Ok(())
    }

    pub fn action_hold(&mut self) {
        if !self.is_can_hold {
            return;
        }
        self.is_can_hold = false;
        if let Some(hold_tetr) = self.hold {
            let fallings = self.board.get_falling_blocks();
            if let Some(f) = fallings.first() {
                self.hold = Some(f.falling.kind);
            }
            self.board.remove_falling_blocks();
            self.push_action_buffer(TetrisGameActionType::RemoveFalling);

            let spawn = self.board.try_spawn_falling(hold_tetr).unwrap();
            self.board.apply_spawn_falling(spawn);
            self.push_action_buffer(TetrisGameActionType::SpawnFromHold {
                spawn: hold_tetr,
                hold: self.hold,
            });
        } else {
            let fallings = self.board.get_falling_blocks();
            if let Some(f) = fallings.first() {
                self.hold = Some(f.falling.kind);
                self.push_action_buffer(TetrisGameActionType::HoldFalling {
                    hold: f.falling.kind,
                });

                self.board.remove_falling_blocks();
                self.push_action_buffer(TetrisGameActionType::RemoveFalling);

                self.spawn_next();
            }
        }
    }

    pub fn get_client_info(&mut self) -> serde_json::Value {
        // self.hint();
        let board = self
            .board
            .board()
            .iter()
            .map(|line| {
                line.iter()
                    .map(|tile| {
                        //
                        let i = match tile {
                            tetris_lib::Tile::Falling(FallingBlock { kind, .. }) => {
                                *kind as usize + 1
                            }
                            tetris_lib::Tile::Placed(id) => *id as usize + 1,
                            tetris_lib::Tile::Hint(_) => 8,
                            tetris_lib::Tile::Empty => 0,
                        };
                        i
                    })
                    .collect::<Vec<_>>()
            })
            .collect::<Vec<_>>();
        serde_json::json!({
            "board": board,
            "next": self.next.iter().map(|t| *t as usize + 1).collect::<Vec<_>>(),
            "hold": self.hold.map(|h| h as usize + 1),
            "isCanHold": self.is_can_hold,
            "isGameOver": self.is_game_over,
        })
    }
}
