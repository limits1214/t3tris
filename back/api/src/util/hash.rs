use anyhow::anyhow;
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use sha2::{Digest, Sha256, Sha512};

pub fn hash_argon2(password: &str) -> anyhow::Result<String> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| anyhow!(e))?;
    Ok(password_hash.to_string())
}

pub fn verify_argon2(password: &str, password_hash: &str) -> anyhow::Result<bool> {
    let parsed_hash = PasswordHash::new(password_hash).map_err(|e| anyhow!(e))?;
    let argon2 = Argon2::default();
    let ok = argon2
        .verify_password(password.as_bytes(), &parsed_hash)
        .is_ok();
    Ok(ok)
}

#[allow(dead_code)]
pub fn hash_sha_256(digest: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(digest.as_bytes());
    let result = hasher.finalize();
    hex::encode(result)
}

#[allow(dead_code)]
pub fn hash_sha_512(digest: String) -> String {
    let mut hasher = Sha512::new();
    hasher.update(digest.as_bytes());
    let result = hasher.finalize();
    hex::encode(result)
}
