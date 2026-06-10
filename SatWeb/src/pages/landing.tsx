import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ChevronRight,
  Moon,
  Sun,
  Globe,
  Rocket,
  Bot,
  LayoutGrid,
  BarChart3,
  LayoutDashboard,
  CheckCircle2,
  Play,
  PlayCircle,
  Maximize2,
  Award,
  ExternalLink,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/themeStore";
import { useAuthStore } from "@/store/authStore";
import PricingSection from "@/components/landing/PricingSection";

const POSTA_LOGO = "/logo-3.png";
const POSTA_COVER = "/cover-posta.jpg";
const POSTA_ABOUT = "/posta.jpg";
const POSTA_TVC = "/tvc-posta.mp4";
const CTA_MOTION = "transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]";

// Phần cấu trúc (không dịch): ảnh + số liệu mẫu. Tiêu đề/mô tả lấy từ i18n theo `seed`.
const TRENDING = [
  { seed: "realestate", posts: "1.240", sites: "320" },
  { seed: "beauty", posts: "980", sites: "210" },
  { seed: "travel", posts: "870", sites: "190" },
  { seed: "finance", posts: "760", sites: "175" },
  { seed: "health", posts: "640", sites: "150" },
  { seed: "tech", posts: "590", sites: "140" },
  { seed: "food", posts: "520", sites: "130" },
  { seed: "education", posts: "480", sites: "120" },
];

// POST a STAR — mỗi bài có ảnh bìa + thư viện ảnh trong public/achievements/.
// Tiêu đề/mô tả/nội dung chi tiết lấy từ i18n theo `seed` (captions khớp theo thứ tự gallery).
const ACHIEVEMENTS = [
  {
    seed: "experienceDay",
    gallery: [
      "/achievements/experience-day-1.jpg",
      "/achievements/experience-day-2.jpg",
      "/achievements/experience-day-3.jpg",
      "/achievements/experience-day-4.jpg",
    ],
  },
  {
    seed: "top30",
    gallery: [
      "/achievements/top-30-1.png",
      "/achievements/top-30-2.png",
      "/achievements/top-30-3.png",
      "/achievements/top-30-4.png",
    ],
  },
  {
    seed: "seminar",
    gallery: ["/achievements/hoi-thao-phu-huynh.png"],
  },
];

type AchievementDetail = {
  heading: string;
  body: { heading?: string; text: string }[];
  captions: string[];
  link?: { label: string; url: string };
};

const REASONS = [
  { key: "bulk", icon: Rocket },
  { key: "ai", icon: Bot },
  { key: "manage", icon: LayoutGrid },
  { key: "track", icon: BarChart3 },
];

const Landing = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useThemeStore();
  const { isAuthenticated, user } = useAuthStore();
  const [email, setEmail] = useState("");
  const [videoOpen, setVideoOpen] = useState(false);
  const [openAchievement, setOpenAchievement] = useState<string | null>(null);

  const lang = i18n.language?.startsWith("en") ? "en" : "vi";
  const changeLang = (value: string) => i18n.changeLanguage(value);

  const faqs = t("landing.faqs", { returnObjects: true }) as { q: string; a: string }[];
  const footerLinks = t("landing.footerLinks", { returnObjects: true }) as string[][];

  const startTo = isAuthenticated ? "/dashboard" : "/register";
  const initials =
    (user as any)?.name
      ?.trim()
      .split(/\s+/)
      .slice(-2)
      .map((w: string) => w[0])
      .join("")
      .toUpperCase() || "U";

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAuthenticated) return navigate("/dashboard");
    navigate("/register", { state: { email } });
  };

  const EmailCapture = ({ onLight = false }: { onLight?: boolean }) => (
    <form onSubmit={handleStart} className="mx-auto flex w-full max-w-xl flex-col gap-3 sm:flex-row">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("landing.emailPlaceholder")}
        className={cn(
          "h-14 flex-1 rounded-md border px-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
          onLight
            ? "border-border bg-card text-foreground placeholder:text-muted-foreground"
            : "border-border bg-card text-foreground placeholder:text-muted-foreground"
        )}
      />
      <button
        type="submit"
        className={cn(
          "flex h-14 items-center justify-center gap-1 rounded-md bg-primary px-7 text-lg font-bold text-primary-foreground cursor-pointer shadow-sm",
          CTA_MOTION
        )}
      >
        {t("common.start")}
        <ChevronRight className="size-6" />
      </button>
    </form>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ===== HERO ===== */}
      <section className="relative flex min-h-[88vh] flex-col overflow-hidden border-b border-primary/10 bg-gradient-to-b from-accent/60 via-background to-background">
        <img
          src={POSTA_COVER}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover opacity-15 dark:opacity-25"
        />
        <div className="absolute inset-0 bg-background/40" />

        {/* Header */}
        <header className="relative z-10 flex items-center justify-between px-4 py-5 sm:px-8 lg:px-12">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 cursor-pointer focus-visible:outline-none"
            aria-label="POSTA"
          >
            <span className="flex size-9 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-primary/20">
              <img src={POSTA_LOGO} alt="Logo POSTA" className="size-7 object-contain" />
            </span>
            <span className="text-2xl font-extrabold tracking-tight text-foreground">POSTA</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="relative hidden items-center sm:flex">
              <Globe className="pointer-events-none absolute left-2.5 size-4 text-muted-foreground" />
              <select
                aria-label={t("common.language")}
                value={lang}
                onChange={(e) => changeLang(e.target.value)}
                className="h-9 cursor-pointer appearance-none rounded-md border border-border bg-card pl-8 pr-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="vi">Tiếng Việt</option>
                <option value="en">English</option>
              </select>
            </div>

            <button
              onClick={toggleTheme}
              aria-label={t("common.changeTheme")}
              className="flex size-9 items-center justify-center rounded-md border border-border bg-card text-foreground cursor-pointer hover:bg-secondary"
            >
              {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
            </button>

            {isAuthenticated ? (
              <>
                <button
                  onClick={() => navigate("/dashboard")}
                  className={cn(
                    "hidden items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground cursor-pointer sm:flex",
                    CTA_MOTION
                  )}
                >
                  <LayoutDashboard className="size-4" />
                  {t("common.dashboard")}
                </button>
                <button
                  onClick={() => navigate("/profile")}
                  className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground cursor-pointer"
                  aria-label={t("common.profile")}
                >
                  {initials}
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className={cn(
                  "rounded-md bg-primary px-5 py-2 text-sm font-bold text-primary-foreground cursor-pointer",
                  CTA_MOTION
                )}
              >
                {t("common.login")}
              </button>
            )}
          </div>
        </header>

        {/* Nội dung hero */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight text-foreground sm:text-5xl lg:text-6xl">
            {t("landing.heroTitle")} <span className="text-primary">{t("landing.heroAccent")}</span>
          </h1>
          <p className="mt-5 text-lg text-foreground/80 sm:text-xl">{t("landing.heroPrice")}</p>
          <p className="mb-5 mt-5 text-base text-muted-foreground">{t("landing.heroSub")}</p>
          <EmailCapture />
        </div>
      </section>

      {/* ===== GIỚI THIỆU DỰ ÁN ===== */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Rocket className="size-3.5" />
              {t("landing.aboutBadge")}
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              {t("landing.aboutTitle")}
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("landing.aboutLead")}
            </p>
            <ul className="mt-6 flex flex-col gap-3">
              {["aboutPoint1", "aboutPoint2", "aboutPoint3"].map((k) => (
                <li key={k} className="flex items-start gap-3 text-foreground">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
                  <span className="text-sm sm:text-base">{t(`landing.${k}`)}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate(startTo)}
              className={cn(
                "mt-8 inline-flex h-12 items-center gap-1.5 rounded-md bg-primary px-7 text-base font-bold text-primary-foreground cursor-pointer shadow-sm",
                CTA_MOTION
              )}
            >
              {t("landing.aboutCta")}
              <ChevronRight className="size-5" />
            </button>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-primary/15 shadow-md">
            <img
              src={POSTA_ABOUT}
              alt={t("landing.aboutTitle")}
              loading="lazy"
              className="aspect-[4/3] size-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ===== TVC GIỚI THIỆU (cinematic, video căn giữa) ===== */}
      <section className="relative overflow-hidden border-y border-primary/10 bg-gradient-to-b from-background via-accent/30 to-background">
        {/* Quầng sáng cam tạo chiều sâu */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-72 w-[44rem] max-w-full -translate-x-1/2 rounded-full bg-orange-500/20 blur-3xl"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-600 dark:text-orange-400">
            <Play className="size-3 fill-current" />
            {t("dashboard.tvcBadge")}
          </span>
          <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {t("dashboard.tvcTitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t("dashboard.tvcDescription")}
          </p>

          {/* Khung phát cinematic 16:9 — bấm để mở rộng */}
          <div className="group relative mx-auto mt-10 aspect-video w-full max-w-4xl overflow-hidden rounded-2xl border border-primary/15 bg-black shadow-2xl ring-1 ring-orange-500/25">
            <img
              src={POSTA_COVER}
              alt={t("dashboard.tvcTitle")}
              loading="lazy"
              className="size-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/40 transition-opacity duration-300 group-hover:from-black/65" />

            {/* Nút play lớn — mở modal phát video */}
            <button
              onClick={() => setVideoOpen(true)}
              aria-label={t("dashboard.playTvcAria")}
              className="absolute inset-0 flex cursor-pointer items-center justify-center focus-visible:outline-none"
            >
              <span className="flex size-20 items-center justify-center rounded-full bg-white/95 text-orange-600 shadow-2xl ring-4 ring-white/30 transition-transform duration-200 group-hover:scale-105 group-focus-visible:ring-orange-400 sm:size-24">
                <Play className="size-9 translate-x-1 fill-current sm:size-11" />
              </span>
            </button>

            {/* Thời lượng (góc trái dưới) */}
            <span className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-md bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
              <PlayCircle className="size-3.5" />
              {t("landing.tvcDuration")}
            </span>

            {/* Phóng to (góc phải dưới) */}
            <button
              onClick={() => setVideoOpen(true)}
              className="absolute bottom-3 right-3 inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-colors duration-200 hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Maximize2 className="size-3.5" />
              {t("landing.tvcExpand")}
            </button>
          </div>

          <Button
            onClick={() => setVideoOpen(true)}
            className="mt-8 h-12 gap-2 bg-gradient-to-r from-orange-500 to-red-600 px-7 text-base font-bold text-white shadow-lg transition-all duration-200 cursor-pointer hover:from-orange-600 hover:to-red-700 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2"
          >
            <PlayCircle className="size-5" />
            {t("dashboard.watchTvc")}
          </Button>
        </div>
      </section>

            {/* ===== THÀNH TỰU ===== */}
      <section
        id="achievements"
        className="scroll-mt-20 border-t border-primary/10 bg-background"
      >
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              <Award className="size-3.5" />
              {t("landing.achievementsBadge")}
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {t("landing.achievementsTitle")}{" "}
              <span className="text-primary">{t("landing.achievementsAccent")}</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("landing.achievementsSub")}
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ACHIEVEMENTS.map((item) => (
              <article
                key={item.seed}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-primary/15 bg-card shadow-sm transition-colors duration-200 hover:border-primary/40"
              >
                <div className="aspect-[4/3] overflow-hidden bg-accent/40">
                  <img
                    src={item.gallery[0]}
                    alt={t(`landing.achievements.${item.seed}.title`)}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-base font-bold text-foreground">
                    {t(`landing.achievements.${item.seed}.title`)}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {t(`landing.achievements.${item.seed}.desc`)}
                  </p>
                  <button
                    onClick={() => setOpenAchievement(item.seed)}
                    className="mt-4 inline-flex w-fit items-center gap-1 text-sm font-semibold text-primary cursor-pointer hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
                  >
                    {t("landing.achievementsDetailCta")}
                    <ChevronRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ===== LÝ DO CHỌN POSTA ===== */}
      <section className="border-t border-primary/10 bg-accent/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-2xl font-bold tracking-tight text-foreground">
            {t("landing.reasonsTitle")}
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {REASONS.map((r) => (
              <div
                key={r.key}
                className="flex h-full flex-col justify-between rounded-xl border border-primary/15 bg-card p-6 shadow-sm transition-colors duration-200 hover:border-primary/40"
              >
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    {t(`landing.reasons.${r.key}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t(`landing.reasons.${r.key}.desc`)}
                  </p>
                </div>
                <div className="mt-6 flex justify-end">
                  <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <r.icon className="size-6" />
                  </span>
                </div>
              </div>
            ))}

     
          </div>

        </div>
      </section>
 

      {/* Modal chi tiết bài POST a STAR */}
      <Dialog
        open={openAchievement !== null}
        onOpenChange={(open) => !open && setOpenAchievement(null)}
      >
        <DialogContent className="max-h-[90vh] w-[96vw] max-w-3xl overflow-y-auto p-0">
          {openAchievement &&
            (() => {
              const item = ACHIEVEMENTS.find((a) => a.seed === openAchievement)!;
              const detail = t(`landing.achievements.${item.seed}.detail`, {
                returnObjects: true,
              }) as AchievementDetail;
              return (
                <article>
                  <div className="aspect-[16/9] w-full overflow-hidden bg-accent/40">
                    <img
                      src={item.gallery[0]}
                      alt={detail.heading}
                      className="size-full object-cover"
                    />
                  </div>
                  <div className="p-6 sm:p-8">
                    <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                      <Award className="size-3.5" />
                      {t("landing.achievementsBadge")}
                    </span>
                    <DialogTitle className="mt-3 text-xl font-extrabold leading-snug text-foreground sm:text-2xl">
                      {detail.heading}
                    </DialogTitle>

                    <div className="mt-5 flex flex-col gap-4">
                      {detail.body.map((block, i) => (
                        <div key={i}>
                          {block.heading && (
                            <h4 className="mb-1 text-base font-bold text-foreground">
                              {block.heading}
                            </h4>
                          )}
                          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                            {block.text}
                          </p>
                        </div>
                      ))}
                    </div>

                    {item.gallery.length > 1 && (
                      <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        {item.gallery.map((src, i) => (
                          <figure key={src} className="flex flex-col gap-2">
                            <div className="overflow-hidden rounded-xl border border-primary/15 bg-accent/40">
                              <img
                                src={src}
                                alt={detail.captions[i] ?? detail.heading}
                                loading="lazy"
                                className="aspect-[4/3] size-full object-cover"
                              />
                            </div>
                            {detail.captions[i] && (
                              <figcaption className="text-xs italic leading-relaxed text-muted-foreground">
                                {detail.captions[i]}
                              </figcaption>
                            )}
                          </figure>
                        ))}
                      </div>
                    )}

                    {detail.link && (
                      <a
                        href={detail.link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "mt-6 inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-bold text-primary-foreground cursor-pointer shadow-sm",
                          CTA_MOTION
                        )}
                      >
                        <ExternalLink className="size-4" />
                        {detail.link.label}
                      </a>
                    )}
                  </div>
                </article>
              );
            })()}
        </DialogContent>
      </Dialog>

      {/* ===== BẢNG GIÁ ===== */}
      <PricingSection />

      {/* ===== FAQ ===== */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
        <h2 className="mb-8 text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {t("landing.faqTitle")}
        </h2>
        <Accordion type="single" collapsible className="flex flex-col gap-3">
          {faqs.map((f, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="rounded-xl border border-primary/15 bg-card px-5 shadow-sm"
            >
              <AccordionTrigger className="py-4 text-left text-base font-semibold text-foreground hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-12 text-center">
          <p className="mb-5 text-base text-muted-foreground">{t("landing.heroSub")}</p>
          <EmailCapture onLight />
        </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-primary/10 bg-card">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="mb-8 text-sm text-muted-foreground">{t("landing.footerContact")}</p>
          <div className="grid grid-cols-2 gap-6 text-sm md:grid-cols-4">
            {footerLinks.map((col, ci) => (
              <ul key={ci} className="flex flex-col gap-3">
                {col.map((label) => (
                  <li key={label}>
                    <a
                      href="#"
                      className="text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6">
            <div className="relative flex w-fit items-center">
              <Globe className="pointer-events-none absolute left-2.5 size-4 text-muted-foreground" />
              <select
                aria-label={t("common.language")}
                value={lang}
                onChange={(e) => changeLang(e.target.value)}
                className="h-9 cursor-pointer appearance-none rounded-md border border-border bg-background pl-8 pr-8 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="vi">Tiếng Việt</option>
                <option value="en">English</option>
              </select>
            </div>
            <p className="text-sm font-semibold text-foreground">{t("landing.footerBrand")}</p>
            <p className="text-xs text-muted-foreground">{t("landing.copyright")}</p>
          </div>
        </div>
      </footer>

      {/* Modal phát TVC — gần full màn hình, video chỉ tải khi mở (tiết kiệm băng thông) */}
      <Dialog open={videoOpen} onOpenChange={setVideoOpen}>
        <DialogContent className="w-[96vw] max-w-[min(96vw,1400px)] overflow-hidden border-0 bg-black p-0 shadow-2xl">
          <DialogTitle className="sr-only">{t("dashboard.tvcDialogTitle")}</DialogTitle>
          {videoOpen && (
            <video
              src={POSTA_TVC}
              controls
              autoPlay
              className="aspect-video max-h-[88vh] w-full bg-black"
            >
              {t("dashboard.videoNotSupported")}
            </video>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Landing;
