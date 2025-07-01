use super::*;

fn activated_rotation(board: &Board) -> Rotate {
    let active_blocks = board.get_falling_blocks();
    active_blocks.first().unwrap().falling.rotation
}

#[cfg(test)]
#[test]
fn spawn_i() {
    let mut board = Board::new(10, 3);
    board.apply_spawn_falling(board.try_spawn_falling(Tetrimino::I).unwrap());
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
    board.apply_spawn_falling(board.try_spawn_falling(Tetrimino::O).unwrap());
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
    board.apply_spawn_falling(board.try_spawn_falling(Tetrimino::T).unwrap());
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
    board.apply_spawn_falling(board.try_spawn_falling(Tetrimino::J).unwrap());
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
    board.apply_spawn_falling(board.try_spawn_falling(Tetrimino::L).unwrap());
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
    board.apply_spawn_falling(board.try_spawn_falling(Tetrimino::S).unwrap());
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
    board.apply_spawn_falling(board.try_spawn_falling(Tetrimino::Z).unwrap());
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
    board.apply_spawn_falling(board.try_spawn_falling(Tetrimino::I).unwrap());

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

    board.apply_rotate_falling(board.try_rotate_falling(RotateDirection::Right).unwrap());
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

    board.apply_rotate_falling(board.try_rotate_falling(RotateDirection::Right).unwrap());
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

    board.apply_rotate_falling(board.try_rotate_falling(RotateDirection::Right).unwrap());
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

    board.apply_rotate_falling(board.try_rotate_falling(RotateDirection::Right).unwrap());
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
    board.apply_spawn_falling(board.try_spawn_falling(Tetrimino::I).unwrap());

    *board.location_mut(5, 0) = Tile::Placed(0);
    println!("O{board}");

    let expted_origin = r#"
___________
0.....P....
1...IIII...
2..........
3..........
_0123456789
"#;
    assert_eq!(format!("{board}"), expted_origin);

    let res = board.try_rotate_falling(RotateDirection::Right);
    assert!(matches!(res, Err(RotateError::Blocked(_, _))));
}

#[test]
fn rotate_right_t() {
    let mut board = Board::new(10, 4);
    board.apply_spawn_falling(board.try_spawn_falling(Tetrimino::T).unwrap());

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

    board.apply_rotate_falling(board.try_rotate_falling(RotateDirection::Right).unwrap());
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

    board.apply_rotate_falling(board.try_rotate_falling(RotateDirection::Right).unwrap());
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

    board.apply_rotate_falling(board.try_rotate_falling(RotateDirection::Right).unwrap());
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

    board.apply_rotate_falling(board.try_rotate_falling(RotateDirection::Right).unwrap());
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
    board.apply_spawn_falling(board.try_spawn_falling(Tetrimino::O).unwrap());

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

    board.apply_rotate_falling(board.try_rotate_falling(RotateDirection::Right).unwrap());

    assert_eq!(format!("{board}"), expted_origin);
    assert_eq!(activated_rotation(&board), Rotate::D90);

    board.apply_rotate_falling(board.try_rotate_falling(RotateDirection::Right).unwrap());

    assert_eq!(format!("{board}"), expted_origin);
    assert_eq!(activated_rotation(&board), Rotate::D180);

    board.apply_rotate_falling(board.try_rotate_falling(RotateDirection::Right).unwrap());

    assert_eq!(format!("{board}"), expted_origin);
    assert_eq!(activated_rotation(&board), Rotate::D270);

    board.apply_rotate_falling(board.try_rotate_falling(RotateDirection::Right).unwrap());

    assert_eq!(format!("{board}"), expted_origin);
    assert_eq!(activated_rotation(&board), Rotate::D0);
}

#[test]
fn rotate_right_j() {
    let mut board = Board::new(10, 4);
    board.apply_spawn_falling(board.try_spawn_falling(Tetrimino::J).unwrap());

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

    board.apply_rotate_falling(board.try_rotate_falling(RotateDirection::Right).unwrap());
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

    board.apply_rotate_falling(board.try_rotate_falling(RotateDirection::Right).unwrap());
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

    board.apply_rotate_falling(board.try_rotate_falling(RotateDirection::Right).unwrap());
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

    board.apply_rotate_falling(board.try_rotate_falling(RotateDirection::Right).unwrap());
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
    board.apply_spawn_falling(board.try_spawn_falling(Tetrimino::L).unwrap());

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

    board.apply_rotate_falling(board.try_rotate_falling(RotateDirection::Right).unwrap());
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

    board.apply_rotate_falling(board.try_rotate_falling(RotateDirection::Right).unwrap());
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

    board.apply_rotate_falling(board.try_rotate_falling(RotateDirection::Right).unwrap());
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

    board.apply_rotate_falling(board.try_rotate_falling(RotateDirection::Right).unwrap());
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
    board.apply_spawn_falling(board.try_spawn_falling(Tetrimino::Z).unwrap());

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

    board.apply_rotate_falling(board.try_rotate_falling(RotateDirection::Right).unwrap());
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

    board.apply_rotate_falling(board.try_rotate_falling(RotateDirection::Right).unwrap());
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

    board.apply_rotate_falling(board.try_rotate_falling(RotateDirection::Right).unwrap());
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

    board.apply_rotate_falling(board.try_rotate_falling(RotateDirection::Right).unwrap());
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
    board.apply_spawn_falling(board.try_spawn_falling(Tetrimino::S).unwrap());

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

    let res = board.try_rotate_falling(RotateDirection::Right);
    board.apply_rotate_falling(res.unwrap());
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

    let res = board.try_rotate_falling(RotateDirection::Right);
    board.apply_rotate_falling(res.unwrap());
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

    let res = board.try_rotate_falling(RotateDirection::Right);
    board.apply_rotate_falling(res.unwrap());
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

    let res = board.try_rotate_falling(RotateDirection::Right);
    board.apply_rotate_falling(res.unwrap());
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
fn right() {
    let mut board = Board::new(10, 4);
    board.apply_spawn_falling(board.try_spawn_falling(Tetrimino::Z).unwrap());

    let expted_origin = r#"
___________
0..........
1...ZZ.....
2....ZZ....
3..........
_0123456789
"#;
    assert_eq!(format!("{board}"), expted_origin);

    board.apply_move_falling(board.try_move_falling(MoveDirection::Right).unwrap());
    let expected_right = r#"
___________
0..........
1....ZZ....
2.....ZZ...
3..........
_0123456789
"#;
    assert_eq!(format!("{board}"), expected_right);
}

#[test]
fn right_block() {
    let mut board = Board::new(10, 4);
    *board.location_mut(6, 2) = Tile::Placed(1);
    board.apply_spawn_falling(board.try_spawn_falling(Tetrimino::Z).unwrap());

    let expted_origin = r#"
___________
0..........
1...ZZ.....
2....ZZP...
3..........
_0123456789
"#;
    assert_eq!(format!("{board}"), expted_origin);

    let res = board.try_move_falling(MoveDirection::Right);
    assert!(matches!(res, Err(MoveError::Blocked(_, _))));
}

#[test]
fn left() {
    let mut board = Board::new(10, 4);
    board.apply_spawn_falling(board.try_spawn_falling(Tetrimino::Z).unwrap());
    let expted_origin = r#"
___________
0..........
1...ZZ.....
2....ZZ....
3..........
_0123456789
"#;
    assert_eq!(format!("{board}"), expted_origin);
    let res = board.try_move_falling(MoveDirection::Left);
    board.apply_move_falling(res.unwrap());
    let res = board.try_move_falling(MoveDirection::Left);
    board.apply_move_falling(res.unwrap());
    let res = board.try_move_falling(MoveDirection::Left);
    board.apply_move_falling(res.unwrap());
    let res = board.try_move_falling(MoveDirection::Left);
    assert!(matches!(
        res,
        Err(MoveError::OutOfBounds(MoveDirection::Left))
    ));

    let expected = r#"
___________
0..........
1ZZ........
2.ZZ.......
3..........
_0123456789
"#;
    assert_eq!(format!("{board}"), expected);
}

#[test]
fn left_block() {
    let mut board = Board::new(10, 4);
    *board.location_mut(1, 1) = Tile::Placed(1);
    board.apply_spawn_falling(board.try_spawn_falling(Tetrimino::Z).unwrap());

    let expted_origin = r#"
___________
0..........
1.P.ZZ.....
2....ZZ....
3..........
_0123456789
"#;
    assert_eq!(format!("{board}"), expted_origin);
    board.apply_rotate_falling(board.try_move_falling(MoveDirection::Left).unwrap());
    let res = board.try_move_falling(MoveDirection::Left);
    assert!(matches!(res, Err(MoveError::Blocked(_, _))));
}

#[test]
fn step() {
    let mut board = Board::new(10, 5);
    board.apply_spawn_falling(board.try_spawn_falling(Tetrimino::Z).unwrap());

    let expted_origin = r#"
___________
0..........
1...ZZ.....
2....ZZ....
3..........
4..........
_0123456789
"#;
    assert_eq!(format!("{board}"), expted_origin);
    let res = board.try_step();
    board.apply_step(res.unwrap());
    let expted = r#"
___________
0..........
1..........
2...ZZ.....
3....ZZ....
4..........
_0123456789
"#;
    assert_eq!(format!("{board}"), expted);
}

#[test]
fn step_err() {
    let mut board = Board::new(10, 5);
    board.apply_spawn_falling(board.try_spawn_falling(Tetrimino::Z).unwrap());

    let expted = r#"
___________
0..........
1...ZZ.....
2....ZZ....
3..........
4..........
_0123456789
"#;
    assert_eq!(format!("{board}"), expted);

    board.apply_step(board.try_step().unwrap());
    board.apply_step(board.try_step().unwrap());

    let res = board.try_step();
    assert!(matches!(res, Err(StepError::OutOfBounds)));
}

#[test]
fn step3() {
    let mut board = Board::new(10, 5);
    board.apply_spawn_falling(board.try_spawn_falling(Tetrimino::Z).unwrap());

    *board.location_mut(5, 4) = Tile::Placed(0);
    let expted = r#"
___________
0..........
1...ZZ.....
2....ZZ....
3..........
4.....P....
_0123456789
"#;
    assert_eq!(format!("{board}"), expted);

    board.apply_step(board.try_step().unwrap());

    let res = board.try_step();
    assert!(matches!(res, Err(StepError::Blocked(_))));
}
#[test]
fn line_clear() {
    let mut board = Board::new(10, 5);
    for x in 0..board.x_len() {
        *board.location_mut(x, 2) = Tile::Placed(0);
    }
    let expted = r#"
___________
0..........
1..........
2PPPPPPPPPP
3..........
4..........
_0123456789
"#;
    assert_eq!(format!("{board}"), expted);

    let clearlines = board.try_line_clear();

    board.apply_line_clear(clearlines);

    let expted = r#"
___________
0..........
1..........
2..........
3..........
4..........
_0123456789
"#;
    assert_eq!(format!("{board}"), expted);
}
#[test]
fn line_clear2() {
    let mut board = Board::new(10, 5);
    for x in 0..board.x_len() {
        *board.location_mut(x, 2) = Tile::Placed(0);
    }
    *board.location_mut(4, 2) = Tile::Empty;

    let expted = r#"
___________
0..........
1..........
2PPPP.PPPPP
3..........
4..........
_0123456789
"#;
    assert_eq!(format!("{board}"), expted);

    *board.location_mut(4, 2) = Tile::Empty;

    let clearlines = board.try_line_clear();

    board.apply_line_clear(clearlines);

    assert_eq!(format!("{board}"), expted);
}

#[test]
fn line_clear3() {
    let mut board = Board::new(10, 5);
    for x in 0..board.x_len() {
        *board.location_mut(x, 2) = Tile::Placed(0);
        *board.location_mut(x, 4) = Tile::Placed(0);
    }
    *board.location_mut(2, 1) = Tile::Placed(0);
    *board.location_mut(6, 3) = Tile::Placed(0);

    let expted = r#"
___________
0..........
1..P.......
2PPPPPPPPPP
3......P...
4PPPPPPPPPP
_0123456789
"#;
    assert_eq!(format!("{board}"), expted);

    let clearlines = board.try_line_clear();

    board.apply_line_clear(clearlines);

    let expted = r#"
___________
0..........
1..........
2..........
3..P.......
4......P...
_0123456789
"#;
    assert_eq!(format!("{board}"), expted);
}

#[test]
fn hard_drop() {
    let mut board = Board::new(10, 8);
    board.apply_spawn_falling(board.try_spawn_falling(Tetrimino::Z).unwrap());
    *board.location_mut(3, 6) = Tile::Placed(1);
    let expted = r#"
___________
0..........
1...ZZ.....
2....ZZ....
3..........
4..........
5..........
6...P......
7..........
_0123456789
"#;
    assert_eq!(format!("{board}"), expted);
    let _ = board.hard_drop();

    let expted = r#"
___________
0..........
1..........
2..........
3..........
4..........
5...ZZ.....
6...PZZ....
7..........
_0123456789
"#;
    assert_eq!(format!("{board}"), expted);
}
#[test]
fn show_hint() {
    let mut board = Board::new(10, 8);
    board.apply_spawn_falling(board.try_spawn_falling(Tetrimino::Z).unwrap());
    let expted = r#"
___________
0..........
1...ZZ.....
2....ZZ....
3..........
4..........
5..........
6..........
7..........
_0123456789
"#;
    assert_eq!(format!("{board}"), expted);
    board.show_falling_hint();
    let expted = r#"
___________
0..........
1...ZZ.....
2....ZZ....
3..........
4..........
5..........
6...HH.....
7....HH....
_0123456789
"#;
    assert_eq!(format!("{board}"), expted);
}

#[test]
fn remove_hint() {
    let mut board = Board::new(10, 8);
    board.apply_spawn_falling(board.try_spawn_falling(Tetrimino::Z).unwrap());

    // let res = board.hard_drop();
    board.show_falling_hint();

    let expted = r#"
___________
0..........
1...ZZ.....
2....ZZ....
3..........
4..........
5..........
6...HH.....
7....HH....
_0123456789
"#;
    assert_eq!(format!("{board}"), expted);
    board.remove_falling_hint();
    let expted = r#"
___________
0..........
1...ZZ.....
2....ZZ....
3..........
4..........
5..........
6..........
7..........
_0123456789
"#;
    assert_eq!(format!("{board}"), expted);
}

#[test]
fn game_over() {
    let mut board = Board::new(10, 8);
    board.apply_spawn_falling(board.try_spawn_falling(Tetrimino::Z).unwrap());
    board.place_falling();

    let expted = r#"
___________
0..........
1...PP.....
2....PP....
3..........
4..........
5..........
6..........
7..........
_0123456789
"#;
    assert_eq!(format!("{board}"), expted);
    assert_eq!(board.has_placed_above(2), true);

    let mut board = Board::new(10, 8);
    board.apply_spawn_falling(board.try_spawn_falling(Tetrimino::Z).unwrap());
    board.apply_step(board.try_step().unwrap());
    board.place_falling();

    let expted = r#"
___________
0..........
1..........
2...PP.....
3....PP....
4..........
5..........
6..........
7..........
_0123456789
"#;
    assert_eq!(format!("{board}"), expted);
    assert_eq!(board.has_placed_above(2), false);
}

#[test]
fn remove_falling_block() {
    let mut board = Board::new(10, 4);
    board.apply_spawn_falling(board.try_spawn_falling(Tetrimino::Z).unwrap());
    let expted = r#"
___________
0..........
1...ZZ.....
2....ZZ....
3..........
_0123456789
"#;
    assert_eq!(format!("{board}"), expted);

    board.remove_falling_blocks();
    let expted = r#"
___________
0..........
1..........
2..........
3..........
_0123456789
"#;
    assert_eq!(format!("{board}"), expted);
}
