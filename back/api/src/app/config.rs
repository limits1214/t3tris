use serde::Deserialize;

#[derive(Debug)]
pub struct AppConfig {
    pub settings: Settings,
}
impl AppConfig {
    pub fn new(settings: Settings) -> Self {
        Self { settings }
    }
}

#[derive(Debug, Deserialize)]
pub struct AppSettings {
    pub front_url: String,
    pub back_url: String,
}
#[derive(Debug, Deserialize)]
pub struct Oauth2Settings {
    pub oauth2_google_client_id: String,
    pub oauth2_google_client_secret: String,
}

#[derive(Debug, Deserialize)]
pub struct Settings {
    pub app: AppSettings,
    pub oauth2: Oauth2Settings,
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
