import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Wallet, TrendingUp, CheckCircle2, Clock, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import useAdminStore from "@/store/adminStore";

const vnd = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + "đ";
const monthLabel = (m: string) => `Th${Number(m.split("-")[1])}`;

const STATUS_CLS: Record<string, string> = {
  paid: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  failed: "bg-destructive/10 text-destructive",
};

export default function AdminRevenue() {
  const { t } = useTranslation();
  const { stats, transactions, loading, getStats, getTransactions } = useAdminStore();

  const STATUS_META: Record<string, { label: string; cls: string }> = {
    paid: { label: t("admin.txPaid"), cls: STATUS_CLS.paid },
    pending: { label: t("admin.txPending"), cls: STATUS_CLS.pending },
    failed: { label: t("admin.txFailed"), cls: STATUS_CLS.failed },
  };
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    getStats();
    getTransactions();
  }, [getStats, getTransactions]);

  const applyFilter = (nextStatus = status) => {
    setStatus(nextStatus);
    getTransactions(nextStatus, search);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    getTransactions(status, search);
  };

  const paidCount = transactions.filter((t) => t.status === "paid").length;
  const pendingCount = transactions.filter((t) => t.status === "pending").length;
  const maxRev = stats ? Math.max(...stats.revenueByMonth.map((r) => r.total), 1) : 1;

  const cards = stats
    ? [
        { label: t("admin.totalRevenue"), value: vnd(stats.totalRevenue), icon: TrendingUp },
        { label: t("admin.mrr"), value: vnd(stats.mrr), icon: Wallet },
        { label: t("admin.collectedTransactions"), value: paidCount, icon: CheckCircle2 },
        { label: t("admin.pendingTransactions"), value: pendingCount, icon: Clock },
      ]
    : [];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("admin.revenueTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("admin.revenueSubtitle")}</p>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-primary/15 bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{c.label}</p>
                <p className="mt-1 text-2xl font-extrabold text-foreground">{c.value}</p>
              </div>
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <c.icon className="size-5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Biểu đồ doanh thu */}
      {stats && (
        <div className="mb-6 rounded-xl border border-primary/15 bg-card p-6 shadow-sm">
          <h2 className="mb-5 text-base font-bold text-foreground">{t("admin.revenueLast6Months")}</h2>
          <div className="flex h-44 items-end justify-between gap-3">
            {stats.revenueByMonth.map((r) => (
              <div key={r.month} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-md bg-primary/80 transition-all duration-500"
                    style={{ height: `${Math.max((r.total / maxRev) * 100, 2)}%` }}
                    title={vnd(r.total)}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{monthLabel(r.month)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bộ lọc */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex gap-2">
          {[
            { v: "", l: t("admin.filterAll") },
            { v: "paid", l: t("admin.filterPaid") },
            { v: "pending", l: t("admin.filterPending") },
            { v: "failed", l: t("admin.filterFailed") },
          ].map((s) => (
            <button
              key={s.v}
              onClick={() => applyFilter(s.v)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium cursor-pointer transition-colors ${
                status === s.v ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.l}
            </button>
          ))}
        </div>
        <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2 sm:ml-auto sm:max-w-xs">
          <div className="relative flex flex-1 items-center">
            <Search className="absolute left-3 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("admin.searchByUserPlaceholder")}
              className="h-10 pl-10 focus-visible:ring-primary"
            />
          </div>
        </form>
      </div>

      {/* Bảng giao dịch */}
      <div className="overflow-x-auto rounded-xl border border-primary/15 bg-card shadow-sm">
        {loading && transactions.length === 0 ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : transactions.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">{t("admin.noTransactions")}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-left text-xs uppercase text-muted-foreground">
                <th className="px-4 py-3 font-semibold">{t("admin.colUser")}</th>
                <th className="px-4 py-3 font-semibold">{t("admin.colPlan")}</th>
                <th className="px-4 py-3 font-semibold">{t("admin.colReference")}</th>
                <th className="px-4 py-3 text-right font-semibold">{t("admin.colAmount")}</th>
                <th className="px-4 py-3 font-semibold">{t("admin.colStatus")}</th>
                <th className="px-4 py-3 text-right font-semibold">{t("admin.colTime")}</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => {
                const meta = STATUS_META[t.status] || STATUS_META.pending;
                return (
                  <tr key={t.id} className="border-b border-border/50 hover:bg-secondary/20">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{t.user?.name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{t.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-foreground">{t.planName}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t.reference || "—"}</td>
                    <td className="px-4 py-3 text-right font-semibold text-primary">{vnd(t.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${meta.cls}`}>{meta.label}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {new Date(t.createdAt).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
