use axum_extra::extract::cookie::Cookie;

use crate::constant::REFRESH_TOKEN;

pub fn gen_refresh_token_cookie(refresh_token: String) -> Cookie<'static> {
    let refresh_time = common::util::config::get_config_settings_jwt().jwt_refresh_time;
    Cookie::build((REFRESH_TOKEN, refresh_token))
        .path("/")
        .http_only(true)
        .max_age(time::Duration::seconds(refresh_time))
        .build()
}

pub fn gen_refresh_token_invalidate() -> Cookie<'static> {
    Cookie::build((REFRESH_TOKEN, ""))
        .path("/")
        .http_only(true)
        .max_age(time::Duration::seconds(0))
        .build()
}
