use std::sync::{Arc, OnceLock};

use serde::Deserialize;

pub static APP_CONFIG: OnceLock<Arc<AppConfig>> = OnceLock::new();

#[derive(Debug)]
pub struct AppConfig {
    pub settings: Settings,
    pub aws_config: aws_config::SdkConfig,
    // pub jwt_access_keys: JwtKeys,
    // pub jwt_refresh_keys: JwtKeys,
}
impl AppConfig {
    pub async fn init() {
        let aws_config = Self::make_aws_config().await;
        APP_CONFIG.get_or_init(|| {
            let settings = Settings::new();
            let app_config = Self::new(settings, aws_config);
            Arc::new(app_config)
        });
    }
    fn new(settings: Settings, aws_config: aws_config::SdkConfig) -> Self {
        // let jwt_access_keys = JwtKeys::new(&settings.jwt.jwt_access_secret);
        // let jwt_refresh_keys = JwtKeys::new(&settings.jwt.jwt_refresh_secret);
        Self {
            settings,
            aws_config,
            // jwt_access_keys,
            // jwt_refresh_keys,
        }
    }

    async fn make_aws_config() -> aws_config::SdkConfig {
        let shared_config = aws_config::from_env()
            .region(aws_config::Region::new("ap-northeast-2"))
            .load()
            .await;
        shared_config
    }
}

#[derive(Debug, Deserialize)]
pub struct RedisSettings {
    pub redis_url: String,
}

#[derive(Debug, Deserialize)]
pub struct Settings {
    pub redis: RedisSettings,
    // pub dynamo: DynamoSettings,
    // pub jwt: JwtSettings,
    // pub cookie: CookieSettings,
    // pub sec: SecSettings,
    // pub gw_ws: GwWsSettings,
}

impl Settings {
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
