use axum::{
    extract::{FromRef, FromRequestParts},
    http::request::Parts,
};
use hyper::StatusCode;
use sqlx::{pool::PoolConnection, PgPool, Postgres};

use crate::app::state::ArcAppState;

pub struct DbConn(pub PoolConnection<Postgres>);

impl<S> FromRequestParts<S> for DbConn
where
    ArcAppState: FromRef<S>,
    PgPool: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = (StatusCode, String);

    async fn from_request_parts(_parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let pool = PgPool::from_ref(state);
        let conn = pool
            .acquire()
            .await
            .map_err(|err| (StatusCode::INTERNAL_SERVER_ERROR, err.to_string()))?;

        Ok(Self(conn))
    }
}
