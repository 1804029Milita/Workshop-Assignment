use chrono::Utc;
use serde::{Deserialize, Serialize};
use sqlx::Row;
use uuid::Uuid;

use crate::db::Db;
use crate::error::AppError;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Expense {
    pub id: String,
    pub amount: f64,
    pub date: String,
    pub category_id: String,
    pub category_name: String,
    pub note: Option<String>,
    pub payment_method: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

pub struct NewExpense<'a> {
    pub amount: f64,
    pub date: &'a str,
    pub category_id: &'a str,
    pub note: Option<&'a str>,
    pub payment_method: Option<&'a str>,
}

pub async fn insert(db: &Db, new: &NewExpense<'_>) -> Result<Expense, AppError> {
    let now = Utc::now().to_rfc3339();
    let id = Uuid::new_v4().to_string();

    sqlx::query(
        "INSERT INTO expenses (id, amount, date, category_id, note, payment_method, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
    )
    .bind(&id)
    .bind(new.amount)
    .bind(new.date)
    .bind(new.category_id)
    .bind(new.note)
    .bind(new.payment_method)
    .bind(&now)
    .bind(&now)
    .execute(&db.0)
    .await?;

    // Read back the joined row to return category_name.
    let row = sqlx::query(
        "SELECT e.id, e.amount, e.date, e.category_id, c.name AS category_name, e.note, e.payment_method, e.created_at, e.updated_at
         FROM expenses e JOIN categories c ON c.id = e.category_id WHERE e.id = $1",
    )
    .bind(&id)
    .fetch_one(&db.0)
    .await?;

    Ok(Expense {
        id: row.get("id"),
        amount: row.get("amount"),
        date: row.get("date"),
        category_id: row.get("category_id"),
        category_name: row.get("category_name"),
        note: row.get::<Option<String>, _>("note"),
        payment_method: row.get::<Option<String>, _>("payment_method"),
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
    })
}

pub async fn list_all(db: &Db) -> Result<Vec<Expense>, AppError> {
    let rows = sqlx::query(
        "SELECT e.id, e.amount, e.date, e.category_id, c.name AS category_name, e.note, e.payment_method, e.created_at, e.updated_at
         FROM expenses e JOIN categories c ON c.id = e.category_id ORDER BY e.date DESC, e.created_at DESC",
    )
    .fetch_all(&db.0)
    .await?;

    Ok(rows
        .into_iter()
        .map(|r| Expense {
            id: r.get("id"),
            amount: r.get("amount"),
            date: r.get("date"),
            category_id: r.get("category_id"),
            category_name: r.get("category_name"),
            note: r.get::<Option<String>, _>("note"),
            payment_method: r.get::<Option<String>, _>("payment_method"),
            created_at: r.get("created_at"),
            updated_at: r.get("updated_at"),
        })
        .collect())
}

pub async fn update(
    db: &Db,
    id: &str,
    amount: f64,
    date: &str,
    category_id: &str,
    note: Option<&str>,
    payment_method: Option<&str>,
) -> Result<Expense, AppError> {
    let now = Utc::now().to_rfc3339();

    let result = sqlx::query(
        "UPDATE expenses SET amount = $1, date = $2, category_id = $3, note = $4, payment_method = $5, updated_at = $6 WHERE id = $7",
    )
    .bind(amount)
    .bind(date)
    .bind(category_id)
    .bind(note)
    .bind(payment_method)
    .bind(&now)
    .bind(id)
    .execute(&db.0)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::Validation("Expense not found.".to_string()));
    }

    let row = sqlx::query(
        "SELECT e.id, e.amount, e.date, e.category_id, c.name AS category_name, e.note, e.payment_method, e.created_at, e.updated_at
         FROM expenses e JOIN categories c ON c.id = e.category_id WHERE e.id = $1",
    )
    .bind(id)
    .fetch_one(&db.0)
    .await?;

    Ok(Expense {
        id: row.get("id"),
        amount: row.get("amount"),
        date: row.get("date"),
        category_id: row.get("category_id"),
        category_name: row.get("category_name"),
        note: row.get::<Option<String>, _>("note"),
        payment_method: row.get::<Option<String>, _>("payment_method"),
        created_at: row.get("created_at"),
        updated_at: now,
    })
}

pub async fn delete(db: &Db, id: &str) -> Result<(), AppError> {
    let result = sqlx::query("DELETE FROM expenses WHERE id = $1")
        .bind(id)
        .execute(&db.0)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::Validation("Expense not found.".to_string()));
    }

    Ok(())
}
