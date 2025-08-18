use serde::{Deserialize, Serialize};
use tetris_lib::Tetrimino;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GarbageQueue {
    pub from: String,
    pub line: u8,
    pub tick: u32,
    pub kind: GarbageQueueKind,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum GarbageQueueKind {
    Queued,
    Ready,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TetrisGameAction {
    pub tick: u32,
    pub action: TetrisGameActionType,
    pub seq: u32,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum TetrisGameActionType {
    Setup {
        next: Vec<Tetrimino>,
    },
    End {
        //
    },
    BoardStart,
    Ticking,
    PushNext {
        next: Tetrimino,
    },
    ShiftNext {
        next: Option<Tetrimino>,
    },
    SpawnFromNext {
        spawn: Tetrimino,
    },
    SpawnFromHold {
        spawn: Tetrimino,
        hold: Option<Tetrimino>,
    },
    Spawn {
        spawn: Tetrimino,
    },
    RemoveFalling,
    MoveRight,
    MoveLeft,
    RotateRight,
    RotateLeft,
    Step,
    DoStep,
    Placing,
    LineClear,
    HardDrop,
    AddHold {
        hold: Tetrimino,
    },
    SoftDrop,
    HoldFalling {
        hold: Tetrimino,
    },
    Score {
        kind: TetrisScore,
        level: u8,
        score: u32,
        combo: u32,
        line: u32,
    },
    GarbageQueue {
        queue: Vec<GarbageQueue>,
    },
    AddGarbage {
        empty: Vec<u8>,
    },
    DoGarbageAdd {
        empty: Vec<u8>,
    },
    BoardEnd {
        // msg: Option<String>,
        kind: BoardEndKind,
        elapsed: u128,
        // end_th: u8,
    },
    SetInfo {
        level: Option<u32>,
        score: Option<u32>,
        line: Option<u32>,
    },
    ScoreEffect {
        kind: String,
        combo: u32,
    },
    // GameEnd {
    //     elapsed: u128,
    // },
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BoardEndKind {
    SpawnImpossible,
    Line40Clear,
    BattleWinner,
    Exit,
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
pub fn level_to_gravity_tick(level: u32) -> u32 {
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

pub fn attack_line(kind: TetrisScore) -> Option<u8> {
    match kind {
        TetrisScore::Double => Some(1),
        TetrisScore::Triple => Some(2),
        TetrisScore::Tetris => Some(4),
        TetrisScore::TSpinSingle => Some(2),
        TetrisScore::TSpinDouble => Some(4),
        TetrisScore::TSpinTriple => Some(6),
        _ => None,
    }
}
