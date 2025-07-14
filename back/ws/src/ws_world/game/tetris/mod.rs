use rand::seq::IndexedRandom;
use serde::{Deserialize, Serialize};
use std::{
    collections::VecDeque,
    time::{Duration, Instant},
};
use tetris_lib::{Board, FallingBlock, SpawnError, StepError, Tetrimino, Tile, TileAt};

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
    Score {
        kind: TetrisScore,
        level: u8,
        score: u32,
        combo: u32,
    },
    GameOver {},
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TetrisGameAction {
    tick: u32,
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
    pub level: u8,
    pub next: VecDeque<Tetrimino>,
    pub is_can_hold: bool,
    pub is_started: bool,
    pub is_game_over: bool,
    pub actions: Vec<TetrisGameAction>,
    pub actions_buffer: Vec<TetrisGameAction>,
    pub elapsed: u128,

    pub tick: u32,
    pub step_tick: u32,

    pub placing_delay_tick: u32,
    pub is_placing_delay: bool,
    pub placing_reset_cnt: u8,

    pub is_tspin: bool,

    pub combo: u32,
    pub combo_tick: u32,
}

impl TetrisGame {
    pub fn new(ws_id: WsId) -> Self {
        Self {
            ws_id,
            board: Board::new(10, 26),
            hold: None,
            clear_line: 0,
            score: 0,
            next: VecDeque::new(),
            level: 1,
            is_can_hold: true,
            is_started: false,
            is_game_over: false,
            tick: 0,
            step_tick: 0,
            actions: vec![],
            actions_buffer: vec![],
            elapsed: 0,
            placing_delay_tick: 0,
            is_placing_delay: false,
            placing_reset_cnt: 10,
            combo: 0,
            combo_tick: 0,
            is_tspin: false,
        }
    }

    pub fn push_action_buffer(&mut self, action: TetrisGameActionType) {
        self.actions_buffer.push(TetrisGameAction {
            tick: self.tick,
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
            }
            Err(err) => Err(err)?,
        };
        Ok(())
    }

    pub fn place_falling(&mut self) {
        self.board.place_falling();
        self.push_action_buffer(TetrisGameActionType::Placing);

        let clear = self.board.try_line_clear();
        let clear_len = clear.len();
        if !clear.is_empty() {
            self.clear_line += clear_len as u32;
            self.level = ((self.clear_line / LEVEL_UP_LINE + 1) as u8).clamp(1, 20);

            self.push_action_buffer(TetrisGameActionType::LineClear);
            self.board.apply_line_clear(clear);

            // combo
            if self.combo_tick > 0 {
                self.combo += 1;
            }
            self.combo_tick = 150; // 2.5 sec
        }

        let kind = if self.is_tspin {
            match clear_len {
                0 => Some(TetrisScore::TSpinZero),
                1 => Some(TetrisScore::TSpinSingle),
                2 => Some(TetrisScore::TSpinDouble),
                3 => Some(TetrisScore::TSpinTriple),
                _ => None,
            }
        } else {
            match clear_len {
                1 => Some(TetrisScore::Single),
                2 => Some(TetrisScore::Double),
                3 => Some(TetrisScore::Triple),
                4 => Some(TetrisScore::Tetris),
                _ => None,
            }
        };

        if let Some(kind) = kind {
            self.score += kind.score(self.level) + (200 * self.combo);
            self.push_action_buffer(TetrisGameActionType::Score {
                level: self.level,
                kind,
                score: self.score,
                combo: self.combo,
            });
        }

        self.is_tspin = false;

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

        self.spawn_with_game_over_check(next_tetr)?;
        self.push_action_buffer(TetrisGameActionType::SpawnFromNext { spawn: next_tetr });

        Ok(())
    }

    pub fn spawn_with_game_over_check(&mut self, tetr: Tetrimino) -> Result<(), SpawnError> {
        let new_tiles = self.board.try_spawn_falling(tetr)?;
        for TileAt { location, .. } in &new_tiles {
            if !matches!(self.board.location(location.x, location.y), Tile::Empty) {
                self.is_game_over = true;
                self.push_action_buffer(TetrisGameActionType::GameOver {});
                return Ok(());
            }
        }
        self.step_tick = 9999;
        self.board.apply_spawn_falling(new_tiles);
        Ok(())
    }

    fn tspin_check(&self) -> bool {
        // check tspin
        let fallings = self.board.get_falling_blocks();

        let is_tspin = if fallings[0].falling.kind == Tetrimino::T {
            // yes: SOFT DROP, HARD DROP, STEP
            // no: MOVE, ,
            let mut is_tspin = false;
            let mut is_3_corner = false;

            let center_loc = fallings
                .into_iter()
                .find(|f| f.falling.id == 2)
                .map(|f| f.location);
            let offsets = [(-1, -1), (1, -1), (-1, 1), (1, 1)];
            let mut placed_cnt = 0;
            if let Some(center_loc) = center_loc {
                for (offset_x, offset_y) in offsets {
                    let find_x = usize::try_from(center_loc.x as i8 + offset_x).ok();
                    let find_y = usize::try_from(center_loc.y as i8 + offset_y).ok();
                    match (find_x, find_y) {
                        (Some(find_x), Some(find_y)) => {
                            if find_x < self.board.x_len() && find_y < self.board.y_len() {
                                match self.board.location(find_x, find_y) {
                                    tetris_lib::Tile::Placed(_) => {
                                        placed_cnt += 1;
                                    }
                                    _ => {}
                                }
                            } else {
                                // wall
                                placed_cnt += 1;
                            }
                        }
                        _ => {}
                    }
                }
                if placed_cnt >= 3 {
                    is_3_corner = true;
                }
            }

            if is_3_corner {
                for a in self.actions.iter().chain(self.actions_buffer.iter()).rev() {
                    match a.action {
                        TetrisGameActionType::RotateLeft => {
                            is_tspin = true;
                            break;
                        }
                        TetrisGameActionType::RotateRight => {
                            is_tspin = true;
                            break;
                        }
                        TetrisGameActionType::MoveLeft => {
                            break;
                        }
                        TetrisGameActionType::MoveRight => {
                            break;
                        }
                        _ => continue,
                    }
                }
            }

            is_tspin
        } else {
            false
        };
        is_tspin
    }

    pub fn action_move_left(&mut self) -> anyhow::Result<()> {
        let plan = self
            .board
            .try_move_falling(tetris_lib::MoveDirection::Left)?;
        self.board.apply_move_falling(plan);

        self.push_action_buffer(TetrisGameActionType::MoveLeft);

        self.is_tspin = false;

        if self.placing_reset_cnt > 0 {
            self.placing_delay_tick = 0;
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

        self.is_tspin = false;

        if self.placing_reset_cnt > 0 {
            self.placing_delay_tick = 0;
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

        self.is_tspin = self.tspin_check();

        if self.placing_reset_cnt > 0 {
            self.placing_delay_tick = 0;
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

        self.is_tspin = self.tspin_check();

        if self.placing_reset_cnt > 0 {
            self.placing_delay_tick = 0;
            self.placing_reset_cnt -= 1;
        }
        Ok(())
    }

    pub fn action_hard_drop(&mut self) -> anyhow::Result<()> {
        let dropcnt = self.board.hard_drop();
        self.push_action_buffer(TetrisGameActionType::HardDrop);

        let soft_drop = TetrisScore::HardDrop;
        self.score += soft_drop.score(self.level) * dropcnt as u32;
        self.push_action_buffer(TetrisGameActionType::Score {
            kind: soft_drop,
            level: self.level,
            score: self.score,
            combo: self.combo,
        });

        self.is_placing_delay = false;
        self.place_falling();
        Ok(())
    }

    pub fn action_soft_drop(&mut self) -> anyhow::Result<()> {
        self.push_action_buffer(TetrisGameActionType::SoftDrop);

        let soft_drop = TetrisScore::SoftDrop;
        self.score += soft_drop.score(self.level);
        self.push_action_buffer(TetrisGameActionType::Score {
            kind: soft_drop,
            level: self.level,
            score: self.score,
            combo: self.combo,
        });
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

            // let spawn = self.board.try_spawn_falling(hold_tetr).unwrap();
            // self.board.apply_spawn_falling(spawn);
            self.spawn_with_game_over_check(hold_tetr).unwrap();
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

        self.is_placing_delay = false;
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

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum TetrisScore {
    Single,
    Double,
    Triple,
    Tetris,
    TSpinZero,
    TSpinSingle,
    TSpinDouble,
    TSpinTriple,
    SoftDrop,
    HardDrop,
    Combo,
}

impl TetrisScore {
    pub fn score(&self, level: u8) -> u32 {
        self.base_score() * level as u32
    }
    pub fn base_score(&self) -> u32 {
        match self {
            TetrisScore::Single => 100,
            TetrisScore::Double => 300,
            TetrisScore::Triple => 500,
            TetrisScore::Tetris => 800,
            TetrisScore::TSpinZero => 400,
            TetrisScore::TSpinSingle => 800,
            TetrisScore::TSpinDouble => 1200,
            TetrisScore::TSpinTriple => 1600,
            TetrisScore::SoftDrop => 1,
            TetrisScore::HardDrop => 2,
            TetrisScore::Combo => 200,
        }
    }
}

const LEVEL_UP_LINE: u32 = 10;
pub const PLACING_DELAY: u32 = 30;
pub fn level_to_gravity_tick(level: u8) -> u32 {
    match level {
        1 => 48,
        2 => 43,
        3 => 38,
        4 => 33,
        5 => 28,
        6 => 23,
        7 => 18,
        8 => 13,
        9 => 8,
        10 => 6,
        11..=13 => 5,
        14..=15 => 4,
        16..=17 => 3,
        18..=19 => 2,
        _ => 1, // 20 이상
    }
}
