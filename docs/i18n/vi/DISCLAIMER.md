# Tuyên bố miễn trừ

> **Lưu ý dịch thuật:** Tiếng Anh là phiên bản chính ([`DISCLAIMER.md` ở root](../../../DISCLAIMER.md)). Bản tiếng Việt này có thể chậm cập nhật một vài commit.

## Dự án cá nhân, có sự hỗ trợ của AI

YTDescGen là dự án cá nhân do một người duy trì (`@poli0981`) để dùng cho kênh YouTube [`@SkullMute`](https://www.youtube.com/@SkullMute), và chia sẻ công khai dưới dạng mã nguồn mở. Đây **không phải sản phẩm thương mại** và không có nghĩa vụ hỗ trợ.

Mã nguồn, tài liệu, bản dịch locale, và các quyết định thiết kế trong repo này được **đồng tác giả với sự hỗ trợ của Anthropic's Claude Code (model 4.7 Opus, cửa sổ context 1M)**. Tất cả commit, release, và quyết định kiến trúc được người duy trì xem xét và phê duyệt trước khi merge.

Tuyên bố này áp dụng cho:

- Mã nguồn trong `src/` và `src-tauri/`.
- Tài liệu trong `docs/` và các file markdown ở root.
- File locale trong `src/i18n/locales/`.
- Workflow CI/CD trong `.github/workflows/`.

Xem thêm: [`THIRD_PARTY_NOTICES.md`](../../../THIRD_PARTY_NOTICES.md) § "AI-Assisted Development Disclosure".

## Chất lượng bản dịch

UI ứng dụng hỗ trợ sáu ngôn ngữ. Chất lượng tác giả khác nhau:

| Locale | Tác giả | Ghi chú |
| --- | --- | --- |
| Tiếng Anh (`en`) | Người duy trì + AI | Locale làm việc chính. Chuỗi được review trước khi commit. |
| Tiếng Việt (`vi`) | Người duy trì (bản ngữ) + AI | Review bởi người duy trì là người bản ngữ tiếng Việt. |
| Tiếng Nhật (`ja`) | AI dịch | Không có review bản ngữ. Ngữ pháp và văn phong có thể chưa chuẩn. |
| Tiếng Tây Ban Nha (`es`) | AI dịch | Không có review bản ngữ. Không nhắm cụ thể vào giọng vùng miền (LatAm vs. Castilian). |
| Tiếng Hàn (`ko`) | AI dịch | Không có review bản ngữ. Honorific register chọn ở mức trung tính. |
| Tiếng Trung (`zh`) | AI dịch | Giản thể. Không có review bản ngữ. |

Nếu bạn là người bản ngữ và phát hiện dịch sai, vui lòng mở issue hoặc PR — xem [CONTRIBUTING.md](../../../CONTRIBUTING.md) § "i18n Contributions".

## Giọng văn và phong cách

Template description sinh ra dùng giọng văn được điều chỉnh cho ngách **gameplay no-commentary** trên YouTube, đặc biệt nhấn mạnh game horror / kinh dị (vì đó là nội dung kênh của người duy trì). Output có thể không hợp với mọi kênh hay mọi văn hoá đọc. Ứng dụng dùng template — bạn có thể sửa bất kỳ text sinh ra nào trước khi đăng.

Một số cụm tiếng Việt cố tình giữ từ vay mượn và giọng casual phản ánh cách các creator gameplay Việt thường viết description. Đây không phải "dịch sai" mà là lựa chọn phong cách cho đối tượng đọc.

## Không bảo hành

Phần mềm cung cấp **nguyên trạng, không có bất kỳ bảo hành nào**. Xem [`LICENSE`](../../../LICENSE) (Apache 2.0) §§ 7 và 8 cho đầy đủ điều khoản miễn trừ bảo hành và giới hạn trách nhiệm.

Nói ngắn gọn: nếu ứng dụng crash, làm hỏng draft, sinh ra description khiến video bị YouTube flag, hoặc gây bất kỳ thiệt hại nào — người duy trì không chịu trách nhiệm. Dùng tự chịu rủi ro; back up draft của bạn.

## Không liên kết với YouTube / Anthropic

YTDescGen **không** liên kết, được tài trợ, hay được YouTube, Google LLC, hay Alphabet Inc. xác nhận. Output sinh ra dành để paste vào YouTube Studio editor; ứng dụng này không tương tác với YouTube API.

Việc dùng Claude Code trong quá trình phát triển **không** biến đây thành sản phẩm của Anthropic. Anthropic, Claude, và Claude Code là nhãn hiệu của Anthropic, PBC. Dự án này độc lập.

## Không phải tư vấn pháp lý hay tài chính

Bất kỳ đề cập nào đến GDPR, CCPA, luật bản quyền, chính sách monetization của YouTube, hay các chủ đề tương tự trong tài liệu repo này chỉ để định hướng — **không phải tư vấn pháp lý**. Tham vấn luật sư có chuyên môn ở khu vực của bạn nếu cần câu trả lời chính thống.
