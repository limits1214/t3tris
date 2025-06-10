use std::convert::Infallible;

use anyhow::anyhow;
use axum::{
    extract::{FromRef, FromRequestParts},
    http::request::Parts,
};
use bb8::{Pool, PooledConnection};
use bb8_redis::RedisConnectionManager;
use hyper::StatusCode;

pub type RedisConnection = PooledConnection<'static, RedisConnectionManager>;
pub struct RedisPoolConn(pub PooledConnection<'static, RedisConnectionManager>);

// pub type RedisPool = Pool<RedisConnectionManager>;

impl<S> FromRequestParts<S> for RedisPoolConn
where
    Pool<RedisConnectionManager>: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = (StatusCode, String);

    async fn from_request_parts(_parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let pool = Pool::<RedisConnectionManager>::from_ref(state);

        let conn = pool
            .get_owned()
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
