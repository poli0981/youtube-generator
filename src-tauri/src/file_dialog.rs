//! Export and import through the native Save / Open dialogs.
//!
//! The dialog runs here, not in the webview: the only path that is ever
//! written or read is the one the user just picked, and it never passes
//! through JavaScript. Both directions are limited to plain-text formats the
//! app produces, and imports to a size no real export reaches.

use std::fs;
use std::io::Read;
use std::path::{Path, PathBuf};

use serde::Serialize;
use tauri::{AppHandle, WebviewWindow};
use tauri_plugin_dialog::{DialogExt, FileDialogBuilder, FilePath};

/// Every file the app exports or imports is one of these.
const ALLOWED_EXTENSIONS: [&str; 5] = ["json", "jsonl", "txt", "csv", "md"];
/// The largest export the app can produce is a few megabytes of history.
const MAX_IMPORT_BYTES: u64 = 20 * 1024 * 1024;

fn is_allowed(ext: &str) -> bool {
    ALLOWED_EXTENSIONS.contains(&ext)
}

fn extension_of(path: &Path) -> Option<String> {
    path.extension()
        .and_then(|e| e.to_str())
        .map(str::to_ascii_lowercase)
}

/// The requested filter extensions, lower-cased and limited to the allowlist.
fn allowed_filter(extensions: &[String]) -> Result<Vec<String>, String> {
    let list: Vec<String> = extensions.iter().map(|e| e.to_ascii_lowercase()).collect();
    if list.is_empty() || !list.iter().all(|e| is_allowed(e)) {
        return Err(format!("unsupported file type: {extensions:?}"));
    }
    Ok(list)
}

/// Just the file name from a suggested name (`a/b.json` → `b.json`), so a
/// suggestion can never point the dialog somewhere else.
fn suggested_file_name(suggested: &str) -> String {
    Path::new(suggested)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("ytdescgen-export")
        .to_owned()
}

/// Keep the user's choice of name, but make sure it ends in an allowed
/// extension: `backup` becomes `backup.json`, `backup.exe` `backup.exe.json`.
fn with_allowed_extension(path: PathBuf, default_ext: &str) -> PathBuf {
    match extension_of(&path) {
        Some(ext) if is_allowed(&ext) => path,
        _ => {
            let mut raw = path.into_os_string();
            raw.push(".");
            raw.push(default_ext);
            PathBuf::from(raw)
        }
    }
}

fn picked_path(picked: FilePath) -> Result<PathBuf, String> {
    picked
        .into_path()
        .map_err(|_| "this location is not supported".to_owned())
}

fn dialog(
    app: &AppHandle,
    window: &WebviewWindow,
    title: Option<String>,
) -> FileDialogBuilder<tauri::Wry> {
    let mut builder = app.dialog().file();
    if let Some(title) = title.filter(|t| !t.trim().is_empty()) {
        builder = builder.set_title(title);
    }
    #[cfg(desktop)]
    let builder = builder.set_parent(window);
    #[cfg(not(desktop))]
    let _ = window;
    builder
}

/// Ask where to save, then write `content` there. Returns the file name that
/// was written, or `None` when the user cancelled.
#[tauri::command]
pub async fn export_text_file(
    app: AppHandle,
    window: WebviewWindow,
    suggested_name: String,
    content: String,
    filter_name: String,
    extensions: Vec<String>,
    title: Option<String>,
) -> Result<Option<String>, String> {
    let filter = allowed_filter(&extensions)?;
    let refs: Vec<&str> = filter.iter().map(String::as_str).collect();
    let picked = dialog(&app, &window, title)
        .set_file_name(suggested_file_name(&suggested_name))
        .add_filter(filter_name, &refs)
        .blocking_save_file();
    let Some(picked) = picked else {
        return Ok(None);
    };
    let path = with_allowed_extension(picked_path(picked)?, &filter[0]);
    fs::write(&path, content).map_err(|e| e.to_string())?;
    Ok(path.file_name().map(|n| n.to_string_lossy().into_owned()))
}

#[derive(Debug, Serialize)]
pub struct PickedFile {
    pub name: String,
    pub text: String,
}

fn read_picked(path: &Path, filter: &[String]) -> Result<PickedFile, String> {
    let ext = extension_of(path).unwrap_or_default();
    if !filter.contains(&ext) {
        return Err(format!("unsupported file type: .{ext}"));
    }
    let file = fs::File::open(path).map_err(|e| e.to_string())?;
    let size = file.metadata().map_err(|e| e.to_string())?.len();
    if size > MAX_IMPORT_BYTES {
        return Err(format!("file is too large ({size} bytes)"));
    }
    let mut bytes = Vec::with_capacity(size as usize);
    file.take(MAX_IMPORT_BYTES)
        .read_to_end(&mut bytes)
        .map_err(|e| e.to_string())?;
    let text = String::from_utf8(bytes).map_err(|_| "the file is not UTF-8 text".to_owned())?;
    Ok(PickedFile {
        name: path
            .file_name()
            .map(|n| n.to_string_lossy().into_owned())
            .unwrap_or_default(),
        // Notepad and some spreadsheet tools write a byte-order mark.
        text: text.strip_prefix('\u{feff}').unwrap_or(&text).to_owned(),
    })
}

/// Ask for a file, then return its name and text. `None` when cancelled.
#[tauri::command]
pub async fn import_text_file(
    app: AppHandle,
    window: WebviewWindow,
    filter_name: String,
    extensions: Vec<String>,
    title: Option<String>,
) -> Result<Option<PickedFile>, String> {
    let filter = allowed_filter(&extensions)?;
    let refs: Vec<&str> = filter.iter().map(String::as_str).collect();
    let picked = dialog(&app, &window, title)
        .add_filter(filter_name, &refs)
        .blocking_pick_file();
    match picked {
        None => Ok(None),
        Some(picked) => read_picked(&picked_path(picked)?, &filter).map(Some),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn filters_are_limited_to_text_formats() {
        assert_eq!(
            allowed_filter(&["JSON".into(), "csv".into()]).unwrap(),
            vec!["json", "csv"]
        );
        assert!(allowed_filter(&[]).is_err());
        assert!(allowed_filter(&["json".into(), "exe".into()]).is_err());
        assert!(allowed_filter(&["".into()]).is_err());
    }

    #[test]
    fn suggested_names_cannot_carry_a_path() {
        assert_eq!(suggested_file_name("backup.json"), "backup.json");
        assert_eq!(suggested_file_name("../../x/backup.json"), "backup.json");
        assert_eq!(suggested_file_name(""), "ytdescgen-export");
        assert_eq!(suggested_file_name(".."), "ytdescgen-export");
    }

    #[test]
    fn saved_files_always_end_in_an_allowed_extension() {
        let dir = std::env::temp_dir();
        assert_eq!(
            with_allowed_extension(dir.join("a.json"), "json"),
            dir.join("a.json")
        );
        assert_eq!(
            with_allowed_extension(dir.join("a.CSV"), "json"),
            dir.join("a.CSV")
        );
        assert_eq!(
            with_allowed_extension(dir.join("a"), "json"),
            dir.join("a.json")
        );
        assert_eq!(
            with_allowed_extension(dir.join("a.exe"), "txt"),
            dir.join("a.exe.txt")
        );
    }

    #[test]
    fn reading_checks_type_size_and_encoding() {
        let dir = std::env::temp_dir().join(format!("ytdescgen-dialog-{}", std::process::id()));
        fs::create_dir_all(&dir).unwrap();
        let json = ["json".to_owned()];

        let ok = dir.join("ok.json");
        fs::write(&ok, "\u{feff}{\"a\":1}").unwrap();
        let picked = read_picked(&ok, &json).unwrap();
        assert_eq!(picked.name, "ok.json");
        assert_eq!(picked.text, "{\"a\":1}");

        let wrong_type = dir.join("x.exe");
        fs::write(&wrong_type, "MZ").unwrap();
        assert!(read_picked(&wrong_type, &json).is_err());

        let binary = dir.join("bin.json");
        fs::write(&binary, [0xff, 0xfe, 0x00, 0x41]).unwrap();
        assert!(read_picked(&binary, &json).is_err());

        let _ = fs::remove_dir_all(&dir);
    }
}
