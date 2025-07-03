use rand::seq::IndexedRandom;
use serde::{Deserialize, Serialize};
use std::{
    collections::VecDeque,
    time::{Duration, Instant},
};
use tetris_lib::{Board, FallingBlock, Tetrimino};

use crate::ws_world::model::WsId;

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
}

impl TetrisGame {
    pub fn new(ws_id: WsId) -> Self {
        let mut next = VecDeque::new();
        for _ in 0..5 {
            let tetrimino = Self::rand_tetrimino();
            next.push_back(tetrimino);
        }

        Self {
            ws_id,
            board: Board::new_common(),
            hold: None,
            clear_line: 0,
            score: 0,
            next,
            level: 0,
            is_can_hold: true,
            is_started: false,
            is_game_over: false,
            last_step: Instant::now(),
        }
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

    pub fn step(&mut self) -> anyhow::Result<()> {
        match self.board.try_step() {
            Ok(step) => {
                self.board.apply_step(step);
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
        if self.board.has_placed_above(3) {
            self.is_game_over = true;
            return;
        }
        let clear = self.board.try_line_clear();
        self.board.apply_line_clear(clear);

        self.spawn_next();
        self.is_can_hold = true;
    }

    pub fn spawn_next(&mut self) -> anyhow::Result<()> {
        let Some(next_tetr) = self.next.pop_front() else {
            return Ok(());
        };
        self.next.push_back(Self::rand_tetrimino());

        let new_tile = self.board.try_spawn_falling(next_tetr)?;
        self.board.apply_spawn_falling(new_tile);

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
        Ok(())
    }

    pub fn action_move_right(&mut self) -> anyhow::Result<()> {
        let plan = self
            .board
            .try_move_falling(tetris_lib::MoveDirection::Right)?;
        self.board.apply_move_falling(plan);
        Ok(())
    }

    pub fn action_rotate_right(&mut self) -> anyhow::Result<()> {
        let plan = self
            .board
            .try_rotate_falling(tetris_lib::RotateDirection::Right)?;
        self.board.apply_rotate_falling(plan);
        Ok(())
    }

    pub fn action_roatet_left(&mut self) -> anyhow::Result<()> {
        let plan = self
            .board
            .try_rotate_falling(tetris_lib::RotateDirection::Left)?;
        self.board.apply_rotate_falling(plan);
        Ok(())
    }

    pub fn action_hard_drop(&mut self) -> anyhow::Result<()> {
        let _ = self.board.hard_drop();
        self.step()?;
        Ok(())
    }

    pub fn action_soft_drop(&mut self) -> anyhow::Result<()> {
        self.step()?;
        Ok(())
    }

    pub fn action_hold(&mut self) {
        self.is_can_hold = false;
        if let Some(hold_tetr) = self.hold {
            let fallings = self.board.get_falling_blocks();
            if let Some(f) = fallings.first() {
                self.hold = Some(f.falling.kind);
            }
            self.board.remove_falling_blocks();

            let spawn = self.board.try_spawn_falling(hold_tetr).unwrap();
            self.board.apply_spawn_falling(spawn);
        } else {
            let fallings = self.board.get_falling_blocks();
            if let Some(f) = fallings.first() {
                self.hold = Some(f.falling.kind);

                self.board.remove_falling_blocks();

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
