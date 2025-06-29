#[cfg(test)]
mod tests;

#[derive(Debug)]
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

#[derive(Debug)]
pub enum RotateDirection {
    Left,
    Right,
}

#[derive(Debug)]
pub enum RotateError {
    OutOfBounds(RotateDirection),
    Blocked(RotateDirection, (usize, usize)),
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

#[derive(Debug)]
pub enum StepError {
    OutOfBounds,
    InvalidShape,
    Blocked((usize, usize)),
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

#[derive(Debug)]
pub enum SpawnError {
    FallingTileExists,
}

impl std::fmt::Display for SpawnError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "Falling tile already exists")
    }
}

impl std::error::Error for SpawnError {}

#[derive(Debug)]
pub enum MoveError {
    OutOfBounds(MoveDirection),
    Blocked(MoveDirection, (usize, usize)),
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

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(usize)]
pub enum Tetrimino {
    I,
    O,
    T,
    J,
    L,
    S,
    Z,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(usize)]
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

#[derive(Debug, Clone, PartialEq, Eq)]
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

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Tile {
    Falling(FallingBlock),
    Placed(u8),
    Hint(u8),
    Empty,
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
        [(2, -1), (1, 0), (0, 1), (-1, 2)],   // D0
        [(1, 2), (0, 1), (-1, 0), (-2, -1)],  // D90
        [(-2, 1), (-1, 0), (0, -1), (1, -2)], // D180
        [(-1, -2), (0, -1), (1, 0), (2, 1)],  // D270
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
    [(0, 0), (1, 0), (2, 0), (3, 0)],
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

#[derive(Debug)]
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
    const HEIGHT: usize = 23;
    const WIDTH: usize = 10;

    pub fn new_common() -> Self {
        Self::new(Self::WIDTH, Self::HEIGHT)
    }

    pub fn new(width: usize, height: usize) -> Self {
        Self(vec![vec![Tile::Empty; width]; height])
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

    pub fn try_spawn_falling(
        &self,
        tetrimino: Tetrimino,
    ) -> Result<Vec<((usize, usize), Tile)>, SpawnError> {
        match tetrimino {
            Tetrimino::I => self.try_spawn_falling_at(tetrimino, 3, 1),
            Tetrimino::O => self.try_spawn_falling_at(tetrimino, 4, 1),
            Tetrimino::T => self.try_spawn_falling_at(tetrimino, 4, 1),
            Tetrimino::J => self.try_spawn_falling_at(tetrimino, 3, 1),
            Tetrimino::L => self.try_spawn_falling_at(tetrimino, 5, 1),
            Tetrimino::S => self.try_spawn_falling_at(tetrimino, 4, 1),
            Tetrimino::Z => self.try_spawn_falling_at(tetrimino, 3, 1),
        }
    }

    pub fn try_spawn_falling_at(
        &self,
        tetrimino: Tetrimino,
        x: usize,
        y: usize,
    ) -> Result<Vec<((usize, usize), Tile)>, SpawnError> {
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
                (((x as i8 + dx) as usize, (y as i8 + dy) as usize), tile)
            })
            .collect::<Vec<_>>())
    }

    pub fn apply_spawn_falling(&mut self, tiles: Vec<((usize, usize), Tile)>) {
        for ((x, y), tile) in tiles {
            *self.location_mut(x, y) = tile;
        }
    }

    pub fn get_falling_blocks(&self) -> Vec<(usize, usize, FallingBlock)> {
        let mut fallings = vec![];
        'outer: for y in 0..self.y_len() {
            for x in 0..self.x_len() {
                let t = self.location(x, y);
                match t {
                    Tile::Falling(active_block) => {
                        fallings.push((x, y, active_block.clone()));
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

    pub fn try_move_falling(
        &self,
        dir: MoveDirection,
    ) -> Result<Vec<((usize, usize), (usize, usize, FallingBlock))>, MoveError> {
        let fallings = self.get_falling_blocks();

        let mut to_move = vec![];
        for (x, y, falling) in fallings {
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
                    return Err(MoveError::Blocked(dir, (x, y)));
                }
            }

            to_move.push(((x, y), (new_x, y, falling)));
        }

        if to_move.len() != 4 {
            return Err(MoveError::InvalidShape);
        }

        Ok(to_move)
    }

    pub fn apply_move_falling(
        &mut self,
        fallings: Vec<((usize, usize), (usize, usize, FallingBlock))>,
    ) {
        for ((x, y), _) in &fallings {
            *self.location_mut(*x, *y) = Tile::Empty;
        }
        for (_, (x, y, falling)) in fallings {
            *self.location_mut(x, y) = Tile::Falling(falling);
        }
    }

    pub fn try_rotate_falling(
        &self,
        dir: RotateDirection,
    ) -> Result<Vec<((usize, usize), (usize, usize, FallingBlock))>, RotateError> {
        let fallings = self.get_falling_blocks();
        let mut to_rotate = vec![];
        for (x, y, mut falling) in fallings {
            let (dx, dy) = match dir {
                RotateDirection::Left => {
                    Board::left_rotate_reference(&falling.kind, &falling.rotation, falling.id)
                }
                RotateDirection::Right => {
                    Board::right_rotate_reference(&falling.kind, &falling.rotation, falling.id)
                }
            };
            let new_x = usize::try_from(x as i8 + dx).ok();
            let new_y = usize::try_from(y as i8 + dy).ok();

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
                _ => return Err(RotateError::Blocked(dir, (x, y))),
            }

            match dir {
                RotateDirection::Left => falling.rotation = falling.rotation.next_ccw(),
                RotateDirection::Right => falling.rotation = falling.rotation.next_cw(),
            }
            to_rotate.push(((x, y), (new_x, new_y, falling)));
        }

        if to_rotate.len() != 4 {
            return Err(RotateError::InvalidShape);
        }

        Ok(to_rotate)
    }

    pub fn apply_rotate_falling(
        &mut self,
        fallings: Vec<((usize, usize), (usize, usize, FallingBlock))>,
    ) {
        for ((x, y), _) in &fallings {
            *self.location_mut(*x, *y) = Tile::Empty;
        }
        for (_, (new_x, new_y, falling)) in fallings {
            *self.location_mut(new_x, new_y) = Tile::Falling(falling);
        }
    }

    // ok 면 다음으로 이동할 위치
    pub fn try_step(
        &self,
    ) -> Result<Vec<((usize, usize), (usize, usize, FallingBlock))>, StepError> {
        let fallings = self.get_falling_blocks();
        let mut to_step = vec![];
        for (x, y, falling) in fallings {
            // 바닥에 닿은경우
            if y + 1 >= self.y_len() {
                return Err(StepError::OutOfBounds);
            }

            match self.location(x, y + 1) {
                Tile::Falling(FallingBlock { kind, .. }) if *kind == falling.kind => {}
                Tile::Empty => {}
                Tile::Hint(_) => {}
                _ => return Err(StepError::Blocked((x, y))),
            }
            to_step.push(((x, y), (x, y + 1, falling)));
        }
        if to_step.len() != 4 {
            return Err(StepError::InvalidShape);
        }

        Ok(to_step)
    }

    pub fn apply_step(&mut self, fallings: Vec<((usize, usize), (usize, usize, FallingBlock))>) {
        for ((x, y), _) in &fallings {
            *self.location_mut(*x, *y) = Tile::Empty;
        }
        for (_, (x, y, falling)) in fallings {
            *self.location_mut(x, y) = Tile::Falling(falling);
        }
    }

    pub fn place_falling(&mut self) {
        let active_blocks = self.get_falling_blocks();
        for (x, y, active_block) in active_blocks {
            *self.location_mut(x, y) = Tile::Placed(active_block.kind as u8);
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

    pub fn hard_drop(&mut self) -> Result<(), StepError> {
        loop {
            self.apply_step(self.try_step()?);
        }
    }

    pub fn show_falling_hint(&mut self) {
        let fallings = self.get_falling_blocks();
        let _ = self.hard_drop();
        let targets = self.get_falling_blocks();
        for (x, y, target_block) in targets {
            *self.location_mut(x, y) = Tile::Hint(target_block.kind as u8);
        }
        for (x, y, falling) in fallings {
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
