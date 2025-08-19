use std::collections::VecDeque;

use rand::{Rng, seq::IndexedRandom};
use serde::{Deserialize, Serialize};
use tetris_lib::{Board, SpawnError, StepError, Tetrimino, Tile, TileAt};

use crate::ws_world::{
    game2::model::{GarbageQueue, GarbageQueueKind, TetrisGameAction, TetrisGameActionType},
    model::{UserId, WsId},
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TetrisGame {
    pub ws_id: WsId,
    pub user_id: UserId,
    pub nick_name: String,
    pub board: Board,
    pub hold: Option<Tetrimino>,
    pub score: u32,
    pub clear_line: u32,
    pub level: u32,
    pub next: VecDeque<Tetrimino>,
    pub is_can_hold: bool,
    pub is_started: bool,
    pub is_board_end: bool,
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
    //
    pub garbage_queue: VecDeque<GarbageQueue>,

    pub attack_list: VecDeque<u8>,

    //
    pub line_40_clear: bool,
    pub battle_win: bool,
    pub seven_bag: VecDeque<Tetrimino>,
    pub act_seq: u32,
    pub last_step_tick: u32,
}
impl TetrisGame {
    pub fn new(ws_id: WsId, user_id: UserId, nick_name: String) -> Self {
        Self {
            ws_id,
            user_id,
            nick_name,
            board: Board::new(10, 26),
            hold: None,
            clear_line: 0,
            score: 0,
            next: VecDeque::new(),
            level: 1,
            is_can_hold: true,
            is_started: false,
            is_board_end: false,
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
            garbage_queue: VecDeque::new(),
            line_40_clear: false,
            battle_win: false,
            seven_bag: VecDeque::new(),
            act_seq: 0,
            attack_list: VecDeque::new(),
            last_step_tick: 0,
        }
    }
    pub fn push_action_buffer(&mut self, action: TetrisGameActionType) {
        self.act_seq += 1;
        self.actions_buffer.push(TetrisGameAction {
            tick: self.tick,
            action: action,
            seq: self.act_seq,
        });
    }
    pub fn get_action_buffer(&mut self) -> Vec<TetrisGameAction> {
        self.actions.extend(self.actions_buffer.clone());
        let s = self.actions_buffer.clone();
        self.actions_buffer.clear();
        return s;
    }
    pub fn board_reset(&mut self) {
        self.board = Board::new(10, 26);
    }

    pub fn garbage_queueing(&mut self, attack_line: u8, from: String) {
        self.garbage_queue.push_back(GarbageQueue {
            from,
            line: attack_line,
            tick: self.tick,
            kind: GarbageQueueKind::Queued,
        });

        self.push_action_buffer(TetrisGameActionType::GarbageQueue {
            queue: self.garbage_queue.clone().into(),
        });
    }
    pub fn add_garbage(&mut self, empty: Vec<u8>) {
        for x in &empty {
            if !self.board.push_garbage_line(*x as usize) {
                // return false;
            };
        }
        // self.push_action_buffer(TetrisGameActionType::AddGarbage { empty: empty });
    }
    pub fn garbage_add(&mut self, clear_len: u8) {
        let mut is_garbage_changed = false;

        let mut temp = clear_len;
        loop {
            let front = self.garbage_queue.pop_front();
            if let Some(mut front) = front {
                is_garbage_changed = true;
                if let Some(v) = temp.checked_sub(front.line) {
                    temp = v;
                } else {
                    front.line = front.line - temp;
                    self.garbage_queue.push_front(front);
                    break;
                }
            } else {
                break;
            }
        }

        let mut add_gargabe = vec![];
        loop {
            let x = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
                .choose(&mut rand::rng())
                .unwrap();
            if let Some(front) = self.garbage_queue.pop_front() {
                is_garbage_changed = true;
                if matches!(front.kind, GarbageQueueKind::Ready) {
                    for _ in 0..front.line {
                        add_gargabe.push(*x);
                    }
                } else {
                    self.garbage_queue.push_front(front);
                    break;
                }
            } else {
                break;
            }
        }
        if is_garbage_changed {
            self.push_action_buffer(TetrisGameActionType::GarbageQueue {
                queue: self.garbage_queue.clone().into(),
            });
        }
        if !add_gargabe.is_empty() {
            // for x in &add_gargabe {
            //     if !self.board.push_garbage_line(*x as usize) {
            //         return false;
            //     };
            // }
            self.push_action_buffer(TetrisGameActionType::DoGarbageAdd { empty: add_gargabe });
        }
    }
}

impl TetrisGame {
    pub fn step(&mut self) -> Result<(), StepError> {
        match self.board.try_step() {
            Ok(step) => {
                self.board.apply_step(step);
                self.push_action_buffer(TetrisGameActionType::Step);
            }
            Err(err) => Err(err)?,
        };
        self.last_step_tick = self.tick;
        Ok(())
    }

    pub fn line_clear(&mut self) -> usize {
        // TODO Attack
        let clear = self.board.try_line_clear();
        let clear_len = clear.len();
        self.garbage_add(clear.len() as u8);

        self.board.apply_line_clear(clear);
        self.push_action_buffer(TetrisGameActionType::LineClear);
        clear_len
    }

    pub fn placing(&mut self) {
        self.board.place_falling();
        self.push_action_buffer(TetrisGameActionType::Placing);
    }

    pub fn remove_falling(&mut self) {
        tracing::info!("remove falling");
        self.board.remove_falling_blocks();
        self.push_action_buffer(TetrisGameActionType::RemoveFalling);
    }

    fn rand_tetrimino(&mut self) -> Tetrimino {
        if self.seven_bag.is_empty() {
            self.seven_bag = VecDeque::from(vec![
                Tetrimino::I,
                Tetrimino::J,
                Tetrimino::L,
                Tetrimino::O,
                Tetrimino::S,
                Tetrimino::T,
                Tetrimino::Z,
            ]);
        }
        let idx = rand::rng().random_range(0..self.seven_bag.len());
        self.seven_bag.remove(idx).unwrap()
    }
    pub fn shift_next(&mut self) -> Option<Tetrimino> {
        let t = self.next.pop_front();
        self.push_action_buffer(TetrisGameActionType::ShiftNext { next: t });
        t
    }
    pub fn push_next(&mut self, tetrimino: Tetrimino) {
        // let added_next = self.rand_tetrimino();
        self.next.push_back(tetrimino);
        self.push_action_buffer(TetrisGameActionType::PushNext { next: tetrimino });
    }
    pub fn spawn_from_next(&mut self) {
        let next_tetr = self.shift_next();
        if let Some(next_tetr) = next_tetr {
            //
        }
    }
    fn spawn_with_game_over_check(&mut self, tetr: Tetrimino) -> Result<bool, SpawnError> {
        let new_tiles = self.board.try_spawn_falling(tetr)?;
        for TileAt { location, .. } in &new_tiles {
            if !matches!(self.board.location(location.x, location.y), Tile::Empty) {
                // self.is_board_end = true;
                // self.push_action_buffer(TetrisGameActionType::BoardEnd {
                //     kind: BoardEndKind::SpawnImpossible,
                //     elapsed: self.elapsed - 3000,
                // });
                return Ok(false);
            }
        }
        self.step_tick = 9999;
        self.board.apply_spawn_falling(new_tiles);
        Ok(true)
    }
    pub fn spawn(&mut self, tetrimino: Tetrimino) -> Result<(), SpawnError> {
        let new_tiles = self.board.try_spawn_falling(tetrimino)?;
        self.board.apply_spawn_falling(new_tiles);
        self.push_action_buffer(TetrisGameActionType::Spawn { spawn: tetrimino });
        Ok(())
    }
    pub fn setup(&mut self, next: Vec<Tetrimino>, hold: Option<Tetrimino>) {
        // for _ in 0..5 {
        //     let tetrimino = self.rand_tetrimino();
        //     self.next.push_back(tetrimino);
        // }

        self.next.extend(next);
        self.hold = hold;
        self.push_action_buffer(TetrisGameActionType::Setup {
            next: self.next.clone().into(),
        });
    }

    pub fn action_move_left(&mut self) -> anyhow::Result<()> {
        let plan = self
            .board
            .try_move_falling(tetris_lib::MoveDirection::Left)?;
        self.board.apply_move_falling(plan);
        self.push_action_buffer(TetrisGameActionType::MoveLeft);
        Ok(())
    }

    pub fn action_move_right(&mut self) -> anyhow::Result<()> {
        let plan = self
            .board
            .try_move_falling(tetris_lib::MoveDirection::Right)?;
        self.board.apply_move_falling(plan);
        self.push_action_buffer(TetrisGameActionType::MoveRight);
        Ok(())
    }

    pub fn action_rotate_left(&mut self) -> anyhow::Result<()> {
        let plan = self
            .board
            .try_rotate_falling(tetris_lib::RotateDirection::Left)?;
        self.board.apply_rotate_falling(plan);
        self.push_action_buffer(TetrisGameActionType::RotateLeft);
        Ok(())
    }

    pub fn action_rotate_right(&mut self) -> anyhow::Result<()> {
        let plan = self
            .board
            .try_rotate_falling(tetris_lib::RotateDirection::Right)?;
        self.board.apply_rotate_falling(plan);
        self.push_action_buffer(TetrisGameActionType::RotateRight);
        Ok(())
    }
    pub fn action_soft_drop(&mut self) -> anyhow::Result<()> {
        match self.board.try_step() {
            Ok(step) => {
                self.board.apply_step(step);
                self.push_action_buffer(TetrisGameActionType::SoftDrop);
            }
            Err(err) => Err(err)?,
        };

        Ok(())
    }
    pub fn action_hard_drop(&mut self) -> anyhow::Result<()> {
        let dropcnt = self.board.hard_drop();
        self.push_action_buffer(TetrisGameActionType::HardDrop);

        Ok(())
    }
    pub fn action_hold(&mut self) -> anyhow::Result<()> {
        Ok(())
    }

    pub fn add_hold(&mut self, tetrimino: Tetrimino) {
        self.hold = Some(tetrimino);
        self.push_action_buffer(TetrisGameActionType::AddHold { hold: tetrimino });
    }

    pub fn set_info(&mut self, level: Option<u32>, score: Option<u32>, line: Option<u32>) {
        if let Some(level) = level {
            self.level = level;
        }
        if let Some(score) = score {
            self.score = score;
        }
        if let Some(line) = line {
            self.clear_line = line;
        }
        self.push_action_buffer(TetrisGameActionType::SetInfo { level, score, line });
    }
    pub fn score_effect(&mut self, kind: String, combo: u32) {
        self.push_action_buffer(TetrisGameActionType::ScoreEffect { kind, combo });
    }

    pub fn board_end(&mut self) {
        self.is_board_end = true;
        self.push_action_buffer(TetrisGameActionType::BoardEnd {
            kind: super::model::BoardEndKind::SpawnImpossible,
            elapsed: self.elapsed,
        });
    }

    // TODO: boardEmpty to 0 mapping for reduce msg size
    pub fn game_sync_data(&self) -> serde_json::Value {
        let next = self.next.clone();
        let board = self.board.board().clone();
        let hold = self.hold.clone();
        let garbage_q = self.garbage_queue.clone();
        let score = self.score;
        let level = self.level;
        let line = self.clear_line;
        let is_board_end = self.is_board_end;
        let elapsed = self.elapsed;

        serde_json::json!({
            "next": next,
            "board": board,
            "hold": hold,
            "garbageQueue": garbage_q,
            "score": score,
            "level": level,
            "line": line,
            "isBoardEnd": is_board_end,
            "elapsed": elapsed
        })
    }
}
