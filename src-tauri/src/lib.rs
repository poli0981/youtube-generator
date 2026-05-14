use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, RunEvent, WindowEvent,
};

#[tauri::command]
fn save_to_file(path: String, content: String) -> Result<(), String> {
    if let Some(parent) = std::path::Path::new(&path).parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    std::fs::write(&path, &content).map_err(|e| e.to_string())
}

#[tauri::command]
fn read_from_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

/// Ensure a directory exists on disk, creating it (and any missing
/// parents) if necessary. No-op when the path already exists as a
/// directory. Fixes the "Windows cannot find ... AppData\Roaming\
/// com.skullmute.ytdescgen" Explorer error on first launch — see
/// `openSettingsFolder()` in `SettingsPage.tsx`, where this is called
/// before `openPath(dir)` so the OS shell never sees a non-existent
/// path. Returns the OS error string on failure (e.g. permission
/// denied) so the caller can surface it via the in-app log.
#[tauri::command]
fn ensure_dir(path: String) -> Result<(), String> {
    std::fs::create_dir_all(&path).map_err(|e| e.to_string())
}

/// Append `content` to the file at `path`, creating the file (and any
/// missing parent directories) if necessary. Used by the v0.17.0 log
/// persistence pipeline to write JSONL entries one line at a time,
/// rather than rewriting the whole file on every log call. Cheap
/// enough that we can call it on every `addEntry` without batching.
/// The caller is responsible for newline termination — this is a raw
/// byte append, not a line writer.
#[tauri::command]
fn append_to_file(path: String, content: String) -> Result<(), String> {
    use std::fs::OpenOptions;
    use std::io::Write;
    if let Some(parent) = std::path::Path::new(&path).parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let mut file = OpenOptions::new()
        .append(true)
        .create(true)
        .open(&path)
        .map_err(|e| e.to_string())?;
    file.write_all(content.as_bytes()).map_err(|e| e.to_string())
}

/// List entries in a directory, returning their file names (not full
/// paths). Used by the v0.17.0 log retention sweep to find
/// `ytdescgen-*.jsonl` files older than the configured retention
/// window. Returns an empty vec if the directory doesn't exist
/// (i.e. no logs have been written yet) — first-run safe.
#[tauri::command]
fn list_dir(path: String) -> Result<Vec<String>, String> {
    let dir = std::path::Path::new(&path);
    if !dir.exists() {
        return Ok(Vec::new());
    }
    let entries = std::fs::read_dir(dir).map_err(|e| e.to_string())?;
    let mut names = Vec::new();
    for entry in entries.flatten() {
        if let Some(name) = entry.file_name().to_str() {
            names.push(name.to_string());
        }
    }
    Ok(names)
}

/// Delete a file at `path` if it exists. No-op when the file is
/// missing (used by log retention sweep — racing with another sweep
/// or a manual cleanup shouldn't error). Returns the OS error string
/// on permission failures.
#[tauri::command]
fn delete_file(path: String) -> Result<(), String> {
    let p = std::path::Path::new(&path);
    if !p.exists() {
        return Ok(());
    }
    std::fs::remove_file(p).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Flag that signals the user has requested a full quit (via tray menu).
    // When false, closing the window hides it to the tray; when true,
    // the app is allowed to exit.
    let quitting = Arc::new(AtomicBool::new(false));
    let quitting_menu = quitting.clone();
    let quitting_window = quitting.clone();
    let quitting_run = quitting.clone();

    tauri::Builder::default()
        // Single-instance MUST be the first plugin registered (v0.12). Without
        // it, every launch spawns a fresh process — which then builds its own
        // tray icon in `setup()`, stacking duplicates in the system tray and
        // leaving orphan processes in Task Manager. The callback runs in the
        // *first* (already-running) instance when a second launch is attempted:
        // we surface its window instead of letting the second process boot.
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .setup(move |app| {
            let show = MenuItem::with_id(app, "show", "Show YTDescGen", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &quit])?;

            let _tray = TrayIconBuilder::with_id("ytdescgen-tray")
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
        .invoke_handler(tauri::generate_handler![
            save_to_file,
            read_from_file,
            ensure_dir,
            append_to_file,
            list_dir,
            delete_file
        ])
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
