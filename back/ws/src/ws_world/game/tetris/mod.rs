use rand::{Rng, SeedableRng, rngs::SmallRng};
mod tetris;
pub struct Tetris {
    board: TetrisBoard,
    level: usize,
    cleared_line: usize,
    now_tetr: Tetrimino,
    next_tetr: Vec<Tetrimino>,
}
impl Tetris {
    pub fn new() -> Self {
        Self {
            board: TetrisBoard::new_common(),
            level: 1,
            cleared_line: 0,
            now_tetr: Tetrimino::rand_new(),
            next_tetr: vec![Tetrimino::rand_new(); 5],
        }
    }
    pub fn step() {
        let is_game_end = false;
        if is_game_end {
            // 게임종료인데 step 하면 warn
        } else {
            let is_exists_origin = true;
            if is_exists_origin {
                //
            } else {
                // 현재 origin 이 없으면 next_tetr 에서 하나뽑고 next tetir 추가
            }
        }
    }

    pub fn action() {
        //
    }

    pub fn get_board() {
        //
    }
}
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Tetrimino {
    I,
    O,
    T,
    J,
    L,
    S,
    Z,
}
impl Tetrimino {
    const SIZE: usize = 7;
    pub fn rand_new() -> Self {
        let mut rng = SmallRng::from_rng(&mut rand::rng());
        let r = rng.random_range(0..Self::SIZE);
        r.into()
    }
}
impl From<usize> for Tetrimino {
    fn from(value: usize) -> Self {
        match value % 7 {
            0 => Self::I,
            1 => Self::O,
            2 => Self::T,
            3 => Self::J,
            4 => Self::L,
            5 => Self::S,
            6 => Self::Z,
            _ => unreachable!(),
        }
    }
}

pub enum TetrisAction {
    Left,
    Right,
    RotateLeft,
    RotateRight,
    SoftDrop,
    HartDrop,
}
pub enum TetrisStatus {
    Spawning,
    End,
}

#[derive(Debug)]
pub struct TetrisBoard(Vec<Vec<TetrisTile>>);

impl std::fmt::Display for TetrisBoard {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str("\n")?;
        f.write_str("_")?;
        for _ in 0..self.x_len() {
            f.write_str("=")?;
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
        f.write_str("_")?;
        for _ in 0..self.x_len() {
            f.write_str("=")?;
        }
        f.write_str("\n")?;
        Ok(())
    }
}

impl TetrisBoard {
    const HEIGHT: usize = 23;
    const WIDTH: usize = 10;
    pub fn new_common() -> Self {
        Self::new(Self::WIDTH, Self::HEIGHT)
    }
    pub fn new(width: usize, height: usize) -> Self {
        Self(vec![vec![TetrisTile::Void; width]; height])
    }

    pub fn spawn(&mut self, tetrimino: Tetrimino, (x, y): (usize, usize)) {
        match tetrimino {
            Tetrimino::I => {
                *self.location_mut(x, y) = TetrisTile::TetriminoOrigin(Tetrimino::I);
                *self.location_mut(x - 1, y) = TetrisTile::Tetrimino(Tetrimino::I);
                *self.location_mut(x + 1, y) = TetrisTile::Tetrimino(Tetrimino::I);
                *self.location_mut(x + 2, y) = TetrisTile::Tetrimino(Tetrimino::I);
            }
            Tetrimino::O => {
                *self.location_mut(x, y) = TetrisTile::TetriminoOrigin(Tetrimino::O);
                *self.location_mut(x + 1, y) = TetrisTile::Tetrimino(Tetrimino::O);
                *self.location_mut(x, y - 1) = TetrisTile::Tetrimino(Tetrimino::O);
                *self.location_mut(x + 1, y - 1) = TetrisTile::Tetrimino(Tetrimino::O);
            }
            Tetrimino::T => {
                *self.location_mut(x, y) = TetrisTile::TetriminoOrigin(Tetrimino::T);
                *self.location_mut(x, y + 1) = TetrisTile::Tetrimino(Tetrimino::T);
                *self.location_mut(x - 1, y) = TetrisTile::Tetrimino(Tetrimino::T);
                *self.location_mut(x + 1, y) = TetrisTile::Tetrimino(Tetrimino::T);
            }
            Tetrimino::J => {
                *self.location_mut(x, y) = TetrisTile::TetriminoOrigin(Tetrimino::J);
                *self.location_mut(x + 1, y) = TetrisTile::Tetrimino(Tetrimino::J);
                *self.location_mut(x + 1, y + 1) = TetrisTile::Tetrimino(Tetrimino::J);
                *self.location_mut(x - 1, y) = TetrisTile::Tetrimino(Tetrimino::J);
            }
            Tetrimino::L => {
                *self.location_mut(x, y) = TetrisTile::TetriminoOrigin(Tetrimino::L);
                *self.location_mut(x - 1, y) = TetrisTile::Tetrimino(Tetrimino::L);
                *self.location_mut(x - 1, y + 1) = TetrisTile::Tetrimino(Tetrimino::L);
                *self.location_mut(x + 1, y) = TetrisTile::Tetrimino(Tetrimino::L);
            }
            Tetrimino::S => {
                *self.location_mut(x, y) = TetrisTile::TetriminoOrigin(Tetrimino::S);
                *self.location_mut(x, y + 1) = TetrisTile::Tetrimino(Tetrimino::S);
                *self.location_mut(x + 1, y + 1) = TetrisTile::Tetrimino(Tetrimino::S);
                *self.location_mut(x - 1, y) = TetrisTile::Tetrimino(Tetrimino::S);
            }
            Tetrimino::Z => {
                *self.location_mut(x, y) = TetrisTile::TetriminoOrigin(Tetrimino::Z);
                *self.location_mut(x, y + 1) = TetrisTile::Tetrimino(Tetrimino::Z);
                *self.location_mut(x - 1, y + 1) = TetrisTile::Tetrimino(Tetrimino::Z);
                *self.location_mut(x + 1, y) = TetrisTile::Tetrimino(Tetrimino::Z);
            }
        }
    }

    // ok or next tetrinimo or game over
    pub fn step(&mut self) {
        //
        //
    }

    pub fn right(&mut self) {
        let mut movevec = vec![];
        'outer: for y in 0..self.y_len() {
            // reverse
            for x in (0..self.x_len()).rev() {
                let t = self.location(x, y);
                if matches!(t, TetrisTile::TetriminoOrigin(_) | TetrisTile::Tetrimino(_)) {
                    // 벽
                    if x + 1 >= self.x_len() {
                        break 'outer;
                    }
                    // 최초체크면서 && 보이드가 아닌블럭이면 탈출
                    if movevec.is_empty() && !matches!(self.location(x + 1, y), TetrisTile::Void) {
                        break 'outer;
                    }
                    movevec.push((x, y, t.clone()));
                    // 4개면 다찾은거니까 조기탈출
                    if movevec.len() == 4 {
                        break 'outer;
                    }
                }
            }
        }
        if movevec.len() != 4 {
            return;
        }
        for (x, y, _) in &movevec {
            *self.location_mut(*x, *y) = TetrisTile::Void;
        }
        for (x, y, t) in movevec {
            *self.location_mut(x + 1, y) = t;
        }
    }

    pub fn left(&mut self) {
        let mut movevec = vec![];
        'outer: for y in 0..self.y_len() {
            for x in 0..self.x_len() {
                let t = self.location(x, y);
                if matches!(t, TetrisTile::TetriminoOrigin(_) | TetrisTile::Tetrimino(_)) {
                    // 벽
                    if x == 0 {
                        break 'outer;
                    }
                    // 최초체크면서 && 보이드가 아닌블럭이면 탈출
                    if movevec.is_empty() && !matches!(self.location(x - 1, y), TetrisTile::Void) {
                        break 'outer;
                    }
                    movevec.push((x, y, t.clone()));
                    // 4개면 다찾은거니까 조기탈출
                    if movevec.len() == 4 {
                        break 'outer;
                    }
                }
            }
        }
        if movevec.len() != 4 {
            return;
        }
        for (x, y, _) in &movevec {
            *self.location_mut(*x, *y) = TetrisTile::Void;
        }
        for (x, y, t) in movevec {
            *self.location_mut(x - 1, y) = t;
        }
    }

    pub fn rotate_right(&mut self) {
        let mut origin = None;
        let mut movevec = vec![];
        'outer: for y in 0..self.y_len() {
            for x in 0..self.x_len() {
                let t = self.location(x, y);
                match t {
                    TetrisTile::TetriminoOrigin(t) => {
                        if matches!(t, Tetrimino::O) {
                            return;
                        }
                        origin = Some((x, y, t.clone()))
                    }
                    TetrisTile::Tetrimino(_) => {
                        movevec.push((x, y, t.clone()));
                    }
                    _ => {}
                }
                // 다 찾으면 조기탈출
                if origin.is_some() && movevec.len() == 3 {
                    break 'outer;
                }
            }
        }
        let Some((origin_x, origin_y, _)) = origin else {
            return;
        };

        let mut new_loc = vec![];
        for (x, y, t) in movevec {
            // 현재위치 원점으로부터 상대좌표
            let rel_x = x as isize - origin_x as isize;
            let rel_y = y as isize - origin_y as isize;

            // 회전한후 원점으로부터 상대좌표
            let new_rel_x = rel_y * -1;
            let new_rel_y = rel_x;

            // 회전후 좌표
            let new_x = usize::try_from(origin_x as isize + new_rel_x).ok();
            let new_y = usize::try_from(origin_y as isize + new_rel_y).ok();

            // 변환실패하면 안됨 실패하면 음수인경우
            let (Some(new_x), Some(new_y)) = (new_x, new_y) else {
                return;
            };
            // 넘기면도 안됨
            if new_x >= self.x_len() || new_y >= self.y_len() {
                return;
            }

            let new_t = self.location(new_x, new_y);
            //void  또는 자기자신가 아니면 안됨
            if !(*new_t == t || matches!(new_t, TetrisTile::Void)) {
                return;
            }
            new_loc.push(((x, y), (new_x, new_y), t));
        }

        if new_loc.len() == 3 {
            for ((x, y), _, _) in &new_loc {
                *self.location_mut(*x, *y) = TetrisTile::Void;
            }
            for (_, (new_x, new_y), t) in new_loc {
                *self.location_mut(new_x, new_y) = t;
            }
        }
    }

    pub fn location(&self, x: usize, y: usize) -> &TetrisTile {
        // let reverse_y = (self.y_len() - 1) - y;
        &self.0[y][x]
    }
    pub fn location_mut(&mut self, x: usize, y: usize) -> &mut TetrisTile {
        // let reverse_y = (self.y_len() - 1) - y;
        &mut self.0[y][x]
    }

    pub fn x_len(&self) -> usize {
        self.0[0].len()
    }
    pub fn y_len(&self) -> usize {
        self.0.len()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TetrisTile {
    Void,
    TetriminoOrigin(Tetrimino),
    Tetrimino(Tetrimino),
    // TetrimonoGuide,
    Block,
}
impl std::fmt::Display for TetrisTile {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            TetrisTile::Void => f.write_str(".")?,
            TetrisTile::TetriminoOrigin(_) => f.write_str("X")?,
            TetrisTile::Tetrimino(tetrimino) => f.write_str(&format!("{:?}", tetrimino))?,
            TetrisTile::Block => f.write_str("B")?,
        }
        Ok(())
    }
}

// I, O, T, J, L, S, Z
#[rustfmt::skip]
pub enum TetrisTile2 {
    IO1, IO2, IO3, IO4,
    IR1, IR2, IR3, IR4,
    I21, I22, I23, I24,
    IL1, IL2, IL3, IL4,

    OO1, OO2, OO3, OO4,
    OR1, OR2, OR3, OR4,
    O21, O22, O23, O24,
    OL1, OL2, OL3, OL4,

    Tile()

}

#[test]
fn test() {
    let board = TetrisBoard::new_common();
    println!("board: {board}");
    println!("len: {}", board.0.len());
}

#[test]
fn test2() {
    let mut rng = SmallRng::from_rng(&mut rand::rng());
    println!("{}", rng.random_range(0..7));
}

#[test]
fn test3() {
    let a = std::mem::size_of::<Tetrimino>();
    println!("size: {a}");
}
#[test]
fn test4() {
    let mut board = TetrisBoard::new_common();
    let t = board.location_mut(8, 20);
    *t = TetrisTile::Block;
    println!("board: {board}");
    println!("x_len: {}, y_len: {}", board.x_len(), board.y_len());
}
#[test]
fn test5() {
    let mut board = TetrisBoard::new_common();
    board.spawn(Tetrimino::I, (5, 3));
    println!("I: {board}");

    let mut board = TetrisBoard::new_common();
    board.spawn(Tetrimino::O, (5, 3));
    println!("O: {board}");

    let mut board = TetrisBoard::new_common();
    board.spawn(Tetrimino::T, (5, 3));
    println!("T: {board}");

    let mut board = TetrisBoard::new_common();
    board.spawn(Tetrimino::J, (5, 3));
    println!("J: {board}");

    let mut board = TetrisBoard::new_common();
    board.spawn(Tetrimino::L, (5, 3));
    println!("L: {board}");

    let mut board = TetrisBoard::new_common();
    board.spawn(Tetrimino::S, (5, 3));
    println!("S: {board}");

    let mut board = TetrisBoard::new_common();
    board.spawn(Tetrimino::Z, (5, 3));
    println!("Z: {board}");
}
#[test]
fn wall_right() {
    let mut board = TetrisBoard::new_common();
    board.spawn(Tetrimino::I, (5, 3));
    println!("board: {board}");
    board.right();
    println!("right1: {board}");
    board.right();
    println!("right2: {board}");
    board.right();
    println!("right3: {board}");
}
#[test]
fn block_right() {
    let mut board = TetrisBoard::new_common();
    *board.location_mut(8, 3) = TetrisTile::Block;
    board.spawn(Tetrimino::I, (3, 3));
    println!("board: {board}");
    board.right();
    println!("right1: {board}");
    board.right();
    println!("right2: {board}");
    board.right();
    println!("right3: {board}");
}

#[test]
fn wall_left() {
    let mut board = TetrisBoard::new_common();
    board.spawn(Tetrimino::I, (3, 3));
    println!("board: {board}");
    board.left();
    println!("rleft1: {board}");
    board.left();
    println!("left2: {board}");
    board.left();
    println!("left3: {board}");
}

#[test]
fn block_left() {
    let mut board = TetrisBoard::new_common();
    *board.location_mut(1, 3) = TetrisTile::Block;
    board.spawn(Tetrimino::I, (3, 3));
    println!("board: {board}");
    board.left();
    println!("rleft1: {board}");
    board.left();
    println!("left2: {board}");
    board.left();
    println!("left3: {board}");
}
#[test]
fn rotate_right() {
    let mut board = TetrisBoard::new_common();
    board.spawn(Tetrimino::L, (5, 5));
    println!("board: {board}");

    board.rotate_right();
    println!("r: {board}");
}

#[test]
fn rotate_right_wall() {
    let mut board = TetrisBoard::new_common();
    board.spawn(Tetrimino::L, (8, 5));
    println!("board: {board}");

    board.rotate_right();
    println!("r: {board}");
    board.right();
    println!("right: {board}");
    board.rotate_right();
    println!("r: {board}");
}

#[test]
fn rotate_right_block() {
    let mut board = TetrisBoard::new_common();
    board.spawn(Tetrimino::L, (5, 5));
    *board.location_mut(5, 6) = TetrisTile::Block;
    println!("board: {board}");
    board.rotate_right();
    println!("r: {board}");
}

#[test]
fn rotate_right_o() {
    let mut board = TetrisBoard::new_common();
    board.spawn(Tetrimino::O, (5, 5));
    println!("board: {board}");
    board.rotate_right();
    println!("r: {board}");
}
#[test]
fn rotate_right_s() {
    let mut board = TetrisBoard::new_common();
    board.spawn(Tetrimino::S, (5, 5));
    println!("board: {board}");
    board.rotate_right();
    println!("r: {board}");
}
#[test]
fn rotate_right_t() {
    let mut board = TetrisBoard::new_common();
    board.spawn(Tetrimino::T, (5, 5));
    println!("board: {board}");
    board.rotate_right();
    println!("r: {board}");
}
#[test]
fn spawn_o() {
    let mut board = TetrisBoard::new(5, 5);
    board.spawn(Tetrimino::O, (2, 2));
    let expected = r#"
_=====
0.....
1..OO.
2..XO.
3.....
4.....
_01234
_=====
"#;
    assert!(format!("{board}") == expected);
}
#[test]
fn spawn_t() {
    let mut board = TetrisBoard::new(5, 5);
    board.spawn(Tetrimino::T, (2, 2));
    let expected = r#"
_=====
0.....
1.....
2.TXT.
3..T..
4.....
_01234
_=====
"#;
    assert!(format!("{board}") == expected);
}

#[test]
fn spawn_i() {
    let mut board = TetrisBoard::new(5, 5);
    board.spawn(Tetrimino::I, (2, 2));
    let expected = r#"
_=====
0.....
1.....
2.IXII
3.....
4.....
_01234
_=====
"#;
    assert!(format!("{board}") == expected);
}

#[test]
fn spawn_j() {
    let mut board = TetrisBoard::new(5, 5);
    board.spawn(Tetrimino::J, (2, 2));
    println!("{board}");
    let expected = r#"
_=====
0.....
1.....
2.JXJ.
3...J.
4.....
_01234
_=====
"#;
    assert!(format!("{board}") == expected);
}

/*
# S, O
===
. S S
S S .
. . .

# S, R
===
. S .
. S S
. . S
 */

/*
# L, O
===
. . L
L L L
. . .

# L, R
===
. L .
. L .
. L L

# L, RR
===
. . .
L L L
L . .

# L, L
===
L L .
. L .
. L .
*/

/*

# Z, O
===
Z Z .
. Z Z
. . .

# Z, R
===
. . Z
. Z Z
. Z .
*/

/*
# J, O
===
J . .
J J J
. . .


# J, R
===
. J J
. J .
. J .

# J, RR
===
. . .
J J J
. . J


# J, L
===
. J .
. J .
J J .
*/

/*
# T, O
===
. T .
T T T
. . .

# T, R
===
. T .
. T T
. T .

# T, RR
===
. . .
T T T
. T .

# T, L
===
. T .
T T .
. T .
*/

/*
# I, O
===
. . . .
I I I I
. . . .
. . . .

# I, R
===
. . I .
. . I .
. . I .
. . I .

*/
