use chrono::NaiveDate;
use tauri::State;

use crate::db::categories;
use crate::db::expenses::{self, Expense, NewExpense};
use crate::db::Db;
use crate::error::AppError;

#[derive(Debug, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateExpenseInput {
    pub amount: f64,
    pub date: String,
    pub category_id: String,
    pub note: Option<String>,
    pub payment_method: Option<String>,
}

#[derive(Debug, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateExpenseInput {
    pub id: String,
    pub amount: f64,
    pub date: String,
    pub category_id: String,
    pub note: Option<String>,
    pub payment_method: Option<String>,
}

fn validate_amount(amount: f64) -> Result<(), AppError> {
    if !amount.is_finite() || amount <= 0.0 {
        return Err(AppError::Validation("Amount must be greater than zero.".to_string()));
    }
    Ok(())
}

fn validate_date(date: &str) -> Result<(), AppError> {
    if date.trim().is_empty() {
        return Err(AppError::Validation("Date is required.".to_string()));
    }
    NaiveDate::parse_from_str(date, "%Y-%m-%d")
        .map(|_| ())
        .map_err(|_| AppError::Validation("Date must be a valid date.".to_string()))
}

fn validate_category_id(category_id: &str) -> Result<(), AppError> {
    if category_id.trim().is_empty() {
        return Err(AppError::Validation("Category is required.".to_string()));
    }
    Ok(())
}

async fn validate_category_exists(db: &Db, category_id: &str) -> Result<(), AppError> {
    if !categories::exists(&*db, category_id).await? {
        return Err(AppError::Validation("Category not found.".to_string()));
    }
    Ok(())
}

#[tauri::command]
pub async fn create_expense(
    db: State<'_, Db>,
    input: CreateExpenseInput,
) -> Result<Expense, AppError> {
    validate_amount(input.amount)?;
    validate_date(&input.date)?;
    validate_category_id(&input.category_id)?;
    validate_category_exists(&*db, &input.category_id).await?;

    let new = NewExpense {
        amount: input.amount,
        date: &input.date,
        category_id: &input.category_id,
        note: input.note.as_deref(),
        payment_method: input.payment_method.as_deref(),
    };

    expenses::insert(&*db, &new).await
}

#[tauri::command]
pub async fn list_expenses(db: State<'_, Db>) -> Result<Vec<Expense>, AppError> {
    expenses::list_all(&*db).await
}

#[tauri::command]
pub async fn update_expense(
    db: State<'_, Db>,
    input: UpdateExpenseInput,
) -> Result<Expense, AppError> {
    validate_amount(input.amount)?;
    validate_date(&input.date)?;
    validate_category_id(&input.category_id)?;
    validate_category_exists(&*db, &input.category_id).await?;

    expenses::update(
        &*db,
        &input.id,
        input.amount,
        &input.date,
        &input.category_id,
        input.note.as_deref(),
        input.payment_method.as_deref(),
    )
    .await
}

#[tauri::command]
pub async fn delete_expense(db: State<'_, Db>, id: String) -> Result<(), AppError> {
    expenses::delete(&*db, &id).await
}
