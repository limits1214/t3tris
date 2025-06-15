use jsonwebtoken::{DecodingKey, EncodingKey, Header, TokenData, Validation};
use nanoid::nanoid;
use serde::{de::DeserializeOwned, Deserialize, Serialize};
use time::OffsetDateTime;

#[derive(Clone)]
pub struct JwtKeys {
    pub encoding: EncodingKey,
    pub decoding: DecodingKey,
}
impl std::fmt::Debug for JwtKeys {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("JwtKeys")
            .field("encoding", &"EncodingKey(...)")
            .field("decoding", &"DecodingKey(...)")
            .finish()
    }
}
impl JwtKeys {
    pub fn new(secret: &str) -> Self {
        let bsecret = secret.as_bytes();
        Self {
            encoding: EncodingKey::from_secret(bsecret),
            decoding: DecodingKey::from_secret(bsecret),
        }
    }

    pub fn encode<T>(&self, claims: &T) -> Result<String, jsonwebtoken::errors::Error>
    where
        T: Serialize,
    {
        jsonwebtoken::encode(&Header::default(), claims, &self.encoding)
    }

    pub fn decode<T>(&self, token: &str) -> Result<TokenData<T>, jsonwebtoken::errors::Error>
    where
        T: DeserializeOwned,
    {
        jsonwebtoken::decode::<T>(token, &self.decoding, &Validation::default())
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AccessTokenClaim {
    pub sub: String,
    pub exp: usize,
    pub iat: usize,
}
impl AccessTokenClaim {
    pub fn new(sub: &str) -> Self {
        let now = OffsetDateTime::now_utc();
        let access_time = crate::util::config::get_config_settings_jwt().jwt_access_time;
        let exp = now + time::Duration::seconds(access_time);
        let exp = exp.unix_timestamp() as usize;
        let iat = now.unix_timestamp() as usize;
        Self {
            sub: sub.to_string(),
            exp,
            iat,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RefreshTokenClaim {
    pub sub: String,
    pub exp: usize,
    pub iat: usize,
    pub jti: String,
}

impl RefreshTokenClaim {
    pub fn new(sub: &str) -> Self {
        let now = OffsetDateTime::now_utc();
        let access_time = crate::util::config::get_config_settings_jwt().jwt_refresh_time;
        let exp = now + time::Duration::seconds(access_time);
        let exp = exp.unix_timestamp() as usize;
        let iat = now.unix_timestamp() as usize;
        Self {
            sub: sub.to_string(),
            exp,
            iat,
            jti: nanoid!(),
        }
    }
}
