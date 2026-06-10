import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  BarChart3,
  Bot,
  CheckCircle2,
  ChevronRight,
  FileText,
  Globe,
  LayoutGrid,
  Moon,
  Rocket,
  Sun,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/themeStore";
import { useAuthStore } from "@/store/authStore";

const POSTA_LOGO = "/logo-3.png";
const CTA_MOTION = "transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]";

// Lý do POSTA hỗ trợ chủ đề (tái dùng nội dung song ngữ landing.reasons.*).
const REASONS = [
  { key: "bulk", icon: Rocket },
  { key: "ai", icon: Bot },
  { key: "manage", icon: LayoutGrid },
  { key: "track", icon: BarChart3 },
];

// Dữ liệu chủ đề (ảnh + số liệu mẫu, cố định). Tiêu đề/mô tả lấy từ i18n theo `seed`.
const TOPICS = [
  { seed: "realestate", posts: "1.240", sites: "320" },
  { seed: "beauty", posts: "980", sites: "210" },
  { seed: "travel", posts: "870", sites: "190" },
  { seed: "finance", posts: "760", sites: "175" },
  { seed: "health", posts: "640", sites: "150" },
  { seed: "tech", posts: "590", sites: "140" },
  { seed: "food", posts: "520", sites: "130" },
  { seed: "education", posts: "480", sites: "120" },
];

const TopicDetail = () => {
  const { seed } = useParams<{ seed: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useThemeStore();
  const { isAuthenticated } = useAuthStore();

  const lang = i18n.language?.startsWith("en") ? "en" : "vi";
  const changeLang = (value: string) => i18n.changeLanguage(value);
  const startTo = isAuthenticated ? "/dashboard" : "/register";

  const topic = TOPICS.find((item) => item.seed === seed);

  const Header = () => (
    <header className="flex items-center justify-between px-4 py-5 sm:px-8 lg:px-12">
      <Link to="/" className="flex items-center gap-2 cursor-pointer focus-visible:outline-none" aria-label="POSTA">
        <span className="flex size-9 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-primary/20">
          <img src={POSTA_LOGO} alt={t("dashboard.logoAlt")} className="size-7 object-contain" />
        </span>
        <span className="text-2xl font-extrabold tracking-tight text-foreground">POSTA</span>
      </Link>
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
      </div>
    </header>
  );

  // Không tìm thấy chủ đề → vẫn hiển thị trang công khai, có lối về trang chủ.
  if (!topic) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
          <h1 className="text-2xl font-bold text-foreground">{t("landing.topicNotFound")}</h1>
          <Link
            to="/"
            className={cn(
              "mt-6 inline-flex h-11 items-center gap-1.5 rounded-md bg-primary px-6 text-sm font-bold text-primary-foreground cursor-pointer shadow-sm",
              CTA_MOTION
            )}
          >
            <ArrowLeft className="size-4" />
            {t("landing.topicBackHome")}
          </Link>
        </div>
      </div>
    );
  }

  const title = t(`landing.trending.${topic.seed}.title`);
  const long = t(`landing.trending.${topic.seed}.long`, { returnObjects: true }) as string[];
  const ideas = t(`landing.trending.${topic.seed}.ideas`, { returnObjects: true }) as string[];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary cursor-pointer"
        >
          <ArrowLeft className="size-4" />
          {t("landing.topicBackHome")}
        </Link>

        {/* Ảnh bìa chủ đề */}
        <div className="relative mt-5 aspect-[16/7] w-full overflow-hidden rounded-2xl border border-primary/15 shadow-md">
          <img
            src={`https://picsum.photos/seed/posta-${topic.seed}/1200/525`}
            alt={title}
            className="size-full object-cover"
          />
          <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow-md">
            <TrendingUp className="size-3.5" />
            {t("landing.trendingBadge")}
          </span>
        </div>

        {/* Nội dung chi tiết */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_18rem]">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">{title}</h1>
            <p className="mt-3 text-sm text-muted-foreground">{t("landing.topicLead")}</p>

            {/* Mô tả dài nhiều đoạn */}
            <div className="mt-6 space-y-4">
              {long.map((para, i) => (
                <p key={i} className="text-base leading-relaxed text-foreground/90 sm:text-lg">
                  {para}
                </p>
              ))}
            </div>

            {/* Gợi ý nội dung */}
            <h2 className="mt-10 text-xl font-bold tracking-tight text-foreground">
              {t("landing.topicIdeasTitle")}
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {ideas.map((idea, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 rounded-lg border border-primary/15 bg-card p-3 text-sm text-foreground shadow-sm"
                >
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{idea}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={() => navigate(startTo, { state: { topic: topic.seed } })}
                className={cn("h-12 gap-1.5 px-7 text-base font-bold cursor-pointer", CTA_MOTION)}
              >
                {t("landing.ctaTopic")}
                <ChevronRight className="size-5" />
              </Button>
            </div>
          </div>

          {/* Số liệu */}
          <aside className="grid grid-cols-2 gap-3 self-start lg:sticky lg:top-6 lg:grid-cols-1">
            <div className="rounded-xl border border-primary/15 bg-secondary/40 p-4">
              <div className="flex items-center gap-1.5 text-primary">
                <FileText className="size-4" />
                <span className="text-xs font-semibold">{t("landing.statsPosts")}</span>
              </div>
              <p className="mt-1 text-2xl font-extrabold text-foreground">{topic.posts}</p>
            </div>
            <div className="rounded-xl border border-primary/15 bg-secondary/40 p-4">
              <div className="flex items-center gap-1.5 text-primary">
                <Globe className="size-4" />
                <span className="text-xs font-semibold">{t("landing.statsSites")}</span>
              </div>
              <p className="mt-1 text-2xl font-extrabold text-foreground">{topic.sites}</p>
            </div>
          </aside>
        </div>

        {/* POSTA giúp gì cho chủ đề này */}
        <section className="mt-16">
          <h2 className="mb-6 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {t("landing.topicHelpTitle")}
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {REASONS.map((r) => (
              <div
                key={r.key}
                className="flex h-full flex-col justify-between rounded-xl border border-primary/15 bg-card p-6 shadow-sm transition-colors duration-200 hover:border-primary/40"
              >
                <div>
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <r.icon className="size-5" />
                  </span>
                  <h3 className="mt-4 text-base font-bold text-foreground">
                    {t(`landing.reasons.${r.key}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t(`landing.reasons.${r.key}.desc`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Chủ đề khác */}
        <section className="mt-16">
          <h2 className="mb-5 text-xl font-bold tracking-tight text-foreground">{t("landing.topicOther")}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {TOPICS.filter((item) => item.seed !== topic.seed).map((item) => (
              <Link
                key={item.seed}
                to={`/topics/${item.seed}`}
                className="group block cursor-pointer focus-visible:outline-none"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-primary/15 shadow-sm transition-colors duration-200 group-hover:border-primary/40 group-focus-visible:ring-2 group-focus-visible:ring-primary">
                  <img
                    src={`https://picsum.photos/seed/posta-${item.seed}/300/225`}
                    alt={t(`landing.trending.${item.seed}.title`)}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <p className="mt-2 truncate text-sm font-semibold text-foreground group-hover:text-primary">
                  {t(`landing.trending.${item.seed}.title`)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default TopicDetail;
