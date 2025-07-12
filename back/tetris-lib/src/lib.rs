use serde::{Deserialize, Serialize};

#[cfg(test)]
mod tests;

#[cfg(feature = "wasm")]
mod wasm;

#[derive(Debug, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(ts_rs::TS))]
#[cfg_attr(feature = "wasm", ts(export))]
pub enum MoveDirection {
    Left,
    Right,
}

impl MoveDirection {
    pub fn dx(&self) -> isize {
        match self {
            Self::Left => -1,
            Self::Right => 1,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[cfg_attr(feature = "wasm", derive(ts_rs::TS))]
#[cfg_attr(feature = "wasm", ts(export))]
pub enum RotateDirection {
    Left,
    Right,
}

#[derive(Debug, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(ts_rs::TS))]
#[cfg_attr(feature = "wasm", ts(export))]
pub enum RotateError {
    OutOfBounds(RotateDirection),
    Blocked(RotateDirection, Location),
    InvalidShape,
}

impl std::fmt::Display for RotateError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            RotateError::OutOfBounds(dir) => write!(f, "Rotation out of bounds: {:?}", dir),
            RotateError::Blocked(dir, pos) => write!(f, "Rotation blocked at {:?}: {:?}", pos, dir),
            RotateError::InvalidShape => write!(f, "Rotation shape is invalid"),
        }
    }
}

impl std::error::Error for RotateError {}

#[derive(Debug, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(ts_rs::TS))]
#[cfg_attr(feature = "wasm", ts(export))]
pub enum StepError {
    OutOfBounds,
    InvalidShape,
    Blocked(Location),
}

impl std::fmt::Display for StepError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            StepError::OutOfBounds => write!(f, "Falling block reached the bottom"),
            StepError::InvalidShape => write!(f, "Falling block shape is invalid"),
            StepError::Blocked(pos) => write!(f, "Falling block is blocked at {:?}", pos),
        }
    }
}

impl std::error::Error for StepError {}

#[derive(Debug, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(ts_rs::TS))]
#[cfg_attr(feature = "wasm", ts(export))]
pub enum SpawnError {
    FallingTileExists,
}

impl std::fmt::Display for SpawnError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "Falling tile already exists")
    }
}

impl std::error::Error for SpawnError {}

#[derive(Debug, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(ts_rs::TS))]
#[cfg_attr(feature = "wasm", ts(export))]
pub enum MoveError {
    OutOfBounds(MoveDirection),
    Blocked(MoveDirection, Location),
    InvalidShape,
}

impl std::fmt::Display for MoveError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            MoveError::OutOfBounds(dir) => write!(f, "Move out of bounds: {:?}", dir),
            MoveError::Blocked(dir, pos) => write!(f, "Move blocked at {:?}: {:?}", pos, dir),
            MoveError::InvalidShape => write!(f, "Move shape is invalid"),
        }
    }
}

impl std::error::Error for MoveError {}

#[repr(usize)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(ts_rs::TS))]
#[cfg_attr(feature = "wasm", ts(export))]

pub enum Tetrimino {
    I,
    O,
    T,
    J,
    L,
    S,
    Z,
}
impl From<Tetrimino> for String {
    fn from(value: Tetrimino) -> Self {
        (&value).into()
    }
}
impl From<&Tetrimino> for String {
    fn from(value: &Tetrimino) -> Self {
        match value {
            Tetrimino::I => "I".to_string(),
            Tetrimino::O => "O".to_string(),
            Tetrimino::T => "T".to_string(),
            Tetrimino::J => "J".to_string(),
            Tetrimino::L => "L".to_string(),
            Tetrimino::S => "S".to_string(),
            Tetrimino::Z => "Z".to_string(),
        }
    }
}

#[repr(usize)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(ts_rs::TS))]
#[cfg_attr(feature = "wasm", ts(export))]
pub enum Rotate {
    D0,
    D90,
    D180,
    D270,
}

impl Rotate {
    pub fn next_cw(&self) -> Self {
        match self {
            Self::D0 => Self::D90,
            Self::D90 => Self::D180,
            Self::D180 => Self::D270,
            Self::D270 => Self::D0,
        }
    }

    pub fn next_ccw(&self) -> Self {
        match self {
            Self::D0 => Self::D270,
            Self::D90 => Self::D0,
            Self::D180 => Self::D90,
            Self::D270 => Self::D180,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(ts_rs::TS))]
#[cfg_attr(feature = "wasm", ts(export))]
pub struct FallingBlock {
    pub kind: Tetrimino,
    pub rotation: Rotate,
    pub id: u8, // 블록 번호
}
impl FallingBlock {
    pub fn with_id(mut self, id: u8) -> Self {
        self.id = id;
        self
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(ts_rs::TS))]
#[cfg_attr(feature = "wasm", ts(export))]
pub struct FallingBlockAt {
    pub falling: FallingBlock,
    pub location: Location,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(ts_rs::TS))]
#[cfg_attr(feature = "wasm", ts(export))]
pub struct Location {
    pub x: usize,
    pub y: usize,
}

impl Location {
    pub fn new(x: usize, y: usize) -> Self {
        Self { x, y }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(ts_rs::TS))]
#[cfg_attr(feature = "wasm", ts(export))]
pub struct FallingBlockPlan {
    pub as_is: Location,
    pub to_be: FallingBlockAt,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(ts_rs::TS))]
#[cfg_attr(feature = "wasm", ts(export))]
pub enum Tile {
    Falling(FallingBlock),
    Placed(u8),
    Hint(u8),
    Empty,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(ts_rs::TS))]
#[cfg_attr(feature = "wasm", ts(export))]
pub struct TileAt {
    pub tile: Tile,
    pub location: Location,
}

impl std::fmt::Display for Tile {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Tile::Falling(FallingBlock { kind, .. }) => {
                f.write_str(&format!("{kind:?}"))?;
            }
            Tile::Empty => {
                f.write_str(".")?;
            }
            Tile::Placed(_) => {
                f.write_str("P")?;
            }
            Tile::Hint(_) => {
                f.write_str("H")?;
            }
        };
        Ok(())
    }
}

const RIGHT_ROTATE_TABLE: [[[(i8, i8); 4]; 4]; 7] = [
    // Tetrimino::I
    [
        // id 0, id 1, id 2, id 3
        [(2, -1), (1, 0), (0, 1), (-1, 2)],   // D0 (D0 -> D90)
        [(1, 2), (0, 1), (-1, 0), (-2, -1)],  // D90 (D90 -> D180)
        [(-2, 1), (-1, 0), (0, -1), (1, -2)], // D180 (D180 -> D270)
        [(-1, -2), (0, -1), (1, 0), (2, 1)],  // D270 (D270 -> D0)
    ],
    // Tetrimino::O
    [
        [(0, 0), (0, 0), (0, 0), (0, 0)],
        [(0, 0), (0, 0), (0, 0), (0, 0)],
        [(0, 0), (0, 0), (0, 0), (0, 0)],
        [(0, 0), (0, 0), (0, 0), (0, 0)],
    ],
    // Tetrimino::T
    [
        [(1, 1), (1, -1), (0, 0), (-1, 1)],
        [(-1, 1), (1, 1), (0, 0), (-1, -1)],
        [(-1, -1), (-1, 1), (0, 0), (1, -1)],
        [(1, -1), (-1, -1), (0, 0), (1, 1)],
    ],
    // Tetrimino::J
    [
        [(2, 0), (1, -1), (0, 0), (-1, 1)],
        [(0, 2), (1, 1), (0, 0), (-1, -1)],
        [(-2, 0), (-1, 1), (0, 0), (1, -1)],
        [(0, -2), (-1, -1), (0, 0), (1, 1)],
    ],
    // Tetrimino::L
    [
        [(0, 2), (1, -1), (0, 0), (-1, 1)],
        [(-2, 0), (1, 1), (0, 0), (-1, -1)],
        [(0, -2), (-1, 1), (0, 0), (1, -1)],
        [(2, 0), (-1, -1), (0, 0), (1, 1)],
    ],
    // Tetrimino::S
    [
        [(1, 1), (0, 2), (1, -1), (0, 0)],
        [(-1, 1), (-2, 0), (1, 1), (0, 0)],
        [(-1, -1), (0, -2), (-1, 1), (0, 0)],
        [(1, -1), (2, 0), (-1, -1), (0, 0)],
    ],
    // Tetrimino::Z
    [
        [(2, 0), (1, 1), (0, 0), (-1, 1)],
        [(0, 2), (-1, 1), (0, 0), (-1, -1)],
        [(-2, 0), (-1, -1), (0, 0), (1, -1)],
        [(0, -2), (1, -1), (0, 0), (1, 1)],
    ],
];

const SPAWN_TABLE: [[(i8, i8); 4]; 7] = [
    // Tetrimino::I
    // 01234
    [(0, 1), (1, 1), (2, 1), (3, 1)],
    // Tetrimino::O
    // 01
    // 23
    [(0, 0), (1, 0), (0, 1), (1, 1)],
    // Tetrimino::T
    //  0
    // 123
    [(0, 0), (-1, 1), (0, 1), (1, 1)],
    // Tetrimino::J
    // 0
    // 123
    [(0, 0), (0, 1), (1, 1), (2, 1)],
    // Tetrimino::L
    //   0
    // 123
    [(0, 0), (-2, 1), (-1, 1), (0, 1)],
    // Tetrimino::S
    //  01
    // 23
    [(0, 0), (1, 0), (-1, 1), (0, 1)],
    // Tetrimino::Z
    // 01
    //  23
    [(0, 0), (1, 0), (1, 1), (2, 1)],
];

const WALL_KICK_JLSTZ_TABLE: [[(i8, i8); 5]; 4] = [
    // test1 ... test5
    [(0, 0), (-1, 0), (-1, -1), (0, 2), (-1, 2)], // D0  (D0 -> D90)
    [(0, 0), (1, 0), (1, 1), (0, -2), (1, -2)],   // D90 (D90 -> D180)
    [(0, 0), (1, 0), (1, -1), (0, 2), (1, 2)],    // D180 (D180 -> D270)
    [(0, 0), (-1, 0), (-1, 1), (0, -2), (-1, -2)], // D270 (D270 -> D0)
];

const WALL_KICK_I_TABLE: [[(i8, i8); 5]; 4] = [
    // test1 ... test5
    [(0, 0), (-2, 0), (1, 0), (-2, 1), (1, -2)], // D0  (D0 -> D90)
    [(0, 0), (-1, 0), (2, 0), (-1, -2), (2, 1)], // D90 (D90 -> D180)
    [(0, 0), (2, 0), (-1, 0), (2, -1), (-1, 2)], // D180 (D180 -> D270)
    [(0, 0), (1, 0), (-2, 0), (1, 2), (-2, -1)], // D270 (D270 -> D0)
];

#[cfg_attr(feature = "wasm", derive(ts_rs::TS))]
#[cfg_attr(feature = "wasm", ts(export))]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Board(Vec<Vec<Tile>>);

impl std::fmt::Display for Board {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str("\n")?;
        f.write_str("_")?;
        for _ in 0..self.x_len() {
            f.write_str("_")?;
        }
        f.write_str("\n")?;
        let mut i = 0;
        for h in &self.0 {
            f.write_str(&format!("{i}"))?;
            i += 1;
            i %= 10;
            for w in h {
                f.write_str(&format!("{}", w))?;
            }
            f.write_str("\n")?;
        }
        f.write_str("_")?;
        for i in 0..self.x_len() {
            f.write_str(&format!("{}", i % 10))?;
        }
        f.write_str("\n")?;
        Ok(())
    }
}

impl Board {
    const HEIGHT: usize = 26;
    const WIDTH: usize = 10;

    pub fn new_common() -> Self {
        Self::new(Self::WIDTH, Self::HEIGHT)
    }

    pub fn new(width: usize, height: usize) -> Self {
        Self(vec![vec![Tile::Empty; width]; height])
    }

    fn right_rotate_wall_kick_reference(
        kind: &Tetrimino,
        rotate: &Rotate,
        test_idx: usize,
    ) -> (i8, i8) {
        let rot_idx = *rotate as usize;
        if *kind == Tetrimino::I {
            WALL_KICK_I_TABLE[rot_idx][test_idx]
        } else {
            WALL_KICK_JLSTZ_TABLE[rot_idx][test_idx]
        }
    }

    fn left_rotate_wall_kick_reference(
        kind: &Tetrimino,
        rotate: &Rotate,
        test_idx: usize,
    ) -> (i8, i8) {
        let next = rotate.next_ccw();
        let (dx, dy) = Board::right_rotate_wall_kick_reference(kind, &next, test_idx);
        (-dx, -dy)
    }

    fn right_rotate_reference(kind: &Tetrimino, rotate: &Rotate, id: u8) -> (i8, i8) {
        let kind_idx = *kind as usize;
        let rot_idx = *rotate as usize;
        let id_idx = id as usize;

        RIGHT_ROTATE_TABLE[kind_idx][rot_idx][id_idx]
    }

    fn left_rotate_reference(kind: &Tetrimino, rotate: &Rotate, id: u8) -> (i8, i8) {
        let next = rotate.next_ccw();
        let (dx, dy) = Board::right_rotate_reference(kind, &next, id);
        (-dx, -dy)
    }

    pub fn location(&self, x: usize, y: usize) -> &Tile {
        &self.0[y][x]
    }

    pub fn location_mut(&mut self, x: usize, y: usize) -> &mut Tile {
        &mut self.0[y][x]
    }

    pub fn x_len(&self) -> usize {
        self.0[0].len()
    }
    pub fn y_len(&self) -> usize {
        self.0.len()
    }

    pub fn board(&self) -> &Vec<Vec<Tile>> {
        &self.0
    }

    pub fn line(&self, y: usize) -> &Vec<Tile> {
        &self.0[y]
    }

    pub fn try_spawn_falling(&self, tetrimino: Tetrimino) -> Result<Vec<TileAt>, SpawnError> {
        let y = if self.y_len() > 20 + 3 {
            self.y_len() - (20 + 3)
        } else {
            1
        };
        match tetrimino {
            Tetrimino::I => self.try_spawn_falling_at(tetrimino, 3, y),
            Tetrimino::O => self.try_spawn_falling_at(tetrimino, 4, y),
            Tetrimino::T => self.try_spawn_falling_at(tetrimino, 4, y),
            Tetrimino::J => self.try_spawn_falling_at(tetrimino, 3, y),
            Tetrimino::L => self.try_spawn_falling_at(tetrimino, 5, y),
            Tetrimino::S => self.try_spawn_falling_at(tetrimino, 4, y),
            Tetrimino::Z => self.try_spawn_falling_at(tetrimino, 3, y),
        }
    }

    pub fn try_spawn_falling_at(
        &self,
        tetrimino: Tetrimino,
        x: usize,
        y: usize,
    ) -> Result<Vec<TileAt>, SpawnError> {
        if !self.get_falling_blocks().is_empty() {
            return Err(SpawnError::FallingTileExists);
        }
        let falling = FallingBlock {
            kind: tetrimino,
            rotation: Rotate::D0,
            id: 0,
        };
        let ids = vec![
            Tile::Falling(falling.clone().with_id(0)),
            Tile::Falling(falling.clone().with_id(1)),
            Tile::Falling(falling.clone().with_id(2)),
            Tile::Falling(falling.with_id(3)),
        ];
        Ok(ids
            .into_iter()
            .enumerate()
            .map(|(idx, tile)| {
                let (dx, dy) = SPAWN_TABLE[tetrimino as usize][idx];
                TileAt {
                    tile: tile,
                    location: Location::new((x as i8 + dx) as usize, (y as i8 + dy) as usize),
                }
            })
            .collect::<Vec<_>>())
    }

    pub fn apply_spawn_falling(&mut self, tiles: Vec<TileAt>) {
        for TileAt {
            tile,
            location: Location { x, y },
        } in tiles
        {
            *self.location_mut(x, y) = tile;
        }
    }

    pub fn get_falling_blocks(&self) -> Vec<FallingBlockAt> {
        let mut fallings = vec![];
        'outer: for y in 0..self.y_len() {
            for x in 0..self.x_len() {
                let t = self.location(x, y);
                match t {
                    Tile::Falling(falling) => {
                        fallings.push(FallingBlockAt {
                            location: Location::new(x, y),
                            falling: falling.clone(),
                        });
                        if fallings.len() == 4 {
                            break 'outer;
                        }
                    }
                    _ => {}
                }
            }
        }

        fallings
    }

    pub fn remove_falling_blocks(&mut self) {
        let fallings = self.get_falling_blocks();
        for FallingBlockAt {
            location: Location { x, y },
            ..
        } in fallings
        {
            *self.location_mut(x, y) = Tile::Empty;
        }
    }

    pub fn try_move_falling(&self, dir: MoveDirection) -> Result<Vec<FallingBlockPlan>, MoveError> {
        let fallings = self.get_falling_blocks();

        let mut to_move = vec![];
        for FallingBlockAt {
            falling,
            location: Location { x, y },
        } in fallings
        {
            let new_x = x as isize + dir.dx();
            if new_x < 0 || new_x >= self.x_len() as isize {
                return Err(MoveError::OutOfBounds(dir));
            }
            let new_x = new_x as usize;

            match self.location(new_x, y) {
                Tile::Falling(FallingBlock { kind, .. }) if *kind == falling.kind => {}
                Tile::Empty => {}
                Tile::Hint(_) => {}
                _ => {
                    return Err(MoveError::Blocked(dir, Location::new(x, y)));
                }
            }
            to_move.push(FallingBlockPlan {
                as_is: Location::new(x, y),
                to_be: FallingBlockAt {
                    falling,
                    location: Location { x: new_x, y: y },
                },
            });
        }

        if to_move.len() != 4 {
            return Err(MoveError::InvalidShape);
        }

        Ok(to_move)
    }

    pub fn apply_move_falling(&mut self, fallings: Vec<FallingBlockPlan>) {
        for FallingBlockPlan {
            as_is: Location { x, y },
            ..
        } in &fallings
        {
            *self.location_mut(*x, *y) = Tile::Empty;
        }
        for FallingBlockPlan {
            to_be:
                FallingBlockAt {
                    falling,
                    location: Location { x, y },
                },
            ..
        } in fallings
        {
            *self.location_mut(x, y) = Tile::Falling(falling);
        }
    }

    fn try_rotate_falling_wall_kick_test(
        &self,
        fallings: &Vec<FallingBlockAt>,
        dir: RotateDirection,
        wall_kick: (i8, i8),
    ) -> Result<Vec<Location>, RotateError> {
        let mut to_rotate = vec![];
        for FallingBlockAt {
            falling,
            location: Location { x, y },
        } in fallings
        {
            let (dx, dy) = match dir {
                RotateDirection::Left => {
                    Board::left_rotate_reference(&falling.kind, &falling.rotation, falling.id)
                }
                RotateDirection::Right => {
                    Board::right_rotate_reference(&falling.kind, &falling.rotation, falling.id)
                }
            };
            let new_x = usize::try_from(*x as i8 + dx + wall_kick.0).ok();
            let new_y = usize::try_from(*y as i8 + dy + wall_kick.1).ok();

            let (Some(new_x), Some(new_y)) = (new_x, new_y) else {
                return Err(RotateError::OutOfBounds(dir));
            };

            if new_x >= self.x_len() || new_y >= self.y_len() {
                return Err(RotateError::OutOfBounds(dir));
            }

            match self.location(new_x, new_y) {
                Tile::Falling(FallingBlock { kind, .. }) if *kind == falling.kind => {}
                Tile::Empty => {}
                Tile::Hint(_) => {}
                _ => return Err(RotateError::Blocked(dir, Location::new(*x, *y))),
            }
            to_rotate.push(Location { x: new_x, y: new_y });
        }
        Ok(to_rotate)
    }

    pub fn try_rotate_falling(
        &self,
        dir: RotateDirection,
    ) -> Result<Vec<FallingBlockPlan>, RotateError> {
        let fallings = self.get_falling_blocks();
        let mut test_idx = 0;
        let wall_kick_tested_location = loop {
            let wall_kick = match dir {
                RotateDirection::Left => Board::left_rotate_wall_kick_reference(
                    &fallings[0].falling.kind,
                    &fallings[0].falling.rotation,
                    test_idx,
                ),
                RotateDirection::Right => Board::right_rotate_wall_kick_reference(
                    &fallings[0].falling.kind,
                    &fallings[0].falling.rotation,
                    test_idx,
                ),
            };
            match self.try_rotate_falling_wall_kick_test(&fallings, dir.clone(), wall_kick) {
                Ok(l) => break Ok(l),
                Err(e) => {
                    if test_idx >= 4 {
                        break Err(e);
                    }
                }
            }
            test_idx += 1;
        }?;

        let mut to_rotate = vec![];
        for (
            idx,
            FallingBlockAt {
                mut falling,
                location,
            },
        ) in fallings.into_iter().enumerate()
        {
            match dir {
                RotateDirection::Left => falling.rotation = falling.rotation.next_ccw(),
                RotateDirection::Right => falling.rotation = falling.rotation.next_cw(),
            }
            let data = &wall_kick_tested_location[idx];
            to_rotate.push(FallingBlockPlan {
                as_is: location,
                to_be: FallingBlockAt {
                    falling,
                    location: data.clone(),
                },
            });
        }

        if to_rotate.len() != 4 {
            return Err(RotateError::InvalidShape);
        }

        Ok(to_rotate)
    }

    pub fn apply_rotate_falling(&mut self, fallings: Vec<FallingBlockPlan>) {
        for FallingBlockPlan {
            as_is: Location { x, y },
            ..
        } in &fallings
        {
            *self.location_mut(*x, *y) = Tile::Empty;
        }
        for FallingBlockPlan {
            to_be:
                FallingBlockAt {
                    falling,
                    location: Location { x, y },
                },
            ..
        } in fallings
        {
            *self.location_mut(x, y) = Tile::Falling(falling);
        }
    }

    // ok 면 다음으로 이동할 위치
    pub fn try_step(&self) -> Result<Vec<FallingBlockPlan>, StepError> {
        let fallings = self.get_falling_blocks();
        let mut to_step = vec![];
        for FallingBlockAt {
            falling,
            location: Location { x, y },
        } in fallings
        {
            // 바닥에 닿은경우
            if y + 1 >= self.y_len() {
                return Err(StepError::OutOfBounds);
            }

            match self.location(x, y + 1) {
                Tile::Falling(FallingBlock { kind, .. }) if *kind == falling.kind => {}
                Tile::Empty => {}
                Tile::Hint(_) => {}
                _ => return Err(StepError::Blocked(Location::new(x, y))),
            }
            to_step.push(FallingBlockPlan {
                as_is: Location::new(x, y),
                to_be: FallingBlockAt {
                    falling,
                    location: Location::new(x, y + 1),
                },
            });
        }
        if to_step.len() != 4 {
            return Err(StepError::InvalidShape);
        }

        Ok(to_step)
    }

    pub fn apply_step(&mut self, fallings: Vec<FallingBlockPlan>) {
        for FallingBlockPlan {
            as_is: Location { x, y },
            ..
        } in &fallings
        {
            *self.location_mut(*x, *y) = Tile::Empty;
        }
        for FallingBlockPlan {
            to_be:
                FallingBlockAt {
                    falling,
                    location: Location { x, y },
                },
            ..
        } in fallings
        {
            *self.location_mut(x, y) = Tile::Falling(falling);
        }
    }

    pub fn place_falling(&mut self) {
        let fallings = self.get_falling_blocks();
        for FallingBlockAt {
            falling,
            location: Location { x, y },
        } in fallings
        {
            *self.location_mut(x, y) = Tile::Placed(falling.kind as u8);
        }
    }

    pub fn try_line_clear(&self) -> Vec<usize> {
        let mut to_clear_lines = vec![];
        for y in 0..self.y_len() {
            let mut placed_cnt = 0;
            for x in 0..self.x_len() {
                match self.location(x, y) {
                    Tile::Placed(_) => {
                        placed_cnt += 1;
                    }
                    _ => {}
                }
            }
            if placed_cnt == self.x_len() {
                to_clear_lines.push(y);
            }
        }
        to_clear_lines
    }

    pub fn apply_line_clear(&mut self, to_clear_lines: Vec<usize>) {
        for to_clear_line in to_clear_lines.iter().rev() {
            self.0.remove(*to_clear_line);
        }
        for _ in to_clear_lines {
            self.0.insert(0, vec![Tile::Empty; self.x_len()]);
        }
    }

    pub fn hard_drop(&mut self) -> u8 {
        let mut cnt = 0;
        loop {
            cnt += 1;
            match self.try_step() {
                Ok(plan) => self.apply_step(plan),
                Err(_) => return cnt,
            }
        }
    }

    pub fn show_falling_hint(&mut self) {
        let fallings = self.get_falling_blocks();
        let _ = self.hard_drop();
        let targets = self.get_falling_blocks();
        for FallingBlockAt {
            falling,
            location: Location { x, y },
        } in targets
        {
            *self.location_mut(x, y) = Tile::Hint(falling.kind as u8);
        }
        for FallingBlockAt {
            falling,
            location: Location { x, y },
        } in fallings
        {
            *self.location_mut(x, y) = Tile::Falling(falling);
        }
    }

    pub fn remove_falling_hint(&mut self) {
        for y in 0..self.y_len() {
            for x in 0..self.x_len() {
                match self.location(x, y) {
                    Tile::Hint(_) => *self.location_mut(x, y) = Tile::Empty,
                    _ => {}
                }
            }
        }
    }

    pub fn has_placed_above(&self, y: usize) -> bool {
        for y in 0..y {
            for x in 0..self.x_len() {
                match self.location(x, y) {
                    Tile::Placed(_) => return true,
                    _ => {}
                }
            }
        }
        return false;
    }
}
