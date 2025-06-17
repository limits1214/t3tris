use anyhow::Result;
use sqlx::{Acquire, PgConnection, Postgres, Transaction};

pub async fn begin(conn: &mut PgConnection) -> Result<Transaction<Postgres>> {
    Ok(conn.begin().await?)
}

pub async fn commit(tx: Transaction<'_, sqlx::Postgres>) -> Result<()> {
    Ok(tx.commit().await?)
}

#[allow(dead_code)]
pub async fn rollback(tx: Transaction<'_, sqlx::Postgres>) -> Result<()> {
    Ok(tx.rollback().await?)
}
