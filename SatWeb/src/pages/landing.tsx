import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  FileText,
  TrendingUp,
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

const REASONS = [
  { key: "bulk", icon: Rocket },
  { key: "ai", icon: Bot },
  { key: "manage", icon: LayoutGrid },
  { key: "track", icon: BarChart3 },
];

type TopicSeed = (typeof TRENDING)[number];

const Landing = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useThemeStore();
  const { isAuthenticated, user } = useAuthStore();
  const [email, setEmail] = useState("");
  const [selected, setSelected] = useState<TopicSeed | null>(null);

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

      {/* ===== CHỦ ĐỀ THỊNH HÀNH ===== */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-2xl font-bold tracking-tight text-foreground">
          {t("landing.trendingTitle")}
        </h2>
        <Carousel opts={{ align: "start", dragFree: true }} className="w-full">
          <CarouselContent className="-ml-4">
            {TRENDING.map((item, i) => (
              <CarouselItem
                key={item.seed}
                className="basis-1/2 pl-4 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
              >
                <button
                  onClick={() => setSelected(item)}
                  className="group block w-full cursor-pointer text-left"
                >
                  <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-primary/15 shadow-sm transition-colors duration-200 group-hover:border-primary/40">
                    <img
                      src={`https://picsum.photos/seed/posta-${item.seed}/300/400`}
                      alt={t(`landing.trending.${item.seed}.title`)}
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <span className="absolute left-2 top-2 flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-md">
                      {i + 1}
                    </span>
                  </div>
                  <p className="mt-2 truncate text-sm font-semibold text-foreground group-hover:text-primary">
                    {t(`landing.trending.${item.seed}.title`)}
                  </p>
                </button>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex" />
          <CarouselNext className="hidden sm:flex" />
        </Carousel>
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

      {/* ===== BẢNG GIÁ ===== */}
      <PricingSection />

      {/* ===== FAQ ===== */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
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

      {/* Modal nội dung chủ đề */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg overflow-hidden p-0">
          {selected && (
            <>
              <div className="relative h-44 w-full overflow-hidden">
                <img
                  src={`https://picsum.photos/seed/posta-${selected.seed}/800/360`}
                  alt={t(`landing.trending.${selected.seed}.title`)}
                  className="size-full object-cover"
                />
                <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow-md">
                  <TrendingUp className="size-3.5" />
                  {t("landing.trendingBadge")}
                </span>
              </div>
              <div className="flex flex-col gap-4 p-6">
                <DialogTitle className="text-xl font-bold text-foreground">
                  {t(`landing.trending.${selected.seed}.title`)}
                </DialogTitle>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t(`landing.trending.${selected.seed}.desc`)}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-primary/15 bg-secondary/40 p-3">
                    <div className="flex items-center gap-1.5 text-primary">
                      <FileText className="size-4" />
                      <span className="text-xs font-semibold">{t("landing.statsPosts")}</span>
                    </div>
                    <p className="mt-1 text-xl font-extrabold text-foreground">{selected.posts}</p>
                  </div>
                  <div className="rounded-lg border border-primary/15 bg-secondary/40 p-3">
                    <div className="flex items-center gap-1.5 text-primary">
                      <Globe className="size-4" />
                      <span className="text-xs font-semibold">{t("landing.statsSites")}</span>
                    </div>
                    <p className="mt-1 text-xl font-extrabold text-foreground">{selected.sites}</p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate(startTo)}
                  className={cn("mt-1 w-full cursor-pointer gap-1.5", CTA_MOTION)}
                >
                  {t("landing.ctaTopic")}
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Landing;
