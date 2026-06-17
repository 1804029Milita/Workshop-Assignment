use chrono::Utc;
use serde::{Deserialize, Serialize};
use sqlx::Row;

use crate::db::Db;
use crate::error::AppError;

const KEY_CURRENCY_CODE: &str = "currency_code";
const KEY_CURRENCY_SYMBOL: &str = "currency_symbol";
const KEY_SETUP_COMPLETE: &str = "setup_complete";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CurrencySettings {
    pub currency_code: String,
    pub currency_symbol: String,
}

pub async fn get(db: &Db, key: &str) -> Result<Option<String>, AppError> {
    let row = sqlx::query("SELECT value FROM settings WHERE key = $1")
        .bind(key)
        .fetch_optional(&db.0)
        .await?;

    Ok(row.map(|r| r.get::<String, _>("value")))
}

pub async fn set(db: &Db, key: &str, value: &str) -> Result<(), AppError> {
    let now = Utc::now().to_rfc3339();
    sqlx::query(
        "INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, $3)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
    )
    .bind(key)
    .bind(value)
    .bind(now)
    .execute(&db.0)
    .await?;

    Ok(())
}

pub async fn is_complete(db: &Db) -> Result<bool, AppError> {
    let value = get(db, KEY_SETUP_COMPLETE).await?;
    Ok(value.as_deref() == Some("true"))
}

pub async fn get_currency(db: &Db) -> Result<Option<CurrencySettings>, AppError> {
    let code = get(db, KEY_CURRENCY_CODE).await?;
    let symbol = get(db, KEY_CURRENCY_SYMBOL).await?;

    match (code, symbol) {
        (Some(c), Some(s)) => Ok(Some(CurrencySettings {
            currency_code: c,
            currency_symbol: s,
        })),
        _ => Ok(None),
    }
}

pub async fn save_currency(
    db: &Db,
    currency_code: &str,
    currency_symbol: &str,
) -> Result<(), AppError> {
    set(db, KEY_CURRENCY_CODE, currency_code).await?;
    set(db, KEY_CURRENCY_SYMBOL, currency_symbol).await?;
    set(db, KEY_SETUP_COMPLETE, "true").await?;
    Ok(())
}
