import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  UserCheck,
  Wallet,
  TrendingUp,
  FileText,
  Globe,
  ArrowRight,
  Loader2,
} from "lucide-react";
import useAdminStore from "@/store/adminStore";

const vnd = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + "đ";
const monthLabel = (m: string) => {
  const [, mm] = m.split("-");
  return `Th${Number(mm)}`;
};

export default function AdminDashboard() {
  const { stats, loading, getStats } = useAdminStore();

  useEffect(() => {
    getStats();
  }, [getStats]);

  const cards = stats
    ? [
        { label: "Tổng người dùng", value: stats.totalUsers, icon: Users, hint: `+${stats.newUsersThisMonth} tháng này` },
        { label: "Đang hoạt động", value: stats.activeUsers, icon: UserCheck, hint: `${stats.verifiedUsers} đã xác thực` },
        { label: "Doanh thu/tháng (MRR)", value: vnd(stats.mrr), icon: Wallet, hint: "Từ gói đang hoạt động" },
        { label: "Tổng doanh thu", value: vnd(stats.totalRevenue), icon: TrendingUp, hint: "Tất cả giao dịch" },
      ]
    : [];

  const maxRev = stats ? Math.max(...stats.revenueByMonth.map((r) => r.total), 1) : 1;

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Bảng điều khiển quản trị</h1>
            <p className="mt-1 text-sm text-muted-foreground">Tổng quan người dùng & doanh thu POSTA.</p>
          </div>
          <Link
            to="/admin/users"
            className="inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform duration-200 hover:scale-[1.02]"
          >
            Quản lý người dùng
            <ArrowRight className="size-4" />
          </Link>
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
                <h2 className="mb-5 text-base font-bold text-foreground">Doanh thu 6 tháng gần nhất</h2>
                <div className="flex h-48 items-end justify-between gap-3">
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

              {/* Người dùng theo gói */}
              <div className="rounded-xl border border-primary/15 bg-card p-6 shadow-sm">
                <h2 className="mb-5 text-base font-bold text-foreground">Người dùng theo gói</h2>
                <ul className="flex flex-col gap-3">
                  {Object.entries(stats.usersByPlan).map(([plan, count]) => (
                    <li key={plan} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{stats.planLabels[plan] || plan}</span>
                      <span className="font-bold text-foreground">{count}</span>
                    </li>
                  ))}
                  <li className="mt-2 flex items-center justify-between border-t border-border pt-3 text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <FileText className="size-3.5" /> Bài viết
                    </span>
                    <span className="font-bold text-foreground">{stats.totalPosts}</span>
                  </li>
                  <li className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Globe className="size-3.5" /> Vệ tinh hoạt động
                    </span>
                    <span className="font-bold text-foreground">{stats.activeSatellites}</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Giao dịch gần đây */}
            <div className="rounded-xl border border-primary/15 bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-bold text-foreground">Giao dịch gần đây</h2>
              {stats.recentTransactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có giao dịch nào.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                        <th className="pb-2 font-semibold">Người dùng</th>
                        <th className="pb-2 font-semibold">Gói</th>
                        <th className="pb-2 text-right font-semibold">Số tiền</th>
                        <th className="pb-2 text-right font-semibold">Thời gian</th>
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
          <p className="text-muted-foreground">Không tải được dữ liệu.</p>
        )}
      </main>
    </div>
  );
}
