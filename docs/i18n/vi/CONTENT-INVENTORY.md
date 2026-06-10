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

## 3. Cảnh báo nội dung (248, chia nhóm)

Cảnh báo được chọn sẽ thêm vào khối `⚠ CONTENT WARNINGS` trong description, trước phần timestamp. Mỗi nhóm có thể thu gọn trong editor; cảnh báo hiển thị theo thứ tự người dùng chọn.

### Spoiler (6)

Spoiler cốt truyện / ending · Spoiler ending · Spoiler ending thật · Spoiler hậu game / NG+ · Spoiler ending bí mật · Spoiler cốt truyện DLC

### Sức khỏe / Quang nhạy (13)

Hiệu ứng chớp sáng · Say game / camera nhanh · Có thể đau nửa đầu · Đèn nhấp nháy · Rung màn hình mạnh · Loé sáng / lens flare · Bloom quá đà / sáng cháy · Hiệu ứng hạt dày đặc · HUD / overlay nhấp nháy · Màu sắc quá rực / loè loẹt · Motion blur nặng · Depth of field gắt · Post-processing đậm đặc

### Âm thanh / Cảm âm (13)

Âm thanh đột ngột · Âm chói tai / tần số cao · Jumpscare bằng âm thanh · Thay đổi âm lượng đột ngột · Âm thanh méo / vỡ · Tiếng ken két / kim loại · Tiếng cao kéo dài · Lỗi âm thanh / glitch · Bass nặng / sub-bass rung · Tiếng la hét kéo dài · Tiếng kính vỡ / va đập · Tạp âm mic / tiếng thở · Tiếng nhiễu / tĩnh điện

### Lời thoại / Ngôn từ (10)

Văng tục dày đặc · Lời thoại ẩn ý t*nh d*c · Lời thoại kích động · Lăng mạ / sỉ nhục bằng lời · Lời đe dọa / uy hiếp · Từ ngữ miệt thị / xúc phạm · Hài thô tục · Hài người lớn · Hài đen / u tối · Nhắc đến chất kích thích / đồ có cồn

### Ám ảnh / Phobia (56)

Jumpscare · Sợ độ cao (acrophobia) · Sợ lỗ / cụm (trypophobia) · Sợ nước sâu (thalassophobia) · Sợ không gian kín (claustrophobia) · Sợ nhện (arachnophobia) · Sợ côn trùng (entomophobia) · Sợ rắn (ophidiophobia) · Sợ chó (cynophobia) · Sợ bóng tối (nyctophobia) · Sợ lửa (pyrophobia) · Sợ búp bê (pediophobia) · Sợ máu (hemophobia) · Sợ chú hề (coulrophobia) · Sợ chết đuối (ablutophobia) · Sợ bị chôn sống (taphophobia) · Hình nhân máy (automatonophobia) · Vật thể khổng lồ (megalophobia) · Vật nhân tạo dưới nước (submechanophobia) · Xác chết (necrophobia) · Ma quỷ (spectrophobia) · Quỷ dữ (demonophobia) · Cá mập (selachophobia) · Vi trùng / ô nhiễm (mysophobia) · Nôn mửa (emetophobia) · Bị nhìn chằm chằm (scopophobia) · Cô lập (monophobia) · Chuột (musophobia) · Dơi (chiroptophobia) · Chim (ornithophobia) · Cá (ichthyophobia) · Bò sát (herpetophobia) · Gián (katsaridaphobia) · Ong (apiphobia) · Sấm sét (astraphobia) · Không gian rộng (agoraphobia) · Đám đông (enochlophobia) · Tuyết / giá lạnh (chionophobia) · Bệnh viện (nosocomephobia) · Vật sắc nhọn (aichmophobia) · Nghẹt thở (pnigophobia) · Sương mù (homichlophobia) · Lốc xoáy / bão (lilapsophobia) · Mưa lớn (ombrophobia) · Mây / trời u ám (nephophobia) · Gió mạnh (ancraophobia) · Cực lạnh (cryophobia) · Ánh nắng gay gắt (heliophobia) · Sóng lớn (cymophobia) · Hồ / nước tĩnh (limnophobia) · Sông / dòng chảy (potamophobia) · Sợ màu sắc / cảnh màu chói (chromophobia) · Sợ màu đỏ / cảnh toàn đỏ (erythrophobia) · Sợ màu vàng (xanthophobia) · Sợ màu trắng / không gian toàn trắng (leukophobia) · Sợ màu đen (melanophobia)

### Sức khỏe tâm thần (17)

Cảnh gây lo âu · Trầm cảm · Rối loạn ăn uống · Sử dụng chất kích thích · Tự hại / tự tử · PTSD · Kim tiêm · Dịch cơ thể · Mang thai / sinh nở kinh dị · Bệnh tật / nhiễm trùng · Lưỡng cực · OCD · Hoảng loạn · Phân ly · Hoang tưởng · Suy nghĩ xâm nhập · Y khoa kinh dị

### Hiện tượng tâm lý — xã hội (22)

Tự kỷ / thần kinh đa dạng · ADHD / rối loạn tập trung · Hikikomori / ẩn dật xã hội · NEET (không học không làm) · Lo âu xã hội · Cô lập xã hội / cô đơn · Tâm thần phân liệt / loạn thần · Burnout / kiệt sức · Mặc cảm sống sót · Bị bỏ rơi / sang chấn · Quan hệ parasocial · Gaslighting / thao túng · Hội chứng Stockholm · Nghiện game / cờ bạc · Khủng hoảng hiện sinh · Hội chứng kẻ mạo danh · Khủng hoảng tuổi trung niên · Khủng hoảng tuổi 1/4 · Quấy rối nơi làm việc · Áp lực vai trò giới · Miệt thị ngoại hình (body shaming) · Chuẩn mực ngoại hình phi thực tế

### Internet / Đời sống số (18)

Bắt nạt / quấy rối qua mạng · Doxxing / phơi bày thông tin cá nhân · Trolling / phá game · Văn hóa tẩy chay / bêu rếu công khai · Nghiện mạng xã hội · Lướt tin tiêu cực vô độ (doomscrolling) · Hội chứng sợ bỏ lỡ (FOMO) · Tin giả / thông tin sai lệch · Lừa đảo trực tuyến / phishing · Giả mạo danh tính trên mạng (catfishing) · Deepfake / nội dung giả mạo bằng AI · Theo dõi / rình rập qua mạng · Trào lưu / thử thách nguy hiểm trên mạng · Văn hóa influencer / câu tương tác · Cực đoan hóa qua mạng / buồng vang thông tin · Loot box / cơ chế gacha · Chủ đề AI / trí tuệ nhân tạo · Riêng tư dữ liệu / giám sát diện rộng

### Nội dung nhạy cảm / 18+ (66)

Máu me · 18+ · Trang phục hở hang · Kh*a th*n một phần · Tạo hình nhân vật bị t*nh d*c hóa · Yếu tố fan service · Tư thế / góc quay gợi cảm · Hình ảnh gây khó chịu · B*o h*nh động vật · Trẻ em chịu tác động · B*o h*nh gia đình · Tham chiếu x*m h*i t*nh d*c · Tra tấn · Tôn giáo · Tác động vật lý chiến tranh · Phân biệt đối xử · Tác động vật lý từ chính quyền · Hút thuốc / uống rượu · G*ết người chi tiết · Tà giáo / huyền bí · Thao túng tâm lý · Mất mát / đau buồn · Bắt cóc · Phát ngôn thù hận · Tội ác lịch sử · Nô lệ · Khủng bố · Bắt nạt · Thử nghiệm trên người · Ăn thịt người · Hạt nhân / phóng xạ · Kỳ thị người đồng tính / LGBTQ+ (homophobia) · Kỳ thị người chuyển giới (transphobia) · Bài ngoại (xenophobia) · Cực đoan chính trị · Cực đoan tôn giáo / cuồng tín · Diệt chủng / thanh trừng sắc tộc · Thánh chiến / xung đột tôn giáo · Đại nạn Holocaust · Nội chiến · Xả súng hàng loạt / xả súng trường học · Chủ nghĩa thực dân / đế quốc · Tuyên truyền nhà nước · Nhà nước giám sát / dystopia · Thuyết âm mưu · Kiểm duyệt / cấm phát ngôn · Xung đột sắc tộc / chủng tộc · Khủng hoảng tị nạn · Cách mạng / nổi dậy · Ám sát chính trị · Đảo chính · Toà án dị giáo / săn phù thủy · Lao động cưỡng bức · Chủ nghĩa dân tộc cực đoan · Treo c* / siết c* · Cảnh ch*t đuối · Cảnh thiêu s*ng · Cảnh ngạt th* · Bị trói / cầm tù tra tấn · Cảnh hành quyết công khai · Cảnh chặt đầu · Cảnh đâm xuyên cơ thể · Thương vong hàng loạt · Tác động vật lý bằng phương tiện · Cảnh sử dụng quá liều · Ngã / nhảy từ trên cao

### Kinh dị nặng (12)

Mắt / cụm mắt · Body horror (biến dạng cơ thể) · Mặt biến dạng / cắt xén · Kinh dị vũ trụ · Máu me / phân thây cực độ · Phân hủy, thối rữa, dòi bọ · Cắt xẻo / cụt chi · Liminal space · Analog horror / VHS · Phi thực tế / méo mó · Truy đuổi · Thực thể / SCP

### Thông tin về playstyle (10)

Lần đầu chơi (blind) · Không spoiler trong chat · Chế độ easy / story · Chế độ khó cao · Permadeath / Iron Man · Thử speedrun · 100% completionist · Đang học cơ chế · Chơi lần đầu · Chơi lại / NG+

### Thông tin về gameplay (5)

Dùng mod · Bật cheat / debug · Dùng glitch · Có guide hỗ trợ · Game mục đích giáo dục / tuyên truyền

---

## 4. Bảo trì

Khi thêm mục mới vào bất kỳ file nguồn nào:

1. **Loại video** → thêm vào [`src/config/video-types.ts`](../../../src/config/video-types.ts) VÀ thêm dòng vào mục 1 ở trên.
2. **Thể loại** → thêm vào [`src/config/genres.ts`](../../../src/config/genres.ts) VÀ thêm dòng vào mục 2.
3. **Cảnh báo nội dung** → thêm vào nhóm phù hợp ở [`src/config/content-warning-groups.ts`](../../../src/config/content-warning-groups.ts) VÀ thêm label vào đúng nhóm ở mục 3 — giữ số đếm trong tiêu đề chính xác.
4. Cập nhật cả bản gốc EN tại [`docs/CONTENT-INVENTORY.md`](../../CONTENT-INVENTORY.md) trong cùng PR.

Sai lệch giữa file này và file nguồn được xem là lỗi tài liệu — mở issue hoặc PR.
