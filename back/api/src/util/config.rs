use crate::app::config::APP_CONFIG;

pub fn get_aws_config() -> &'static aws_config::SdkConfig {
    &APP_CONFIG.get().unwrap().aws_config
}

pub fn get_config_redis_url() -> &'static str {
    &APP_CONFIG.get().unwrap().settings.redis.redis_url
}
