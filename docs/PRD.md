# Product Requirements Document (PRD)

## YTDescGen — YouTube Gameplay Description Generator

**Version**: 1.0
**Author**: Kokone (skullmute)
**Last Updated**: 2026-04-07

---

## 1. Problem Statement

Kênh YouTube Gameplay No Commentary cần tạo title, description, và tags cho mỗi video upload. Quy trình hiện tại:

1. Mở file template → copy → paste vào YouTube Studio
2. Thay thế từng placeholder bằng thông tin game cụ thể
3. Tìm và thêm tags phù hợp thể loại
4. Lặp lại toàn bộ cho mỗi ngôn ngữ
5. Lặp lại toàn bộ cho mỗi video trong series

**Pain Points:**
- Lặp lại thao tác nhập Social/Rig/Channel info mỗi lần
- Dễ quên/sai khi thay placeholder
- Tags phải nhớ hoặc tra cứu từ file Excel
- Không có cách kiểm tra character limit trước khi paste
- Multi-language phải làm riêng từng bản
- Không tái sử dụng được game info cho multi-part series

## 2. Solution

Ứng dụng web (+ desktop) với form-based UI:
- Chọn video type, ngôn ngữ, thể loại game
- Nhập thông tin một lần → lưu Profile
- Nhập game info một lần → lưu Preset cho cả series
- Tự động generate title + description + tags
- Copy trực tiếp vào clipboard, paste vào YouTube Studio
- Hỗ trợ batch mode cho nhiều video cùng game

## 3. Target Users

- **Primary**: Bản thân Kokone — kênh Gameplay No Commentary
- **Secondary**: Các YouTuber gameplay nhỏ lẻ cùng niche
- **Future**: Mở rộng cho community qua GitHub release

## 4. Core User Stories

### Must Have (P0)

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| US-01 | Chọn loại video (Full, Part, Boss, etc.) | UI hiển thị đúng form fields theo loại video đã chọn |
| US-02 | Chọn ngôn ngữ output (EN/VI/JA) | Toàn bộ generated output chuyển sang ngôn ngữ đã chọn |
| US-03 | Chọn thể loại game | Tags được generate phù hợp thể loại |
| US-04 | Nhập game info (tên, platform, store links) | Thông tin được đưa vào title + description đúng vị trí |
| US-05 | Nhập timestamps | Timestamps xuất hiện trong description với format YouTube chapters |
| US-06 | Nhập Social/Donate links | Links xuất hiện trong description section phù hợp |
| US-07 | Nhập Rig info | Rig xuất hiện dưới dạng compact format trong description |
| US-08 | Xem preview title + description + tags | Preview cập nhật real-time khi thay đổi input |
| US-09 | Copy từng phần (title / desc / tags) | Clipboard chứa đúng nội dung, toast confirm |
| US-10 | Copy tất cả | Clipboard chứa title + desc, tags riêng |
| US-11 | Hiển thị character count | Description ≤ 5000, Tags ≤ 500, warning khi gần/vượt limit |
| US-12 | Toggle Spoiler/18+ warning | Dòng warning xuất hiện/ẩn trong description |

### Should Have (P1)

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| US-13 | Lưu Profile (social, rig, channel) | Profile persist qua sessions, load vào form |
| US-14 | Lưu Game Preset (tên + store links) | Preset persist, selectable khi tạo video mới |
| US-15 | Xem lịch sử generated outputs | Danh sách outputs đã tạo, có thể copy lại |
| US-16 | Thêm ngôn ngữ mới dễ dàng | Chỉ cần thêm locale JSON files + register |
| US-17 | Thêm thể loại game mới | Chỉ cần thêm entry trong config + tag pool |
| US-18 | Import/Export settings | JSON export/import cho profiles + presets |
| US-19 | Multi-language output đồng thời | Generate cả 3 ngôn ngữ cùng lúc, mỗi ngôn ngữ 1 tab |

### Nice to Have (P2)

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| US-20 | Batch mode cho multi-part series | Nhập game info 1 lần, tạo N videos khác part/timestamps |
| US-21 | Desktop app (Windows/macOS) | Tauri binary, hoạt động offline |
| US-22 | Custom template editor | Người dùng tự sửa template structure |
| US-23 | Keyboard shortcuts | Ctrl+Enter = generate, Ctrl+Shift+C = copy all |
| US-24 | Dark/Light theme toggle | Theme persist qua sessions |
| US-25 | Auto-save draft | Form state tự lưu, recover khi reload |
| US-26 | Tag suggestions từ game name | Gợi ý tag dựa trên tên game + trending |
| US-27 | YouTube API integration | Auto-fill qua YouTube Data API (future) |
| US-28 | VS Code / IDE extension | Command palette → generate description |

## 5. Non-Functional Requirements

| Requirement | Target |
|------------|--------|
| First Contentful Paint | < 1.5s |
| Bundle size (web) | < 500KB gzipped |
| Desktop binary size | < 15MB (Tauri) |
| Offline support | Full functionality without internet |
| Browser support | Chrome 90+, Firefox 90+, Edge 90+ |
| Accessibility | WCAG 2.1 Level AA |
| Persistence | localStorage (web), file system (desktop) |

## 6. Out of Scope (v1)

- YouTube API auto-upload
- Thumbnail generation
- Video editing integration
- Multi-user / team features
- Cloud sync between devices
- Analytics / tracking
- Monetization

## 7. Success Metrics

| Metric | Target |
|--------|--------|
| Time to generate 1 video description | < 2 minutes (vs ~10 minutes manual) |
| Error rate (missing fields, wrong format) | 0% — form validates before generate |
| Languages supported at launch | 3 (EN, VI, JA) |
| Genres supported at launch | 10+ |
| Video types supported | 7+ |
