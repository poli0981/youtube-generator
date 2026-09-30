// The tray icon, single-instance enforcement, hide-to-tray and
// exit-prevention machinery below are desktop-only. None of these APIs exist
// (or make sense) on mobile, so gate the imports too — otherwise the Android
// build fails with unresolved imports / unused-import warnings.
#[cfg(desktop)]
use std::sync::atomic::{AtomicBool, Ordering};
#[cfg(desktop)]
use std::sync::Arc;

#[cfg(desktop)]
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, RunEvent, WindowEvent,
};

mod file_dialog;
mod storage;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Plugins and commands shared by every platform (desktop + Android).
    // Desktop-only pieces (single-instance, tray, hide-to-tray,
    // exit-prevention) are layered on below behind #[cfg(desktop)].
    //
    // No command takes a path: `storage` resolves file *names* under the app
    // data directory, and `file_dialog` writes or reads only the file the
    // user picks in a native dialog. The fs and shell plugins, which exposed
    // arbitrary paths and processes to the webview, are gone.
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            storage::backup_list,
            storage::backup_read,
            storage::backup_write,
            storage::backup_delete,
            storage::log_append,
            storage::log_list,
            storage::log_read,
            storage::log_delete,
            storage::recover_legacy_data,
            file_dialog::export_text_file,
            file_dialog::import_text_file,
        ]);

    #[cfg(desktop)]
    {
        // Flag that signals the user has requested a full quit (via tray menu).
        // When false, closing the window hides it to the tray; when true,
        // the app is allowed to exit.
        let quitting = Arc::new(AtomicBool::new(false));
        let quitting_menu = quitting.clone();
        let quitting_window = quitting.clone();
        let quitting_run = quitting.clone();

        builder
            // Single-instance MUST be the first desktop plugin registered (v0.12).
            // Without it, every launch spawns a fresh process — which then builds
            // its own tray icon in `setup()`, stacking duplicates in the system
            // tray and leaving orphan processes in Task Manager. The callback runs
            // in the *first* (already-running) instance when a second launch is
            // attempted: we surface its window instead of letting the second boot.
            .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.unminimize();
                    let _ = window.set_focus();
                }
            }))
            .setup(move |app| {
                let show = MenuItem::with_id(app, "show", "Show YTDescGen", true, None::<&str>)?;
                let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
                let menu = Menu::with_items(app, &[&show, &quit])?;

                // The one tray icon: built here with the app icon (there is no
                // `trayIcon` in tauri.conf.json, which would add a second).
                let mut tray = TrayIconBuilder::with_id("ytdescgen-tray");
                if let Some(icon) = app.default_window_icon() {
                    tray = tray.icon(icon.clone());
                }
                let _tray = tray
                    .tooltip("YTDescGen — YouTube Description Generator")
                    .menu(&menu)
                    .on_menu_event(move |app, event| match event.id.as_ref() {
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.unminimize();
                                let _ = window.set_focus();
                            }
                        }
                        "quit" => {
                            quitting_menu.store(true, Ordering::SeqCst);
                            app.exit(0);
                        }
                        _ => {}
                    })
                    .on_tray_icon_event(|tray, event| {
                        if let TrayIconEvent::Click {
                            button: MouseButton::Left,
                            button_state: MouseButtonState::Up,
                            ..
                        } = event
                        {
                            let app = tray.app_handle();
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.unminimize();
                                let _ = window.set_focus();
                            }
                        }
                    })
                    .build(app)?;

                Ok(())
            })
            .on_window_event(move |window, event| {
                if let WindowEvent::CloseRequested { api, .. } = event {
                    // If the user asked to quit via the tray menu, let the
                    // window close normally so the app can exit.
                    if !quitting_window.load(Ordering::SeqCst) {
                        let _ = window.hide();
                        api.prevent_close();
                    }
                }
            })
            .build(tauri::generate_context!())
            .expect("error while building tauri application")
            .run(move |_app_handle, event| {
                if let RunEvent::ExitRequested { api, .. } = event {
                    // Only prevent exit when the user hasn't explicitly asked to quit.
                    if !quitting_run.load(Ordering::SeqCst) {
                        api.prevent_exit();
                    }
                }
            });
    }

    // Mobile (Android): no tray, single-instance, or hide-to-tray — just run.
    #[cfg(not(desktop))]
    builder
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}
