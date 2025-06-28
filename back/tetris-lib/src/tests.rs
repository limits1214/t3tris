use super::*;

fn activated_rotation(board: &Board) -> Rotate {
    let active_blocks = board.collect_active_blocks();
    active_blocks.first().unwrap().2.rotation
}

#[cfg(test)]
#[test]
fn spawn_i() {
    let mut board = Board::new(10, 3);
    board.apply_spawn_active(board.try_spawn_active(Tetrimino::I).unwrap());
    let expected = r#"
___________
0..........
1...IIII...
2..........
_0123456789
"#;
    assert!(format!("{board}") == expected);
    assert_eq!(activated_rotation(&board), Rotate::D0);
}

#[test]
fn spawn_o() {
    let mut board = Board::new(10, 3);
    board.apply_spawn_active(board.try_spawn_active(Tetrimino::O).unwrap());
    let expected = r#"
___________
0..........
1....OO....
2....OO....
_0123456789
"#;
    assert_eq!(format!("{board}"), expected);
    assert_eq!(activated_rotation(&board), Rotate::D0);
}

#[test]
fn spawn_t() {
    let mut board = Board::new(10, 3);
    board.apply_spawn_active(board.try_spawn_active(Tetrimino::T).unwrap());
    let expected = r#"
___________
0..........
1....T.....
2...TTT....
_0123456789
"#;
    assert_eq!(format!("{board}"), expected);
    assert_eq!(activated_rotation(&board), Rotate::D0);
}

#[test]
fn spawn_j() {
    let mut board = Board::new(10, 3);
    board.apply_spawn_active(board.try_spawn_active(Tetrimino::J).unwrap());
    let expected = r#"
___________
0..........
1...J......
2...JJJ....
_0123456789
"#;
    assert_eq!(format!("{board}"), expected);
    assert_eq!(activated_rotation(&board), Rotate::D0);
}

#[test]
fn spawn_l() {
    let mut board = Board::new(10, 3);
    board.apply_spawn_active(board.try_spawn_active(Tetrimino::L).unwrap());
    let expected = r#"
___________
0..........
1.....L....
2...LLL....
_0123456789
"#;
    assert_eq!(format!("{board}"), expected);
    assert_eq!(activated_rotation(&board), Rotate::D0);
}

#[test]
fn spawn_s() {
    let mut board = Board::new(10, 3);
    board.apply_spawn_active(board.try_spawn_active(Tetrimino::S).unwrap());
    let expected = r#"
___________
0..........
1....SS....
2...SS.....
_0123456789
"#;
    assert_eq!(format!("{board}"), expected);
    assert_eq!(activated_rotation(&board), Rotate::D0);
}

#[test]
fn spawn_z() {
    let mut board = Board::new(10, 3);
    board.apply_spawn_active(board.try_spawn_active(Tetrimino::Z).unwrap());
    let expected = r#"
___________
0..........
1...ZZ.....
2....ZZ....
_0123456789
"#;
    assert_eq!(format!("{board}"), expected);
    assert_eq!(activated_rotation(&board), Rotate::D0);
}

#[test]
fn rotate_right_i() {
    let mut board = Board::new(10, 4);
    board.apply_spawn_active(board.try_spawn_active(Tetrimino::I).unwrap());

    let expted_origin = r#"
___________
0..........
1...IIII...
2..........
3..........
_0123456789
"#;
    assert_eq!(format!("{board}"), expted_origin);
    assert_eq!(activated_rotation(&board), Rotate::D0);

    board.rotate_right();
    let expexted_to_d0_d90 = r#"
___________
0.....I....
1.....I....
2.....I....
3.....I....
_0123456789
"#;
    assert_eq!(format!("{board}"), expexted_to_d0_d90);
    assert_eq!(activated_rotation(&board), Rotate::D90);

    board.rotate_right();
    let expexted_to_d90_d180 = r#"
___________
0..........
1..........
2...IIII...
3..........
_0123456789
"#;
    assert_eq!(format!("{board}"), expexted_to_d90_d180);
    assert_eq!(activated_rotation(&board), Rotate::D180);

    board.rotate_right();
    let expexted_to_d180_d270 = r#"
___________
0....I.....
1....I.....
2....I.....
3....I.....
_0123456789
"#;
    assert_eq!(format!("{board}"), expexted_to_d180_d270);
    assert_eq!(activated_rotation(&board), Rotate::D270);

    board.rotate_right();
    let expexted_to_d270_d0 = r#"
___________
0..........
1...IIII...
2..........
3..........
_0123456789
"#;
    assert_eq!(format!("{board}"), expexted_to_d270_d0);
    assert_eq!(activated_rotation(&board), Rotate::D0);
}

#[test]
fn rotate_right_i_block() {
    let mut board = Board::new(10, 4);
    board.apply_spawn_active(board.try_spawn_active(Tetrimino::I).unwrap());

    *board.location_mut(5, 0) = Tile::Placed(0);
    println!("O{board}");
    board.rotate_right();
    println!("D90{board}");
}

#[test]
fn rotate_right_t() {
    let mut board = Board::new(10, 4);
    board.apply_spawn_active(board.try_spawn_active(Tetrimino::T).unwrap());

    let expted_origin = r#"
___________
0..........
1....T.....
2...TTT....
3..........
_0123456789
"#;
    assert_eq!(format!("{board}"), expted_origin);
    assert_eq!(activated_rotation(&board), Rotate::D0);

    board.rotate_right();
    let expexted_to_d0_d90 = r#"
___________
0..........
1....T.....
2....TT....
3....T.....
_0123456789
"#;
    assert_eq!(format!("{board}"), expexted_to_d0_d90);
    assert_eq!(activated_rotation(&board), Rotate::D90);

    board.rotate_right();
    let expexted_to_d90_d180 = r#"
___________
0..........
1..........
2...TTT....
3....T.....
_0123456789
"#;
    assert_eq!(format!("{board}"), expexted_to_d90_d180);
    assert_eq!(activated_rotation(&board), Rotate::D180);

    board.rotate_right();
    let expexted_to_d180_d270 = r#"
___________
0..........
1....T.....
2...TT.....
3....T.....
_0123456789
"#;
    assert_eq!(format!("{board}"), expexted_to_d180_d270);
    assert_eq!(activated_rotation(&board), Rotate::D270);

    board.rotate_right();
    let expexted_to_d270_d0 = r#"
___________
0..........
1....T.....
2...TTT....
3..........
_0123456789
"#;
    assert_eq!(format!("{board}"), expexted_to_d270_d0);
    assert_eq!(activated_rotation(&board), Rotate::D0);
}
#[test]
fn rotate_right_o() {
    let mut board = Board::new(10, 4);
    board.apply_spawn_active(board.try_spawn_active(Tetrimino::O).unwrap());

    let expted_origin = r#"
___________
0..........
1....OO....
2....OO....
3..........
_0123456789
"#;
    assert_eq!(format!("{board}"), expted_origin);
    assert_eq!(activated_rotation(&board), Rotate::D0);

    board.rotate_right();

    assert_eq!(format!("{board}"), expted_origin);
    assert_eq!(activated_rotation(&board), Rotate::D90);

    board.rotate_right();

    assert_eq!(format!("{board}"), expted_origin);
    assert_eq!(activated_rotation(&board), Rotate::D180);

    board.rotate_right();

    assert_eq!(format!("{board}"), expted_origin);
    assert_eq!(activated_rotation(&board), Rotate::D270);

    board.rotate_right();

    assert_eq!(format!("{board}"), expted_origin);
    assert_eq!(activated_rotation(&board), Rotate::D0);
}

#[test]
fn rotate_right_j() {
    let mut board = Board::new(10, 4);
    board.apply_spawn_active(board.try_spawn_active(Tetrimino::J).unwrap());

    let expted_origin = r#"
___________
0..........
1...J......
2...JJJ....
3..........
_0123456789
"#;
    assert_eq!(format!("{board}"), expted_origin);
    assert_eq!(activated_rotation(&board), Rotate::D0);

    board.rotate_right();
    let expexted_to_d0_d90 = r#"
___________
0..........
1....JJ....
2....J.....
3....J.....
_0123456789
"#;
    assert_eq!(format!("{board}"), expexted_to_d0_d90);
    assert_eq!(activated_rotation(&board), Rotate::D90);

    board.rotate_right();
    let expexted_to_d90_d180 = r#"
___________
0..........
1..........
2...JJJ....
3.....J....
_0123456789
"#;
    assert_eq!(format!("{board}"), expexted_to_d90_d180);
    assert_eq!(activated_rotation(&board), Rotate::D180);

    board.rotate_right();
    let expexted_to_d180_d270 = r#"
___________
0..........
1....J.....
2....J.....
3...JJ.....
_0123456789
"#;
    assert_eq!(format!("{board}"), expexted_to_d180_d270);
    assert_eq!(activated_rotation(&board), Rotate::D270);

    board.rotate_right();
    let expexted_to_d270_d0 = r#"
___________
0..........
1...J......
2...JJJ....
3..........
_0123456789
"#;
    assert_eq!(format!("{board}"), expexted_to_d270_d0);
    assert_eq!(activated_rotation(&board), Rotate::D0);
}

#[test]
fn rotate_right_l() {
    let mut board = Board::new(10, 4);
    board.apply_spawn_active(board.try_spawn_active(Tetrimino::L).unwrap());

    let expted_origin = r#"
___________
0..........
1.....L....
2...LLL....
3..........
_0123456789
"#;
    assert_eq!(format!("{board}"), expted_origin);
    assert_eq!(activated_rotation(&board), Rotate::D0);

    board.rotate_right();
    let expexted_to_d0_d90 = r#"
___________
0..........
1....L.....
2....L.....
3....LL....
_0123456789
"#;
    assert_eq!(format!("{board}"), expexted_to_d0_d90);
    assert_eq!(activated_rotation(&board), Rotate::D90);

    board.rotate_right();
    let expexted_to_d90_d180 = r#"
___________
0..........
1..........
2...LLL....
3...L......
_0123456789
"#;
    assert_eq!(format!("{board}"), expexted_to_d90_d180);
    assert_eq!(activated_rotation(&board), Rotate::D180);

    board.rotate_right();
    let expexted_to_d180_d270 = r#"
___________
0..........
1...LL.....
2....L.....
3....L.....
_0123456789
"#;
    assert_eq!(format!("{board}"), expexted_to_d180_d270);
    assert_eq!(activated_rotation(&board), Rotate::D270);

    board.rotate_right();
    let expexted_to_d270_d0 = r#"
___________
0..........
1.....L....
2...LLL....
3..........
_0123456789
"#;
    assert_eq!(format!("{board}"), expexted_to_d270_d0);
    assert_eq!(activated_rotation(&board), Rotate::D0);
}

#[test]
fn rotate_right_z() {
    let mut board = Board::new(10, 4);
    board.apply_spawn_active(board.try_spawn_active(Tetrimino::Z).unwrap());

    let expted_origin = r#"
___________
0..........
1...ZZ.....
2....ZZ....
3..........
_0123456789
"#;
    assert_eq!(format!("{board}"), expted_origin);
    assert_eq!(activated_rotation(&board), Rotate::D0);

    board.rotate_right();
    let expexted_to_d0_d90 = r#"
___________
0..........
1.....Z....
2....ZZ....
3....Z.....
_0123456789
"#;
    assert_eq!(format!("{board}"), expexted_to_d0_d90);
    assert_eq!(activated_rotation(&board), Rotate::D90);

    board.rotate_right();
    let expexted_to_d90_d180 = r#"
___________
0..........
1..........
2...ZZ.....
3....ZZ....
_0123456789
"#;
    assert_eq!(format!("{board}"), expexted_to_d90_d180);
    assert_eq!(activated_rotation(&board), Rotate::D180);

    board.rotate_right();
    let expexted_to_d180_d270 = r#"
___________
0..........
1....Z.....
2...ZZ.....
3...Z......
_0123456789
"#;
    assert_eq!(format!("{board}"), expexted_to_d180_d270);
    assert_eq!(activated_rotation(&board), Rotate::D270);

    board.rotate_right();
    let expexted_to_d270_d0 = r#"
___________
0..........
1...ZZ.....
2....ZZ....
3..........
_0123456789
"#;
    assert_eq!(format!("{board}"), expexted_to_d270_d0);
    assert_eq!(activated_rotation(&board), Rotate::D0);
}
#[test]
fn rotate_right_s() {
    let mut board = Board::new(10, 4);
    board.apply_spawn_active(board.try_spawn_active(Tetrimino::S).unwrap());

    let expted_origin = r#"
___________
0..........
1....SS....
2...SS.....
3..........
_0123456789
"#;
    assert_eq!(format!("{board}"), expted_origin);
    assert_eq!(activated_rotation(&board), Rotate::D0);

    let res = board.try_rotate(RotateDirection::Right);
    board.apply_rotate(res.unwrap());
    let expexted_to_d0_d90 = r#"
___________
0..........
1....S.....
2....SS....
3.....S....
_0123456789
"#;
    assert_eq!(format!("{board}"), expexted_to_d0_d90);
    assert_eq!(activated_rotation(&board), Rotate::D90);

    let res = board.try_rotate(RotateDirection::Right);
    board.apply_rotate(res.unwrap());
    let expexted_to_d90_d180 = r#"
___________
0..........
1..........
2....SS....
3...SS.....
_0123456789
"#;
    assert_eq!(format!("{board}"), expexted_to_d90_d180);
    assert_eq!(activated_rotation(&board), Rotate::D180);

    let res = board.try_rotate(RotateDirection::Right);
    board.apply_rotate(res.unwrap());
    let expexted_to_d180_d270 = r#"
___________
0..........
1...S......
2...SS.....
3....S.....
_0123456789
"#;
    assert_eq!(format!("{board}"), expexted_to_d180_d270);
    assert_eq!(activated_rotation(&board), Rotate::D270);

    let res = board.try_rotate(RotateDirection::Right);
    board.apply_rotate(res.unwrap());
    let expexted_to_d270_d0 = r#"
___________
0..........
1....SS....
2...SS.....
3..........
_0123456789
"#;
    assert_eq!(format!("{board}"), expexted_to_d270_d0);
    assert_eq!(activated_rotation(&board), Rotate::D0);
}

#[test]
fn rotate_left_l() {
    let mut board = Board::new(10, 4);
    board.apply_spawn_active(board.try_spawn_active(Tetrimino::L).unwrap());
    println!("O{board}");
    board.rotate_left();
    println!("D90{board}");
    board.rotate_left();
    println!("D180{board}");
    board.rotate_left();
    println!("D270{board}");
    board.rotate_left();
    println!("O{board}");
}

#[test]
fn rotate_rigt_left_l() {
    let mut board = Board::new(10, 4);
    board.apply_spawn_active(board.try_spawn_active(Tetrimino::L).unwrap());
    println!("O{board:?}");
    board.rotate_right();
    println!("D90{board:?}");
    board.rotate_left();
    println!("D180{board:?}");
    board.rotate_right();
    println!("D90{board:?}");
    board.rotate_left();
    println!("D180{board:?}");
    board.rotate_left();
    println!("D180{board}");
    board.rotate_right();
    println!("D90{board}");
    board.rotate_right();
    println!("D90{board}");
    board.rotate_right();
    println!("D90{board}");
    board.rotate_right();
    println!("D90{board}");
}

#[test]
fn rotate_left_s() {
    let mut board = Board::new(10, 4);
    board.apply_spawn_active(board.try_spawn_active(Tetrimino::S).unwrap());
    println!("O{board}");
    board.rotate_left();
    println!("D90{board}");
    board.rotate_left();
    println!("D180{board}");
    board.rotate_left();
    println!("D270{board}");
    board.rotate_left();
    println!("O{board}");
}

#[test]
fn rotate_left_z() {
    let mut board = Board::new(10, 4);
    board.apply_spawn_active(board.try_spawn_active(Tetrimino::Z).unwrap());
    println!("O{board}");
    board.rotate_left();
    println!("D90{board}");
    board.rotate_left();
    println!("D180{board}");
    board.rotate_left();
    println!("D270{board}");
    board.rotate_left();
    println!("O{board}");
}

#[test]
fn right() {
    let mut board = Board::new(10, 4);
    board.apply_spawn_active(board.try_spawn_active(Tetrimino::Z).unwrap());
    println!("O{board}");
    board.right();
    println!("r1{board}");
    board.right();
    println!("r2{board}");
    board.right();
    println!("r3{board}");
    board.right();
    println!("r4{board}");
    board.right();
    println!("r5{board}");
}

#[test]
fn right_block() {
    let mut board = Board::new(10, 4);
    *board.location_mut(7, 2) = Tile::Placed(1);
    board.apply_spawn_active(board.try_spawn_active(Tetrimino::Z).unwrap());
    println!("O{board}");
    board.right();
    println!("r1{board}");
    board.right();
    println!("r2{board}");
}

#[test]
fn left() {
    let mut board = Board::new(10, 4);
    board.apply_spawn_active(board.try_spawn_active(Tetrimino::Z).unwrap());
    println!("O{board}");
    let res = board.try_move(MoveDirection::Left);
    board.apply_move(res.unwrap());
    println!("l1{board}");
    let res = board.try_move(MoveDirection::Left);
    board.apply_move(res.unwrap());
    println!("l2{board}");
    let res = board.try_move(MoveDirection::Left);
    board.apply_move(res.unwrap());
    println!("l3{board}");
    let res = board.try_move(MoveDirection::Left);
    assert!(matches!(
        res,
        Err(MoveError::OutOfBounds(MoveDirection::Left))
    ));
}

#[test]
fn left_block() {
    let mut board = Board::new(10, 4);
    *board.location_mut(1, 1) = Tile::Placed(1);
    board.apply_spawn_active(board.try_spawn_active(Tetrimino::Z).unwrap());
    println!("O{board}");
    board.left();
    println!("l1{board}");
    board.left();
    println!("l2{board}");
}
