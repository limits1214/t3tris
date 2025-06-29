use crossterm::{
    cursor,
    event::{self, Event, KeyCode},
    execute,
    style::Print,
    terminal::{self, ClearType},
};
use std::io::{Write, stdout};
use std::time::{Duration, Instant};
use tetris_lib::{Board, MoveDirection, RotateDirection, Tetrimino};

struct Tetris {
    board: Board,
    clearline: u32,
}
impl Tetris {
    pub fn new() -> Self {
        Self {
            board: Board::new_common(),
            clearline: 0,
        }
    }
}

impl Tetris {
    pub fn rand_tetrimino() -> Tetrimino {
        let v = vec![
            Tetrimino::I,
            Tetrimino::O,
            Tetrimino::T,
            Tetrimino::J,
            Tetrimino::L,
            Tetrimino::S,
            Tetrimino::Z,
        ];
        let i = fastrand::usize(..v.len());
        v[i]
    }

    pub fn start(&mut self) {
        self.board.apply_spawn_falling(
            self.board
                .try_spawn_falling(Self::rand_tetrimino())
                .unwrap(),
        );
        self.board.remove_falling_hint();
        self.board.show_falling_hint();
    }

    pub fn tick(&mut self, stdout: &mut std::io::Stdout) {
        match self.board.try_step() {
            Ok(x) => self.board.apply_step(x),
            Err(err) => match err {
                tetris_lib::StepError::InvalidShape => todo!(),
                tetris_lib::StepError::OutOfBounds | tetris_lib::StepError::Blocked(_) => {
                    self.board.place_falling();

                    let x = self.board.try_line_clear();
                    if !x.is_empty() {
                        self.clearline += x.len() as u32;
                        self.board.apply_line_clear(x);
                    }

                    self.start();
                    let _ = draw(stdout, self);
                }
            },
        }
    }
}

fn main() -> anyhow::Result<()> {
    let mut stdout = stdout();
    terminal::enable_raw_mode()?;
    execute!(stdout, terminal::EnterAlternateScreen, cursor::Hide)?;

    let mut last_tick = Instant::now();
    let tick_rate = Duration::from_millis(500);
    let mut tetris = Tetris::new();

    tetris.start();
    draw(&mut stdout, &mut tetris)?;
    let mut is_game_over = false;

    loop {
        // 입력 이벤트 핸들링
        if event::poll(Duration::from_millis(10))? {
            if let Event::Key(key_event) = event::read()? {
                match key_event.code {
                    KeyCode::Char('q') => break, // q 누르면 종료
                    KeyCode::Left => {
                        if !is_game_over {
                            match tetris.board.try_move_falling(MoveDirection::Left) {
                                Ok(mv) => tetris.board.apply_move_falling(mv),
                                Err(_) => {
                                    //
                                }
                            };
                            tetris.board.remove_falling_hint();
                            tetris.board.show_falling_hint();
                            draw(&mut stdout, &mut tetris)?;
                        }
                    }
                    KeyCode::Right => {
                        if !is_game_over {
                            match tetris.board.try_move_falling(MoveDirection::Right) {
                                Ok(mv) => tetris.board.apply_move_falling(mv),
                                Err(_) => {
                                    //
                                }
                            };
                            tetris.board.remove_falling_hint();
                            tetris.board.show_falling_hint();
                            draw(&mut stdout, &mut tetris)?;
                        }
                    }
                    KeyCode::Down => {
                        //
                        if !is_game_over {
                            match tetris.board.try_step() {
                                Ok(mv) => tetris.board.apply_step(mv),
                                Err(_) => {
                                    //
                                }
                            };
                            draw(&mut stdout, &mut tetris)?;
                        }
                    }
                    KeyCode::Up => {
                        if !is_game_over {
                            match tetris.board.try_rotate_falling(RotateDirection::Right) {
                                Ok(mv) => tetris.board.apply_rotate_falling(mv),
                                Err(_) => {
                                    //
                                }
                            };
                            tetris.board.remove_falling_hint();
                            tetris.board.show_falling_hint();
                            draw(&mut stdout, &mut tetris)?;
                        }
                    }
                    KeyCode::Char(' ') => {
                        if !is_game_over {
                            let _ = tetris.board.hard_drop();
                            tetris.tick(&mut stdout);
                        }
                    }
                    KeyCode::Char('r') => {
                        if is_game_over {
                            tetris = Tetris::new();
                            tetris.start();
                            is_game_over = false;
                        } else {
                            //te
                        }
                    }
                    _ => {}
                }
            }
        }

        // 매 틱마다 화면 갱신
        if last_tick.elapsed() >= tick_rate {
            // draw(&mut stdout, &mut cnt)?;
            if tetris.board.has_placed_above(3) {
                is_game_over = true;
                execute!(stdout, cursor::MoveTo(0, 0), Print("RESTART R"))?;
            } else {
                tetris.tick(&mut stdout);
                draw(&mut stdout, &mut tetris)?;
            }

            last_tick = Instant::now();
        }
    }

    // 터미널 복구
    execute!(stdout, terminal::LeaveAlternateScreen, cursor::Show)?;
    terminal::disable_raw_mode()?;
    Ok(())
}

fn draw(stdout: &mut std::io::Stdout, tetris: &mut Tetris) -> anyhow::Result<()> {
    execute!(
        stdout,
        cursor::MoveTo(0, 0),
        terminal::Clear(ClearType::All)
    )?;

    //
    let mut frame = String::new();
    frame.push_str("\r┌──────────┐\n");
    for y in 0..tetris.board.y_len() {
        frame.push('\r');
        frame.push('│');
        for tile in tetris.board.line(y) {
            frame.push_str(&format!("{}", tile));
        }
        frame.push_str("│\n");
    }
    frame.push_str("\r└──────────┘");

    execute!(stdout, cursor::MoveTo(0, 0), Print(frame))?;
    execute!(
        stdout,
        cursor::MoveTo(20, 0),
        Print(format!("clearline: {}", tetris.clearline))
    )?;
    //
    stdout.flush()?;
    Ok(())
}
