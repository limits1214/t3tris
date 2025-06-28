/*
try_spawn_active
try_move
try_rotate
try_hard_drop
try_step
try_line_clear


apply_spawn_active
apply_move
apply_rotate
apply_hard_drop
apply_step
apply_line_clear

*/

#[cfg(test)]
mod tests;

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

pub const SPAWN_TABLE: [[(i8, i8); 4]; 7] = [
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

#[derive(Debug, Clone, Copy , PartialEq, Eq)]
#[repr(usize)]
#[rustfmt::skip]
pub enum Tetrimino {
    I, O, T, J, L, S, Z
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(usize)]
#[rustfmt::skip]
pub enum Rotate {
    D0, D90, D180, D270
}
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ActiveBlock {
    pub kind: Tetrimino,
    pub rotation: Rotate,
    pub id: u8, // 블록 번호
}
impl ActiveBlock {
    pub fn with_id(mut self, id: u8) -> Self {
        self.id = id;
        self
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Tile {
    Active(ActiveBlock),
    Placed(u8),
    Hint(u8),
    Empty,
}
impl std::fmt::Display for Tile {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Tile::Active(ActiveBlock { kind, .. }) => {
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

    pub fn try_spawn_active(
        &self,
        tetrimino: Tetrimino,
    ) -> Result<Vec<((usize, usize), Tile)>, SpawnError> {
        match tetrimino {
            Tetrimino::I => self.try_spawn_active_with_location(tetrimino, 3, 1),
            Tetrimino::O => self.try_spawn_active_with_location(tetrimino, 4, 1),
            Tetrimino::T => self.try_spawn_active_with_location(tetrimino, 4, 1),
            Tetrimino::J => self.try_spawn_active_with_location(tetrimino, 3, 1),
            Tetrimino::L => self.try_spawn_active_with_location(tetrimino, 5, 1),
            Tetrimino::S => self.try_spawn_active_with_location(tetrimino, 4, 1),
            Tetrimino::Z => self.try_spawn_active_with_location(tetrimino, 3, 1),
        }
    }

    pub fn try_spawn_active_with_location(
        &self,
        tetrimino: Tetrimino,
        x: usize,
        y: usize,
    ) -> Result<Vec<((usize, usize), Tile)>, SpawnError> {
        if !self.collect_active_blocks().is_empty() {
            return Err(SpawnError::ActiveTileExists);
        }
        let active_block = ActiveBlock {
            kind: tetrimino,
            rotation: Rotate::D0,
            id: 0,
        };
        let ids = vec![
            Tile::Active(active_block.clone().with_id(0)),
            Tile::Active(active_block.clone().with_id(1)),
            Tile::Active(active_block.clone().with_id(2)),
            Tile::Active(active_block.with_id(3)),
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

    pub fn apply_spawn_active(&mut self, tiles: Vec<((usize, usize), Tile)>) {
        for ((x, y), tile) in tiles {
            *self.location_mut(x, y) = tile;
        }
    }

    pub fn rotate_right(&mut self) {
        let active_blocks = self.collect_active_blocks();
        let mut to_rotate = vec![];
        for (x, y, active_block) in active_blocks {
            let (dx, dy) = Board::right_rotate_reference(
                &active_block.kind,
                &active_block.rotation,
                active_block.id,
            );
            let new_x = usize::try_from(x as i8 + dx).ok();
            let new_y = usize::try_from(y as i8 + dy).ok();

            // under flow 방지, 벽에 부딪힌경우 TODO: wall kick
            let (Some(new_x), Some(new_y)) = (new_x, new_y) else {
                return;
            };

            // 벽에 부딪힌경우 TODO: wall kick
            if new_x >= self.x_len() || new_y >= self.y_len() {
                return;
            }

            // 주변에 블록이 있어서 회전못하는경우 TODO: wall kick
            match self.location(new_x, new_y) {
                Tile::Active(ActiveBlock { kind, .. }) if *kind == active_block.kind => {}
                Tile::Empty => {}
                _ => return,
            }

            to_rotate.push(((x, y), (new_x, new_y, active_block)));
        }

        // validatoin
        if to_rotate.len() != 4 {
            return;
        }

        // 먼저 지워주고
        for ((x, y), _) in &to_rotate {
            *self.location_mut(*x, *y) = Tile::Empty;
        }
        // 로테이션 바꿔주고 타일 바꿔준다.
        for (_, (new_x, new_y, mut active_block)) in to_rotate {
            match active_block.rotation {
                Rotate::D0 => active_block.rotation = Rotate::D90,
                Rotate::D90 => active_block.rotation = Rotate::D180,
                Rotate::D180 => active_block.rotation = Rotate::D270,
                Rotate::D270 => active_block.rotation = Rotate::D0,
            }
            *self.location_mut(new_x, new_y) = Tile::Active(active_block);
        }
    }

    pub fn rotate_left(&mut self) {
        let active_blocks = self.collect_active_blocks();
        let mut to_rotate = vec![];
        for (x, y, active_block) in active_blocks {
            let (dx, dy) = Board::left_rotate_reference(
                &active_block.kind,
                &active_block.rotation,
                active_block.id,
            );
            let new_x = usize::try_from(x as i8 + dx).ok();
            let new_y = usize::try_from(y as i8 + dy).ok();

            // under flow 방지, 벽에 부딪힌경우 TODO: wall kick
            let (Some(new_x), Some(new_y)) = (new_x, new_y) else {
                return;
            };

            // 벽에 부딪힌경우 TODO: wall kick
            if new_x >= self.x_len() || new_y >= self.y_len() {
                return;
            }

            // 주변에 블록이 있어서 회전못하는경우 TODO: wall kick
            match self.location(new_x, new_y) {
                Tile::Active(ActiveBlock { kind, .. }) if *kind == active_block.kind => {}
                Tile::Empty => {}
                _ => return,
            }

            to_rotate.push(((x, y), (new_x, new_y, active_block)));
        }

        // validatoin
        if to_rotate.len() != 4 {
            return;
        }

        // 먼저 지워주고
        for ((x, y), _) in &to_rotate {
            *self.location_mut(*x, *y) = Tile::Empty;
        }
        // 로테이션 바꿔주고 타일 바꿔준다.
        for (_, (new_x, new_y, mut active_block)) in to_rotate {
            match active_block.rotation {
                Rotate::D0 => active_block.rotation = Rotate::D270,
                Rotate::D90 => active_block.rotation = Rotate::D0,
                Rotate::D180 => active_block.rotation = Rotate::D90,
                Rotate::D270 => active_block.rotation = Rotate::D180,
            }
            *self.location_mut(new_x, new_y) = Tile::Active(active_block);
        }
    }

    pub fn collect_active_blocks(&self) -> Vec<(usize, usize, ActiveBlock)> {
        let mut active_blocks = vec![];
        'outer: for y in 0..self.y_len() {
            for x in 0..self.x_len() {
                let t = self.location(x, y);
                match t {
                    Tile::Active(active_block) => {
                        active_blocks.push((x, y, active_block.clone()));
                        if active_blocks.len() == 4 {
                            break 'outer;
                        }
                    }
                    _ => {}
                }
            }
        }

        active_blocks
    }

    pub fn right(&mut self) {
        let active_blocks = self.collect_active_blocks();
        let mut to_left = vec![];
        for (x, y, active_block) in active_blocks {
            if x + 1 >= self.x_len() {
                return;
            }
            match self.location(x + 1, y) {
                Tile::Active(ActiveBlock { kind, .. }) if *kind == active_block.kind => {}
                Tile::Empty => {}
                _ => return,
            }
            to_left.push((x, y, active_block));
        }
        if to_left.len() != 4 {
            return;
        }
        for (x, y, _) in &to_left {
            *self.location_mut(*x, *y) = Tile::Empty;
        }
        for (x, y, active_block) in to_left {
            *self.location_mut(x + 1, y) = Tile::Active(active_block);
        }
    }

    pub fn left(&mut self) {
        let active_blocks = self.collect_active_blocks();
        let mut to_left = vec![];
        for (x, y, active_block) in active_blocks {
            if x < 1 {
                return;
            }
            match self.location(x - 1, y) {
                Tile::Active(ActiveBlock { kind, .. }) if *kind == active_block.kind => {}
                Tile::Empty => {}
                _ => return,
            }
            to_left.push((x, y, active_block));
        }
        if to_left.len() != 4 {
            return;
        }
        for (x, y, _) in &to_left {
            *self.location_mut(*x, *y) = Tile::Empty;
        }
        for (x, y, active_block) in to_left {
            *self.location_mut(x - 1, y) = Tile::Active(active_block);
        }
    }

    fn right_rotate_reference(kind: &Tetrimino, rotate: &Rotate, id: u8) -> (i8, i8) {
        let kind_idx = *kind as usize;
        let rot_idx = *rotate as usize;
        let id_idx = id as usize;

        RIGHT_ROTATE_TABLE[kind_idx][rot_idx][id_idx]
    }

    fn left_rotate_reference(kind: &Tetrimino, rotate: &Rotate, id: u8) -> (i8, i8) {
        // D90 → D0 이라는 의미니까, 결과는 `right_rotate_reference` 역방향
        let next = match rotate {
            Rotate::D0 => Rotate::D270,
            Rotate::D90 => Rotate::D0,
            Rotate::D180 => Rotate::D90,
            Rotate::D270 => Rotate::D180,
        };
        let (dx, dy) = Board::right_rotate_reference(kind, &next, id);
        (-dx, -dy)
    }

    pub fn location(&self, x: usize, y: usize) -> &Tile {
        // let x = x.clamp(0, self.x_len() - 1);
        // let y = y.clamp(0, self.y_len() - 1);
        &self.0[y][x]
    }

    pub fn location_mut(&mut self, x: usize, y: usize) -> &mut Tile {
        // let x = x.clamp(0, self.x_len() - 1);
        // let y = y.clamp(0, self.y_len() - 1);
        &mut self.0[y][x]
    }

    pub fn x_len(&self) -> usize {
        self.0[0].len()
    }
    pub fn y_len(&self) -> usize {
        self.0.len()
    }

    pub fn try_move(
        &self,
        dir: MoveDirection,
    ) -> Result<Vec<((usize, usize), (usize, usize, ActiveBlock))>, MoveError> {
        let active_blocks = self.collect_active_blocks();

        let mut to_move = vec![];
        for (x, y, active_block) in active_blocks {
            let new_x = x as isize + dir.dx();
            if new_x < 0 || new_x >= self.x_len() as isize {
                return Err(MoveError::OutOfBounds(dir));
            }
            let new_x = new_x as usize;

            let target_tile = self.location(new_x, y);
            match target_tile {
                Tile::Active(ActiveBlock { kind, .. }) if *kind == active_block.kind => {}
                Tile::Empty => {}
                _ => {
                    return Err(MoveError::Blocked(dir, target_tile.clone()));
                }
            }

            to_move.push(((x, y), (new_x, y, active_block)));
        }

        if to_move.len() != 4 {
            return Err(MoveError::InvalidShape);
        }

        Ok(to_move)
    }

    pub fn apply_move(
        &mut self,
        to_move_blocks: Vec<((usize, usize), (usize, usize, ActiveBlock))>,
    ) {
        for ((x, y), _) in &to_move_blocks {
            *self.location_mut(*x, *y) = Tile::Empty;
        }
        for (_, (x, y, active_block)) in to_move_blocks {
            *self.location_mut(x, y) = Tile::Active(active_block);
        }
    }

    pub fn try_rotate(
        &self,
        dir: RotateDirection,
    ) -> Result<Vec<((usize, usize), (usize, usize, ActiveBlock))>, RotateError> {
        let active_blocks = self.collect_active_blocks();
        let mut to_rotate = vec![];
        for (x, y, mut active_block) in active_blocks {
            let (dx, dy) = match dir {
                RotateDirection::Left => Board::left_rotate_reference(
                    &active_block.kind,
                    &active_block.rotation,
                    active_block.id,
                ),
                RotateDirection::Right => Board::right_rotate_reference(
                    &active_block.kind,
                    &active_block.rotation,
                    active_block.id,
                ),
            };
            let new_x = usize::try_from(x as i8 + dx).ok();
            let new_y = usize::try_from(y as i8 + dy).ok();

            let (Some(new_x), Some(new_y)) = (new_x, new_y) else {
                return Err(RotateError::OutOfBounds(dir));
            };

            if new_x >= self.x_len() || new_y >= self.y_len() {
                return Err(RotateError::OutOfBounds(dir));
            }

            let target_tile = self.location(new_x, new_y);
            match target_tile {
                Tile::Active(ActiveBlock { kind, .. }) if *kind == active_block.kind => {}
                Tile::Empty => {}
                _ => return Err(RotateError::Blocked(dir, target_tile.clone())),
            }

            match dir {
                RotateDirection::Left => match active_block.rotation {
                    Rotate::D0 => active_block.rotation = Rotate::D270,
                    Rotate::D90 => active_block.rotation = Rotate::D0,
                    Rotate::D180 => active_block.rotation = Rotate::D90,
                    Rotate::D270 => active_block.rotation = Rotate::D180,
                },
                RotateDirection::Right => match active_block.rotation {
                    Rotate::D0 => active_block.rotation = Rotate::D90,
                    Rotate::D90 => active_block.rotation = Rotate::D180,
                    Rotate::D180 => active_block.rotation = Rotate::D270,
                    Rotate::D270 => active_block.rotation = Rotate::D0,
                },
            }
            to_rotate.push(((x, y), (new_x, new_y, active_block)));
        }

        if to_rotate.len() != 4 {
            return Err(RotateError::InvalidShape);
        }

        Ok(to_rotate)
    }

    pub fn apply_rotate(
        &mut self,
        to_rotate_blocks: Vec<((usize, usize), (usize, usize, ActiveBlock))>,
    ) {
        for ((x, y), _) in &to_rotate_blocks {
            *self.location_mut(*x, *y) = Tile::Empty;
        }
        for (_, (new_x, new_y, active_block)) in to_rotate_blocks {
            *self.location_mut(new_x, new_y) = Tile::Active(active_block);
        }
    }

    // ok 면 다음으로 이동할 위치
    pub fn try_step(
        &self,
    ) -> Result<Vec<((usize, usize), (usize, usize, ActiveBlock))>, StepError> {
        let active_blocks = self.collect_active_blocks();
        let mut to_step = vec![];
        for (x, y, active_block) in active_blocks {
            // 바닥에 닿은경우
            if y + 1 >= self.y_len() {
                return Err(StepError::OutOfBounds);
            }

            let target_tile = self.location(x, y + 1);
            match target_tile {
                Tile::Active(ActiveBlock { kind, .. }) if *kind == active_block.kind => {}
                Tile::Empty => {}
                _ => return Err(StepError::Blocked(target_tile.clone())),
            }
            to_step.push(((x, y), (x, y + 1, active_block)));
        }
        if to_step.len() != 4 {
            return Err(StepError::InvalidShape);
        }

        Ok(to_step)
    }

    pub fn apply_step(
        &mut self,
        to_step_blocks: Vec<((usize, usize), (usize, usize, ActiveBlock))>,
    ) {
        for ((x, y), _) in &to_step_blocks {
            *self.location_mut(*x, *y) = Tile::Empty;
        }
        for (_, (x, y, active_block)) in to_step_blocks {
            *self.location_mut(x - 1, y) = Tile::Active(active_block);
        }
    }

    pub fn place_active(&mut self) {
        let active_blocks = self.collect_active_blocks();
        for (x, y, active_block) in active_blocks {
            // TODO: define Placed id
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
        for to_clear_line in to_clear_lines.into_iter().rev() {
            self.0.remove(to_clear_line);
            self.0.insert(0, vec![Tile::Empty; self.x_len()]);
        }
    }

    pub fn try_hard_drop(&mut self) {
        // while
    }
    pub fn apply_hard_drop(&mut self) {
        //
    }

    pub fn try_soft_drop() {
        //
    }
    pub fn apply_soft_drop() {
        //
    }
}

#[derive(Debug)]
pub enum MoveDirection {
    Left,
    Right,
}

#[derive(Debug)]
pub enum MoveError {
    OutOfBounds(MoveDirection),
    Blocked(MoveDirection, Tile),
    InvalidShape,
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
    Blocked(RotateDirection, Tile),
    InvalidShape,
}

#[derive(Debug)]
pub enum StepError {
    OutOfBounds,
    InvalidShape,
    Blocked(Tile),
}
#[derive(Debug)]
pub enum SpawnError {
    ActiveTileExists,
}
