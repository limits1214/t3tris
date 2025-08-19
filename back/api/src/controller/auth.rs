use crate::{app::state::ArcApiAppState, constant::REFRESH_TOKEN, service, util};
use anyhow::anyhow;
use axum::{
    extract::Query,
    response::{IntoResponse, Redirect},
    routing::{get, post},
    Json, Router,
};
use axum_extra::{
    extract::CookieJar,
    headers::{authorization::Bearer, Authorization, UserAgent},
    TypedHeader,
};
use common::{
    dto::{
        request::auth::{EmailLoginRequest, EmailSignupRequest, GuestLoginRequest, OAuthCallback},
        response::{
            auth::{AccessAndRefreshTokenResponse, AccessTokenResponse},
            ApiResponse,
        },
    },
    error::{AppResult, AuthError},
    extractor::db::DbConn,
};
use common::{entity::user::Provider, extractor::x_forwarded_for::XForwardedFor};
use oauth2::{AuthorizationCode, CsrfToken, Scope, TokenResponse};
use serde_json::json;
use validator::Validate;

pub fn auth_router(_state: ArcApiAppState) -> Router<ArcApiAppState> {
    Router::new()
        .route("/api/auth/logout", post(refresh_token_logout))
        .route("/api/auth/token/refresh", post(access_token_refresh))
        .route("/api/auth/guest/login", post(guest_login))
        .route("/api/auth/email/signup", post(email_signup))
        .route("/api/auth/email/login", post(email_login))
        .route("/api/auth/google/login", get(google_login))
        .route("/api/auth/google/callback", get(google_login_callback))
        .route("/api/auth/wstoken", get(get_ws_token))
}

/// 게스트 로그인 핸들러
/// - 별다른 가입 없이 닉네임만 입력하면되고 해당 닉네임으로 Guest 유저를 가입시키고 로그인 시켜준다.
/// - 닉네임은 중복을 허용한다.
pub async fn guest_login(
    DbConn(mut conn): DbConn,
    TypedHeader(user_agent): TypedHeader<UserAgent>,
    XForwardedFor(x_forwarded): XForwardedFor,
    _jar: CookieJar,
    Json(j): Json<GuestLoginRequest>,
) -> AppResult<Json<ApiResponse<AccessAndRefreshTokenResponse>>> {
    j.validate()?;

    let mut tx = common::util::dbtx::begin(&mut conn).await?;

    // 게스트 유저 생성 및 세션 등록, 토큰 발급
    let (access_token, refresh_token) = service::auth::create_guest_user_with_session(
        &mut tx,
        &j.nick_name,
        user_agent.as_str(),
        x_forwarded.as_deref(),
    )
    .await?;

    common::util::dbtx::commit(tx).await?;

    // {
    //     // refresh_token 쿠키 세팅 + 응답 반환
    //     let refresh_token_cookie = util::cookie::gen_refresh_token_cookie(refresh_token);
    //     let res_json = ApiResponse::ok(AccessTokenResponse { access_token });
    //     Ok((jar.add(refresh_token_cookie), Json(res_json)))
    // }

    let res_json = ApiResponse::ok(AccessAndRefreshTokenResponse {
        access_token,
        refresh_token,
    });
    Ok(Json(res_json))
}

/// 이메일 가입 핸들러
/// - 이메일은 미사용
/// - TODO: 이메일 검증 코드 보내기 구현 필요
pub async fn email_signup(
    DbConn(mut conn): DbConn,
    XForwardedFor(x_forwarded): XForwardedFor,
    TypedHeader(user_agent): TypedHeader<UserAgent>,
    jar: CookieJar,
    Json(j): Json<EmailSignupRequest>,
) -> AppResult<(CookieJar, Json<ApiResponse<AccessTokenResponse>>)> {
    j.validate()?;

    let (access_token, refresh_token) = service::auth::create_email_user(
        &mut conn,
        user_agent.as_str(),
        x_forwarded.as_deref(),
        &j.nick_name,
        &j.email,
        &j.pw,
        j.avatar_url.as_deref(),
    )
    .await?;

    let refresh_token_cookie = util::cookie::gen_refresh_token_cookie(refresh_token);
    let res_json = ApiResponse::ok(AccessTokenResponse { access_token });
    Ok((jar.add(refresh_token_cookie), Json(res_json)))
}

/// 이메일 로그인 핸들러
/// - 이메일은 미사용
pub async fn email_login(
    XForwardedFor(x_forwarded): XForwardedFor,
    TypedHeader(user_agent): TypedHeader<UserAgent>,
    jar: CookieJar,
    DbConn(mut conn): DbConn,
    Json(j): Json<EmailLoginRequest>,
) -> AppResult<(CookieJar, Json<ApiResponse<AccessTokenResponse>>)> {
    j.validate()?;

    let (access_token, refresh_token) = service::auth::create_email_session(
        &mut conn,
        user_agent.as_str(),
        x_forwarded.as_deref(),
        &j.email,
        &j.pw,
    )
    .await?;

    let refresh_token_cookie = util::cookie::gen_refresh_token_cookie(refresh_token);
    let res_json = ApiResponse::ok(AccessTokenResponse { access_token });
    Ok((jar.add(refresh_token_cookie), Json(res_json)))
}

/// 액세스 토큰 리프레쉬 핸들러
/// - refresh token 쿠키가 존재해야 한다.
pub async fn access_token_refresh(
    DbConn(mut conn): DbConn,
    _jar: CookieJar,
    TypedHeader(Authorization(bearer)): TypedHeader<Authorization<Bearer>>,
) -> AppResult<Json<ApiResponse<AccessTokenResponse>>> {
    // let refresh_token_cookie = jar
    //     .get(REFRESH_TOKEN)
    //     .ok_or(AuthError::RefreshTokenNotExists)?;

    // {
    //     let access_token =
    //         service::auth::refrsh_access_token(&mut conn, refresh_token_cookie.value()).await?;
    //     let res_json = ApiResponse::ok(AccessTokenResponse { access_token });
    //     Ok(Json(res_json))
    // }
    let refresh_token_str = bearer.token();
    let access_token = service::auth::refrsh_access_token(&mut conn, refresh_token_str).await?;

    let res_json = ApiResponse::ok(AccessTokenResponse { access_token });
    Ok(Json(res_json))
}

/// 로그아웃 핸들러
/// - refresh_token 쿠키를 제거한다.
pub async fn refresh_token_logout(jar: CookieJar) -> (CookieJar, Json<ApiResponse<()>>) {
    (
        jar.add(util::cookie::gen_refresh_token_invalidate()),
        Json(ApiResponse::just_ok()),
    )
}

/// 구글로그인 핸들러
/// - 구글 authorize페이지로 리다이렉트함
pub async fn google_login() -> Redirect {
    let client = util::oauth2::google_oauth2_client();
    let state = json!({
        "csrf": CsrfToken::new_random()
    })
    .to_string();

    // 구글 유저 조회에서 email 과 profile 이미지 얻어야하니 스코프 추가
    let (authorize_url, _csrf_state) = client
        .authorize_url(|| CsrfToken::new(state))
        .add_scope(Scope::new(format!(
            "https://www.googleapis.com/auth/userinfo.email"
        )))
        .add_scope(Scope::new(format!(
            "https://www.googleapis.com/auth/userinfo.profile"
        )))
        .url();

    // 구글 authorize 페이지로 리다이렉트
    Redirect::temporary(authorize_url.to_string().as_str())
}

/// 구글로그인 콜백 핸들러
/// - 구글로 리다이렉트를 통해 받은 code 값으로 google acceess token을 http 요청을 통해 얻어온다
/// - google access token을 가지고 google user info http 요청에 사용해서 사용자 정보를 얻는다.
/// - 얻은 사용자 정보를 통해 가입 or 로그인 및 세션만들어준다.
/// - 이후 다시 front로 리다이렉트해준다.
/// - TODO: 닉네임 변환 필요
pub async fn google_login_callback(
    DbConn(mut conn): DbConn,
    TypedHeader(user_agent): TypedHeader<UserAgent>,
    XForwardedFor(x_forwarded): XForwardedFor,
    jar: CookieJar,
    query: Query<OAuthCallback>,
) -> AppResult<(CookieJar, Redirect)> {
    let client = util::oauth2::google_oauth2_client();

    // 코드 를 액세스토큰으로 교환
    let token_result = client
        .exchange_code(AuthorizationCode::new(query.code.clone()))
        .request_async(common::util::http_client::get_http_clinet())
        .await
        .map_err(|err| anyhow!(err))?;
    let google_access_token = token_result.access_token().secret().to_string();

    // 액세스토큰으로 구글 유저 정보 획득
    let info = util::oauth2::google_oauth2_user_info_api(&google_access_token).await?;
    tracing::info!(
        "google_login_callback!! query: {:?}, forwarded: {:?}, user_agent: {:?}, info: {:?}",
        query,
        x_forwarded.as_deref(),
        user_agent,
        info
    );

    // 서비스 호출 위한 파라미터 정제
    let google_provider_user_id = info
        .get("sub")
        .and_then(|j| j.as_str())
        .ok_or_else(|| anyhow!("GoogleInfoSubNotExists"))?;
    let google_email = info.get("email").and_then(|j| j.as_str());
    let google_nick_name = info.get("name").and_then(|j| j.as_str());
    // TODO: nick_name conversion
    let google_nick_name = google_nick_name.unwrap_or_else(|| "NICK_NAME");
    let google_avatar_url = info.get("picture").and_then(|j| j.as_str());

    // 구글 유저 정보로 가입 or 로그인 서비스 진행
    let (access_token, refresh_token, is_first) = service::auth::create_social_user_with_session(
        &mut conn,
        user_agent.as_str(),
        x_forwarded.as_deref(),
        &Provider::Google,
        google_provider_user_id,
        google_nick_name,
        google_email,
        google_avatar_url,
    )
    .await?;

    // 프론트로 리다이렉트
    let appsettings = util::config::get_config_settings_app();
    let refresh_token_cookie = util::cookie::gen_refresh_token_cookie(refresh_token);
    Ok((
        jar.add(refresh_token_cookie),
        Redirect::to(&format!(
            "{}/loginsuccess?accessToken={access_token}&isFirst={is_first}",
            appsettings.front_url
        )),
    ))
}

/// 단순 ws 연결 막기위한
/// 검증 ws 토큰 발급
/// TODO: access_token 생성 함수를 가지고 했지만, 전용 ws 토큰 생성 함수 만들기
pub async fn get_ws_token() -> AppResult<impl IntoResponse> {
    let (_, access_token) = common::util::jwt::gen_access_token("ws_token")?;
    Ok(Json(ApiResponse::ok(json!({"accessToken": access_token}))))
}
