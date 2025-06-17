use crate::{entity::session::Session, error::AppResult};
use sqlx::{PgConnection, postgres::PgQueryResult};
use time::OffsetDateTime;

pub async fn select_session_by_id(conn: &mut PgConnection, id: &str) -> AppResult<Option<Session>> {
    let session = sqlx::query_as!(
        Session,
        r#"
            SELECT 
                ts.id,
                ts.user_id ,
                ts.ip,
                ts.user_agent,
                ts.expires_at,
                ts.created_at,
                ts.created_by,
                ts.updated_at,
                ts.updated_by,
                ts.is_deleted
            FROM
                tb_session ts
            WHERE
                ts.is_deleted = FALSE
                AND ts.id = $1
        "#,
        id
    )
    .fetch_optional(conn)
    .await?;
    Ok(session)
}

pub struct InsertSessionArg<'a> {
    pub id: &'a str,
    pub user_id: &'a str,
    pub ip: Option<&'a str>,
    pub user_agent: &'a str,
    pub expires_at: &'a OffsetDateTime,
}
pub async fn insert_session(
    conn: &mut PgConnection,
    arg: InsertSessionArg<'_>,
) -> anyhow::Result<PgQueryResult> {
    #[rustfmt::skip]
    let res = sqlx::query!(
        r#"
            INSERT INTO tb_session
            (
                id, user_id, ip, user_agent, expires_at,
                created_by, updated_by
            )
            VALUES
            (
                $1, $2, $3, $4, $5,
                $6, $7
            )
        "#,
        arg.id, arg.user_id, arg.ip, arg.user_agent, arg.expires_at,
        arg.user_id, arg.user_id
    )
    .execute(conn)
    .await?;
    Ok(res)
}
