use anyhow::Context;
use time::OffsetDateTime;

pub fn time_from_unix_timestamp(timestamp: i64) -> anyhow::Result<OffsetDateTime> {
    OffsetDateTime::from_unix_timestamp(timestamp).context("timestamp_range_error")
}
