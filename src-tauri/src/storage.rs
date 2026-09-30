//! Files the app keeps for itself: automatic backups and the daily log files.
//!
//! The webview only ever sends a *file name*. Every path is built here, under
//! the app's own data directory, from a name that passed `is_backup_name` /
//! `is_log_name` — so the frontend has no way to read, write, list or delete
//! anything else on disk. (Before v1.0.0 five commands took an arbitrary path
//! from JavaScript.)
//!
//! `recover_legacy_files` moves the files that versions before v1.0.0 wrote
//! next to the data directory instead of inside it — the frontend joined the
//! directory and the file name without a separator — into the right places.

use std::fs;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::time::UNIX_EPOCH;

use serde::Serialize;
use tauri::{AppHandle, Manager};

const BACKUP_DIR: &str = "backups";
const LOG_DIR: &str = "logs";
const NAME_PREFIX: &str = "ytdescgen-";
/// Automatic backups start with this; `backup_write` keeps the newest
/// [`AUTO_BACKUP_KEEP`] of them. Backups with any other name (the file
/// recovered from an old version, for one) are never deleted automatically.
const AUTO_BACKUP_PREFIX: &str = "ytdescgen-backup-";
const AUTO_BACKUP_KEEP: usize = 10;
/// Nothing the app writes comes close; this stops a stray huge file in the
/// folder from being read into memory.
const MAX_FILE_BYTES: u64 = 32 * 1024 * 1024;
/// One log line, not a file: `log_append` is called once per entry.
const MAX_LOG_APPEND_BYTES: usize = 256 * 1024;

/// `ytdescgen-<lowercase letters, digits, hyphens>.json`, at most 100 bytes.
pub fn is_backup_name(name: &str) -> bool {
    name.len() <= 100
        && name
            .strip_prefix(NAME_PREFIX)
            .and_then(|rest| rest.strip_suffix(".json"))
            .is_some_and(|stem| {
                !stem.is_empty()
                    && stem
                        .bytes()
                        .all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'-')
            })
}

/// `ytdescgen-YYYYMMDD.jsonl` — one file per day.
pub fn is_log_name(name: &str) -> bool {
    name.strip_prefix(NAME_PREFIX)
        .and_then(|rest| rest.strip_suffix(".jsonl"))
        .is_some_and(|date| date.len() == 8 && date.bytes().all(|b| b.is_ascii_digit()))
}

fn data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    app.path().app_data_dir().map_err(|e| e.to_string())
}

fn checked(name: &str, valid: fn(&str) -> bool) -> Result<&str, String> {
    if valid(name) {
        Ok(name)
    } else {
        Err(format!("invalid file name: {name:?}"))
    }
}

fn read_limited(path: &Path) -> Result<String, String> {
    let file = fs::File::open(path).map_err(|e| e.to_string())?;
    let size = file.metadata().map_err(|e| e.to_string())?.len();
    if size > MAX_FILE_BYTES {
        return Err(format!("file is too large ({size} bytes)"));
    }
    let mut text = String::with_capacity(size as usize);
    file.take(MAX_FILE_BYTES)
        .read_to_string(&mut text)
        .map_err(|e| e.to_string())?;
    Ok(text)
}

/// Write through a temporary file and rename it over the target, so a crash
/// mid-write leaves the previous backup intact instead of half a file.
fn write_atomic(path: &Path, content: &str) -> Result<(), String> {
    let dir = path.parent().ok_or("no parent directory")?;
    fs::create_dir_all(dir).map_err(|e| e.to_string())?;
    let tmp = path.with_extension("json.tmp");
    fs::write(&tmp, content).map_err(|e| e.to_string())?;
    fs::rename(&tmp, path).map_err(|e| {
        let _ = fs::remove_file(&tmp);
        e.to_string()
    })
}

#[derive(Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct BackupInfo {
    pub name: String,
    pub size: u64,
    /// Last modified, in milliseconds since the Unix epoch.
    pub modified_ms: u64,
}

fn list_backups_in(dir: &Path) -> Result<Vec<BackupInfo>, String> {
    let Ok(entries) = fs::read_dir(dir) else {
        return Ok(Vec::new()); // nothing backed up yet
    };
    let mut backups: Vec<BackupInfo> = entries
        .flatten()
        .filter_map(|entry| {
            let name = entry.file_name().into_string().ok()?;
            if !is_backup_name(&name) {
                return None;
            }
            let meta = entry.metadata().ok().filter(|m| m.is_file())?;
            let modified_ms = meta
                .modified()
                .ok()
                .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
                .map_or(0, |d| d.as_millis() as u64);
            Some(BackupInfo {
                name,
                size: meta.len(),
                modified_ms,
            })
        })
        .collect();
    // Newest first. Automatic backups carry their date in the name, which
    // also sorts correctly when two share a modification time.
    backups.sort_by(|a, b| {
        b.modified_ms
            .cmp(&a.modified_ms)
            .then_with(|| b.name.cmp(&a.name))
    });
    Ok(backups)
}

/// Delete all but the newest `keep` automatic backups (by name: they are
/// named `ytdescgen-backup-YYYYMMDD-HHmm…`, so name order is date order).
fn prune_auto_backups(dir: &Path, keep: usize) -> Result<(), String> {
    let mut auto: Vec<String> = list_backups_in(dir)?
        .into_iter()
        .map(|b| b.name)
        .filter(|name| name.starts_with(AUTO_BACKUP_PREFIX))
        .collect();
    auto.sort_unstable_by(|a, b| b.cmp(a));
    for name in auto.into_iter().skip(keep) {
        fs::remove_file(dir.join(name)).map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn write_backup_in(dir: &Path, name: &str, content: &str) -> Result<(), String> {
    write_atomic(&dir.join(checked(name, is_backup_name)?), content)?;
    if name.starts_with(AUTO_BACKUP_PREFIX) {
        prune_auto_backups(dir, AUTO_BACKUP_KEEP)?;
    }
    Ok(())
}

#[tauri::command]
pub fn backup_list(app: AppHandle) -> Result<Vec<BackupInfo>, String> {
    list_backups_in(&data_dir(&app)?.join(BACKUP_DIR))
}

#[tauri::command]
pub fn backup_read(app: AppHandle, name: String) -> Result<String, String> {
    let dir = data_dir(&app)?.join(BACKUP_DIR);
    read_limited(&dir.join(checked(&name, is_backup_name)?))
}

#[tauri::command]
pub fn backup_write(app: AppHandle, name: String, content: String) -> Result<(), String> {
    write_backup_in(&data_dir(&app)?.join(BACKUP_DIR), &name, &content)
}

#[tauri::command]
pub fn backup_delete(app: AppHandle, name: String) -> Result<(), String> {
    let dir = data_dir(&app)?.join(BACKUP_DIR);
    remove_if_present(&dir.join(checked(&name, is_backup_name)?))
}

fn remove_if_present(path: &Path) -> Result<(), String> {
    match fs::remove_file(path) {
        Err(e) if e.kind() != std::io::ErrorKind::NotFound => Err(e.to_string()),
        _ => Ok(()),
    }
}

fn append_in(dir: &Path, name: &str, content: &str) -> Result<(), String> {
    if content.len() > MAX_LOG_APPEND_BYTES {
        return Err("log entry is too large".into());
    }
    fs::create_dir_all(dir).map_err(|e| e.to_string())?;
    let mut file = fs::OpenOptions::new()
        .append(true)
        .create(true)
        .open(dir.join(checked(name, is_log_name)?))
        .map_err(|e| e.to_string())?;
    file.write_all(content.as_bytes())
        .map_err(|e| e.to_string())
}

fn list_logs_in(dir: &Path) -> Vec<String> {
    let Ok(entries) = fs::read_dir(dir) else {
        return Vec::new();
    };
    let mut names: Vec<String> = entries
        .flatten()
        .filter_map(|entry| entry.file_name().into_string().ok())
        .filter(|name| is_log_name(name))
        .collect();
    names.sort_unstable();
    names
}

#[tauri::command]
pub fn log_append(app: AppHandle, name: String, content: String) -> Result<(), String> {
    append_in(&data_dir(&app)?.join(LOG_DIR), &name, &content)
}

#[tauri::command]
pub fn log_list(app: AppHandle) -> Result<Vec<String>, String> {
    Ok(list_logs_in(&data_dir(&app)?.join(LOG_DIR)))
}

#[tauri::command]
pub fn log_read(app: AppHandle, name: String) -> Result<String, String> {
    let dir = data_dir(&app)?.join(LOG_DIR);
    read_limited(&dir.join(checked(&name, is_log_name)?))
}

#[tauri::command]
pub fn log_delete(app: AppHandle, name: String) -> Result<(), String> {
    let dir = data_dir(&app)?.join(LOG_DIR);
    remove_if_present(&dir.join(checked(&name, is_log_name)?))
}

#[derive(Debug, Default, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct LegacyReport {
    /// Backup names the old data files were saved as (restorable from
    /// Settings, never applied automatically).
    pub backups: Vec<String>,
    /// Log files moved into the right folder.
    pub logs_moved: u32,
}

/// `<data dir><suffix>`: the path the old frontend produced by gluing a file
/// name straight onto the directory, e.g. `…\com.skullmute.ytdescgensettings.json`.
fn glued(data_dir: &Path, suffix: &str) -> PathBuf {
    let mut raw = data_dir.as_os_str().to_owned();
    raw.push(suffix);
    PathBuf::from(raw)
}

/// First free `ytdescgen-legacy-data[-N].json` in the backup folder.
fn free_legacy_name(backup_dir: &Path) -> String {
    (1..)
        .map(|n| match n {
            1 => "ytdescgen-legacy-data.json".to_owned(),
            n => format!("ytdescgen-legacy-data-{n}.json"),
        })
        .find(|name| !backup_dir.join(name).exists())
        .expect("an unbounded range always yields a free name")
}

fn move_file(from: &Path, to: &Path) -> Result<(), String> {
    if fs::rename(from, to).is_ok() {
        return Ok(());
    }
    // Different volume (or a locked file): copy, then remove the original.
    fs::copy(from, to).map_err(|e| e.to_string())?;
    fs::remove_file(from).map_err(|e| e.to_string())
}

pub fn recover_legacy_files(data_dir: &Path) -> Result<LegacyReport, String> {
    let mut report = LegacyReport::default();
    let backup_dir = data_dir.join(BACKUP_DIR);
    let log_dir = data_dir.join(LOG_DIR);

    // The mirror file: next to the data dir on desktop, possibly inside it
    // where the platform path already ended in a separator.
    for old in [
        glued(data_dir, "settings.json"),
        data_dir.join("settings.json"),
    ] {
        let Ok(meta) = fs::metadata(&old) else {
            continue;
        };
        if !meta.is_file() || meta.len() > MAX_FILE_BYTES {
            continue;
        }
        fs::create_dir_all(&backup_dir).map_err(|e| e.to_string())?;
        let name = free_legacy_name(&backup_dir);
        move_file(&old, &backup_dir.join(&name))?;
        report.backups.push(name);
    }

    // Daily log files: merge into the right folder, then drop the stray one.
    let old_logs = glued(data_dir, "logs");
    if old_logs.is_dir() {
        for name in list_logs_in(&old_logs) {
            let from = old_logs.join(&name);
            let to = log_dir.join(&name);
            fs::create_dir_all(&log_dir).map_err(|e| e.to_string())?;
            if to.exists() {
                let text = read_limited(&from)?;
                append_in(&log_dir, &name, &text)?;
                fs::remove_file(&from).map_err(|e| e.to_string())?;
            } else {
                move_file(&from, &to)?;
            }
            report.logs_moved += 1;
        }
        // Only succeeds when empty — anything else in there is left alone.
        let _ = fs::remove_dir(&old_logs);
    }

    Ok(report)
}

#[tauri::command]
pub fn recover_legacy_data(app: AppHandle) -> Result<LegacyReport, String> {
    recover_legacy_files(&data_dir(&app)?)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicU32, Ordering};

    /// A fresh directory under the system temp dir, removed on drop.
    struct TempDir(PathBuf);

    impl TempDir {
        fn new() -> Self {
            static COUNTER: AtomicU32 = AtomicU32::new(0);
            let path = std::env::temp_dir().join(format!(
                "ytdescgen-test-{}-{}",
                std::process::id(),
                COUNTER.fetch_add(1, Ordering::SeqCst)
            ));
            fs::create_dir_all(&path).unwrap();
            Self(path)
        }
    }

    impl Drop for TempDir {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }

    #[test]
    fn backup_names_are_a_closed_set() {
        assert!(is_backup_name("ytdescgen-backup-20260930-1415.json"));
        assert!(is_backup_name("ytdescgen-legacy-data-2.json"));
        for bad in [
            "",
            "ytdescgen-.json",
            "backup.json",
            "ytdescgen-backup.JSON",
            "ytdescgen-Backup.json",
            "ytdescgen-../x.json",
            "ytdescgen-a/b.json",
            "ytdescgen-a\\b.json",
            "ytdescgen-a.b.json",
            "ytdescgen-a.json.tmp",
            "ytdescgen-a .json",
            "ytdescgen-ä.json",
            "../ytdescgen-a.json",
            "C:\\ytdescgen-a.json",
        ] {
            assert!(!is_backup_name(bad), "{bad:?} should be rejected");
        }
        assert!(!is_backup_name(&format!(
            "ytdescgen-{}.json",
            "a".repeat(90)
        )));
    }

    #[test]
    fn log_names_are_one_file_per_day() {
        assert!(is_log_name("ytdescgen-20260930.jsonl"));
        for bad in [
            "ytdescgen-2026093.jsonl",
            "ytdescgen-202609300.jsonl",
            "ytdescgen-2026-09-30.jsonl",
            "ytdescgen-20260930.json",
            "ytdescgen-20260930.jsonl/..",
            "../ytdescgen-20260930.jsonl",
            "x-20260930.jsonl",
        ] {
            assert!(!is_log_name(bad), "{bad:?} should be rejected");
        }
    }

    #[test]
    fn writing_a_backup_rejects_paths() {
        let dir = TempDir::new();
        assert!(write_backup_in(&dir.0, "../escape.json", "{}").is_err());
        assert!(write_backup_in(&dir.0, "ytdescgen-../../escape.json", "{}").is_err());
        assert!(!dir.0.parent().unwrap().join("escape.json").exists());
    }

    #[test]
    fn backups_round_trip_and_list_newest_first() {
        let dir = TempDir::new();
        write_backup_in(&dir.0, "ytdescgen-backup-20260101-0000.json", "{\"a\":1}").unwrap();
        write_backup_in(&dir.0, "ytdescgen-backup-20260102-0000.json", "{\"b\":2}").unwrap();
        fs::write(dir.0.join("notes.txt"), "not a backup").unwrap();

        let listed = list_backups_in(&dir.0).unwrap();
        let names: Vec<_> = listed.iter().map(|b| b.name.as_str()).collect();
        assert_eq!(names.len(), 2);
        assert!(names.contains(&"ytdescgen-backup-20260101-0000.json"));
        assert_eq!(listed.iter().map(|b| b.size).sum::<u64>(), 14);
        assert_eq!(
            read_limited(&dir.0.join("ytdescgen-backup-20260102-0000.json")).unwrap(),
            "{\"b\":2}"
        );
        // No temporary file left behind.
        assert!(fs::read_dir(&dir.0)
            .unwrap()
            .flatten()
            .all(|e| !e.file_name().to_string_lossy().ends_with(".tmp")));
    }

    #[test]
    fn only_automatic_backups_are_pruned() {
        let dir = TempDir::new();
        write_backup_in(&dir.0, "ytdescgen-legacy-data.json", "{}").unwrap();
        for day in 1..=12 {
            let name = format!("ytdescgen-backup-202601{day:02}-0000.json");
            write_backup_in(&dir.0, &name, "{}").unwrap();
        }
        let mut names: Vec<_> = list_backups_in(&dir.0)
            .unwrap()
            .into_iter()
            .map(|b| b.name)
            .collect();
        names.sort();
        assert_eq!(names.len(), AUTO_BACKUP_KEEP + 1);
        assert!(names.contains(&"ytdescgen-legacy-data.json".to_owned()));
        assert!(!names.contains(&"ytdescgen-backup-20260101-0000.json".to_owned()));
        assert!(!names.contains(&"ytdescgen-backup-20260102-0000.json".to_owned()));
        assert!(names.contains(&"ytdescgen-backup-20260112-0000.json".to_owned()));
    }

    #[test]
    fn listing_a_missing_folder_is_empty() {
        let dir = TempDir::new();
        assert!(list_backups_in(&dir.0.join("nope")).unwrap().is_empty());
        assert!(list_logs_in(&dir.0.join("nope")).is_empty());
    }

    #[test]
    fn logs_append_and_reject_other_names() {
        let dir = TempDir::new();
        append_in(&dir.0, "ytdescgen-20260930.jsonl", "{\"n\":1}\n").unwrap();
        append_in(&dir.0, "ytdescgen-20260930.jsonl", "{\"n\":2}\n").unwrap();
        assert_eq!(
            read_limited(&dir.0.join("ytdescgen-20260930.jsonl")).unwrap(),
            "{\"n\":1}\n{\"n\":2}\n"
        );
        assert!(append_in(&dir.0, "../ytdescgen-20260930.jsonl", "x").is_err());
        assert!(append_in(&dir.0, "evil.txt", "x").is_err());
        let huge = "x".repeat(MAX_LOG_APPEND_BYTES + 1);
        assert!(append_in(&dir.0, "ytdescgen-20260930.jsonl", &huge).is_err());
        assert_eq!(list_logs_in(&dir.0), vec!["ytdescgen-20260930.jsonl"]);
    }

    #[test]
    fn legacy_files_move_into_place() {
        let root = TempDir::new();
        let data = root.0.join("com.example.app");
        fs::create_dir_all(data.join(LOG_DIR)).unwrap();
        // What pre-1.0 versions wrote next to the data directory.
        fs::write(glued(&data, "settings.json"), "{\"ytdescgen-settings\":{}}").unwrap();
        let stray_logs = glued(&data, "logs");
        fs::create_dir_all(&stray_logs).unwrap();
        fs::write(stray_logs.join("ytdescgen-20260101.jsonl"), "old\n").unwrap();
        fs::write(stray_logs.join("ytdescgen-20260930.jsonl"), "a\n").unwrap();
        fs::write(data.join(LOG_DIR).join("ytdescgen-20260930.jsonl"), "b\n").unwrap();

        let report = recover_legacy_files(&data).unwrap();
        assert_eq!(report.backups, vec!["ytdescgen-legacy-data.json"]);
        assert_eq!(report.logs_moved, 2);
        assert!(!glued(&data, "settings.json").exists());
        assert!(!stray_logs.exists());
        assert_eq!(
            read_limited(&data.join(BACKUP_DIR).join("ytdescgen-legacy-data.json")).unwrap(),
            "{\"ytdescgen-settings\":{}}"
        );
        assert_eq!(
            read_limited(&data.join(LOG_DIR).join("ytdescgen-20260930.jsonl")).unwrap(),
            "b\na\n"
        );
        assert!(data.join(LOG_DIR).join("ytdescgen-20260101.jsonl").exists());

        // Nothing left to do the second time.
        assert_eq!(
            recover_legacy_files(&data).unwrap(),
            LegacyReport::default()
        );
    }

    #[test]
    fn a_second_legacy_file_gets_its_own_name() {
        let root = TempDir::new();
        let data = root.0.join("app");
        fs::create_dir_all(data.join(BACKUP_DIR)).unwrap();
        fs::write(
            data.join(BACKUP_DIR).join("ytdescgen-legacy-data.json"),
            "{}",
        )
        .unwrap();
        fs::write(data.join("settings.json"), "{\"x\":1}").unwrap();
        let report = recover_legacy_files(&data).unwrap();
        assert_eq!(report.backups, vec!["ytdescgen-legacy-data-2.json"]);
    }

    #[test]
    fn unrelated_files_in_the_stray_log_folder_stay() {
        let root = TempDir::new();
        let data = root.0.join("app");
        let stray_logs = glued(&data, "logs");
        fs::create_dir_all(&stray_logs).unwrap();
        fs::write(stray_logs.join("readme.txt"), "keep me").unwrap();
        let report = recover_legacy_files(&data).unwrap();
        assert_eq!(report.logs_moved, 0);
        assert!(stray_logs.join("readme.txt").exists());
    }
}
