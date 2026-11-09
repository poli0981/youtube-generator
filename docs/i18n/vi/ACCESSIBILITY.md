# Khả năng tiếp cận

> **Lưu ý dịch thuật:** Tiếng Anh là phiên bản chính ([`ACCESSIBILITY.md` ở root](../../../ACCESSIBILITY.md)). Bản tiếng Việt này có thể chậm cập nhật một vài commit.

**Cập nhật lần cuối:** 2026-11-09

YTDescGen hướng tới việc ai làm video cũng dùng được, kể cả người dùng bàn phím thay chuột, trình đọc màn hình, phóng to hoặc kính lúp, chế độ tương phản cao, điều khiển bằng giọng nói hay màn hình cảm ứng. Văn bản này nói rõ những gì đang hoạt động, cách kiểm tra, những gì chưa ổn, và cách báo cho chúng tôi khi bạn gặp rào cản.

Văn bản áp dụng cho trang web [ytgenerator.stream](https://ytgenerator.stream), ứng dụng desktop (Windows, macOS, Linux) và ứng dụng Android. Các bản này dùng chung một giao diện, nên mọi điều dưới đây áp dụng cho tất cả, trừ khi có nêu tên nền tảng.

## Mục tiêu

Chúng tôi hướng tới [WCAG 2.2](https://www.w3.org/TR/WCAG22/) mức **AA**. Đây là mục tiêu, không phải tuyên bố đã đạt chuẩn: YTDescGen là dự án mã nguồn mở do một người duy trì và chưa được kiểm định độc lập. Khi phát hiện chỗ chưa đạt, chỗ đó sẽ được sửa hoặc ghi vào mục [Hạn chế đã biết](#hạn-chế-đã-biết).

## Những gì đang hoạt động

### Bàn phím

- Mọi trang, menu và hộp thoại đều dùng được chỉ bằng bàn phím. **Chuyển đến nội dung** là điểm dừng đầu tiên trên các trang của ứng dụng, và một đường viền hiện rõ vị trí đang được focus.
- Hộp thoại giữ focus bên trong khi đang mở, đóng bằng **Esc**, rồi trả focus về đúng nút đã mở nó.
- Phím tắt dùng được trên mọi trang:
  - **Ctrl/⌘ + K**: command palette (mở trang bất kỳ, sao chép, profile, preset, template, đổi theme và ngôn ngữ).
  - **Ctrl/⌘ + G** hoặc **Ctrl/⌘ + Enter**: sang trang Kết quả.
  - **Ctrl/⌘ + Shift + C**: Sao chép tất cả.
  - **Ctrl/⌘ + S**: lưu vào Lịch sử.
  - **Ctrl/⌘ + B**: thu gọn/mở thanh bên.
  - **Alt + T**: tới vùng thông báo.
  - **Ctrl/⌘ + /** (hoặc **?**): danh sách đầy đủ.
- Phím tắt một phím **?** có thể tắt ở **Cài đặt › Trình soạn › Phím tắt một phím**, dành cho người nhập bằng giọng nói hoặc hay bấm nhầm phím.

### Trình đọc màn hình

- Mọi nút đều có tên, kể cả nút chỉ có biểu tượng, và mọi ô nhập đều có nhãn. Gợi ý và thông báo lỗi được gắn với đúng ô của nó.
- Các xác nhận và lỗi đều được đọc lên ("Đã sao chép!", "Đã lưu vào lịch sử", lý do không sao chép được), các vấn đề của Strict Mode cũng vậy.
- Khi bạn mở trang khác, tên trang được đọc lên. Focus vẫn ở liên kết bạn vừa dùng.
- Mỗi trang có tiêu đề riêng và một tiêu đề chính duy nhất. Ngôn ngữ của trang theo ngôn ngữ giao diện bạn chọn (tám ngôn ngữ).
- Tiêu đề, mô tả và tag được tạo ra đều gắn ngôn ngữ mà chúng được viết, nên mô tả tiếng Nhật được đọc bằng giọng tiếng Nhật kể cả khi giao diện đang là tiếng Việt.

### Thị giác

- Có theme tối và theme sáng, cả hai đều đạt độ tương phản WCAG AA cho chữ (4.5:1) trên mọi nền. Một test giữ cho điều này không bị phá ([tests/styles/contrast.test.ts](../../../tests/styles/contrast.test.ts)).
- Bố cục co giãn từ màn hình rộng xuống bề rộng điện thoại, nên khi phóng to, nội dung dồn thành một cột thay vì tràn ra ngoài màn hình.
- Ứng dụng desktop phóng to/thu nhỏ bằng **Ctrl/⌘ + =** và **Ctrl/⌘ + −** (trên Windows dùng được cả Ctrl + con lăn chuột). Trên Android, dùng hai ngón tay để phóng to.
- Ở chế độ High Contrast của Windows (forced colours), đường viền focus vẫn hiện.
- **Cài đặt › Giao diện › Ẩn thanh cuộn** bỏ các thanh cuộn; vẫn cuộn được bằng bàn phím, con lăn chuột và cảm ứng.

### Chuyển động

- Khi bật **Giảm chuyển động** (Reduce motion) trong hệ điều hành, các hiệu ứng động và cuộn mượt được tắt.

### Cảm ứng

- Trên màn hình cảm ứng, nút và ô nhập lớn lên khoảng 44 px, các nút đóng/bỏ qua nhỏ cũng vậy.

### Trang kiểm tra của website

- Bước kiểm tra Cloudflare Turnstile trước khi vào website thường tự xong. Trạng thái của nó ("Đang kiểm tra trình duyệt…", lỗi) được đọc lên, và dùng được bằng bàn phím. Xem [Hạn chế đã biết](#hạn-chế-đã-biết) nếu Cloudflare yêu cầu bạn giải thử thách.

## Cách kiểm tra

- **Thủ công.** Người duy trì dùng YTDescGen chỉ bằng bàn phím (rút chuột) và bằng Windows Narrator, qua các luồng chính: trình soạn, kết quả, sao chép, profile, preset, template, Lịch sử, Cài đặt và sao lưu.
- **Tự động.** Một unit test kiểm tra độ tương phản của mọi token màu ở cả hai theme.
- **Quy tắc thiết kế.** Các thành phần giao diện dựng từ những khối có sẵn khả năng tiếp cận (Radix primitives). Nút chỉ có biểu tượng không thể tạo ra mà thiếu tên, và mọi ô nhập lấy nhãn và phần nối lỗi từ cùng một component dùng chung.

Ứng dụng **chưa** được thử với NVDA, JAWS, VoiceOver (macOS), TalkBack (Android) hay Orca (Linux). Rất mong nhận được phản hồi từ những ai đang dùng các công cụ này.

## Môi trường hỗ trợ

| Nền tảng | Chạy trên | Trình đọc màn hình |
| --- | --- | --- |
| Windows: ứng dụng desktop, hoặc website trên Edge / Chrome | Windows 10 hoặc 11 với WebView2; Chrome hoặc Edge 111+ | Narrator: đã thử |
| Website trên trình duyệt khác | Firefox 114+, Safari 16.4+ | Chưa thử |
| Ứng dụng desktop macOS | macOS 11 trở lên, Apple silicon | VoiceOver: chưa thử |
| Ứng dụng desktop Linux | WebKitGTK 2.40 trở lên | Orca: chưa thử |
| Ứng dụng Android | Android 11 trở lên, Android System WebView bản mới | TalkBack: chưa thử |

## Hạn chế đã biết

- **Thử thách của Cloudflare trên website.** Nếu Turnstile bắt bạn giải thử thách thay vì tự qua, thử thách đó do Cloudflare quản lý và khả năng tiếp cận của nó do họ sửa. Nếu nó chặn bạn, hãy dùng ứng dụng desktop hoặc Android (không có trang kiểm tra), hoặc [gửi email cho chúng tôi](#báo-một-rào-cản).
- **Viền ô nhập mờ.** Viền của ô nhập trống chỉ khoảng 1.2–1.3:1 so với nền, dưới mức 3:1 mà WCAG yêu cầu. Ô nhập vẫn được nhận biết qua nhãn, và ô đang focus có viền và vầng màu nhấn.
- **Nút Tiếp tục ở màn hình chạy lần đầu** dùng gradient của thương hiệu. Chữ trắng trên đầu màu tím nhạt hơn của gradient chỉ đạt 3.96:1.
- **Bộ đếm ký tự không được đọc lên khi bạn gõ**, vì như vậy sẽ chen ngang mỗi lần gõ phím. Khi một trường vượt giới hạn của YouTube, việc sao chép bị từ chối kèm thông báo lý do, và Strict Mode liệt kê vấn đề trong một banner được đọc lên.
- **Chưa có lint khả năng tiếp cận tự động.** `eslint-plugin-jsx-a11y` chưa hỗ trợ ESLint 10 mà dự án đang dùng, và unit test chạy không có DOM của trình duyệt. Ngoài test độ tương phản, việc kiểm tra là thủ công (xem ở trên).
- **Bản dịch.** Các ngôn ngữ giao diện ngoài tiếng Anh và tiếng Việt được dịch với sự hỗ trợ của AI (xem [Tuyên bố miễn trừ](DISCLAIMER.md)). Một số nhãn có thể nghe không tự nhiên khi được đọc lên.
- **Emoji trong mô tả.** Mô tả được tạo dùng vài emoji làm dấu mục (ví dụ 👍 và 🔔), và trình đọc màn hình trên YouTube sẽ đọc tên của chúng.

## Báo một rào cản

Nếu có điều gì trong YTDescGen cản trở bạn, hãy cho chúng tôi biết. Bạn không cần biết nguyên nhân kỹ thuật.

- **Nên dùng:** mở một [issue về khả năng tiếp cận](https://github.com/poli0981/youtube-generator/issues/new?template=accessibility.yml). Biểu mẫu sẽ hỏi nền tảng, công nghệ hỗ trợ bạn dùng và chuyện gì đã xảy ra.
- **Không muốn đăng công khai?** Gửi email tới **contact@poli0981.dev**, tiêu đề bắt đầu bằng `[Accessibility]`.
- **Câu hỏi nhanh?** Hỏi trên [Discord](https://discord.gg/kDM9GMu5vm).

### Mức độ nghiêm trọng

| Mức | Ý nghĩa |
| --- | --- |
| **Critical** | Bạn không làm xong được việc chính: soạn, tạo, sao chép, lưu, hoặc qua được bước kiểm tra của website. |
| **High** | Bạn làm xong được, nhưng rất vất vả hoặc phải dùng cách vòng. |
| **Medium** | Vẫn dùng được, nhưng thất thường hoặc khó hiểu. |
| **Low** | Phiền nhỏ, không cản bạn. |

### Cách chúng tôi phản hồi

- Chúng tôi trả lời trong vòng **7 ngày** và tin vào những gì bạn báo.
- Rào cản **Critical** được sửa trong bản vá kế tiếp. Các mức khác được lên kế hoạch như mọi lỗi khác, mức nặng hơn làm trước.
- Nếu có cách tạm thời, chúng tôi sẽ cho bạn biết trong lúc chờ bản sửa.
- Khi bản sửa ra, chúng tôi sẽ nhờ bạn kiểm tra lại nếu bạn sẵn lòng.

Đây là dự án một người làm, nên các mốc thời gian là ước tính thật lòng, không phải cam kết. Nếu trễ, chúng tôi sẽ nói rõ trong issue.

## Dành cho người đóng góp

Thay đổi giao diện cần giữ đúng mọi điều ở trên. Trước khi mở pull request có đụng tới UI:

- **Bàn phím.** Mọi thứ dùng được bằng bàn phím: thứ tự focus hợp lý, đường viền focus hiện rõ, **Esc** đóng thứ bạn vừa mở, và không có chỗ nào giữ chặt focus.
- **Tên gọi.** Dùng các component dùng chung `Field` (nối nhãn, gợi ý và lỗi) và `IconButton` (không thể render nếu thiếu `label`). Chữ trong `aria-label` đi qua `t()` như mọi chuỗi khác, đủ tám locale.
- **Lỗi và trạng thái.** Phải được đọc lên: `Banner` với `alert`, một toast, hoặc một live region có sẵn.
- **Màu sắc.** Màu không bao giờ là tín hiệu duy nhất. Chỉ dùng token thiết kế, và chạy `npm run test:run`. Test độ tương phản sẽ báo lỗi nếu một token tụt dưới AA, và chữ trắng phải nằm trên các nền `*-solid`.
- **Chuyển động.** Hiệu ứng mới phải tôn trọng giảm chuyển động. Các component của Motion đã làm sẵn, và animation CSS được quy tắc chung trong `globals.css` xử lý.
- **Kích thước.** Mọi thứ bấm được tối thiểu 24 × 24 px và lớn lên trên màn hình cảm ứng.
- **Trình đọc màn hình.** Thử thay đổi một lần bằng trình đọc màn hình: Narrator (Win + Ctrl + Enter), VoiceOver (⌘ + F5), NVDA hoặc Orca.

Mẫu pull request có cùng danh sách kiểm tra này.

## Góp ý cho văn bản này

Mọi ý tưởng để cải thiện văn bản này hay cách xử lý khả năng tiếp cận đều được hoan nghênh trên [GitHub Discussions](https://github.com/poli0981/youtube-generator/discussions). Còn rào cản thì hãy báo qua [quy trình báo lỗi](#báo-một-rào-cản) để được theo dõi.
