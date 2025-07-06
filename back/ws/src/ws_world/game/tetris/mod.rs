use rand::seq::IndexedRandom;
use serde::{Deserialize, Serialize};
use std::{
    collections::VecDeque,
    time::{Duration, Instant},
};
use tetris_lib::{Board, FallingBlock, Tetrimino};

use crate::ws_world::model::WsId;
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum TetrisGameAction {
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
    pub last_step: Instant, // started: Instant,
    // elapsed: Duration,
    pub actions: Vec<TetrisGameAction>,
    pub actions_buffer: Vec<TetrisGameAction>,
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
            last_step: Instant::now(),
            actions: vec![],
            actions_buffer: vec![],
        }
    }

    fn push_action_buffer(&mut self, action: TetrisGameAction) {
        self.actions_buffer.push(action);
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
        self.push_action_buffer(TetrisGameAction::Setup {
            next: self.next.clone().into(),
        });
    }

    pub fn step(&mut self) -> anyhow::Result<()> {
        match self.board.try_step() {
            Ok(step) => {
                self.board.apply_step(step);
                self.push_action_buffer(TetrisGameAction::Step);
            }
            Err(err) => match err {
                tetris_lib::StepError::OutOfBounds => self.place_falling(),
                tetris_lib::StepError::Blocked(_) => self.place_falling(),
                tetris_lib::StepError::InvalidShape => Err(err)?,
            },
        };
        Ok(())
    }

    fn place_falling(&mut self) {
        self.board.place_falling();
        self.push_action_buffer(TetrisGameAction::Placing);

        if self.board.has_placed_above(3) {
            self.is_game_over = true;
            self.push_action_buffer(TetrisGameAction::End {});
            return;
        }

        let clear = self.board.try_line_clear();
        if !clear.is_empty() {
            self.push_action_buffer(TetrisGameAction::LineClear);
        }
        self.board.apply_line_clear(clear);

        self.spawn_next();
        self.is_can_hold = true;
    }

    pub fn spawn_next(&mut self) -> anyhow::Result<()> {
        let Some(next_tetr) = self.next.pop_front() else {
            return Ok(());
        };
        let added_next = Self::rand_tetrimino();
        self.next.push_back(added_next);
        self.push_action_buffer(TetrisGameAction::NextAdd { next: added_next });

        let new_tile = self.board.try_spawn_falling(next_tetr)?;
        self.board.apply_spawn_falling(new_tile);
        self.push_action_buffer(TetrisGameAction::SpawnFromNext { spawn: next_tetr });

        Ok(())
    }

    fn hint(&mut self) {
        self.board.remove_falling_hint();
        self.board.show_falling_hint();
    }

    pub fn action_move_left(&mut self) -> anyhow::Result<()> {
        let plan = self
            .board
            .try_move_falling(tetris_lib::MoveDirection::Left)?;
        self.board.apply_move_falling(plan);

        self.push_action_buffer(TetrisGameAction::MoveLeft);
        Ok(())
    }

    pub fn action_move_right(&mut self) -> anyhow::Result<()> {
        let plan = self
            .board
            .try_move_falling(tetris_lib::MoveDirection::Right)?;
        self.board.apply_move_falling(plan);

        self.push_action_buffer(TetrisGameAction::MoveRight);
        Ok(())
    }

    pub fn action_rotate_right(&mut self) -> anyhow::Result<()> {
        let plan = self
            .board
            .try_rotate_falling(tetris_lib::RotateDirection::Right)?;
        self.board.apply_rotate_falling(plan);

        self.push_action_buffer(TetrisGameAction::RotateRight);
        Ok(())
    }

    pub fn action_roatet_left(&mut self) -> anyhow::Result<()> {
        let plan = self
            .board
            .try_rotate_falling(tetris_lib::RotateDirection::Left)?;
        self.board.apply_rotate_falling(plan);

        self.push_action_buffer(TetrisGameAction::RotateLeft);
        Ok(())
    }

    pub fn action_hard_drop(&mut self) -> anyhow::Result<()> {
        let _ = self.board.hard_drop();
        self.push_action_buffer(TetrisGameAction::HardDrop);
        self.step()?;
        Ok(())
    }

    pub fn action_soft_drop(&mut self) -> anyhow::Result<()> {
        self.push_action_buffer(TetrisGameAction::SoftDrop);
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
            self.push_action_buffer(TetrisGameAction::RemoveFalling);

            let spawn = self.board.try_spawn_falling(hold_tetr).unwrap();
            self.board.apply_spawn_falling(spawn);
            self.push_action_buffer(TetrisGameAction::SpawnFromHold { spawn: hold_tetr });
        } else {
            let fallings = self.board.get_falling_blocks();
            if let Some(f) = fallings.first() {
                self.hold = Some(f.falling.kind);
                self.push_action_buffer(TetrisGameAction::HoldFalling {
                    hold: f.falling.kind,
                });

                self.board.remove_falling_blocks();
                self.push_action_buffer(TetrisGameAction::RemoveFalling);

                self.spawn_next();
            }
        }
    }

    pub fn get_client_info(&mut self) -> serde_json::Value {
        self.hint();
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
