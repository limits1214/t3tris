use sqlx::FromRow;
use time::OffsetDateTime;
#[allow(dead_code)]
#[derive(Debug, FromRow)]
pub struct User {
    pub id: String,
    pub nick_name: String,
    pub avatar_url: Option<String>,
    pub email: Option<String>,
    pub password: Option<String>,
    pub user_stt: UserStatus,
    pub user_role: UserRole,
    pub provider: Provider,
    pub provider_user_id: Option<String>,
    pub created_at: OffsetDateTime,
    pub created_by: Option<String>,
    pub updated_at: OffsetDateTime,
    pub updated_by: Option<String>,
    pub is_deleted: bool,
}

#[derive(Debug, sqlx::Type)]
#[sqlx(type_name = "VARCHAR", rename_all = "PascalCase")]
pub enum UserStatus {
    Guest,
    WaitEmailVerify,
    Ok,
    Quit,
}

#[derive(Debug, sqlx::Type)]
#[sqlx(type_name = "VARCHAR", rename_all = "PascalCase")]
pub enum UserRole {
    User,
    Admin,
}

#[derive(Debug, sqlx::Type)]
#[sqlx(type_name = "VARCHAR", rename_all = "PascalCase")]
pub enum Provider {
    Guest,
    Email,
    Google,
    Kakao,
    Naver,
    Github,
    Apple,
    Facebook,
}
impl AsRef<str> for UserStatus {
    fn as_ref(&self) -> &str {
        match self {
            UserStatus::Guest => "Guest",
            UserStatus::WaitEmailVerify => "WaitEmailVerify",
            UserStatus::Ok => "Ok",
            UserStatus::Quit => "Quit",
        }
    }
}

impl AsRef<str> for UserRole {
    fn as_ref(&self) -> &str {
        match self {
            UserRole::User => "User",
            UserRole::Admin => "Admin",
        }
    }
}

impl AsRef<str> for Provider {
    fn as_ref(&self) -> &str {
        match self {
            Provider::Guest => "Guest",
            Provider::Email => "Email",
            Provider::Google => "Google",
            Provider::Kakao => "Kakao",
            Provider::Naver => "Naver",
            Provider::Github => "Github",
            Provider::Apple => "Apple",
            Provider::Facebook => "Facebook",
        }
    }
}
