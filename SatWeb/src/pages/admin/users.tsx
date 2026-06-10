import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Search, UserPlus, Ban, Loader2, ShieldCheck, ChevronRight } from "lucide-react";
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

const selectCls =
  "h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer";

export default function AdminUsers() {
  const { t } = useTranslation();
  const { users, loading, adminPlans, getUsers, getAdminPlans, createUser, updateUser, deleteUser } = useAdminStore();
  const currentEmail = (useAuthStore((s) => s.user) as any)?.email;

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    plan: "freemium",
    isAdmin: false,
  });

  // Danh sách gói động để chọn khi gán cho user.
  const PLAN_OPTIONS = adminPlans.map((p) => ({ value: p.key, label: p.name }));
  const planName = (key: string) => adminPlans.find((p) => p.key === key)?.name || key || "—";

  useEffect(() => {
    getUsers();
    getAdminPlans();
  }, [getUsers, getAdminPlans]);

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
    if (window.confirm(t("admin.confirmLockUser", { name }))) deleteUser(id);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("admin.usersTitle")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("admin.accountsCount", { count: users.length })}</p>
          </div>
          <Button onClick={() => setOpen(true)} className="w-fit cursor-pointer gap-1.5">
            <UserPlus className="size-4" />
            {t("admin.grantAccount")}
          </Button>
        </div>

        <form onSubmit={handleSearch} className="mb-4 flex items-center gap-2">
          <div className="relative flex flex-1 items-center">
            <Search className="absolute left-3 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("admin.searchUserPlaceholder")}
              className="h-10 pl-10 focus-visible:ring-primary"
            />
          </div>
          <Button type="submit" variant="outline" className="cursor-pointer">
            {t("admin.search")}
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
                  <th className="px-4 py-3 font-semibold">{t("admin.colUser")}</th>
                  <th className="px-4 py-3 font-semibold">{t("admin.colPlan")}</th>
                  <th className="px-4 py-3 font-semibold">{t("admin.colRole")}</th>
                  <th className="px-4 py-3 font-semibold">{t("admin.colStatus")}</th>
                  <th className="px-4 py-3 text-right font-semibold">{t("admin.colActions")}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u.email === currentEmail;
                  return (
                    <tr key={u.id} className="border-b border-border/50 hover:bg-secondary/20">
                      <td className="px-4 py-3">
                        <Link to={`/admin/users/${u.id}`} className="group inline-flex flex-col cursor-pointer">
                          <span className="font-medium text-foreground group-hover:text-primary group-hover:underline">
                            {u.name} {isSelf && <span className="text-xs text-muted-foreground">{t("admin.youSuffix")}</span>}
                          </span>
                          <span className="text-xs text-muted-foreground">{u.email}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        {u.isAdmin ? (
                          <span className="text-sm text-muted-foreground">—</span>
                        ) : (
                          <span className="text-sm text-foreground">{planName(u.plan)}</span>
                        )}
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
                          title={isSelf ? t("admin.cannotChangeOwnRole") : t("admin.changeRole")}
                        >
                          {u.isAdmin && <ShieldCheck className="size-3" />}
                          {u.isAdmin ? t("admin.roleAdmin") : t("admin.roleUser")}
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
                          title={isSelf ? t("admin.cannotLockSelf") : t("admin.toggleLock")}
                        >
                          {u.isActive ? t("admin.statusActive") : t("admin.statusLocked")}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            disabled={isSelf || !u.isActive}
                            onClick={() => handleDelete(u.id, u.name)}
                            className={`rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive ${
                              isSelf || !u.isActive ? "cursor-not-allowed opacity-40" : "cursor-pointer"
                            }`}
                            title={!u.isActive ? t("admin.accountLocked") : t("admin.lockAccount")}
                            aria-label={t("admin.lockAccount")}
                          >
                            <Ban className="size-4" />
                          </button>
                          <Link
                            to={`/admin/users/${u.id}`}
                            className="rounded-md p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary cursor-pointer"
                            title={t("admin.viewDetail")}
                          >
                            <ChevronRight className="size-4" />
                          </Link>
                        </div>
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
            <DialogTitle>{t("admin.grantNewAccount")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="cu-name">{t("admin.fullName")}</Label>
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
              <Label htmlFor="cu-pass">{t("admin.password")}</Label>
              <Input
                id="cu-pass"
                type="text"
                value={newUser.password}
                onChange={(e) => setNewUser((u) => ({ ...u, password: e.target.value }))}
                placeholder={t("admin.passwordHint")}
                className="focus-visible:ring-primary"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              {/* Admin không dùng gói → ẩn ô chọn gói khi bật quyền quản trị */}
              {!newUser.isAdmin ? (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="cu-plan">{t("admin.colPlan")}</Label>
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
              ) : (
                <p className="text-sm text-muted-foreground">{t("admin.adminNoPlan")}</p>
              )}
              <label className="flex cursor-pointer items-center gap-2 pt-6 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={newUser.isAdmin}
                  onChange={(e) => setNewUser((u) => ({ ...u, isAdmin: e.target.checked }))}
                  className="size-4 cursor-pointer accent-primary"
                />
                {t("admin.adminRole")}
              </label>
            </div>
            <Button
              onClick={handleCreate}
              disabled={creating || !newUser.name || !newUser.email || !newUser.password}
              className="mt-2 w-full cursor-pointer gap-2"
            >
              {creating && <Loader2 className="size-4 animate-spin" />}
              {t("admin.grantAccount")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
