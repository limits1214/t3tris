#[derive(Debug, Clone, PartialEq, Eq)]
#[repr(usize)]
#[rustfmt::skip]
pub enum Tetrimino {
    I, O, T, J, L, S, Z
}

#[derive(Debug, Clone, PartialEq, Eq)]
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

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Tile {
    Active(ActiveBlock),
    Placed(u8),
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
        // f.write_str("_")?;
        // for _ in 0..self.x_len() {
        //     f.write_str("_")?;
        // }
        // f.write_str("\n")?;
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

    pub fn spawn(&mut self, tetrimino: Tetrimino) {
        // y: 가로사이즈/2 - (테트리미노 가로사이즈 / 2 반올림)
        // self.x_len() / 2 - 2
        match tetrimino {
            Tetrimino::I => self.spawn_with_location(tetrimino, 3, 1),
            Tetrimino::O => self.spawn_with_location(tetrimino, 4, 1),
            Tetrimino::T => self.spawn_with_location(tetrimino, 4, 1),
            Tetrimino::J => self.spawn_with_location(tetrimino, 3, 1),
            Tetrimino::L => self.spawn_with_location(tetrimino, 5, 1),
            Tetrimino::S => self.spawn_with_location(tetrimino, 4, 1),
            Tetrimino::Z => self.spawn_with_location(tetrimino, 3, 1),
        }
    }

    #[rustfmt::skip]
    pub fn spawn_with_location(&mut self, tetrimino: Tetrimino, x: usize, y: usize) {
        match tetrimino {
            Tetrimino::I => {
                // 01234
                *self.location_mut(x, y) = Tile::Active(ActiveBlock { kind: tetrimino.clone(), rotation: Rotate::D0, id: 0 });
                *self.location_mut(x + 1, y) = Tile::Active(ActiveBlock { kind: tetrimino.clone(), rotation: Rotate::D0, id: 1 });
                *self.location_mut(x + 2, y) = Tile::Active(ActiveBlock { kind: tetrimino.clone(), rotation: Rotate::D0, id: 2 });
                *self.location_mut(x + 3, y) = Tile::Active(ActiveBlock { kind: tetrimino.clone(), rotation: Rotate::D0, id: 3 });
            }
            Tetrimino::O => {
                // 01
                // 23
                println!("{} {}", x, y);
                *self.location_mut(x, y) = Tile::Active(ActiveBlock { kind: tetrimino.clone(), rotation: Rotate::D0, id: 0 });
                *self.location_mut(x + 1, y) = Tile::Active(ActiveBlock { kind: tetrimino.clone(), rotation: Rotate::D0, id: 1 });
                *self.location_mut(x, y + 1) = Tile::Active(ActiveBlock { kind: tetrimino.clone(), rotation: Rotate::D0, id: 2 });
                *self.location_mut(x + 1, y + 1) = Tile::Active(ActiveBlock { kind: tetrimino.clone(), rotation: Rotate::D0, id: 3 });
            }
            Tetrimino::T => {
                //  0
                // 123
                *self.location_mut(x, y) = Tile::Active(ActiveBlock { kind: tetrimino.clone(), rotation: Rotate::D0, id: 0 });
                *self.location_mut(x - 1, y + 1) = Tile::Active(ActiveBlock { kind: tetrimino.clone(), rotation: Rotate::D0, id: 1 });
                *self.location_mut(x, y + 1) = Tile::Active(ActiveBlock { kind: tetrimino.clone(), rotation: Rotate::D0, id: 2 });
                *self.location_mut(x + 1, y + 1) = Tile::Active(ActiveBlock { kind: tetrimino.clone(), rotation: Rotate::D0, id: 3 });
            }
            Tetrimino::J => {
                // 0
                // 123
                *self.location_mut(x, y) = Tile::Active(ActiveBlock { kind: tetrimino.clone(), rotation: Rotate::D0, id: 0 });
                *self.location_mut(x, y + 1) = Tile::Active(ActiveBlock { kind: tetrimino.clone(), rotation: Rotate::D0, id: 1 });
                *self.location_mut(x + 1, y + 1) = Tile::Active(ActiveBlock { kind: tetrimino.clone(), rotation: Rotate::D0, id: 2 });
                *self.location_mut(x + 2, y + 1) = Tile::Active(ActiveBlock { kind: tetrimino.clone(), rotation: Rotate::D0, id: 3 });
            }
            Tetrimino::L => {
                //   0
                // 123
                *self.location_mut(x, y) = Tile::Active(ActiveBlock { kind: tetrimino.clone(), rotation: Rotate::D0, id: 0 });
                *self.location_mut(x - 2, y + 1) = Tile::Active(ActiveBlock { kind: tetrimino.clone(), rotation: Rotate::D0, id: 1 });
                *self.location_mut(x - 1 , y + 1) = Tile::Active(ActiveBlock { kind: tetrimino.clone(), rotation: Rotate::D0, id: 2 });
                *self.location_mut(x, y + 1) = Tile::Active(ActiveBlock { kind: tetrimino.clone(), rotation: Rotate::D0, id: 3 });
            }
            Tetrimino::S => {
                //  01
                // 23
                *self.location_mut(x, y) = Tile::Active(ActiveBlock { kind: tetrimino.clone(), rotation: Rotate::D0, id: 0 });
                *self.location_mut(x + 1, y) = Tile::Active(ActiveBlock { kind: tetrimino.clone(), rotation: Rotate::D0, id: 1 });
                *self.location_mut(x - 1, y + 1) = Tile::Active(ActiveBlock { kind: tetrimino.clone(), rotation: Rotate::D0, id: 2 });
                *self.location_mut(x, y + 1) = Tile::Active(ActiveBlock { kind: tetrimino.clone(), rotation: Rotate::D0, id: 3 });
            }
            Tetrimino::Z => {
                // 01
                //  23
                *self.location_mut(x, y) = Tile::Active(ActiveBlock { kind: tetrimino.clone(), rotation: Rotate::D0, id: 0 });
                *self.location_mut(x + 1, y) = Tile::Active(ActiveBlock { kind: tetrimino.clone(), rotation: Rotate::D0, id: 1 });
                *self.location_mut(x + 1, y + 1) = Tile::Active(ActiveBlock { kind: tetrimino.clone(), rotation: Rotate::D0, id: 2 });
                *self.location_mut(x + 2, y + 1) = Tile::Active(ActiveBlock { kind: tetrimino.clone(), rotation: Rotate::D0, id: 3 });
            }
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

    fn right_rotate_reference(kind: &Tetrimino, rotate: &Rotate, id: u8) -> (i8, i8) {
        let kind_idx = kind.clone() as usize;
        let rot_idx = rotate.clone() as usize;
        let id_idx = id as usize;

        ROTATE_TABLE[kind_idx][rot_idx][id_idx]
    }

    fn right_rotate_reference2(kind: &Tetrimino, rotate: &Rotate, id: u8) -> (i8, i8) {
        match (kind, rotate, id) {
            (Tetrimino::I, Rotate::D0, 0) => (2, -1),
            (Tetrimino::I, Rotate::D0, 1) => (1, 0),
            (Tetrimino::I, Rotate::D0, 2) => (0, 1),
            (Tetrimino::I, Rotate::D0, 3) => (-1, 2),

            (Tetrimino::I, Rotate::D90, 0) => (1, 2),
            (Tetrimino::I, Rotate::D90, 1) => (0, 1),
            (Tetrimino::I, Rotate::D90, 2) => (-1, 0),
            (Tetrimino::I, Rotate::D90, 3) => (-2, -1),

            (Tetrimino::I, Rotate::D180, 0) => (-2, 1),
            (Tetrimino::I, Rotate::D180, 1) => (-1, 0),
            (Tetrimino::I, Rotate::D180, 2) => (0, -1),
            (Tetrimino::I, Rotate::D180, 3) => (1, -2),

            (Tetrimino::I, Rotate::D270, 0) => (-1, -2),
            (Tetrimino::I, Rotate::D270, 1) => (0, -1),
            (Tetrimino::I, Rotate::D270, 2) => (1, 0),
            (Tetrimino::I, Rotate::D270, 3) => (2, 1),

            (Tetrimino::O, _, _) => (0, 0),

            (Tetrimino::T, Rotate::D0, 0) => (1, 1),
            (Tetrimino::T, Rotate::D0, 1) => (1, -1),
            (Tetrimino::T, Rotate::D0, 2) => (0, 0),
            (Tetrimino::T, Rotate::D0, 3) => (-1, 1),

            (Tetrimino::T, Rotate::D90, 0) => (-1, 1),
            (Tetrimino::T, Rotate::D90, 1) => (1, 1),
            (Tetrimino::T, Rotate::D90, 2) => (0, 0),
            (Tetrimino::T, Rotate::D90, 3) => (-1, -1),

            (Tetrimino::T, Rotate::D180, 0) => (-1, -1),
            (Tetrimino::T, Rotate::D180, 1) => (-1, 1),
            (Tetrimino::T, Rotate::D180, 2) => (0, 0),
            (Tetrimino::T, Rotate::D180, 3) => (1, -1),

            (Tetrimino::T, Rotate::D270, 0) => (1, -1),
            (Tetrimino::T, Rotate::D270, 1) => (-1, -1),
            (Tetrimino::T, Rotate::D270, 2) => (0, 0),
            (Tetrimino::T, Rotate::D270, 3) => (1, 1),

            (Tetrimino::J, Rotate::D0, 0) => (2, 0),
            (Tetrimino::J, Rotate::D0, 1) => (1, -1),
            (Tetrimino::J, Rotate::D0, 2) => (0, 0),
            (Tetrimino::J, Rotate::D0, 3) => (-1, 1),

            (Tetrimino::J, Rotate::D90, 0) => (0, 2),
            (Tetrimino::J, Rotate::D90, 1) => (1, 1),
            (Tetrimino::J, Rotate::D90, 2) => (0, 0),
            (Tetrimino::J, Rotate::D90, 3) => (-1, -1),

            (Tetrimino::J, Rotate::D180, 0) => (-2, 0),
            (Tetrimino::J, Rotate::D180, 1) => (-1, 1),
            (Tetrimino::J, Rotate::D180, 2) => (0, 0),
            (Tetrimino::J, Rotate::D180, 3) => (1, -1),

            (Tetrimino::J, Rotate::D270, 0) => (0, -2),
            (Tetrimino::J, Rotate::D270, 1) => (-1, -1),
            (Tetrimino::J, Rotate::D270, 2) => (0, 0),
            (Tetrimino::J, Rotate::D270, 3) => (1, 1),

            (Tetrimino::L, Rotate::D0, 0) => (0, 2),
            (Tetrimino::L, Rotate::D0, 1) => (1, -1),
            (Tetrimino::L, Rotate::D0, 2) => (0, 0),
            (Tetrimino::L, Rotate::D0, 3) => (-1, 1),

            (Tetrimino::L, Rotate::D90, 0) => (-2, 0),
            (Tetrimino::L, Rotate::D90, 1) => (1, 1),
            (Tetrimino::L, Rotate::D90, 2) => (0, 0),
            (Tetrimino::L, Rotate::D90, 3) => (-1, -1),

            (Tetrimino::L, Rotate::D180, 0) => (0, -2),
            (Tetrimino::L, Rotate::D180, 1) => (-1, 1),
            (Tetrimino::L, Rotate::D180, 2) => (0, 0),
            (Tetrimino::L, Rotate::D180, 3) => (1, -1),

            (Tetrimino::L, Rotate::D270, 0) => (2, 0),
            (Tetrimino::L, Rotate::D270, 1) => (-1, -1),
            (Tetrimino::L, Rotate::D270, 2) => (0, 0),
            (Tetrimino::L, Rotate::D270, 3) => (1, 1),

            (Tetrimino::S, Rotate::D0, 0) => (1, 1),
            (Tetrimino::S, Rotate::D0, 1) => (0, 2),
            (Tetrimino::S, Rotate::D0, 2) => (1, -1),
            (Tetrimino::S, Rotate::D0, 3) => (0, 0),

            (Tetrimino::S, Rotate::D90, 0) => (-1, 1),
            (Tetrimino::S, Rotate::D90, 1) => (-2, 0),
            (Tetrimino::S, Rotate::D90, 2) => (1, 1),
            (Tetrimino::S, Rotate::D90, 3) => (0, 0),

            (Tetrimino::S, Rotate::D180, 0) => (-1, -1),
            (Tetrimino::S, Rotate::D180, 1) => (0, -2),
            (Tetrimino::S, Rotate::D180, 2) => (-1, 1),
            (Tetrimino::S, Rotate::D180, 3) => (0, 0),

            (Tetrimino::S, Rotate::D270, 0) => (1, -1),
            (Tetrimino::S, Rotate::D270, 1) => (2, 0),
            (Tetrimino::S, Rotate::D270, 2) => (-1, -1),
            (Tetrimino::S, Rotate::D270, 3) => (0, 0),

            (Tetrimino::Z, Rotate::D0, 0) => (2, 0),
            (Tetrimino::Z, Rotate::D0, 1) => (1, 1),
            (Tetrimino::Z, Rotate::D0, 2) => (0, 0),
            (Tetrimino::Z, Rotate::D0, 3) => (-1, 1),

            (Tetrimino::Z, Rotate::D90, 0) => (0, 2),
            (Tetrimino::Z, Rotate::D90, 1) => (-1, 1),
            (Tetrimino::Z, Rotate::D90, 2) => (0, 0),
            (Tetrimino::Z, Rotate::D90, 3) => (-1, -1),

            (Tetrimino::Z, Rotate::D180, 0) => (-2, 0),
            (Tetrimino::Z, Rotate::D180, 1) => (-1, -1),
            (Tetrimino::Z, Rotate::D180, 2) => (0, 0),
            (Tetrimino::Z, Rotate::D180, 3) => (1, -1),

            (Tetrimino::Z, Rotate::D270, 0) => (0, -2),
            (Tetrimino::Z, Rotate::D270, 1) => (1, -1),
            (Tetrimino::Z, Rotate::D270, 2) => (0, 0),
            (Tetrimino::Z, Rotate::D270, 3) => (1, 1),
            _ => (0, 0),
        }
    }

    // ok or next tetrinimo or game over
    pub fn step(&mut self) {
        //
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
}

// const RT: [[[(i8, i8); 4]; 4]; 7] = [
//     [
//         [(0, 0), (0, 0), (0, 0), (0, 0)],
//         [(0, 0), (0, 0), (0, 0), (0, 0)],
//         [(0, 0), (0, 0), (0, 0), (0, 0)],
//         [(0, 0), (0, 0), (0, 0), (0, 0)],
//     ],
//     [
//         [(0, 0), (0, 0), (0, 0), (0, 0)],
//         [(0, 0), (0, 0), (0, 0), (0, 0)],
//         [(0, 0), (0, 0), (0, 0), (0, 0)],
//         [(0, 0), (0, 0), (0, 0), (0, 0)],
//     ],
//     [
//         [(0, 0), (0, 0), (0, 0), (0, 0)],
//         [(0, 0), (0, 0), (0, 0), (0, 0)],
//         [(0, 0), (0, 0), (0, 0), (0, 0)],
//         [(0, 0), (0, 0), (0, 0), (0, 0)],
//     ],
//     [
//         [(0, 0), (0, 0), (0, 0), (0, 0)],
//         [(0, 0), (0, 0), (0, 0), (0, 0)],
//         [(0, 0), (0, 0), (0, 0), (0, 0)],
//         [(0, 0), (0, 0), (0, 0), (0, 0)],
//     ],
//     [
//         [(0, 0), (0, 0), (0, 0), (0, 0)],
//         [(0, 0), (0, 0), (0, 0), (0, 0)],
//         [(0, 0), (0, 0), (0, 0), (0, 0)],
//         [(0, 0), (0, 0), (0, 0), (0, 0)],
//     ],
//     [
//         [(0, 0), (0, 0), (0, 0), (0, 0)],
//         [(0, 0), (0, 0), (0, 0), (0, 0)],
//         [(0, 0), (0, 0), (0, 0), (0, 0)],
//         [(0, 0), (0, 0), (0, 0), (0, 0)],
//     ],
//     [
//         [(0, 0), (0, 0), (0, 0), (0, 0)],
//         [(0, 0), (0, 0), (0, 0), (0, 0)],
//         [(0, 0), (0, 0), (0, 0), (0, 0)],
//         [(0, 0), (0, 0), (0, 0), (0, 0)],
//     ],
// ];

const ROTATE_TABLE: [[[(i8, i8); 4]; 4]; 7] = [
    // Tetrimino::I
    [
        [(2, -1), (1, 0), (0, 1), (-1, 2)],   // D0
        [(1, 2), (0, 1), (-1, 0), (-2, -1)],  // D90
        [(-2, 1), (-1, 0), (0, -1), (1, -2)], // D180
        [(-1, -2), (0, -1), (1, 0), (2, 1)],  // D270
    ],
    // Tetrimino::O
    [
        [(0, 0), (0, 0), (0, 0), (0, 0)], // D0
        [(0, 0), (0, 0), (0, 0), (0, 0)], // D90
        [(0, 0), (0, 0), (0, 0), (0, 0)], // D180
        [(0, 0), (0, 0), (0, 0), (0, 0)], // D270
    ],
    // Tetrimino::T
    [
        [(1, 1), (1, -1), (0, 0), (-1, 1)],   // D0
        [(-1, 1), (1, 1), (0, 0), (-1, -1)],  // D90
        [(-1, -1), (-1, 1), (0, 0), (1, -1)], // D180
        [(1, -1), (-1, -1), (0, 0), (1, 1)],  // D270
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
#[test]
fn spawn_i() {
    let mut board = Board::new(10, 3);
    board.spawn(Tetrimino::I);
    let expected = r#"
___________
0..........
1...IIII...
2..........
_0123456789
"#;
    assert!(format!("{board}") == expected);
}

#[test]
fn spawn_o() {
    let mut board = Board::new(10, 3);
    board.spawn(Tetrimino::O);
    let expected = r#"
___________
0..........
1....OO....
2....OO....
_0123456789
"#;
    assert!(format!("{board}") == expected);
}

#[test]
fn spawn_t() {
    let mut board = Board::new(10, 3);
    board.spawn(Tetrimino::T);
    let expected = r#"
___________
0..........
1....T.....
2...TTT....
_0123456789
"#;
    assert!(format!("{board}") == expected);
}

#[test]
fn spawn_j() {
    let mut board = Board::new(10, 3);
    board.spawn(Tetrimino::J);
    let expected = r#"
___________
0..........
1...J......
2...JJJ....
_0123456789
"#;
    assert!(format!("{board}") == expected);
}

#[test]
fn spawn_l() {
    let mut board = Board::new(10, 3);
    board.spawn(Tetrimino::L);
    let expected = r#"
___________
0..........
1.....L....
2...LLL....
_0123456789
"#;
    assert!(format!("{board}") == expected);
}

#[test]
fn spawn_s() {
    let mut board = Board::new(10, 3);
    board.spawn(Tetrimino::S);
    let expected = r#"
___________
0..........
1....SS....
2...SS.....
_0123456789
"#;
    assert!(format!("{board}") == expected);
}

#[test]
fn spawn_z() {
    let mut board = Board::new(10, 3);
    board.spawn(Tetrimino::Z);
    let expected = r#"
___________
0..........
1...ZZ.....
2....ZZ....
_0123456789
"#;
    assert!(format!("{board}") == expected);
}

#[test]
fn rotate_right_i() {
    let mut board = Board::new(10, 4);
    board.spawn(Tetrimino::I);
    println!("O{board}");
    board.rotate_right();
    println!("D90{board}");
    board.rotate_right();
    println!("D180{board}");
    board.rotate_right();
    println!("D270{board}");
    board.rotate_right();
    println!("O{board}");
}

#[test]
fn rotate_right_i_block() {
    let mut board = Board::new(10, 4);
    board.spawn(Tetrimino::I);
    *board.location_mut(5, 0) = Tile::Placed(0);
    println!("O{board}");
    board.rotate_right();
    println!("D90{board}");
}

#[test]
fn rotate_right_t() {
    let mut board = Board::new(10, 4);
    board.spawn(Tetrimino::T);
    println!("O{board}");
    board.rotate_right();
    println!("D90{board}");
    board.rotate_right();
    println!("D180{board}");
    board.rotate_right();
    println!("D270{board}");
    board.rotate_right();
    println!("O{board}");
}
#[test]
fn rotate_right_o() {
    let mut board = Board::new(10, 4);
    board.spawn(Tetrimino::O);
    println!("O{board}");
    board.rotate_right();
    println!("D90{board}");
    board.rotate_right();
    println!("D180{board}");
    board.rotate_right();
    println!("D270{board}");
    board.rotate_right();
    println!("O{board}");
}
#[test]
fn rotate_right_j() {
    let mut board = Board::new(10, 4);
    board.spawn(Tetrimino::J);
    println!("O{board}");
    board.rotate_right();
    println!("D90{board}");
    board.rotate_right();
    println!("D180{board}");
    board.rotate_right();
    println!("D270{board}");
    board.rotate_right();
    println!("O{board}");
}
#[test]
fn rotate_right_l() {
    let mut board = Board::new(10, 4);
    board.spawn(Tetrimino::L);
    println!("O{board}");
    board.rotate_right();
    println!("D90{board}");
    board.rotate_right();
    println!("D180{board}");
    board.rotate_right();
    println!("D270{board}");
    board.rotate_right();
    println!("O{board}");
}
#[test]
fn rotate_right_s() {
    let mut board = Board::new(10, 4);
    board.spawn(Tetrimino::S);
    println!("O{board}");
    board.rotate_right();
    println!("D90{board}");
    board.rotate_right();
    println!("D180{board}");
    board.rotate_right();
    println!("D270{board}");
    board.rotate_right();
    println!("O{board}");
}

#[test]
fn rotate_right_z() {
    let mut board = Board::new(10, 4);
    board.spawn(Tetrimino::Z);
    println!("O{board}");
    board.rotate_right();
    println!("D90{board}");
    board.rotate_right();
    println!("D180{board}");
    board.rotate_right();
    println!("D270{board}");
    board.rotate_right();
    println!("O{board}");
}
