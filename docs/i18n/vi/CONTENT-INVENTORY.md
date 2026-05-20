# Danh mục Nội dung

Bản kê khai tĩnh cho mọi loại video, thể loại game, và cảnh báo nội dung trong editor của YTDescGen. Cập nhật thủ công — khi thêm mục mới vào một trong các file nguồn dưới đây, **thêm dòng tương ứng vào đây** trong cùng PR.

File này tồn tại để **minh bạch** — bất kỳ ai tò mò về việc editor có thể mô tả được gì (mà không cần cài app hay đọc source) đều có thể quét trong một phút.

**Bản gốc tiếng Anh:** [`docs/CONTENT-INVENTORY.md`](../../CONTENT-INVENTORY.md).

**Nguồn tham chiếu (source of truth):**
- Loại video: [`src/config/video-types.ts`](../../../src/config/video-types.ts)
- Thể loại game: [`src/config/genres.ts`](../../../src/config/genres.ts)
- Cảnh báo nội dung: [`src/config/content-warning-groups.ts`](../../../src/config/content-warning-groups.ts)

---

## 1. Loại video (20)

Mỗi loại video kéo theo một template description, cấu trúc title, và tag bias riêng. Cột "Trường bổ sung" liệt kê các trường editor sẽ hiển thị khi chọn loại video tương ứng.

| Icon | Loại | Trường bổ sung |
|---|---|---|
| 🎮 | Gameplay đầy đủ | — |
| 📂 | Gameplay theo phần | Số phần |
| 🎬 | Demo đầy đủ | — |
| 🎞 | Demo theo phần | Số phần |
| 👹 | Đấu trùm | Tên trùm |
| 💀 | Đấu trùm không trúng đòn | Tên trùm |
| 🏁 | Kết thúc / Toàn bộ Ending | — |
| ⚡ | Speedrun | — |
| 💯 | Hoàn thành 100% | — |
| 📦 | Nội dung DLC | Tên DLC |
| 🔄 | New Game+ | — |
| 🏆 | Thử thách | Tên thử thách |
| 📌 | Nhiệm vụ phụ | — |
| 🔍 | Bí mật / Ẩn | — |
| ⚖️ | So sánh đồ họa | — |
| 📘 | Hướng dẫn không lời | — |
| 🧩 | Chơi với Mod | Tên Mod |
| ⭐ | Toàn bộ vật phẩm sưu tầm | — |
| 🔴 | Livestream | URL Live, Thời gian dự kiến |
| 🎴 | Nhiệm vụ Gacha | Loại nhiệm vụ, Tên chapter, Tên quest, Số phần |

---

## 2. Thể loại game (41)

Thể loại được chọn ảnh hưởng đến định dạng title, tag pool, và (khi cấu hình ở Settings → Genre Playlists) gợi ý playlist trong pinned comment.

Các nhóm bulk-select trong editor: **All RPGs** (rpg + jrpg + action_rpg + crpg), **All Shooters** (fps + arena_shooter + tactical_fps + boomer_shooter + extraction_shooter + shmup), **All Horror** (horror + survival_horror + psychological_horror).

| Icon | Thể loại |
|---|---|
| ⚔️ | Hành động / Phiêu lưu |
| 🗡 | Hack & Slash |
| 👊 | Beat 'em Up |
| 🦘 | Platformer |
| 👻 | Kinh dị / Sinh tồn |
| 🧟 | Kinh dị Sinh tồn |
| 🧠 | Kinh dị Tâm lý |
| 🛡 | RPG |
| 🎎 | JRPG |
| 🏹 | Action RPG |
| 📜 | CRPG / Góc nhìn từ trên |
| 🔫 | FPS / Bắn súng |
| 🎯 | Bắn súng Arena |
| 🎖 | Bắn súng Chiến thuật |
| 💥 | Boomer Shooter |
| 🎒 | Extraction Shooter |
| 🛸 | SHMUP / Bullet Hell |
| 🌍 | Thế giới mở / Sandbox |
| 🕹 | Indie |
| 💀 | Souls-like |
| 🏎 | Đua xe / Thể thao |
| 📖 | Cốt truyện |
| 🏗 | Mô phỏng / Chiến thuật |
| 🏙 | Xây thành |
| 🥊 | Đối kháng |
| 🥷 | Lén lút / Gián điệp |
| ⛏ | Sinh tồn / Chế tạo |
| 🎲 | Roguelike / Roguelite |
| 🗺 | Metroidvania |
| 🌐 | MMO / Trực tuyến |
| 🎵 | Âm nhạc / Nhịp điệu |
| 🧩 | Giải đố |
| 🏰 | Tower Defense |
| 🃏 | Bài / Card |
| 🎴 | Deck Builder |
| 🤖 | Auto Battler |
| 🏆 | Battle Royale |
| ♟ | Chiến thuật theo lượt |
| 🚀 | Không gian / Sci-Fi |
| 🌾 | Nông trại / Life Sim |
| 🎬 | FMV / Phim tương tác |
| 💬 | Visual Novel |

---

## 3. Cảnh báo nội dung (125, chia nhóm)

Cảnh báo được chọn sẽ thêm vào khối `⚠ CONTENT WARNINGS` trong description, trước phần timestamp. Mỗi nhóm có thể thu gọn trong editor; cảnh báo hiển thị theo thứ tự người dùng chọn.

### Spoiler (6)

Spoiler cốt truyện / ending · Spoiler ending · Spoiler ending thật · Spoiler hậu game / NG+ · Spoiler ending bí mật · Spoiler cốt truyện DLC

### Sức khỏe / Quang nhạy (6)

Đèn nháy · Say tàu xe · Kích thích migraine · Âm thanh lớn / đột ngột · Hiệu ứng strobe · Rung hình mạnh

### Ám ảnh / Phobia (41)

Jumpscare · Sợ độ cao (acrophobia) · Sợ lỗ / cụm (trypophobia) · Sợ nước sâu (thalassophobia) · Sợ không gian kín (claustrophobia) · Sợ nhện (arachnophobia) · Sợ côn trùng (entomophobia) · Sợ rắn (ophidiophobia) · Sợ chó (cynophobia) · Sợ bóng tối (nyctophobia) · Sợ lửa (pyrophobia) · Sợ búp bê (pediophobia) · Sợ máu (hemophobia) · Sợ chú hề (coulrophobia) · Sợ chết đuối (ablutophobia) · Sợ bị chôn sống (taphophobia) · Hình nhân máy (automatonophobia) · Vật thể khổng lồ (megalophobia) · Vật nhân tạo dưới nước (submechanophobia) · Xác chết (necrophobia) · Ma quỷ (spectrophobia) · Quỷ dữ (demonophobia) · Cá mập (selachophobia) · Vi trùng / ô nhiễm (mysophobia) · Nôn mửa (emetophobia) · Bị nhìn chằm chằm (scopophobia) · Cô lập (monophobia) · Chuột (musophobia) · Dơi (chiroptophobia) · Chim (ornithophobia) · Cá (ichthyophobia) · Bò sát (herpetophobia) · Gián (katsaridaphobia) · Ong (apiphobia) · Sấm sét (astraphobia) · Không gian rộng (agoraphobia) · Đám đông (enochlophobia) · Tuyết / giá lạnh (chionophobia) · Bệnh viện (nosocomephobia) · Vật sắc nhọn (aichmophobia) · Nghẹt thở (pnigophobia)

### Sức khỏe tâm thần (17)

Cảnh gây lo âu · Trầm cảm · Rối loạn ăn uống · Sử dụng chất kích thích · Tự hại / tự tử · PTSD · Kim tiêm · Dịch cơ thể · Mang thai / sinh nở kinh dị · Bệnh tật / nhiễm trùng · Lưỡng cực · OCD · Hoảng loạn · Phân ly · Hoang tưởng · Suy nghĩ xâm nhập · Y khoa kinh dị

### Nội dung nhạy cảm / 18+ (29)

Máu me · 18+ · Hình ảnh gây khó chịu · Bạo hành động vật · Bạo lực với trẻ em · Bạo lực gia đình · Tham chiếu xâm hại tình dục · Tra tấn · Tôn giáo · Bạo lực chiến tranh · Phân biệt đối xử · Bạo lực nhà nước / cảnh sát · Hút thuốc / uống rượu · Giết người chi tiết · Tà giáo / huyền bí · Thao túng tâm lý · Mất mát / đau buồn · Bắt cóc · Phát ngôn thù hận · Tội ác lịch sử · Nô lệ · Khủng bố · Bắt nạt · Thử nghiệm trên người · Ăn thịt người · Hạt nhân / phóng xạ · Kỳ thị người đồng tính / LGBTQ+ (homophobia) · Kỳ thị người chuyển giới (transphobia) · Bài ngoại (xenophobia)

### Kinh dị nặng (12)

Mắt / cụm mắt · Body horror (biến dạng cơ thể) · Mặt biến dạng / cắt xén · Kinh dị vũ trụ · Máu me / phân thây cực độ · Phân hủy, thối rữa, dòi bọ · Cắt xẻo / cụt chi · Liminal space · Analog horror / VHS · Phi thực tế / méo mó · Truy đuổi · Thực thể / SCP

### Thông tin về playstyle (10)

Lần đầu chơi (blind) · Không spoiler trong chat · Chế độ easy / story · Chế độ khó cao · Permadeath / Iron Man · Thử speedrun · 100% completionist · Đang học cơ chế · Chơi lần đầu · Chơi lại / NG+

### Thông tin về gameplay (4)

Dùng mod · Bật cheat / debug · Dùng glitch · Có guide hỗ trợ

---

## 4. Bảo trì

Khi thêm mục mới vào bất kỳ file nguồn nào:

1. **Loại video** → thêm vào [`src/config/video-types.ts`](../../../src/config/video-types.ts) VÀ thêm dòng vào mục 1 ở trên.
2. **Thể loại** → thêm vào [`src/config/genres.ts`](../../../src/config/genres.ts) VÀ thêm dòng vào mục 2.
3. **Cảnh báo nội dung** → thêm vào nhóm phù hợp ở [`src/config/content-warning-groups.ts`](../../../src/config/content-warning-groups.ts) VÀ thêm label vào đúng nhóm ở mục 3 — giữ số đếm trong tiêu đề chính xác.
4. Cập nhật cả bản gốc EN tại [`docs/CONTENT-INVENTORY.md`](../../CONTENT-INVENTORY.md) trong cùng PR.

Sai lệch giữa file này và file nguồn được xem là lỗi tài liệu — mở issue hoặc PR.
