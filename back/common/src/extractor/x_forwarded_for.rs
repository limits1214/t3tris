use std::convert::Infallible;

use axum::{extract::FromRequestParts, http::request::Parts};

pub struct XForwardedFor(pub Option<String>);

impl<S> FromRequestParts<S> for XForwardedFor
where
    S: Send + Sync,
{
    type Rejection = Infallible;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let ret = parts
            .headers
            .get("x-forwarded-for")
            .and_then(|h| h.to_str().ok())
            .map(|s| s.to_string());

        Ok(Self(ret))
    }
}
