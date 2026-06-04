import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Globe, Bot, FileText, Loader2, ArrowLeft } from "lucide-react";
import usePlanStore, { PaymentInfo, Plan } from "@/store/planStore";
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

const PricingPage = () => {
  const navigate = useNavigate();
  const { plans, subscription, getPlans, getSubscription, purchasePlan, devConfirm } = usePlanStore();
  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [buying, setBuying] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    getPlans();
    getSubscription();
  }, [getPlans, getSubscription]);

  const currentKey = subscription?.plan?.key;

  // Trong lúc mở dialog thanh toán, poll subscription để bắt webhook SePay kích hoạt.
  useEffect(() => {
    if (!payment) return;
    pollRef.current = window.setInterval(async () => {
      await getSubscription();
      const pending = usePlanStore.getState().subscription?.pending;
      if (!pending) {
        // Đã thanh toán xong (pending biến mất) → đóng dialog.
        setPayment(null);
      }
    }, 4000);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [payment, getSubscription]);

  const handleBuy = async (plan: Plan) => {
    if (plan.key === currentKey) return;
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

  const handleDevConfirm = async () => {
    if (!payment) return;
    setConfirming(true);
    const ok = await devConfirm(payment.reference);
    setConfirming(false);
    if (ok) setPayment(null);
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
      <p className="mt-1 text-sm text-muted-foreground">Quản lý gói hiện tại và nâng cấp khi cần.</p>

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
        {plans.map((p) => {
          const isCurrent = p.key === currentKey;
          return (
            <div
              key={p.key}
              className={cn(
                "flex flex-col rounded-2xl border bg-card p-6 shadow-sm",
                isCurrent ? "border-primary ring-2 ring-primary/30" : "border-primary/15"
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
                disabled={isCurrent || buying === p.key}
                variant={isCurrent ? "outline" : "default"}
                className="mt-6 w-full cursor-pointer"
              >
                {buying === p.key && <Loader2 className="size-4 animate-spin" />}
                {isCurrent ? "Gói hiện tại" : p.price > 0 ? "Mua gói" : "Dùng miễn phí"}
              </Button>
            </div>
          );
        })}
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

              {/* Chỉ hiện ở môi trường dev để test không cần chuyển khoản thật */}
              {import.meta.env.DEV && (
                <Button onClick={handleDevConfirm} disabled={confirming} variant="outline" className="w-full cursor-pointer">
                  {confirming && <Loader2 className="size-4 animate-spin" />}
                  <Check className="size-4" /> Tôi đã chuyển khoản (giả lập)
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PricingPage;
