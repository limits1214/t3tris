use std::sync::{Arc, OnceLock};

use crate::app::config::{AppConfig, AppSettings, Oauth2Settings, Settings};

static APP_CONFIG: OnceLock<Arc<AppConfig>> = OnceLock::new();

pub fn config_init() {
    APP_CONFIG.get_or_init(|| {
        let settings = Settings::new();
        let app_config = AppConfig::new(settings);
        Arc::new(app_config)
    });
}

pub fn get_config_settings_app() -> &'static AppSettings {
    &APP_CONFIG.get().unwrap().settings.app
}

pub fn get_config_settings_oauth2() -> &'static Oauth2Settings {
    &APP_CONFIG.get().unwrap().settings.oauth2
}
