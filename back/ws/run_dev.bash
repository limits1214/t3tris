# before must install
# cargo install cargo-watch systemfd
# systemfd --no-pid -s http::4000 -- cargo watch -x run

# cargo install cargo-watch systemfd watchexec-cli
watchexec -r -- cargo run