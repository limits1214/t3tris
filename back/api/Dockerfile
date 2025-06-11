FROM rust:1.87-alpine AS builder

RUN apk add --no-cache musl-dev

WORKDIR /workspace

# 전체 프로젝트 복사
COPY . .

# 지정된 crate만 빌드
RUN cargo build --release \
    --target aarch64-unknown-linux-musl \
    --manifest-path ./api/Cargo.toml

# RUN strip target/aarch64-unknown-linux-musl/release/t2ris-api

# 실행 이미지
# FROM scratch
FROM alpine

WORKDIR /app
COPY --from=builder /workspace/target/aarch64-unknown-linux-musl/release/t2ris-api /app/t2ris-api
COPY --from=builder /workspace/api/Settings.toml /app/Settings.toml
EXPOSE 4000
ENTRYPOINT ["/app/t2ris-api"]
