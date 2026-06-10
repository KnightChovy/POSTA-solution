import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Check, Globe, Bot, FileText, Sparkles } from "lucide-react";
import usePlanStore from "@/store/planStore";
import { useAuthStore } from "@/store/authStore";
import { formatVND, limitText } from "@/lib/planFormat";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const CTA_MOTION = "transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]";

// Khu vực bảng giá trên landing — đọc gói động từ API.
const PricingSection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { plans, getPlans } = usePlanStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    getPlans();
  }, [getPlans]);

  if (!plans.length) return null;

  // Gói "phổ biến" để làm nổi bật (ưu tiên professional, nếu không có thì gói giữa).
  const popularKey =
    plans.find((p) => p.key === "professional")?.key ||
    plans[Math.min(1, plans.length - 1)]?.key;

  const goBuy = () => navigate(isAuthenticated ? "/pricing" : "/register");

  return (
    <section className="border-t border-primary/10 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {t("pricing.sectionTitle")}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted-foreground">
          {t("pricing.sectionSubtitle")}
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((p) => {
            const isPopular = p.key === popularKey;
            return (
              <div
                key={p.key}
                className={cn(
                  "relative flex flex-col rounded-2xl border bg-card p-6 shadow-sm transition-colors duration-200",
                  isPopular ? "border-primary ring-2 ring-primary/30" : "border-primary/15 hover:border-primary/40"
                )}
              >
                {isPopular && (
                  <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow-md">
                    <Sparkles className="size-3.5" /> {t("pricing.popular")}
                  </span>
                )}

                <h3 className="text-lg font-bold text-foreground">{p.name}</h3>
                <p className="mt-1 min-h-[40px] text-sm text-muted-foreground">{p.description}</p>

                <div className="mt-4 flex items-end gap-1">
                  <span className="text-3xl font-extrabold text-foreground">{formatVND(p.price)}</span>
                  {p.price > 0 && <span className="mb-1 text-sm text-muted-foreground">{t("pricing.perMonth")}</span>}
                </div>

                <ul className="mt-6 flex flex-1 flex-col gap-3 text-sm">
                  <li className="flex items-center gap-2 text-foreground">
                    <Globe className="size-4 shrink-0 text-primary" />
                    {limitText(p.limits.websites, t("pricing.unitWebsite"))}
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Bot className="size-4 shrink-0 text-primary" />
                    {limitText(p.limits.ai, t("pricing.unitAi"), p.limits.aiPeriod)}
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <FileText className="size-4 shrink-0 text-primary" />
                    {limitText(p.limits.posts, t("pricing.unitPost"), p.limits.postsPeriod)}
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Check className="size-4 shrink-0 text-primary" />
                    {t("pricing.featureAiRewrite")}
                  </li>
                </ul>

                <Button
                  onClick={goBuy}
                  variant={isPopular ? "default" : "outline"}
                  className={cn("mt-6 w-full cursor-pointer", CTA_MOTION)}
                >
                  {p.price > 0 ? t("pricing.choosePlan") : t("pricing.useFree")}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
