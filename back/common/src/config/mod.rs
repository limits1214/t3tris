use crate::jwt::JwtKeys;
use serde::Deserialize;

#[derive(Debug)]
pub struct CommonAppConfig {
    pub settings: CommonSettings,
    pub jwt_access_keys: JwtKeys,
    pub jwt_refresh_keys: JwtKeys,
}
impl CommonAppConfig {
    pub fn new(settings: CommonSettings) -> Self {
        let jwt_access_keys = JwtKeys::new(&settings.jwt.jwt_access_secret);
        let jwt_refresh_keys = JwtKeys::new(&settings.jwt.jwt_refresh_secret);
        Self {
            settings,
            jwt_access_keys,
            jwt_refresh_keys,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct AppSettings {
    pub front_url: String,
    pub back_url: String,
}
#[derive(Debug, Deserialize)]
pub struct RedisSettings {
    pub redis_url: String,
}

#[derive(Debug, Deserialize)]
pub struct JwtSettings {
    pub jwt_access_secret: String,
    pub jwt_refresh_secret: String,
    pub jwt_access_time: i64,
    pub jwt_refresh_time: i64,
}

#[derive(Debug, Deserialize)]
pub struct DatabaseSettings {
    pub database_url: String,
}

#[derive(Debug, Deserialize)]
pub struct CommonSettings {
    pub app: AppSettings,
    pub database: DatabaseSettings,
    pub redis: RedisSettings,
    pub jwt: JwtSettings,
}

impl CommonSettings {
    pub fn new() -> Self {
        let builder = config::Config::builder()
            .add_source(config::File::with_name("Settings"))
            .add_source(config::File::with_name("Settings.local").required(false))
            .add_source(config::Environment::default().prefix("ENV").separator("__"))
            .build()
            .unwrap();
        builder.try_deserialize().unwrap()
    }
}
