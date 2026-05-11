# Môi trường phát triển

Những thứ cần cài trên máy mới để làm việc với YTDescGen. Phần phần cứng
ở [`pc_spec.md`](pc_spec.md); file này tập trung vào toolchain.

## Editor

- **JetBrains 2026.x** (bản trả phí) — PyCharm, WebStorm, RustRover, Rider.
- **VS Code** — cho chỉnh sửa nhanh, xem trước markdown, và pair session.

Chọn editor phù hợp với từng file; cả hai đều dùng chung cấu hình
ESLint / Prettier / TypeScript của project.

## Toolchain

| Công cụ | Phiên bản          | Ghi chú |
|---------|--------------------|---------|
| Node.js | ≥ 25.8.1           | Cần cho Vite 5 + Vitest 2. Nên dùng `nvm` / `volta` để pin version. |
| Python  | 3.12               | Phục vụ các script trong `scripts/`. |
| Rust    | stable (`rustup`)  | Cần cho build desktop Tauri 2. |
| Git     | bản mới            | Phiên bản nào hỗ trợ SSH + Sparse Checkout đều dùng được. |

## Quy ước Git

- `commit.gpgsign = true` — mọi commit đều được GPG-sign.
- Mô hình branch: `main` (stable) ← `dev` (integration) ← `feat/*`.
- Format commit message: `type(scope): message` — xem [`../../../CLAUDE.md`](../../../CLAUDE.md).

## Lệnh hay dùng

Xem [`../../../CLAUDE.md`](../../../CLAUDE.md) để có danh sách đầy đủ. Hàng ngày:

```bash
npm install         # lần đầu
npm run dev         # Vite dev server
npm run typecheck   # tsc --noEmit
npm run test        # Vitest watch
npm run validate:locales
npm run tauri dev   # shell desktop chạy đè lên dev server
```

## Tài liệu liên quan

- [`pc_spec.md`](pc_spec.md) — phần cứng (tiếng Việt).
- [`../../../webapp/TAURI.md`](../../../webapp/TAURI.md) — yêu cầu build Tauri 2 theo nền tảng.
- [`../../dev_env.md`](../../dev_env.md) — bản gốc tiếng Anh.
