use sqlx::{postgres::PgPoolOptions, Pool, Postgres};

use crate::util;

pub async fn init_db_pool() -> Pool<Postgres> {
    //TODO: settings 에서 받아오게
    let dp_pool_max_connections_cnt = 5;
    //TODO: settings 에서 받아오게
    let dp_pool_acquire_timeout_sec = std::time::Duration::from_secs(3);
    let database_url = &util::config::get_config_settings_db().database_url;
    PgPoolOptions::new()
        .max_connections(dp_pool_max_connections_cnt)
        .acquire_timeout(dp_pool_acquire_timeout_sec)
        .connect(database_url)
        .await
        .expect("can't connect to database")
}
