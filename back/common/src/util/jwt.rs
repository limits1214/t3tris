use crate::jwt::{AccessTokenClaim, RefreshTokenClaim};

pub fn gen_access_token(
    sub: &str,
) -> Result<(AccessTokenClaim, String), jsonwebtoken::errors::Error> {
    let access_token_claim = AccessTokenClaim::new(sub);
    let keys = super::config::get_config_jwt_access_keys();
    let access_token = keys.encode(&access_token_claim)?;
    Ok((access_token_claim, access_token))
}

pub fn decode_access_token(jwt: &str) -> Result<AccessTokenClaim, jsonwebtoken::errors::Error> {
    let token = super::config::get_config_jwt_access_keys().decode::<AccessTokenClaim>(jwt)?;
    Ok(token.claims)
}

pub fn gen_refresh_token(
    sub: &str,
) -> Result<(RefreshTokenClaim, String), jsonwebtoken::errors::Error> {
    let refresh_token_claim = RefreshTokenClaim::new(sub);
    let keys = super::config::get_config_jwt_refresh_keys();
    let refresh_token = keys.encode(&refresh_token_claim)?;
    Ok((refresh_token_claim, refresh_token))
}

pub fn decode_refresh_token(jwt: &str) -> Result<RefreshTokenClaim, jsonwebtoken::errors::Error> {
    let token = super::config::get_config_jwt_refresh_keys().decode::<RefreshTokenClaim>(jwt)?;
    Ok(token.claims)
}
