/**
 * Copy for the Turnstile gate page, in the app's eight languages.
 *
 * `{terms}` / `{privacy}` become links; `{hours}` is the gate lifetime. The
 * page is the first thing every web visitor sees, so it follows the visitor's
 * `Accept-Language` rather than defaulting to English.
 */

export type GateLang = "en" | "vi" | "ja" | "es" | "ko" | "zh" | "pt-BR" | "id";

export interface GateStrings {
  title: string;
  metaDescription: string;
  heading: string;
  lead: string;
  agree: string;
  returning: string;
  termsLink: string;
  privacyLink: string;
  enter: string;
  checking: string;
  entering: string;
  failed: string;
  widgetError: string;
  noscript: string;
  dataNote: string;
  protectedBy: string;
  security: string;
}

export const GATE_STRINGS: Readonly<Record<GateLang, GateStrings>> = {
  en: {
    title: "Quick check — YTDescGen",
    metaDescription:
      "Generate YouTube titles, descriptions and tags for gameplay no-commentary videos — in 8 languages, in your browser or on desktop.",
    heading: "Just a quick check",
    lead: "This keeps automated traffic out of YTDescGen. It usually finishes on its own in a second or two.",
    agree: "I agree to the {terms} and have read the {privacy}.",
    returning: "By continuing you agree to the {terms} and the {privacy}.",
    termsLink: "Terms of Use",
    privacyLink: "Privacy Policy",
    enter: "Enter YTDescGen",
    checking: "Checking your browser…",
    entering: "Verified — opening YTDescGen…",
    failed: "The check didn't go through. Please try again.",
    widgetError:
      "The check couldn't load. Allow challenges.cloudflare.com in your content blocker, or try another browser.",
    noscript: "YTDescGen needs JavaScript enabled to complete this check.",
    dataNote:
      "Cloudflare Turnstile processes technical signals (such as your IP address and browser details) to run this check. YTDescGen only keeps a signed cookie that remembers you passed, for {hours} hours.",
    protectedBy: "Protected by Cloudflare Turnstile",
    security: "Security",
  },
  vi: {
    title: "Kiểm tra nhanh — YTDescGen",
    metaDescription:
      "Tạo tiêu đề, mô tả và tag YouTube cho video gameplay không bình luận — 8 ngôn ngữ, ngay trên trình duyệt hoặc máy tính.",
    heading: "Kiểm tra nhanh một chút",
    lead: "Bước này giúp chặn lưu lượng tự động vào YTDescGen. Thường chỉ mất một hai giây và tự hoàn tất.",
    agree: "Tôi đồng ý với {terms} và đã đọc {privacy}.",
    returning: "Tiếp tục đồng nghĩa với việc bạn đồng ý với {terms} và {privacy}.",
    termsLink: "Điều khoản sử dụng",
    privacyLink: "Chính sách quyền riêng tư",
    enter: "Vào YTDescGen",
    checking: "Đang kiểm tra trình duyệt…",
    entering: "Đã xác minh — đang mở YTDescGen…",
    failed: "Kiểm tra chưa thành công. Vui lòng thử lại.",
    widgetError:
      "Không tải được bước kiểm tra. Hãy cho phép challenges.cloudflare.com trong trình chặn nội dung hoặc dùng trình duyệt khác.",
    noscript: "YTDescGen cần bật JavaScript để hoàn tất bước kiểm tra này.",
    dataNote:
      "Cloudflare Turnstile xử lý một số tín hiệu kỹ thuật (như địa chỉ IP và thông tin trình duyệt) để chạy bước kiểm tra. YTDescGen chỉ lưu một cookie đã ký để ghi nhớ bạn đã qua kiểm tra trong {hours} giờ.",
    protectedBy: "Được bảo vệ bởi Cloudflare Turnstile",
    security: "Bảo mật",
  },
  ja: {
    title: "確認 — YTDescGen",
    metaDescription:
      "実況なしのゲームプレイ動画向けに、YouTube のタイトル・説明文・タグを8言語で生成。ブラウザでもデスクトップでも。",
    heading: "かんたんな確認です",
    lead: "自動アクセスから YTDescGen を守るための確認です。通常は1〜2秒で自動的に完了します。",
    agree: "{terms}に同意し、{privacy}を読みました。",
    returning: "続行すると、{terms}と{privacy}に同意したものとみなされます。",
    termsLink: "利用規約",
    privacyLink: "プライバシーポリシー",
    enter: "YTDescGen に入る",
    checking: "ブラウザを確認しています…",
    entering: "確認できました — YTDescGen を開いています…",
    failed: "確認に失敗しました。もう一度お試しください。",
    widgetError:
      "確認を読み込めませんでした。コンテンツブロッカーで challenges.cloudflare.com を許可するか、別のブラウザをお試しください。",
    noscript: "この確認を完了するには JavaScript を有効にしてください。",
    dataNote:
      "Cloudflare Turnstile は確認のために技術的な情報（IP アドレスやブラウザ情報など）を処理します。YTDescGen が保存するのは、確認済みであることを{hours}時間記憶する署名付き Cookie だけです。",
    protectedBy: "Cloudflare Turnstile による保護",
    security: "セキュリティ",
  },
  es: {
    title: "Comprobación rápida — YTDescGen",
    metaDescription:
      "Genera títulos, descripciones y etiquetas de YouTube para vídeos de gameplay sin comentarios — en 8 idiomas, en el navegador o en escritorio.",
    heading: "Una comprobación rápida",
    lead: "Esto mantiene el tráfico automatizado fuera de YTDescGen. Normalmente termina solo en uno o dos segundos.",
    agree: "Acepto los {terms} y he leído la {privacy}.",
    returning: "Al continuar, aceptas los {terms} y la {privacy}.",
    termsLink: "Términos de uso",
    privacyLink: "Política de privacidad",
    enter: "Entrar en YTDescGen",
    checking: "Comprobando tu navegador…",
    entering: "Verificado — abriendo YTDescGen…",
    failed: "La comprobación no se completó. Inténtalo de nuevo.",
    widgetError:
      "No se pudo cargar la comprobación. Permite challenges.cloudflare.com en tu bloqueador de contenido o prueba con otro navegador.",
    noscript: "YTDescGen necesita JavaScript activado para completar esta comprobación.",
    dataNote:
      "Cloudflare Turnstile procesa señales técnicas (como tu dirección IP y datos del navegador) para realizar esta comprobación. YTDescGen solo guarda una cookie firmada que recuerda que la superaste durante {hours} horas.",
    protectedBy: "Protegido por Cloudflare Turnstile",
    security: "Seguridad",
  },
  ko: {
    title: "빠른 확인 — YTDescGen",
    metaDescription:
      "무해설 게임플레이 영상용 YouTube 제목·설명·태그를 8개 언어로 생성하세요 — 브라우저 또는 데스크톱에서.",
    heading: "잠깐 확인할게요",
    lead: "자동화된 트래픽으로부터 YTDescGen을 보호하기 위한 확인입니다. 보통 1~2초 안에 자동으로 끝납니다.",
    agree: "{terms}에 동의하며 {privacy}을 읽었습니다.",
    returning: "계속하면 {terms} 및 {privacy}에 동의하는 것으로 간주됩니다.",
    termsLink: "이용약관",
    privacyLink: "개인정보 처리방침",
    enter: "YTDescGen 들어가기",
    checking: "브라우저를 확인하는 중…",
    entering: "확인 완료 — YTDescGen을 여는 중…",
    failed: "확인에 실패했습니다. 다시 시도해 주세요.",
    widgetError:
      "확인 화면을 불러오지 못했습니다. 콘텐츠 차단기에서 challenges.cloudflare.com을 허용하거나 다른 브라우저를 사용해 보세요.",
    noscript: "이 확인을 완료하려면 JavaScript를 켜 주세요.",
    dataNote:
      "Cloudflare Turnstile은 확인을 위해 기술적 신호(IP 주소, 브라우저 정보 등)를 처리합니다. YTDescGen은 확인을 통과했음을 {hours}시간 동안 기억하는 서명된 쿠키만 저장합니다.",
    protectedBy: "Cloudflare Turnstile로 보호됨",
    security: "보안",
  },
  zh: {
    title: "快速验证 — YTDescGen",
    metaDescription:
      "为无解说游戏视频生成 YouTube 标题、描述和标签——支持 8 种语言，可在浏览器或桌面端使用。",
    heading: "快速验证一下",
    lead: "这一步用于阻挡自动化流量访问 YTDescGen，通常一两秒内会自动完成。",
    agree: "我同意{terms}，并已阅读{privacy}。",
    returning: "继续即表示你同意{terms}和{privacy}。",
    termsLink: "使用条款",
    privacyLink: "隐私政策",
    enter: "进入 YTDescGen",
    checking: "正在检查你的浏览器…",
    entering: "验证通过 — 正在打开 YTDescGen…",
    failed: "验证未通过，请重试。",
    widgetError: "无法加载验证。请在内容拦截器中允许 challenges.cloudflare.com，或换一个浏览器。",
    noscript: "YTDescGen 需要启用 JavaScript 才能完成验证。",
    dataNote:
      "Cloudflare Turnstile 会处理一些技术信号（例如 IP 地址和浏览器信息）来完成验证。YTDescGen 只会保存一个签名 Cookie，用于在 {hours} 小时内记住你已通过验证。",
    protectedBy: "由 Cloudflare Turnstile 保护",
    security: "安全",
  },
  "pt-BR": {
    title: "Verificação rápida — YTDescGen",
    metaDescription:
      "Gere títulos, descrições e tags do YouTube para vídeos de gameplay sem comentários — em 8 idiomas, no navegador ou no desktop.",
    heading: "Só uma verificação rápida",
    lead: "Isso mantém o tráfego automatizado longe do YTDescGen. Normalmente termina sozinho em um ou dois segundos.",
    agree: "Concordo com os {terms} e li a {privacy}.",
    returning: "Ao continuar, você concorda com os {terms} e a {privacy}.",
    termsLink: "Termos de Uso",
    privacyLink: "Política de Privacidade",
    enter: "Entrar no YTDescGen",
    checking: "Verificando seu navegador…",
    entering: "Verificado — abrindo o YTDescGen…",
    failed: "A verificação não foi concluída. Tente novamente.",
    widgetError:
      "Não foi possível carregar a verificação. Permita challenges.cloudflare.com no seu bloqueador de conteúdo ou use outro navegador.",
    noscript: "O YTDescGen precisa do JavaScript ativado para concluir esta verificação.",
    dataNote:
      "O Cloudflare Turnstile processa sinais técnicos (como seu endereço IP e dados do navegador) para fazer esta verificação. O YTDescGen guarda apenas um cookie assinado que lembra que você passou, por {hours} horas.",
    protectedBy: "Protegido pelo Cloudflare Turnstile",
    security: "Segurança",
  },
  id: {
    title: "Pemeriksaan singkat — YTDescGen",
    metaDescription:
      "Buat judul, deskripsi, dan tag YouTube untuk video gameplay tanpa komentar — dalam 8 bahasa, di browser atau desktop.",
    heading: "Pemeriksaan singkat",
    lead: "Ini menjaga YTDescGen dari lalu lintas otomatis. Biasanya selesai sendiri dalam satu atau dua detik.",
    agree: "Saya menyetujui {terms} dan telah membaca {privacy}.",
    returning: "Dengan melanjutkan, Anda menyetujui {terms} dan {privacy}.",
    termsLink: "Ketentuan Penggunaan",
    privacyLink: "Kebijakan Privasi",
    enter: "Masuk ke YTDescGen",
    checking: "Memeriksa browser Anda…",
    entering: "Terverifikasi — membuka YTDescGen…",
    failed: "Pemeriksaan tidak berhasil. Silakan coba lagi.",
    widgetError:
      "Pemeriksaan tidak dapat dimuat. Izinkan challenges.cloudflare.com di pemblokir konten Anda atau coba browser lain.",
    noscript: "YTDescGen memerlukan JavaScript yang aktif untuk menyelesaikan pemeriksaan ini.",
    dataNote:
      "Cloudflare Turnstile memproses sinyal teknis (seperti alamat IP dan detail browser) untuk menjalankan pemeriksaan ini. YTDescGen hanya menyimpan cookie bertanda tangan yang mengingat bahwa Anda lolos, selama {hours} jam.",
    protectedBy: "Dilindungi oleh Cloudflare Turnstile",
    security: "Keamanan",
  },
};

const PREFIX_TO_LANG: ReadonlyArray<[string, GateLang]> = [
  ["vi", "vi"],
  ["ja", "ja"],
  ["es", "es"],
  ["ko", "ko"],
  ["zh", "zh"],
  ["pt", "pt-BR"],
  ["id", "id"],
  ["in", "id"], // legacy ISO 639 code for Indonesian
  ["en", "en"],
];

/** Pick the best supported language from an `Accept-Language` header. */
export function pickGateLang(acceptLanguage: string | null): GateLang {
  if (!acceptLanguage) return "en";
  const ranked = acceptLanguage
    .split(",")
    .map((part, index) => {
      const [tag = "", ...params] = part.trim().split(";");
      const q = params
        .map((p) => p.trim())
        .find((p) => p.startsWith("q="))
        ?.slice(2);
      const weight = q === undefined ? 1 : Number(q);
      return { tag: tag.toLowerCase(), weight: Number.isFinite(weight) ? weight : 0, index };
    })
    .filter((entry) => entry.tag && entry.weight > 0)
    .sort((a, b) => b.weight - a.weight || a.index - b.index);
  for (const { tag } of ranked) {
    const primary = tag.split("-")[0] ?? "";
    const match = PREFIX_TO_LANG.find(([prefix]) => primary === prefix);
    if (match) return match[1];
  }
  return "en";
}
