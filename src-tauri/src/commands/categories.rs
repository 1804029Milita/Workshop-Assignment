use tauri::State;

use crate::db::categories;
use crate::db::Db;
use crate::error::AppError;

#[derive(Debug, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateCategoryInput {
    pub name: String,
}

#[derive(Debug, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCategoryInput {
    pub id: String,
    pub name: String,
}

fn validate_name(name: &str) -> Result<(), AppError> {
    if name.trim().is_empty() {
        return Err(AppError::Validation("Category name is required.".to_string()));
    }
    Ok(())
}

#[tauri::command]
pub async fn create_category(
    db: State<'_, Db>,
    input: CreateCategoryInput,
) -> Result<categories::Category, AppError> {
    validate_name(&input.name)?;
    categories::create(&*db, &input.name).await
}

#[tauri::command]
pub async fn list_categories(db: State<'_, Db>) -> Result<Vec<categories::Category>, AppError> {
    categories::list(&*db).await
}

#[tauri::command]
pub async fn update_category(
    db: State<'_, Db>,
    input: UpdateCategoryInput,
) -> Result<categories::Category, AppError> {
    validate_name(&input.name)?;
    categories::update(&*db, &input.id, &input.name).await
}

#[tauri::command]
pub async fn delete_category(db: State<'_, Db>, id: String) -> Result<(), AppError> {
    categories::delete(&*db, &id).await
}
