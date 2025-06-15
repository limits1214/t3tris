-- 유저 테이블
CREATE TABLE tb_user(
    id                  VARCHAR(21)                 NOT NULL,
    nick_name           VARCHAR(100)                NOT NULL,
    avatar_url          VARCHAR(500)                NULL,
    email               VARCHAR(100)                NULL,
    password            VARCHAR(200)                NULL,
    user_stt            VARCHAR(100)                NOT NULL,
    user_role           VARCHAR(100)                NOT NULL,
    provider            VARCHAR(100)                NOT NULL,
    provider_user_id    VARCHAR(100)                NULL,
    --
    created_at          TIMESTAMP WITH TIME ZONE    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by          VARCHAR(21)                 NULL,
    updated_at          TIMESTAMP WITH TIME ZONE    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by          VARCHAR(21)                 NULL,
    is_deleted          BOOLEAN                     NOT NULL DEFAULT FALSE
);
ALTER TABLE tb_user ADD CONSTRAINT pk_tb_user_id PRIMARY KEY (id);
ALTER TABLE tb_user ADD CONSTRAINT uq_tb_user_email UNIQUE (email);
-- user_stt 제약
ALTER TABLE tb_user ADD CONSTRAINT ck_tb_user_stt
  CHECK (user_stt IN ('Guest', 'WaitEmailVerify', 'Ok', 'Quit'));
-- user_role 제약
ALTER TABLE tb_user ADD CONSTRAINT ck_tb_user_role
  CHECK (user_role IN ('User', 'Admin'));
-- provider 제약
ALTER TABLE tb_user ADD CONSTRAINT ck_tb_user_provider
  CHECK (provider IN ('Guest', 'Email', 'Google', 'Kakao', 'Naver', 'Github', 'Apple', 'Facebook'));

-- 세션 테이블
CREATE TABLE tb_session(
    -- jti
    id                  VARCHAR(21)                 NOT NULL,
    user_id             VARCHAR(21)                 NOT NULL,
    ip                  VARCHAR(200)                NULL,
    user_agent          VARCHAR(300)                NULL,
    expires_at          TIMESTAMP WITH TIME ZONE    NOT NULL,
    --
    created_at          TIMESTAMP WITH TIME ZONE    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by          VARCHAR(21)                 NULL,
    updated_at          TIMESTAMP WITH TIME ZONE    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by          VARCHAR(21)                 NULL,
    is_deleted          BOOLEAN                     NOT NULL DEFAULT FALSE
);
ALTER TABLE tb_session ADD CONSTRAINT pk_tb_session_id PRIMARY KEY (id);
CREATE INDEX idx_tb_session_user_id ON tb_session(user_id);