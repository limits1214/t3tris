use crate::entity::user::Provider;
use crate::entity::user::User;
use crate::entity::user::UserRole;
use crate::entity::user::UserStatus;
use sqlx::PgConnection;
use sqlx::postgres::PgQueryResult;

pub async fn select_user_by_id(conn: &mut PgConnection, id: &str) -> anyhow::Result<Option<User>> {
    let user = sqlx::query_as!(
        User,
        r#"
            SELECT 
                tu.id,
                tu.nick_name,
                tu.avatar_url ,
                tu.email ,
                tu.password, 
                tu.user_stt AS "user_stt: UserStatus",
                tu.user_role AS "user_role: UserRole",
                tu.provider AS "provider: Provider",
                tu.provider_user_id ,
                --
                tu.created_at ,
                tu.created_by ,
                tu.updated_at,
                tu.updated_by,
                tu.is_deleted
            FROM
                tb_user tu
            WHERE
                tu.is_deleted = FALSE
                AND tu.id = $1
        "#,
        id
    )
    .fetch_optional(conn)
    .await?;
    Ok(user)
}

pub struct InsertUserArg<'a> {
    pub id: &'a str,
    pub nick_name: &'a str,
    pub avatar_url: Option<&'a str>,
    pub email: Option<&'a str>,
    pub password: Option<&'a str>,
    pub user_stt: &'a UserStatus,
    pub user_role: &'a UserRole,
    pub provider: &'a Provider,
    pub provider_user_id: Option<&'a str>,
}
pub async fn insert_user(
    conn: &mut PgConnection,
    arg: InsertUserArg<'_>,
) -> anyhow::Result<PgQueryResult> {
    #[rustfmt::skip]
    let res = sqlx::query!(
        r#"
            INSERT INTO tb_user
            (
                id, nick_name, avatar_url, email, "password",
                user_stt, user_role, provider, provider_user_id,
                created_by , updated_by
            )
            VALUES
            (
                $1, $2, $3, $4, $5,
                $6, $7, $8, $9,
                $10 ,$11
            )
        "#,
        arg.id, arg.nick_name, arg.avatar_url, arg.email, arg.password,
        arg.user_stt.as_ref(), arg.user_role.as_ref(), arg.provider.as_ref(), arg.provider_user_id,
        arg.id, arg.id
    )
    .execute(conn)
    .await?;
    Ok(res)
}

pub async fn select_user_by_provider_id(
    conn: &mut PgConnection,
    provider: &Provider,
    provider_user_id: &str,
) -> anyhow::Result<Option<User>> {
    let user = sqlx::query_as!(
        User,
        r#"
            SELECT 
                tu.id,
                tu.nick_name,
                tu.avatar_url ,
                tu.email ,
                tu.password, 
                tu.user_stt AS "user_stt: UserStatus",
                tu.user_role AS "user_role: UserRole",
                tu.provider AS "provider: Provider",
                tu.provider_user_id ,
                --
                tu.created_at ,
                tu.created_by ,
                tu.updated_at,
                tu.updated_by,
                tu.is_deleted
            FROM
                tb_user tu
            WHERE
                tu.is_deleted = FALSE 
                AND tu.provider = $1
                AND tu.provider_user_id = $2
        "#,
        provider.as_ref(),
        provider_user_id
    )
    .fetch_optional(conn)
    .await?;
    Ok(user)
}

pub async fn select_user_by_email(
    conn: &mut PgConnection,
    email: &str,
) -> anyhow::Result<Option<User>> {
    let user = sqlx::query_as!(
        User,
        r#"
            SELECT 
                tu.id,
                tu.nick_name,
                tu.avatar_url ,
                tu.email ,
                tu.password, 
                tu.user_stt AS "user_stt: UserStatus",
                tu.user_role AS "user_role: UserRole",
                tu.provider AS "provider: Provider",
                tu.provider_user_id ,
                --
                tu.created_at ,
                tu.created_by ,
                tu.updated_at,
                tu.updated_by,
                tu.is_deleted
            FROM
                tb_user tu
            WHERE
                tu.is_deleted = FALSE 
                AND tu.provider = 'Email'
                AND tu.email = $1
        "#,
        email
    )
    .fetch_optional(conn)
    .await?;
    Ok(user)
}
