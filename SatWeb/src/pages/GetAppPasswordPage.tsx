import React from "react";
import {
  KeyRound,
  Globe,
  PenLine,
  Sparkles,
  Send,
  Info,
  Lightbulb,
  ListChecks,
  ArrowUp,
} from "lucide-react";
import { useTranslation, Trans } from "react-i18next";

/** Hình minh họa: có ảnh thì hiển thị ảnh + chú thích, chưa có ảnh thì bỏ qua. */
const Figure: React.FC<{ src?: string | null; caption: string }> = ({
  src,
  caption,
}) =>
  src ? (
    <figure className="mt-4">
      <img
        src={src}
        alt={caption}
        loading="lazy"
        className="w-full rounded-lg border border-border shadow-sm"
      />
      <figcaption className="mt-2 text-xs italic text-muted-foreground">
        {caption}
      </figcaption>
    </figure>
  ) : null;

/** Khung lưu ý màu hổ phách. */
const NoteCallout: React.FC<{ text: string }> = ({ text }) => (
  <div className="mt-4 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-relaxed text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
    <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
    <span dangerouslySetInnerHTML={{ __html: text }} />
  </div>
);

/** Danh sách các bước có đánh số, cho phép in đậm/nghiêng inline. */
const Steps: React.FC<{ items: string[] }> = ({ items }) => (
  <ol className="list-inside list-decimal space-y-2 text-sm leading-relaxed text-muted-foreground">
    {items.map((s, i) => (
      <li key={i} dangerouslySetInnerHTML={{ __html: s }} />
    ))}
  </ol>
);

interface SectionDef {
  id: string;
  Icon: React.ComponentType<{ className?: string }>;
  titleKey: string;
  introKey: string;
  stepsKey: string;
  shotKey: string;
  noteKey: string;
  img: string | null;
}

const SECTIONS: SectionDef[] = [
  {
    id: "app-password",
    Icon: KeyRound,
    titleKey: "manual.s1Title",
    introKey: "manual.s1Intro",
    stepsKey: "manual.s1Steps",
    shotKey: "manual.s1Shot",
    noteKey: "manual.s1Note",
    // Màn hình WordPress riêng của bạn — bỏ ảnh vào /public/manual/buoc-1-wordpress.png
    img: null,
  },
  {
    id: "add-site",
    Icon: Globe,
    titleKey: "manual.s2Title",
    introKey: "manual.s2Intro",
    stepsKey: "manual.s2Steps",
    shotKey: "manual.s2Shot",
    noteKey: "manual.s2Note",
    img: "/manual/buoc-2-them-site.png",
  },
  {
    id: "write-post",
    Icon: PenLine,
    titleKey: "manual.s3Title",
    introKey: "manual.s3Intro",
    stepsKey: "manual.s3Steps",
    shotKey: "manual.s3Shot",
    noteKey: "manual.s3Note",
    img: "/manual/buoc-3-tao-bai.png",
  },
  {
    id: "use-ai",
    Icon: Sparkles,
    titleKey: "manual.s4Title",
    introKey: "manual.s4Intro",
    stepsKey: "manual.s4Steps",
    shotKey: "manual.s4Shot",
    noteKey: "manual.s4Note",
    img: "/manual/buoc-4-seo.png",
  },
  {
    id: "publish",
    Icon: Send,
    titleKey: "manual.s5Title",
    introKey: "manual.s5Intro",
    stepsKey: "manual.s5Steps",
    shotKey: "manual.s5Shot",
    noteKey: "manual.s5Note",
    // Trang Tiến độ chỉ có dữ liệu sau khi đăng bài thật — bỏ ảnh vào /public/manual/buoc-5-tien-do.png
    img: null,
  },
];

const TOC = [
  { id: "overview", key: "manual.toc.overview" },
  { id: "app-password", key: "manual.toc.appPassword" },
  { id: "add-site", key: "manual.toc.addSite" },
  { id: "write-post", key: "manual.toc.writePost" },
  { id: "use-ai", key: "manual.toc.useAi" },
  { id: "publish", key: "manual.toc.publish" },
  { id: "tips", key: "manual.toc.tips" },
];

const cardClass =
  "scroll-mt-6 bg-card border border-border rounded-xl p-5 mb-5 shadow-sm hover:shadow-md transition-shadow duration-300";

const BackToTop: React.FC<{ label: string }> = ({ label }) => (
  <a
    href="#top"
    className="mt-4 inline-flex items-center gap-1 rounded-md text-xs font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
  >
    <ArrowUp className="h-3.5 w-3.5" aria-hidden />
    {label}
  </a>
);

const GetAppPasswordPage: React.FC = () => {
  const { t } = useTranslation();

  const overviewFlow = t("manual.overviewFlow", {
    returnObjects: true,
  }) as string[];
  const tips = t("manual.tips", { returnObjects: true }) as string[];
  const backLabel = t("manual.backToTop");

  return (
    <div id="top" className="min-h-screen bg-gradient-subtle p-4 md:p-8">
      <div className="mx-auto max-w-3xl">
        {/* Tiêu đề trang */}
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground md:text-3xl">
            <Trans
              i18nKey="manual.pageTitle"
              components={{
                accent: (
                  <span className="bg-gradient-to-r from-amber-500 to-yellow-600 bg-clip-text text-transparent" />
                ),
              }}
            />
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("manual.pageSubtitle")}
          </p>
        </header>

        {/* Mục lục */}
        <nav className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <ListChecks className="h-4 w-4" aria-hidden />
            {t("manual.tocTitle")}
          </h2>
          <ol className="list-inside list-decimal space-y-1.5 text-sm">
            {TOC.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="rounded text-foreground transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                >
                  {t(item.key)}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Tổng quan */}
        <section id="overview" className={cardClass}>
          <h2 className="mb-3 text-lg font-medium text-foreground">
            {t("manual.overviewTitle")}
          </h2>
          <p
            className="text-sm leading-relaxed text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: t("manual.overviewBody") }}
          />
          <ol className="mt-3 list-inside list-decimal space-y-2 text-sm leading-relaxed text-muted-foreground">
            {overviewFlow.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
          <Figure src="/manual/tong-quan.png" caption={t("manual.overviewShot")} />
        </section>

        {/* Các bước 1 → 5 */}
        {SECTIONS.map(
          ({ id, Icon, titleKey, introKey, stepsKey, shotKey, noteKey, img }) => {
            const steps = t(stepsKey, { returnObjects: true }) as string[];
            const note = t(noteKey);
            return (
              <section key={id} id={id} className={cardClass}>
                <h2 className="mb-3 flex items-center gap-2 text-lg font-medium text-foreground">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                    <Icon className="h-4 w-4" />
                  </span>
                  {t(titleKey)}
                </h2>
                <p
                  className="mb-3 text-sm leading-relaxed text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: t(introKey) }}
                />
                <Steps items={steps} />
                <Figure src={img} caption={t(shotKey)} />
                {note ? <NoteCallout text={note} /> : null}
                <BackToTop label={backLabel} />
              </section>
            );
          },
        )}

        {/* Mẹo & lưu ý */}
        <section id="tips" className={cardClass}>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-medium text-foreground">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Lightbulb className="h-4 w-4" />
            </span>
            {t("manual.tipsTitle")}
          </h2>
          <ul className="list-inside list-disc space-y-2 text-sm leading-relaxed text-muted-foreground">
            {tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
          <BackToTop label={backLabel} />
        </section>
      </div>
    </div>
  );
};

export default GetAppPasswordPage;
