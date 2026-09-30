import { useState, type MouseEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ChevronRight, FileText } from "lucide-react";
import clsx from "clsx";
import { LEGAL_CONTENT } from "virtual:legal-docs";
import { LEGAL_DOCS, isLegalDocId, legalDocPath, type LegalDoc } from "@config/legal";
import { useDocumentTitle } from "@hooks/use-document-title";
import { Logo } from "@components/brand/Logo";
import { SegmentedControl } from "@components/ui/SegmentedControl";

/** `legal.docs.thirdParty` → `legal.summaries.thirdParty`. */
function summaryKey(doc: LegalDoc): string {
  return doc.labelKey.replace("legal.docs.", "legal.summaries.");
}

/**
 * The in-app Legal Center (v1.0.0). Lives outside the consent guard so the
 * first-run consent screen can open each document in place — which also keeps
 * the desktop and Android builds from ever navigating their webview to a web
 * page. Content comes from `virtual:legal-docs`, rendered at build time from
 * the Markdown files at the repo root, so it matches ytgenerator.stream/legal
 * word for word and works offline.
 */
export function LegalPage() {
  const { t } = useTranslation("ui");
  const navigate = useNavigate();
  const { docId } = useParams();
  const [lang, setLang] = useState<"en" | "vi">("en");

  const doc = docId && isLegalDocId(docId) ? LEGAL_DOCS.find((d) => d.id === docId) : undefined;
  const content = doc ? LEGAL_CONTENT[doc.id] : undefined;
  const html = content
    ? ((lang === "vi" ? content.html.vi : undefined) ?? content.html.en ?? "")
    : "";
  // Plain-text sources (LICENSE, NOTICE) render as a <pre> with no heading.
  const needsHeading = !/^\s*<h1[\s>]/.test(html);
  useDocumentTitle(doc ? t(doc.labelKey) : t("legal.title"));

  const goBack = (): void => {
    // A deep link opened in a fresh tab has nothing to go back to.
    if (window.history.length > 1) navigate(-1);
    else navigate(doc ? "/legal" : "/");
  };

  // Links inside the rendered Markdown are plain <a> tags. Route in-site ones
  // through the router (a real navigation would reload the web app and, in
  // Tauri, leave the app entirely) and turn #anchors into scrolls so the hash
  // router never mistakes them for routes.
  const onArticleClick = (event: MouseEvent<HTMLElement>): void => {
    const anchor = (event.target as HTMLElement).closest("a");
    const href = anchor?.getAttribute("href");
    if (!href) return;
    if (href.startsWith("#")) {
      event.preventDefault();
      document.getElementById(decodeURIComponent(href.slice(1)))?.scrollIntoView();
      return;
    }
    if (href === "/legal" || href.startsWith("/legal/")) {
      event.preventDefault();
      navigate(href.split(/[?#]/)[0] ?? "/legal");
    }
  };

  const docNav = (
    <nav aria-label={t("legal.allDocuments")} className="flex flex-col gap-1">
      {LEGAL_DOCS.map((d) => (
        <Link
          key={d.id}
          to={legalDocPath(d.id)}
          aria-current={d.id === doc?.id ? "page" : undefined}
          className={clsx(
            "rounded-lg px-3 py-2 text-sm transition-colors",
            d.id === doc?.id
              ? "bg-surface-2 text-text-primary font-medium"
              : "text-text-secondary hover:bg-surface-1 hover:text-text-primary",
          )}
        >
          {t(d.labelKey)}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="bg-surface-0 min-h-screen">
      <header className="border-border bg-surface-0/90 sticky top-0 z-10 flex items-center gap-3 border-b px-4 py-3 backdrop-blur">
        <button
          type="button"
          onClick={goBack}
          className="text-text-secondary hover:bg-surface-2 hover:text-text-primary flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t("legal.back")}
        </button>
        <Link
          to="/legal"
          className="text-text-primary flex items-center gap-2 text-sm font-semibold"
        >
          <Logo className="size-6" />
          {t("legal.title")}
        </Link>
      </header>

      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 md:grid-cols-[200px_minmax(0,1fr)]">
        <aside className="hidden md:block">
          <div className="sticky top-20">{docNav}</div>
        </aside>

        <main className="min-w-0">
          {!docId && (
            <section>
              <h1 className="text-text-primary text-2xl font-semibold">{t("legal.title")}</h1>
              <p className="text-text-secondary mt-2 text-sm">{t("legal.intro")}</p>
              <p className="text-text-muted mt-1 text-xs">{t("legal.englishOnly")}</p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {LEGAL_DOCS.map((d) => (
                  <li key={d.id}>
                    <Link
                      to={legalDocPath(d.id)}
                      className="border-border bg-surface-1 hover:border-accent group flex items-start gap-3 rounded-xl border p-4 transition-colors"
                    >
                      <FileText className="text-accent mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="text-text-primary block text-sm font-medium">
                          {t(d.labelKey)}
                        </span>
                        <span className="text-text-muted mt-1 block text-xs leading-relaxed">
                          {t(summaryKey(d))}
                        </span>
                      </span>
                      <ChevronRight
                        className="text-text-muted group-hover:text-accent mt-0.5 h-4 w-4 shrink-0"
                        aria-hidden
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {docId && !content && (
            <section className="py-12 text-center">
              <p className="text-text-secondary">{t("legal.notFound")}</p>
              <Link to="/legal" className="text-accent mt-3 inline-block text-sm">
                {t("legal.allDocuments")}
              </Link>
            </section>
          )}

          {doc && content && (
            <>
              <div className="mb-4 md:hidden">{docNav}</div>
              {needsHeading && (
                <h1 className="text-text-primary mb-2 text-2xl font-semibold">{t(doc.labelKey)}</h1>
              )}
              <div className="mb-4 flex flex-wrap items-center gap-3">
                {content.html.vi && (
                  <SegmentedControl
                    ariaLabel={t("legal.language")}
                    layoutId="legal-language"
                    size="sm"
                    className="ml-auto"
                    value={lang}
                    onChange={setLang}
                    options={[
                      { value: "en", label: "English" },
                      { value: "vi", label: "Tiếng Việt" },
                    ]}
                  />
                )}
              </div>
              <article
                lang={lang}
                onClick={onArticleClick}
                className="legal-prose border-border bg-surface-1 shadow-card rounded-card border px-5 py-6 sm:px-8"
                // Build-time HTML rendered from the repo's own Markdown files
                // (build-plugins/legal-docs.ts) — never user input.
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
