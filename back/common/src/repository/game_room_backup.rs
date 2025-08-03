use sqlx::{PgConnection, postgres::PgQueryResult};

pub struct InsertGameRoomBackupArg<'a> {
    pub room_id: &'a str,
    pub game_id: &'a str,
    pub ws_ids: &'a serde_json::Value,
    pub user_ids: &'a serde_json::Value,
    pub data: &'a serde_json::Value,
}
pub async fn insert_game_room_backup(
    conn: &mut PgConnection,
    arg: InsertGameRoomBackupArg<'_>,
) -> anyhow::Result<PgQueryResult> {
    #[rustfmt::skip]
    let res = sqlx::query!(
        r#"
            INSERT INTO tb_game_room_backup
            (
                room_id, game_id, ws_ids, user_ids, data,
                created_by, updated_by
            )
            VALUES
            (
                $1, $2, $3, $4, $5,
                NULL, NULL
            )
        "#,
        arg.room_id, arg.game_id, arg.ws_ids, arg.user_ids, arg.data,
    )
    .execute(conn)
    .await?;
    Ok(res)
}
