use std::path::PathBuf;

use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use sqlx::SqlitePool;
use tauri::{AppHandle, Manager};
use tauri_plugin_sql::{Migration, MigrationKind};

use crate::error::AppError;

pub mod categories;
pub mod expenses;
pub mod settings;

pub struct Db(pub SqlitePool);

const DB_FILE: &str = "expense-tracker.db";
const MIGRATION_SQL: &str = include_str!("../../migrations/20260101000000_create_initial.sql");

pub async fn init_pool(app: &AppHandle) -> Result<Db, AppError> {
    let app_dir: PathBuf = app
        .path()
        .app_config_dir()
        .map_err(|e| AppError::Database(format!("failed to resolve app config dir: {e}")))?;

    std::fs::create_dir_all(&app_dir)
        .map_err(|e| AppError::Database(format!("failed to create app config dir: {e}")))?;

    let db_path = app_dir.join(DB_FILE);

    let options = SqliteConnectOptions::new()
        .filename(&db_path)
        .create_if_missing(true);

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(options)
        .await
        .map_err(|e| AppError::Database(format!("failed to open sqlite database: {e}")))?;

    // Apply the initial schema migration directly via sqlx.
    sqlx::query(MIGRATION_SQL).execute(&pool).await?;

    Ok(Db(pool))
}

pub fn migrations() -> Vec<Migration> {
    vec![Migration {
        version: 1,
        description: "create_initial_tables",
        sql: MIGRATION_SQL,
        kind: MigrationKind::Up,
    }]
}
