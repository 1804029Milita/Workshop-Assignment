mod commands;
mod db;
mod error;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:expense-tracker.db", db::migrations())
                .build(),
        )
        .setup(|app| {
            let pool = tauri::async_runtime::block_on(db::init_pool(app.handle()))?;
            app.manage(pool);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::settings::is_setup_complete,
            commands::settings::save_currency_setup,
            commands::settings::get_currency_settings,
            commands::categories::create_category,
            commands::categories::list_categories,
            commands::categories::update_category,
            commands::categories::delete_category,
            commands::expenses::create_expense,
            commands::expenses::list_expenses,
            commands::expenses::update_expense,
            commands::expenses::delete_expense,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
