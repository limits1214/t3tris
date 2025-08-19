# FROM rust:1.87-slim AS builder

# RUN apt update && apt install -y \
#     musl-tools \
#     gcc-aarch64-linux-gnu \
#     pkg-config \
#     && rustup target add aarch64-unknown-linux-musl

# ENV CC_aarch64_unknown_linux_musl=aarch64-linux-gnu-gcc

FROM messense/rust-musl-cross:aarch64-musl AS builder

WORKDIR /workspace

# 필요한 타겟 추가
RUN rustup target add aarch64-unknown-linux-musl

# 전체 프로젝트 복사
COPY . .

# 지정된 crate만 빌드
RUN cargo build --release \
    --target aarch64-unknown-linux-musl \
    --manifest-path ./api/Cargo.toml

# RUN strip target/aarch64-unknown-linux-musl/release/tetris-api

# 실행 이미지
# FROM scratch
FROM alpine

WORKDIR /app
COPY --from=builder /workspace/target/aarch64-unknown-linux-musl/release/tetris-api /app/tetris-api
COPY --from=builder /workspace/api/Settings.toml /app/Settings.toml
EXPOSE 4000
ENTRYPOINT ["/app/tetris-api"]
