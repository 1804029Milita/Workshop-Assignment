use chrono::Utc;
use serde::{Deserialize, Serialize};
use sqlx::Row;
use uuid::Uuid;

use crate::db::Db;
use crate::error::AppError;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Category {
    pub id: String,
    pub name: String,
    pub created_at: String,
    pub updated_at: String,
}

pub async fn list(db: &Db) -> Result<Vec<Category>, AppError> {
    let rows = sqlx::query("SELECT id, name, created_at, updated_at FROM categories ORDER BY name ASC")
        .fetch_all(&db.0)
        .await?;

    Ok(rows
        .into_iter()
        .map(|r| Category {
            id: r.get("id"),
            name: r.get("name"),
            created_at: r.get("created_at"),
            updated_at: r.get("updated_at"),
        })
        .collect())
}

pub async fn exists(db: &Db, id: &str) -> Result<bool, AppError> {
    let row = sqlx::query("SELECT 1 AS one FROM categories WHERE id = $1 LIMIT 1")
        .bind(id)
        .fetch_optional(&db.0)
        .await?;

    Ok(row.is_some())
}

pub async fn create(db: &Db, name: &str) -> Result<Category, AppError> {
    let now = Utc::now().to_rfc3339();
    let id = Uuid::new_v4().to_string();

    sqlx::query(
        "INSERT INTO categories (id, name, created_at, updated_at) VALUES ($1, $2, $3, $4)",
    )
    .bind(&id)
    .bind(name)
    .bind(&now)
    .bind(&now)
    .execute(&db.0)
    .await?;

    Ok(Category {
        id,
        name: name.to_string(),
        created_at: now.clone(),
        updated_at: now,
    })
}

pub async fn update(db: &Db, id: &str, name: &str) -> Result<Category, AppError> {
    let now = Utc::now().to_rfc3339();

    let result = sqlx::query(
        "UPDATE categories SET name = $1, updated_at = $2 WHERE id = $3",
    )
    .bind(name)
    .bind(&now)
    .bind(id)
    .execute(&db.0)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::Validation("Category not found.".to_string()));
    }

    let row = sqlx::query("SELECT id, name, created_at, updated_at FROM categories WHERE id = $1")
        .bind(id)
        .fetch_one(&db.0)
        .await?;

    Ok(Category {
        id: row.get("id"),
        name: row.get("name"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    })
}

pub async fn delete(db: &Db, id: &str) -> Result<(), AppError> {
    let count: i64 = sqlx::query("SELECT COUNT(*) AS c FROM expenses WHERE category_id = $1")
        .bind(id)
        .fetch_one(&db.0)
        .await?
        .get("c");

    if count > 0 {
        return Err(AppError::Validation(
            "Category is in use by existing expenses.".to_string(),
        ));
    }

    let result = sqlx::query("DELETE FROM categories WHERE id = $1")
        .bind(id)
        .execute(&db.0)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::Validation("Category not found.".to_string()));
    }

    Ok(())
}
