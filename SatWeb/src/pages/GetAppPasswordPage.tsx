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
  ShieldAlert,
  Wrench,
  Headset,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useTranslation, Trans } from "react-i18next";

/**
 * Hình minh họa theo ngôn ngữ: ảnh lưu dạng /manual/<base>-<lang>.png
 * (vd tong-quan-vi.png / tong-quan-en.png). Chưa có ảnh (base = null) thì bỏ qua.
 */
const Figure: React.FC<{
  base?: string | null;
  lang: string;
  caption: string;
}> = ({ base, lang, caption }) =>
  base ? (
    <figure className="mt-4">
      <img
        src={`/manual/${base}-${lang}.png`}
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

/** Danh sách có đánh số (các bước), cho phép in đậm/nghiêng inline. */
const Steps: React.FC<{ items: string[] }> = ({ items }) => (
  <ol className="list-inside list-decimal space-y-2 text-sm leading-relaxed text-muted-foreground">
    {items.map((s, i) => (
      <li key={i} dangerouslySetInnerHTML={{ __html: s }} />
    ))}
  </ol>
);

/** Danh sách gạch đầu dòng, cho phép in đậm/nghiêng inline. */
const Bullets: React.FC<{ items: string[] }> = ({ items }) => (
  <ul className="list-inside list-disc space-y-2 text-sm leading-relaxed text-muted-foreground">
    {items.map((s, i) => (
      <li key={i} dangerouslySetInnerHTML={{ __html: s }} />
    ))}
  </ul>
);

/** Icon tròn nền hổ phách đứng trước tiêu đề mục. */
const SectionIcon: React.FC<{
  Icon: React.ComponentType<{ className?: string }>;
}> = ({ Icon }) => (
  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
    <Icon className="h-4 w-4" />
  </span>
);

interface StepSectionDef {
  id: string;
  Icon: React.ComponentType<{ className?: string }>;
  titleKey: string;
  introKey: string;
  stepsKey: string;
  shotKey: string;
  noteKey: string;
  // Tên file ảnh (không gồm hậu tố ngôn ngữ); null = chưa có ảnh, ẩn hẳn.
  imgBase: string | null;
}

const STEP_SECTIONS: StepSectionDef[] = [
  {
    id: "app-password",
    Icon: KeyRound,
    titleKey: "manual.s1Title",
    introKey: "manual.s1Intro",
    stepsKey: "manual.s1Steps",
    shotKey: "manual.s1Shot",
    noteKey: "manual.s1Note",
    // Màn hình WordPress riêng của bạn — bỏ ảnh vào buoc-1-wordpress-vi/-en.png
    imgBase: null,
  },
  {
    id: "add-site",
    Icon: Globe,
    titleKey: "manual.s2Title",
    introKey: "manual.s2Intro",
    stepsKey: "manual.s2Steps",
    shotKey: "manual.s2Shot",
    noteKey: "manual.s2Note",
    imgBase: "buoc-2-them-site",
  },
  {
    id: "write-post",
    Icon: PenLine,
    titleKey: "manual.s3Title",
    introKey: "manual.s3Intro",
    stepsKey: "manual.s3Steps",
    shotKey: "manual.s3Shot",
    noteKey: "manual.s3Note",
    imgBase: "buoc-3-tao-bai",
  },
  {
    id: "use-ai",
    Icon: Sparkles,
    titleKey: "manual.s4Title",
    introKey: "manual.s4Intro",
    stepsKey: "manual.s4Steps",
    shotKey: "manual.s4Shot",
    noteKey: "manual.s4Note",
    imgBase: "buoc-4-seo",
  },
  {
    id: "publish",
    Icon: Send,
    titleKey: "manual.s5Title",
    introKey: "manual.s5Intro",
    stepsKey: "manual.s5Steps",
    shotKey: "manual.s5Shot",
    noteKey: "manual.s5Note",
    // Trang Tiến độ chỉ có dữ liệu sau khi đăng bài thật — bỏ ảnh vào buoc-5-tien-do-vi/-en.png
    imgBase: null,
  },
];

interface InfoSectionDef {
  id: string;
  Icon: React.ComponentType<{ className?: string }>;
  titleKey: string;
  introKey: string;
  pointsKey: string;
  noteKey: string;
}

const INFO_SECTIONS: InfoSectionDef[] = [
  {
    id: "safety",
    Icon: ShieldAlert,
    titleKey: "manual.safetyTitle",
    introKey: "manual.safetyIntro",
    pointsKey: "manual.safetyPoints",
    noteKey: "manual.safetyNote",
  },
  {
    id: "troubleshooting",
    Icon: Wrench,
    titleKey: "manual.troubleshootingTitle",
    introKey: "manual.troubleshootingIntro",
    pointsKey: "manual.troubleshootingPoints",
    noteKey: "manual.troubleshootingNote",
  },
  {
    id: "warranty",
    Icon: Headset,
    titleKey: "manual.warrantyTitle",
    introKey: "manual.warrantyIntro",
    pointsKey: "manual.warrantyPoints",
    noteKey: "manual.warrantyNote",
  },
  {
    id: "maintenance",
    Icon: RefreshCw,
    titleKey: "manual.maintenanceTitle",
    introKey: "manual.maintenanceIntro",
    pointsKey: "manual.maintenancePoints",
    noteKey: "manual.maintenanceNote",
  },
  {
    id: "disposal",
    Icon: Trash2,
    titleKey: "manual.disposalTitle",
    introKey: "manual.disposalIntro",
    pointsKey: "manual.disposalPoints",
    noteKey: "manual.disposalNote",
  },
];

const TOC = [
  { id: "overview", key: "manual.toc.overview" },
  { id: "app-password", key: "manual.toc.appPassword" },
  { id: "add-site", key: "manual.toc.addSite" },
  { id: "write-post", key: "manual.toc.writePost" },
  { id: "use-ai", key: "manual.toc.useAi" },
  { id: "publish", key: "manual.toc.publish" },
  { id: "safety", key: "manual.toc.safety" },
  { id: "troubleshooting", key: "manual.toc.troubleshooting" },
  { id: "warranty", key: "manual.toc.warranty" },
  { id: "maintenance", key: "manual.toc.maintenance" },
  { id: "disposal", key: "manual.toc.disposal" },
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
  const { t, i18n } = useTranslation();
  // Ảnh tiếng Việt khi UI là tiếng Việt, tiếng Anh khi UI là tiếng Anh.
  const lang = i18n.language?.toLowerCase().startsWith("en") ? "en" : "vi";

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
          <Figure base="tong-quan" lang={lang} caption={t("manual.overviewShot")} />
        </section>

        {/* Các bước 1 → 5 */}
        {STEP_SECTIONS.map(
          ({
            id,
            Icon,
            titleKey,
            introKey,
            stepsKey,
            shotKey,
            noteKey,
            imgBase,
          }) => {
            const steps = t(stepsKey, { returnObjects: true }) as string[];
            const note = t(noteKey);
            return (
              <section key={id} id={id} className={cardClass}>
                <h2 className="mb-3 flex items-center gap-2 text-lg font-medium text-foreground">
                  <SectionIcon Icon={Icon} />
                  {t(titleKey)}
                </h2>
                <p
                  className="mb-3 text-sm leading-relaxed text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: t(introKey) }}
                />
                <Steps items={steps} />
                <Figure base={imgBase} lang={lang} caption={t(shotKey)} />
                {note ? <NoteCallout text={note} /> : null}
                <BackToTop label={backLabel} />
              </section>
            );
          },
        )}

        {/* Các mục thông tin: an toàn, xử lý sự cố, bảo hành, bảo trì, tiêu hủy */}
        {INFO_SECTIONS.map(
          ({ id, Icon, titleKey, introKey, pointsKey, noteKey }) => {
            const points = t(pointsKey, { returnObjects: true }) as string[];
            const note = t(noteKey);
            return (
              <section key={id} id={id} className={cardClass}>
                <h2 className="mb-3 flex items-center gap-2 text-lg font-medium text-foreground">
                  <SectionIcon Icon={Icon} />
                  {t(titleKey)}
                </h2>
                <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
                  {t(introKey)}
                </p>
                <Bullets items={points} />
                {note ? <NoteCallout text={note} /> : null}
                <BackToTop label={backLabel} />
              </section>
            );
          },
        )}

        {/* Mẹo & lưu ý */}
        <section id="tips" className={cardClass}>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-medium text-foreground">
            <SectionIcon Icon={Lightbulb} />
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
