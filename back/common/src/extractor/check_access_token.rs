use anyhow::anyhow;
use axum::{
    RequestPartsExt,
    extract::{FromRequestParts, OptionalFromRequestParts},
    http::request::Parts,
};
use axum_extra::{
    TypedHeader,
    headers::{Authorization, authorization::Bearer},
};

use crate::{error::AppError, jwt::AccessTokenClaim, util};

#[derive(Debug)]
pub struct CheckAccessToken(pub AccessTokenClaim);

impl<S> FromRequestParts<S> for CheckAccessToken
where
    // Arc<CommonAppState>: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let bearer = parts
            .extract::<TypedHeader<Authorization<Bearer>>>()
            .await
            .map_err(|err| anyhow!(err))?;

        let access_token_claim =
            util::jwt::decode_access_token(&bearer.token()).map_err(|err| anyhow!(err))?;
        Ok(Self(access_token_claim))
    }
}

impl<S> OptionalFromRequestParts<S> for CheckAccessToken
where
    // Arc<CommonAppState>: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &S,
    ) -> Result<Option<Self>, Self::Rejection> {
        let bearer =
            <CheckAccessToken as FromRequestParts<S>>::from_request_parts(parts, state).await;
        Ok(bearer.ok())
    }
}
