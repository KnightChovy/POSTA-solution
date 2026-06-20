import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Users,
  UserCheck,
  Wallet,
  TrendingUp,
  FileText,
  Globe,
  Loader2,
} from "lucide-react";
import useAdminStore from "@/store/adminStore";

const vnd = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + "đ";
const monthLabel = (m: string) => {
  const [, mm] = m.split("-");
  return `Th${Number(mm)}`;
};
const fullMonth = (m: string) => {
  const [y, mm] = m.split("-");
  return `Tháng ${Number(mm)}/${y}`;
};

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { stats, loading, getStats } = useAdminStore();

  useEffect(() => {
    getStats();
  }, [getStats]);

  const cards = stats
    ? [
        { label: t("admin.totalUsers"), value: stats.totalUsers, icon: Users, hint: t("admin.newUsersThisMonth", { count: stats.newUsersThisMonth }) },
        { label: t("admin.activeUsers"), value: stats.activeUsers, icon: UserCheck, hint: t("admin.verifiedCount", { count: stats.verifiedUsers }) },
        { label: t("admin.mrr"), value: vnd(stats.mrr), icon: Wallet, hint: t("admin.fromActivePlans") },
        { label: t("admin.totalRevenue"), value: vnd(stats.totalRevenue), icon: TrendingUp, hint: t("admin.allTransactions") },
      ]
    : [];

  const maxRev = stats ? Math.max(...stats.revenueByMonth.map((r) => r.total), 1) : 1;

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("admin.dashboardTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("admin.dashboardSubtitle")}</p>
        </div>

        {loading && !stats ? (
          <div className="flex items-center justify-center rounded-xl border border-primary/15 bg-card p-12">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : stats ? (
          <div className="flex flex-col gap-6">
            {/* Stat cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {cards.map((c) => (
                <div key={c.label} className="rounded-xl border border-primary/15 bg-card p-5 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{c.label}</p>
                      <p className="mt-1 text-2xl font-extrabold text-foreground">{c.value}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{c.hint}</p>
                    </div>
                    <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <c.icon className="size-5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Biểu đồ doanh thu */}
              <div className="rounded-xl border border-primary/15 bg-card p-6 shadow-sm lg:col-span-2">
                <h2 className="mb-5 text-base font-bold text-foreground">{t("admin.revenueLast6Months")}</h2>
                <div className="flex h-48 items-stretch justify-between gap-3">
                  {stats.revenueByMonth.map((r) => (
                    <div key={r.month} className="group relative flex flex-1 flex-col items-center gap-2">
                      <div className="flex w-full flex-1 items-end">
                        <div
                          className="w-full rounded-t-md bg-primary/80 transition-all duration-300 group-hover:bg-primary"
                          style={{ height: `${Math.max((r.total / maxRev) * 100, 2)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{monthLabel(r.month)}</span>
                      <div className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-2 whitespace-nowrap rounded-md bg-foreground px-2.5 py-1.5 text-center text-xs text-background opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                        <span className="block font-semibold">{fullMonth(r.month)}</span>
                        <span className="block">{vnd(r.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Người dùng theo gói */}
              <div className="rounded-xl border border-primary/15 bg-card p-6 shadow-sm">
                <h2 className="mb-5 text-base font-bold text-foreground">{t("admin.usersByPlan")}</h2>
                <ul className="flex flex-col gap-3">
                  {Object.entries(stats.usersByPlan).map(([plan, count]) => (
                    <li key={plan} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{stats.planLabels[plan] || plan}</span>
                      <span className="font-bold text-foreground">{count}</span>
                    </li>
                  ))}
                  <li className="mt-2 flex items-center justify-between border-t border-border pt-3 text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <FileText className="size-3.5" /> {t("admin.posts")}
                    </span>
                    <span className="font-bold text-foreground">{stats.totalPosts}</span>
                  </li>
                  <li className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Globe className="size-3.5" /> {t("admin.activeSatellites")}
                    </span>
                    <span className="font-bold text-foreground">{stats.activeSatellites}</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Giao dịch gần đây */}
            <div className="rounded-xl border border-primary/15 bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-bold text-foreground">{t("admin.recentTransactions")}</h2>
              {stats.recentTransactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("admin.noTransactions")}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                        <th className="pb-2 font-semibold">{t("admin.colUser")}</th>
                        <th className="pb-2 font-semibold">{t("admin.colPlan")}</th>
                        <th className="pb-2 text-right font-semibold">{t("admin.colAmount")}</th>
                        <th className="pb-2 text-right font-semibold">{t("admin.colTime")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentTransactions.map((t, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="py-2.5">
                            <p className="font-medium text-foreground">{t.user?.name || "—"}</p>
                            <p className="text-xs text-muted-foreground">{t.user?.email}</p>
                          </td>
                          <td className="py-2.5 text-foreground">{stats.planLabels[t.plan] || t.plan}</td>
                          <td className="py-2.5 text-right font-semibold text-primary">{vnd(t.amount)}</td>
                          <td className="py-2.5 text-right text-muted-foreground">
                            {new Date(t.createdAt).toLocaleDateString("vi-VN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">{t("admin.loadFailed")}</p>
        )}
      </main>
    </div>
  );
}
