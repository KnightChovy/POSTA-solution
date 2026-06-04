import { useEffect, useState } from "react";
import { Plus, Copy, Lock, Loader2, Pencil, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import useAdminStore, { AdminPlan, PlanInput } from "@/store/adminStore";
import { formatVND, limitText } from "@/lib/planFormat";

const selectCls =
  "h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer";

const EMPTY_FORM: PlanInput = {
  name: "",
  description: "",
  price: 0,
  limits: { websites: 1, ai: 0, aiPeriod: "month", posts: -1, postsPeriod: "month" },
  isPublished: true,
  sortOrder: 0,
};

export default function AdminPlans() {
  const { adminPlans, loading, getAdminPlans, createPlan, updatePlan, clonePlan, setPlanVisibility } = useAdminStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminPlan | null>(null);
  const [form, setForm] = useState<PlanInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAdminPlans();
  }, [getAdminPlans]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (p: AdminPlan) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description,
      price: p.price,
      limits: { ...p.limits },
      isPublished: p.isPublished,
      sortOrder: p.sortOrder,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const ok = editing ? await updatePlan(editing._id, form) : await createPlan(form);
    setSaving(false);
    if (ok) setOpen(false);
  };

  const setLimit = (key: keyof PlanInput["limits"], value: any) =>
    setForm((f) => ({ ...f, limits: { ...f.limits, [key]: value } }));

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Quản lý gói dịch vụ</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {adminPlans.length} gói. Gói đã có giao dịch sẽ bị khoá — chỉ có thể Clone.
            </p>
          </div>
          <Button onClick={openCreate} className="w-fit cursor-pointer gap-1.5">
            <Plus className="size-4" />
            Tạo gói
          </Button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-primary/15 bg-card shadow-sm">
          {loading && adminPlans.length === 0 ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40 text-left text-xs uppercase text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Gói</th>
                  <th className="px-4 py-3 font-semibold">Giá</th>
                  <th className="px-4 py-3 font-semibold">Giới hạn</th>
                  <th className="px-4 py-3 font-semibold">Trạng thái</th>
                  <th className="px-4 py-3 font-semibold">Lượt mua</th>
                  <th className="px-4 py-3 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {adminPlans.map((p) => (
                  <tr key={p._id} className="border-b border-border/50 hover:bg-secondary/20">
                    <td className="px-4 py-3">
                      <p className="flex items-center gap-1.5 font-medium text-foreground">
                        {p.name}
                        {p.isLocked && (
                          <span title="Đã có giao dịch — khoá sửa">
                            <Lock className="size-3.5 text-amber-500" />
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{p.key}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground">{formatVND(p.price)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      <div>{limitText(p.limits.websites, "website")}</div>
                      <div>{limitText(p.limits.ai, "AI", p.limits.aiPeriod)}</div>
                      <div>{limitText(p.limits.posts, "bài", p.limits.postsPeriod)}</div>
                    </td>
                    <td className="px-4 py-3">
                      {p.isArchived ? (
                        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-muted-foreground">Lưu trữ</span>
                      ) : p.isPublished ? (
                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">Đang bán</span>
                      ) : (
                        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-muted-foreground">Ẩn</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-foreground">{p.purchaseCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          disabled={p.isLocked}
                          onClick={() => openEdit(p)}
                          title={p.isLocked ? "Gói đã bán — hãy Clone để sửa" : "Sửa gói"}
                          className={`rounded-md p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary ${
                            p.isLocked ? "cursor-not-allowed opacity-40" : "cursor-pointer"
                          }`}
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => clonePlan(p._id)}
                          title="Clone gói"
                          className="cursor-pointer rounded-md p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                        >
                          <Copy className="size-4" />
                        </button>
                        <button
                          onClick={() => setPlanVisibility(p._id, { isPublished: !p.isPublished, isArchived: false })}
                          title={p.isPublished ? "Ẩn khỏi trang bán" : "Hiện trên trang bán"}
                          className="cursor-pointer rounded-md p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                        >
                          {p.isPublished ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Modal tạo / sửa gói */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Sửa gói" : "Tạo gói mới"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="p-name">Tên gói</Label>
              <Input id="p-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="focus-visible:ring-primary" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="p-desc">Mô tả</Label>
              <Input id="p-desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="focus-visible:ring-primary" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="p-price">Giá (VNĐ/tháng)</Label>
              <Input id="p-price" type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))} className="focus-visible:ring-primary" />
            </div>

            <div className="rounded-lg border border-border p-3">
              <p className="mb-3 text-sm font-semibold text-foreground">Giới hạn (-1 = không giới hạn)</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Số website</Label>
                  <Input type="number" value={form.limits.websites} onChange={(e) => setLimit("websites", Number(e.target.value))} className="h-9 focus-visible:ring-primary" />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Số lần AI</Label>
                  <Input type="number" value={form.limits.ai} onChange={(e) => setLimit("ai", Number(e.target.value))} className="h-9 focus-visible:ring-primary" />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Kỳ AI</Label>
                  <select value={form.limits.aiPeriod} onChange={(e) => setLimit("aiPeriod", e.target.value)} className={selectCls}>
                    <option value="week">Tuần</option>
                    <option value="month">Tháng</option>
                    <option value="none">Không reset</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Số bài đăng</Label>
                  <Input type="number" value={form.limits.posts} onChange={(e) => setLimit("posts", Number(e.target.value))} className="h-9 focus-visible:ring-primary" />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Kỳ bài đăng</Label>
                  <select value={form.limits.postsPeriod} onChange={(e) => setLimit("postsPeriod", e.target.value)} className={selectCls}>
                    <option value="week">Tuần</option>
                    <option value="month">Tháng</option>
                    <option value="none">Không reset</option>
                  </select>
                </div>
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={!!form.isPublished}
                onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
                className="size-4 cursor-pointer accent-primary"
              />
              Hiển thị trên trang bán
            </label>

            <Button onClick={handleSave} disabled={saving || !form.name.trim()} className="mt-2 w-full cursor-pointer gap-2">
              {saving && <Loader2 className="size-4 animate-spin" />}
              {editing ? "Lưu thay đổi" : "Tạo gói"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
