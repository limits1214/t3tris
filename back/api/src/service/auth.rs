use nanoid::nanoid;
use sqlx::PgConnection;

use crate::{
    entity::user::{Provider, User, UserRole, UserStatus},
    error::{AppResult, AuthError},
    repository::{self, session::InsertSessionArg, user::InsertUserArg},
    util,
};

/// 게스트 유저 생성 및 세션 등록 후 토큰 반환
///
/// - 새로운 Guest 유저 생성
/// - 세션 등록 (user_agent, ip 포함)
/// - access_token / refresh_token 발급
pub async fn create_guest_user_with_session(
    conn: &mut PgConnection,
    nick_name: &str,
    user_agent: &str,
    ip: Option<&str>,
) -> AppResult<(String, String)> {
    let new_user_id = nanoid!();

    // JWT 발급
    let (_, access_token) = util::jwt::gen_access_token(&new_user_id)?;
    let (refresh_token_claim, refresh_token) = util::jwt::gen_refresh_token(&new_user_id)?;

    // 유저 생성
    repository::user::insert_user(
        conn,
        InsertUserArg {
            id: &new_user_id,
            nick_name,
            avatar_url: None,
            email: None,
            password: None,
            user_stt: &UserStatus::Guest,
            user_role: &UserRole::User,
            provider: &Provider::Guest,
            provider_user_id: None,
        },
    )
    .await?;

    // 세션 등록
    repository::session::insert_session(
        conn,
        InsertSessionArg {
            id: &refresh_token_claim.jti,
            user_id: &new_user_id,
            ip,
            user_agent,
            expires_at: &util::time::time_from_unix_timestamp(refresh_token_claim.exp as i64)?,
        },
    )
    .await?;

    Ok((access_token, refresh_token))
}

pub async fn create_email_user(
    conn: &mut PgConnection,
    user_agent: &str,
    ip: Option<&str>,
    nick_name: &str,
    email: &str,
    pw: &str,
    avatar_url: Option<&str>,
) -> AppResult<(String, String)> {
    // check 1
    let user = repository::user::select_user_by_email(conn, email).await?;
    if user.is_some() {
        Err(AuthError::UserExists)?
    }

    let new_user_id = nanoid!();

    let password_hash = util::hash::hash_argon2(pw)?;
    let _ = repository::user::insert_user(
        conn,
        InsertUserArg {
            id: &new_user_id,
            nick_name,
            avatar_url,
            email: Some(email),
            password: Some(&password_hash),
            user_stt: &UserStatus::WaitEmailVerify,
            user_role: &UserRole::User,
            provider: &Provider::Email,
            provider_user_id: None,
        },
    )
    .await?;

    let (_, access_token) = util::jwt::gen_access_token(&new_user_id)?;
    let (refresh_token_claim, refresh_token) = util::jwt::gen_refresh_token(&new_user_id)?;

    let _ = repository::session::insert_session(
        conn,
        InsertSessionArg {
            id: &refresh_token_claim.jti,
            user_id: &new_user_id,
            ip,
            user_agent,
            expires_at: &util::time::time_from_unix_timestamp(refresh_token_claim.exp as i64)?,
        },
    )
    .await;

    Ok((access_token, refresh_token))
}

pub async fn create_email_session(
    conn: &mut PgConnection,
    user_agent: &str,
    ip: Option<&str>,
    email: &str,
    pw: &str,
) -> AppResult<(String, String)> {
    // check 1
    let User {
        id,
        password,
        user_stt,
        ..
    } = repository::user::select_user_by_email(conn, email)
        .await?
        .ok_or(AuthError::UserNotExists)?;

    // check 2
    match user_stt {
        UserStatus::Ok => (),
        _ => Err(AuthError::UserStatusErr)?,
    };

    // check 3
    let password: String = password.ok_or(AuthError::PasswordNotExists)?;
    let result = util::hash::verify_argon2(pw, &password)?;
    if !result {
        Err(AuthError::UserPasswordNotMatch)?;
    }

    let (_, access_token) = util::jwt::gen_access_token(&id)?;
    let (refresh_token_claim, refresh_token) = util::jwt::gen_refresh_token(&id)?;

    let _ = repository::session::insert_session(
        conn,
        InsertSessionArg {
            id: &refresh_token_claim.jti,
            user_id: &id,
            ip,
            user_agent,
            expires_at: &util::time::time_from_unix_timestamp(refresh_token_claim.exp as i64)?,
        },
    )
    .await;

    Ok((access_token, refresh_token))
}

pub async fn refrsh_access_token(
    conn: &mut PgConnection,
    refresh_token: &str,
) -> AppResult<String> {
    let refresh_token_claim = util::jwt::decode_refresh_token(refresh_token)?;

    repository::session::select_session_by_id(conn, &refresh_token_claim.jti)
        .await?
        .ok_or(AuthError::RefreshTokenNotExists)?;

    let (_, access_token) = util::jwt::gen_access_token(&refresh_token_claim.sub)?;
    Ok(access_token)
}

// 존재여부 체크
// 존재한다면 발급
// 미존재한다면 가입후 발급
pub async fn create_social_user_with_session(
    conn: &mut PgConnection,
    user_agent: &str,
    ip: Option<&str>,
    provider: &Provider,
    provider_user_id: &str,
    nick_name: &str,
    email: Option<&str>,
    avatar_url: Option<&str>,
) -> AppResult<(String, String, bool)> {
    let user =
        repository::user::select_user_by_provider_id(conn, provider, provider_user_id).await?;

    let (access_token, refresh_token, is_first) = if let Some(user) = user {
        let (_, access_token) = util::jwt::gen_access_token(&user.id)?;
        let (refresh_token_claim, refresh_token) = util::jwt::gen_refresh_token(&user.id)?;
        let _ = repository::session::insert_session(
            conn,
            InsertSessionArg {
                id: &refresh_token_claim.jti,
                user_id: &user.id,
                ip,
                user_agent,
                expires_at: &util::time::time_from_unix_timestamp(refresh_token_claim.exp as i64)?,
            },
        )
        .await;
        (access_token, refresh_token, false)
    } else {
        let new_user_id = nanoid!();
        let _ = repository::user::insert_user(
            conn,
            InsertUserArg {
                id: &new_user_id,
                nick_name,
                avatar_url,
                email,
                password: None,
                user_stt: &UserStatus::Ok,
                user_role: &UserRole::User,
                provider,
                provider_user_id: Some(provider_user_id),
            },
        )
        .await?;

        let (_, access_token) = util::jwt::gen_access_token(&new_user_id)?;
        let (refresh_token_claim, refresh_token) = util::jwt::gen_refresh_token(&new_user_id)?;
        let _ = repository::session::insert_session(
            conn,
            InsertSessionArg {
                id: &refresh_token_claim.jti,
                user_id: &new_user_id,
                ip,
                user_agent,
                expires_at: &util::time::time_from_unix_timestamp(refresh_token_claim.exp as i64)?,
            },
        )
        .await;
        (access_token, refresh_token, true)
    };

    Ok((access_token, refresh_token, is_first))
}
