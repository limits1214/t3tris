-- 게임백업 테이블
CREATE TABLE tb_game_room_backup (
    id              SERIAL PRIMARY KEY,
    room_id         VARCHAR(21)                 NOT NULL,
    game_id         VARCHAR(21)                 NOT NULL,
    ws_ids          JSONB                       NOT NULL,
    user_ids        JSONB                       NOT NULL,
    data            JSONB                       NOT NULL,
    --
    created_at      TIMESTAMP WITH TIME ZONE    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by      VARCHAR(21)                 NULL,
    updated_at      TIMESTAMP WITH TIME ZONE    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by      VARCHAR(21)                 NULL,
    is_deleted      BOOLEAN                     NOT NULL DEFAULT FALSE
);