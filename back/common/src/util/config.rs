use std::sync::{Arc, OnceLock};

use crate::{
    config::{CommonAppConfig, CommonSettings, DatabaseSettings, JwtSettings, RedisSettings},
    jwt::JwtKeys,
};

static APP_CONFIG: OnceLock<Arc<CommonAppConfig>> = OnceLock::new();

pub fn config_init() {
    APP_CONFIG.get_or_init(|| {
        let settings = CommonSettings::new();
        let app_config = CommonAppConfig::new(settings);
        Arc::new(app_config)
    });
}

pub fn get_config_settings_redis() -> &'static RedisSettings {
    &APP_CONFIG.get().unwrap().settings.redis
}

pub fn get_config_settings_db() -> &'static DatabaseSettings {
    &APP_CONFIG.get().unwrap().settings.database
}

pub fn get_config_settings_jwt() -> &'static JwtSettings {
    &APP_CONFIG.get().unwrap().settings.jwt
}

// pub fn get_config_settings_app() -> &'static AppSettings {
//     &APP_CONFIG.get().unwrap().settings.app
// }

// pub fn get_config_settings_oauth2() -> &'static Oauth2Settings {
//     &APP_CONFIG.get().unwrap().settings.oauth2
// }

// pub fn get_config_redis_url() -> &'static str {
//     &APP_CONFIG.get().unwrap().settings.redis.redis_url
// }

pub fn get_config_jwt_access_keys() -> &'static JwtKeys {
    &APP_CONFIG.get().unwrap().jwt_access_keys
}

pub fn get_config_jwt_refresh_keys() -> &'static JwtKeys {
    &APP_CONFIG.get().unwrap().jwt_refresh_keys
}
