import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, UserPlus, Trash2, Loader2, ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import useAdminStore from "@/store/adminStore";
import { useAuthStore } from "@/store/authStore";

const PLAN_OPTIONS = [
  { value: "none", label: "Chưa có gói" },
  { value: "basic", label: "Cơ bản" },
  { value: "pro", label: "Trung bình" },
  { value: "enterprise", label: "Nâng cao" },
];

const selectCls =
  "h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer";

export default function AdminUsers() {
  const { users, loading, getUsers, createUser, updateUser, deleteUser } = useAdminStore();
  const currentEmail = (useAuthStore((s) => s.user) as any)?.email;

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    plan: "none",
    isAdmin: false,
  });

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    getUsers(search);
  };

  const handleCreate = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) return;
    setCreating(true);
    const ok = await createUser(newUser);
    setCreating(false);
    if (ok) {
      setOpen(false);
      setNewUser({ name: "", email: "", password: "", plan: "none", isAdmin: false });
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Xoá người dùng "${name}"?`)) deleteUser(id);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <Link
          to="/admin"
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="size-4" />
          Bảng điều khiển
        </Link>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Quản lý người dùng</h1>
            <p className="mt-1 text-sm text-muted-foreground">{users.length} tài khoản</p>
          </div>
          <Button onClick={() => setOpen(true)} className="w-fit cursor-pointer gap-1.5">
            <UserPlus className="size-4" />
            Cấp tài khoản
          </Button>
        </div>

        <form onSubmit={handleSearch} className="mb-4 flex items-center gap-2">
          <div className="relative flex flex-1 items-center">
            <Search className="absolute left-3 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên hoặc email..."
              className="h-10 pl-10 focus-visible:ring-primary"
            />
          </div>
          <Button type="submit" variant="outline" className="cursor-pointer">
            Tìm
          </Button>
        </form>

        <div className="overflow-x-auto rounded-xl border border-primary/15 bg-card shadow-sm">
          {loading && users.length === 0 ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40 text-left text-xs uppercase text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Người dùng</th>
                  <th className="px-4 py-3 font-semibold">Gói</th>
                  <th className="px-4 py-3 font-semibold">Quyền</th>
                  <th className="px-4 py-3 font-semibold">Trạng thái</th>
                  <th className="px-4 py-3 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u.email === currentEmail;
                  return (
                    <tr key={u.id} className="border-b border-border/50 hover:bg-secondary/20">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">
                          {u.name} {isSelf && <span className="text-xs text-muted-foreground">(bạn)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={u.plan}
                          onChange={(e) => updateUser(u.id, { plan: e.target.value })}
                          className={selectCls}
                        >
                          {PLAN_OPTIONS.map((p) => (
                            <option key={p.value} value={p.value}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          disabled={isSelf}
                          onClick={() => updateUser(u.id, { isAdmin: !u.isAdmin })}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                            u.isAdmin
                              ? "bg-primary/10 text-primary"
                              : "bg-secondary text-muted-foreground"
                          } ${isSelf ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                          title={isSelf ? "Không thể đổi quyền của chính mình" : "Đổi quyền"}
                        >
                          {u.isAdmin && <ShieldCheck className="size-3" />}
                          {u.isAdmin ? "Admin" : "User"}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          disabled={isSelf}
                          onClick={() => updateUser(u.id, { isActive: !u.isActive })}
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            u.isActive
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-destructive/10 text-destructive"
                          } ${isSelf ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                          title={isSelf ? "Không thể khoá chính mình" : "Đổi trạng thái"}
                        >
                          {u.isActive ? "Hoạt động" : "Đã khoá"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          disabled={isSelf}
                          onClick={() => handleDelete(u.id, u.name)}
                          className={`rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive ${
                            isSelf ? "cursor-not-allowed opacity-40" : "cursor-pointer"
                          }`}
                          aria-label="Xoá người dùng"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Modal cấp tài khoản */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cấp tài khoản mới</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="cu-name">Họ và tên</Label>
              <Input
                id="cu-name"
                value={newUser.name}
                onChange={(e) => setNewUser((u) => ({ ...u, name: e.target.value }))}
                className="focus-visible:ring-primary"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cu-email">Email</Label>
              <Input
                id="cu-email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser((u) => ({ ...u, email: e.target.value }))}
                className="focus-visible:ring-primary"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cu-pass">Mật khẩu</Label>
              <Input
                id="cu-pass"
                type="text"
                value={newUser.password}
                onChange={(e) => setNewUser((u) => ({ ...u, password: e.target.value }))}
                placeholder="Tối thiểu 6 ký tự"
                className="focus-visible:ring-primary"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="cu-plan">Gói</Label>
                <select
                  id="cu-plan"
                  value={newUser.plan}
                  onChange={(e) => setNewUser((u) => ({ ...u, plan: e.target.value }))}
                  className={selectCls}
                >
                  {PLAN_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex cursor-pointer items-center gap-2 pt-6 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={newUser.isAdmin}
                  onChange={(e) => setNewUser((u) => ({ ...u, isAdmin: e.target.checked }))}
                  className="size-4 cursor-pointer accent-primary"
                />
                Quyền quản trị
              </label>
            </div>
            <Button
              onClick={handleCreate}
              disabled={creating || !newUser.name || !newUser.email || !newUser.password}
              className="mt-2 w-full cursor-pointer gap-2"
            >
              {creating && <Loader2 className="size-4 animate-spin" />}
              Cấp tài khoản
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
