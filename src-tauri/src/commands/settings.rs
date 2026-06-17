use tauri::State;

use crate::db::settings::{self, CurrencySettings};
use crate::db::Db;
use crate::error::AppError;

#[derive(Debug, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveCurrencySetupInput {
    pub currency_code: String,
    pub currency_symbol: String,
}

fn validate_currency_code(code: &str) -> Result<(), AppError> {
    if code.is_empty() {
        return Err(AppError::Validation("Currency code is required.".to_string()));
    }
    if code.len() != 3 || !code.chars().all(|c| c.is_ascii_uppercase()) {
        return Err(AppError::Validation(
            "Currency code must be 3 letters.".to_string(),
        ));
    }
    Ok(())
}

fn validate_currency_symbol(symbol: &str) -> Result<(), AppError> {
    if symbol.is_empty() {
        return Err(AppError::Validation(
            "Currency symbol is required.".to_string(),
        ));
    }
    if symbol.chars().count() > 4 {
        return Err(AppError::Validation(
            "Currency symbol must be 1 to 4 characters.".to_string(),
        ));
    }
    Ok(())
}

#[tauri::command]
pub async fn is_setup_complete(db: State<'_, Db>) -> Result<bool, AppError> {
    // Never fail the app boot; fall back to false on any error.
    match settings::is_complete(&*db).await {
        Ok(v) => Ok(v),
        Err(_) => Ok(false),
    }
}

#[tauri::command]
pub async fn save_currency_setup(
    db: State<'_, Db>,
    input: SaveCurrencySetupInput,
) -> Result<CurrencySettings, AppError> {
    validate_currency_code(&input.currency_code)?;
    validate_currency_symbol(&input.currency_symbol)?;

    settings::save_currency(&*db, &input.currency_code, &input.currency_symbol).await?;

    Ok(CurrencySettings {
        currency_code: input.currency_code,
        currency_symbol: input.currency_symbol,
    })
}

#[tauri::command]
pub async fn get_currency_settings(
    db: State<'_, Db>,
) -> Result<Option<CurrencySettings>, AppError> {
    settings::get_currency(&*db).await
}
