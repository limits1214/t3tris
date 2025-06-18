use axum::{
    extract::{FromRef, FromRequestParts},
    http::request::Parts,
};
use hyper::StatusCode;
use std::convert::Infallible;

#[allow(dead_code)]
pub struct RedisConn(pub deadpool_redis::Connection);

impl<S> FromRequestParts<S> for RedisConn
where
    deadpool_redis::Pool: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = (StatusCode, String);

    async fn from_request_parts(_parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let pool = deadpool_redis::Pool::from_ref(state);

        let conn = pool
            .get()
            .await
            .map_err(|err| (StatusCode::INTERNAL_SERVER_ERROR, err.to_string()))?;

        Ok(Self(conn))
    }
}

pub struct RedisClient(pub redis::Client);

impl<S> FromRequestParts<S> for RedisClient
where
    redis::Client: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = Infallible;

    async fn from_request_parts(_parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let clinet = redis::Client::from_ref(state);
        Ok(Self(clinet))
    }
}
