import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Globe, Bot, FileText, Loader2, ArrowLeft, Receipt } from "lucide-react";
import usePlanStore, { PaymentInfo, Plan } from "@/store/planStore";
import useProfileStore from "@/store/profileStore";
import { formatVND, limitText, usagePercent, usageText } from "@/lib/planFormat";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Một thanh quota (đã dùng / giới hạn).
const QuotaBar = ({ label, icon: Icon, used, limit }: { label: string; icon: any; used: number; limit: number }) => (
  <div>
    <div className="mb-1 flex items-center justify-between text-sm">
      <span className="flex items-center gap-1.5 text-foreground">
        <Icon className="size-4 text-primary" /> {label}
      </span>
      <span className="font-semibold text-foreground">{usageText(used, limit)}</span>
    </div>
    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${usagePercent(used, limit)}%` }} />
    </div>
  </div>
);

// Định dạng ngày giờ kiểu Việt Nam.
const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// Nhãn trạng thái giao dịch.
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { text: string; cls: string }> = {
    paid: { text: "Đã thanh toán", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
    pending: { text: "Chờ thanh toán", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
    failed: { text: "Thất bại", cls: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
    cancelled: { text: "Đã hủy", cls: "bg-secondary text-muted-foreground" },
  };
  const s = map[status] || { text: status, cls: "bg-secondary text-foreground" };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${s.cls}`}>{s.text}</span>;
};

const PricingPage = () => {
  const navigate = useNavigate();
  const { plans, subscription, transactions, getPlans, getSubscription, getTransactions, purchasePlan } =
    usePlanStore();
  const { profile, getProfile } = useProfileStore();
  const isAdmin = !!profile?.isAdmin; // admin chỉ được xem gói, không được mua
  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [buying, setBuying] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    getPlans();
    getSubscription();
    getTransactions();
    if (!profile) getProfile();
  }, [getPlans, getSubscription, getTransactions, getProfile, profile]);

  const currentKey = subscription?.plan?.key;
  // Giá gói hiện tại để so sánh: chỉ cho NÂNG CẤP (gói đắt hơn), khoá các gói thấp hơn/bằng.
  const currentPrice = subscription?.plan?.price ?? 0;

  // Trong lúc mở dialog thanh toán, poll subscription để bắt webhook SePay kích hoạt.
  useEffect(() => {
    if (!payment) return;
    pollRef.current = window.setInterval(async () => {
      await getSubscription();
      const pending = usePlanStore.getState().subscription?.pending;
      if (!pending) {
        // Đã thanh toán xong (pending biến mất) → đóng dialog + làm mới lịch sử.
        setPayment(null);
        getTransactions();
      }
    }, 4000);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [payment, getSubscription, getTransactions]);

  const handleBuy = async (plan: Plan) => {
    // Admin chỉ được xem, không mua gói.
    if (isAdmin) return;
    // Chỉ cho nâng cấp lên gói cao hơn — chặn gói hiện tại & gói thấp hơn/bằng.
    if (plan.key === currentKey || plan.price <= currentPrice) return;
    setBuying(plan.key);
    const result = await purchasePlan(plan.key);
    setBuying(null);
    if (!result) return;
    if (result.free) {
      await getSubscription();
      return;
    }
    if (result.payment) setPayment(result.payment);
  };

  const usage = subscription?.usage;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate("/dashboard")}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary cursor-pointer"
      >
        <ArrowLeft className="size-4" /> Về bảng điều khiển
      </button>

      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Gói dịch vụ</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {isAdmin ? "Tài khoản quản trị chỉ xem thông tin gói, không thể mua." : "Quản lý gói hiện tại và nâng cấp khi cần."}
      </p>

      {/* Gói hiện tại + quota */}
      {subscription && (
        <div className="mt-6 rounded-2xl border border-primary/15 bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Gói hiện tại</p>
              <p className="text-xl font-bold text-foreground">{subscription.plan.name}</p>
            </div>
            {subscription.pending && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                Đang chờ thanh toán: {subscription.pending.planName}
              </span>
            )}
          </div>
          {usage && (
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <QuotaBar label="Website" icon={Globe} used={usage.websites.used} limit={usage.websites.limit} />
              <QuotaBar label="Lần dùng AI" icon={Bot} used={usage.ai.used} limit={usage.ai.limit} />
              <QuotaBar label="Bài đăng" icon={FileText} used={usage.posts.used} limit={usage.posts.limit} />
            </div>
          )}
        </div>
      )}

      {/* Danh sách gói */}
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...plans].sort((a, b) => a.price - b.price).map((p) => {
          const isCurrent = p.key === currentKey;
          const isUpgrade = !isCurrent && p.price > currentPrice; // gói cao hơn → cho nâng cấp
          const isLower = !isCurrent && p.price <= currentPrice; // gói thấp hơn/bằng → khoá
          return (
            <div
              key={p.key}
              className={cn(
                "flex flex-col rounded-2xl border bg-card p-6 shadow-sm transition-opacity",
                isCurrent ? "border-primary ring-2 ring-primary/30" : "border-primary/15",
                isLower && "opacity-60"
              )}
            >
              <h3 className="text-lg font-bold text-foreground">{p.name}</h3>
              <p className="mt-1 min-h-[40px] text-sm text-muted-foreground">{p.description}</p>
              <div className="mt-4 flex items-end gap-1">
                <span className="text-3xl font-extrabold text-foreground">{formatVND(p.price)}</span>
                {p.price > 0 && <span className="mb-1 text-sm text-muted-foreground">/tháng</span>}
              </div>
              <ul className="mt-6 flex flex-1 flex-col gap-3 text-sm">
                <li className="flex items-center gap-2 text-foreground">
                  <Globe className="size-4 shrink-0 text-primary" />
                  {limitText(p.limits.websites, "website")}
                </li>
                <li className="flex items-center gap-2 text-foreground">
                  <Bot className="size-4 shrink-0 text-primary" />
                  {limitText(p.limits.ai, "lần dùng AI", p.limits.aiPeriod)}
                </li>
                <li className="flex items-center gap-2 text-foreground">
                  <FileText className="size-4 shrink-0 text-primary" />
                  {limitText(p.limits.posts, "bài đăng", p.limits.postsPeriod)}
                </li>
              </ul>
              <Button
                onClick={() => handleBuy(p)}
                disabled={isAdmin || isCurrent || isLower || buying === p.key}
                variant={isUpgrade ? "default" : "outline"}
                className="mt-6 w-full cursor-pointer"
                title={isAdmin ? "Tài khoản quản trị không thể mua gói" : isLower ? "Không thể hạ xuống gói thấp hơn" : undefined}
              >
                {buying === p.key && <Loader2 className="size-4 animate-spin" />}
                {isAdmin ? "Chỉ xem" : isCurrent ? "Gói hiện tại" : isLower ? "Gói thấp hơn" : "Nâng cấp"}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Lịch sử thanh toán */}
      <div className="mt-10">
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <Receipt className="size-5 text-primary" /> Lịch sử thanh toán
        </h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-primary/15 bg-card shadow-sm">
          {transactions.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">Chưa có giao dịch nào.</p>
          ) : (
            <div className="max-h-[26rem] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-card">
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Thời gian</th>
                    <th className="px-4 py-3 font-medium">Gói</th>
                    <th className="px-4 py-3 text-right font-medium">Số tiền</th>
                    <th className="px-4 py-3 text-right font-medium">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-b border-border/60 last:border-0">
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(t.createdAt)}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{t.planName}</td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground">{formatVND(t.amount)}</td>
                      <td className="px-4 py-3 text-right">
                        <StatusBadge status={t.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Dialog thanh toán SePay */}
      <Dialog open={!!payment} onOpenChange={(o) => !o && setPayment(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thanh toán chuyển khoản</DialogTitle>
          </DialogHeader>
          {payment && (
            <div className="flex flex-col items-center gap-4">
              {payment.qrUrl ? (
                <img src={payment.qrUrl} alt="Mã QR chuyển khoản" className="size-56 rounded-lg border border-border" />
              ) : (
                <div className="flex size-56 items-center justify-center rounded-lg border border-dashed border-border text-center text-xs text-muted-foreground">
                  Chưa cấu hình tài khoản SePay (SEPAY_ACCOUNT_NUMBER / SEPAY_BANK_CODE).
                  Quét QR sẽ khả dụng sau khi cấu hình.
                </div>
              )}
              <div className="w-full space-y-1 rounded-lg bg-secondary/50 p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Số tiền</span>
                  <span className="font-bold text-foreground">{formatVND(payment.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nội dung CK</span>
                  <span className="font-mono font-semibold text-foreground">{payment.reference}</span>
                </div>
              </div>
              <p className="flex items-center gap-2 text-center text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                Đang chờ xác nhận thanh toán tự động...
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PricingPage;
