# Máy phát triển

Cấu hình tham chiếu cho máy dev chính của YTDescGen — bản web public, các
binary Tauri desktop, và video demo ghi hình đều đến từ máy này. Xem
[`dev_env.md`](dev_env.md) cho phần IDE + toolchain, và
[`../../pc_spec.md`](../../pc_spec.md) cho bản gốc tiếng Anh.

## Máy chính

| Thành phần | Chi tiết |
|------------|----------|
| OS         | Windows 11 Pro 25H2 Insider Preview (Dev Channel) |
| Build      | 26300.8376 |
| CPU        | Intel Core i7-14700KF |
| GPU        | NVIDIA GeForce RTX 5080 (16 GB VRAM) |
| RAM        | 32 GB DDR5 |
| Lưu trữ    | 1 TB SSD |
| IDE        | JetBrains bản trả phí, 2026.x — PyCharm, WebStorm, RustRover, Rider — cộng thêm VS Code |

## Điện thoại kiểm thử bản web

Bản web được smoke-test trên Safari và các trình duyệt Chromium trên các
máy sau:

- iPhone 14 Pro (iOS 26.x)
- iPhone 13 Pro Max (iOS 26.x)
- Trình duyệt: Chrome, Brave

## Vì sao cần ghi rõ

Hiệu năng render, style scrollbar, và sidebar `position: sticky` của editor
hoạt động hơi khác giữa Safari mobile và Chromium desktop. Mọi thay đổi UI
được smoke-test trên các điện thoại liệt kê ở trên trước khi ship.

## Tài liệu liên quan

- [`dev_env.md`](dev_env.md) — bảng IDE + toolchain (tiếng Việt).
- [`../../../webapp/TAURI.md`](../../../webapp/TAURI.md) — yêu cầu build Tauri desktop.
- [`../../pc_spec.md`](../../pc_spec.md) — bản gốc tiếng Anh.
