import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShieldCheck,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Globe,
  MapPin,
  FileText,
  Bot,
  Loader2,
  RefreshCw,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import useAdminStore from "@/store/adminStore";
import { formatVND, usageText, usagePercent } from "@/lib/planFormat";

const vndTime = (s: string) =>
  new Date(s).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

const STATUS_META: Record<string, { label: string; cls: string }> = {
  paid: { label: "Đã thanh toán", cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  pending: { label: "Chờ thanh toán", cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  failed: { label: "Đã huỷ", cls: "bg-destructive/10 text-destructive" },
};

const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value?: string }) =>
  value ? (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  ) : null;

export default function AdminUserDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { userDetail, loading, adminPlans, getUserDetail, getAdminPlans, changeUserPlan, confirmTransaction, cancelTransaction } =
    useAdminStore();

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{ plan: string; method: "paid" | "gift"; note: string }>({
    plan: "",
    method: "paid",
    note: "",
  });

  useEffect(() => {
    getUserDetail(id);
    getAdminPlans();
  }, [id, getUserDetail, getAdminPlans]);

  if (loading && !userDetail) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!userDetail) return <div className="p-8 text-muted-foreground">Không tìm thấy người dùng.</div>;

  const { user, plan, usage, postCount, websiteCount, purchasedPlans, transactions } = userDetail;
  const isAdmin = user.isAdmin;

  const sellablePlans = adminPlans.filter((p) => !p.isArchived);

  const openChange = () => {
    setForm({ plan: plan.key, method: "paid", note: "" });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.plan || !form.note.trim()) return;
    setSaving(true);
    const ok = await changeUserPlan(id, form);
    setSaving(false);
    if (ok) setOpen(false);
  };

  const handleConfirm = async (txId: string) => {
    if (await confirmTransaction(txId)) getUserDetail(id);
  };
  const handleCancel = async (txId: string) => {
    if (await cancelTransaction(txId)) getUserDetail(id);
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <button
        onClick={() => navigate("/admin/users")}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary cursor-pointer"
      >
        <ArrowLeft className="size-4" /> Danh sách người dùng
      </button>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-primary/15 bg-card p-6 shadow-sm">
        <span className="flex size-16 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xl font-bold text-primary ring-1 ring-primary/20">
          {user.avatar ? <img src={user.avatar} alt="" className="size-full object-cover" /> : user.name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-xl font-bold text-foreground">{user.name}</h1>
            {isAdmin && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                <ShieldCheck className="size-3" /> Quản trị viên
              </span>
            )}
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                user.isActive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-destructive/10 text-destructive"
              }`}
            >
              {user.isActive ? "Hoạt động" : "Đã khoá"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Thông tin + thống kê */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          <section className="rounded-xl border border-primary/15 bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-base font-bold text-foreground">Thông tin</h2>
            <div className="flex flex-col gap-3">
              <InfoRow icon={Mail} label="Email" value={user.email} />
              <InfoRow icon={Phone} label="SĐT" value={user.phone} />
              <InfoRow icon={Briefcase} label="Chức danh" value={user.jobTitle} />
              <InfoRow icon={Building2} label="Công ty" value={user.company} />
              <InfoRow icon={Globe} label="Website" value={user.website} />
              <InfoRow icon={MapPin} label="Địa chỉ" value={user.address} />
              {!user.phone && !user.jobTitle && !user.company && !user.website && !user.address && (
                <p className="text-sm text-muted-foreground">Chưa cập nhật thông tin bổ sung.</p>
              )}
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-primary/15 bg-card p-4 text-center shadow-sm">
              <FileText className="mx-auto mb-1 size-5 text-primary" />
              <p className="text-2xl font-extrabold text-foreground">{postCount}</p>
              <p className="text-xs text-muted-foreground">Bài viết</p>
            </div>
            <div className="rounded-xl border border-primary/15 bg-card p-4 text-center shadow-sm">
              <Globe className="mx-auto mb-1 size-5 text-primary" />
              <p className="text-2xl font-extrabold text-foreground">{websiteCount}</p>
              <p className="text-xs text-muted-foreground">Website</p>
            </div>
          </section>
        </div>

        {/* Gói + giao dịch */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Gói hiện tại */}
          <section className="rounded-xl border border-primary/15 bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">Gói dịch vụ</h2>
              {!isAdmin && (
                <Button onClick={openChange} size="sm" className="cursor-pointer gap-1.5">
                  <RefreshCw className="size-3.5" /> Đổi gói
                </Button>
              )}
            </div>

            {isAdmin ? (
              <p className="text-sm text-muted-foreground">Tài khoản quản trị không sử dụng gói dịch vụ.</p>
            ) : (
              <>
                <p className="mb-4 text-lg font-bold text-primary">{plan.name}</p>
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { label: "Website", icon: Globe, ...usage.websites },
                    { label: "Lần dùng AI", icon: Bot, ...usage.ai },
                    { label: "Bài đăng", icon: FileText, ...usage.posts },
                  ].map((r) => (
                    <div key={r.label}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 text-foreground">
                          <r.icon className="size-3.5 text-primary" /> {r.label}
                        </span>
                        <span className="font-semibold text-foreground">{usageText(r.used, r.limit)}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${usagePercent(r.used, r.limit)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                {purchasedPlans.length > 0 && (
                  <div className="mt-4 border-t border-border pt-3">
                    <p className="text-xs text-muted-foreground">
                      Gói đã mua: <span className="font-medium text-foreground">{purchasedPlans.join(", ")}</span>
                    </p>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Lịch sử giao dịch */}
          <section className="rounded-xl border border-primary/15 bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-base font-bold text-foreground">Lịch sử giao dịch ({transactions.length})</h2>
            {transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có giao dịch nào.</p>
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {transactions.map((t) => {
                  const meta = STATUS_META[t.status] || STATUS_META.pending;
                  return (
                    <div key={t.id} className="flex flex-wrap items-center gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground">
                          {t.planName} <span className="text-xs font-normal text-muted-foreground">· {t.provider}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {vndTime(t.createdAt)}
                          {t.note && ` · ${t.note}`}
                        </p>
                      </div>
                      <span className="font-semibold text-primary">{formatVND(t.amount)}</span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${meta.cls}`}>{meta.label}</span>
                      {t.status === "pending" && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleConfirm(t.id)}
                            title="Xác nhận đã nhận tiền"
                            className="cursor-pointer rounded-md p-1.5 text-emerald-600 hover:bg-emerald-500/10"
                          >
                            <Check className="size-4" />
                          </button>
                          <button
                            onClick={() => handleCancel(t.id)}
                            title="Huỷ giao dịch"
                            className="cursor-pointer rounded-md p-1.5 text-destructive hover:bg-destructive/10"
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Dialog đổi gói */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Đổi gói cho {user.name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="cp-plan">Gói mới</Label>
              <select
                id="cp-plan"
                value={form.plan}
                onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
              >
                {sellablePlans.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.name} — {formatVND(p.price)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Hình thức</Label>
              <div className="flex gap-2">
                {[
                  { v: "paid", l: "Đã thanh toán" },
                  { v: "gift", l: "Tặng / Khuyến mãi" },
                ].map((m) => (
                  <button
                    key={m.v}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, method: m.v as "paid" | "gift" }))}
                    className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium cursor-pointer transition-colors ${
                      form.method === m.v ? "border-primary bg-primary/10 text-primary" : "border-input text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {m.l}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {form.method === "paid"
                  ? "Ghi nhận doanh thu theo giá gói (user đã chuyển khoản/trả tiền mặt)."
                  : "Kích hoạt gói miễn phí, không tính vào doanh thu."}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="cp-note">Lý do (bắt buộc)</Label>
              <Textarea
                id="cp-note"
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="VD: User chuyển khoản 299k ngày 04/06, hoặc tặng dùng thử..."
                className="min-h-[72px] focus-visible:ring-primary"
              />
            </div>

            <Button onClick={handleSave} disabled={saving || !form.plan || !form.note.trim()} className="mt-1 w-full cursor-pointer gap-2">
              {saving && <Loader2 className="size-4 animate-spin" />}
              Xác nhận đổi gói
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
