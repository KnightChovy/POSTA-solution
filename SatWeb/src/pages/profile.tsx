import { useEffect, useRef, useState } from "react";
import {
  User,
  Mail,
  Phone,
  Camera,
  Loader2,
  ShieldCheck,
  Briefcase,
  Building2,
  Globe,
  MapPin,
  CalendarDays,
  Trash2,
  KeyRound,
  MonitorSmartphone,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import useProfileStore, { UpdateProfileInput } from "@/store/profileStore";
import { useAuthStore } from "@/store/authStore";
import {
  changePasswordService,
  getSessionsService,
  revokeSessionService,
} from "@/service/authService";
import { toast } from "react-toastify";

interface SessionItem {
  id: string;
  device: string;
  ip: string;
  createdAt: string;
  lastUsedAt: string;
}

const MAX_AVATAR_MB = 2;

function initialsOf(name: string) {
  return (
    name
      ?.trim()
      .split(/\s+/)
      .slice(-2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "U"
  );
}

function formatDate(d?: string) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function ProfilePage() {
  const { profile, loading, saving, getProfile, updateProfile } = useProfileStore();
  const updateUser = useAuthStore((s) => s.updateUser);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    jobTitle: "",
    company: "",
    website: "",
    address: "",
    bio: "",
  });
  // avatar: null = giữ nguyên, "" = xoá, "data:..." = ảnh mới
  const [avatar, setAvatar] = useState<string | null>(null);
  const [preview, setPreview] = useState("");

  // Đổi mật khẩu
  const [pwd, setPwd] = useState({ oldPassword: "", newPassword: "", confirm: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);

  // Phiên đăng nhập
  const [sessions, setSessions] = useState<SessionItem[]>([]);

  useEffect(() => {
    getProfile();
  }, [getProfile]);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || "",
        phone: profile.phone || "",
        jobTitle: profile.jobTitle || "",
        company: profile.company || "",
        website: profile.website || "",
        address: profile.address || "",
        bio: profile.bio || "",
      });
      setPreview(profile.avatar || "");
      setAvatar(null);
    }
  }, [profile]);

  const setField = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handlePickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_AVATAR_MB * 1024 * 1024) {
      toast.error(`Ảnh tối đa ${MAX_AVATAR_MB}MB`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setAvatar(base64);
      setPreview(base64);
    };
    reader.readAsDataURL(file); // chuyển ảnh sang base64
  };

  const handleRemoveAvatar = () => {
    setAvatar("");
    setPreview("");
  };

  const handleSave = async () => {
    const payload: UpdateProfileInput = { ...form };
    if (avatar !== null) payload.avatar = avatar;
    const ok = await updateProfile(payload);
    if (ok) updateUser({ name: form.name } as any);
  };

  const loadSessions = async () => {
    try {
      const res = await getSessionsService();
      if (!res?.error) setSessions(res.sessions || []);
    } catch {
      /* bỏ qua */
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleChangePassword = async () => {
    if (pwd.newPassword !== pwd.confirm) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }
    setChangingPwd(true);
    try {
      const res = await changePasswordService(pwd.oldPassword, pwd.newPassword);
      if (res?.error) {
        toast.error(res.message || "Đổi mật khẩu thất bại");
      } else {
        toast.success(res.message || "Đổi mật khẩu thành công");
        setPwd({ oldPassword: "", newPassword: "", confirm: "" });
      }
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setChangingPwd(false);
    }
  };

  const handleRevoke = async (id: string) => {
    const res = await revokeSessionService(id);
    if (!res?.error) {
      toast.success("Đã thu hồi phiên");
      setSessions((s) => s.filter((x) => x.id !== id));
    }
  };

  const fmtTime = (d?: string) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleString("vi-VN");
    } catch {
      return "—";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Hồ sơ cá nhân</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý thông tin tài khoản POSTA của bạn.
          </p>
        </div>

        {loading && !profile ? (
          <div className="flex items-center justify-center rounded-xl border border-primary/15 bg-card p-12">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Cột tóm tắt */}
            <aside className="lg:col-span-1">
              <div className="flex flex-col items-center gap-4 rounded-xl border border-primary/15 bg-card p-6 text-center shadow-sm">
                <div className="relative">
                  <div className="flex size-28 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-3xl font-bold text-primary ring-1 ring-primary/20">
                    {preview ? (
                      <img src={preview} alt="Ảnh đại diện" className="size-full object-cover" />
                    ) : (
                      initialsOf(form.name)
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 flex size-9 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label="Đổi ảnh đại diện"
                  >
                    <Camera className="size-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePickAvatar}
                  />
                </div>

                <div>
                  <p className="text-lg font-bold text-foreground">{form.name || "Người dùng"}</p>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                  {(form.jobTitle || form.company) && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {[form.jobTitle, form.company].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>

                {profile?.isAdmin && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-primary">
                    <ShieldCheck className="size-3.5" />
                    Quản trị viên
                  </span>
                )}

                {preview && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-destructive hover:underline"
                  >
                    <Trash2 className="size-3.5" />
                    Xoá ảnh đại diện
                  </button>
                )}

                <div className="mt-2 flex w-full items-center justify-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
                  <CalendarDays className="size-3.5" />
                  Tham gia: {formatDate(profile?.createdAt)}
                </div>
              </div>
            </aside>

            {/* Cột form */}
            <div className="flex flex-col gap-6 lg:col-span-2">
              {/* Thông tin cá nhân */}
              <section className="rounded-xl border border-primary/15 bg-card p-6 shadow-sm">
                <h2 className="mb-5 border-b border-border pb-3 text-base font-bold text-foreground">
                  Thông tin cá nhân
                </h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    id="name"
                    label="Họ và tên"
                    icon={User}
                    value={form.name}
                    onChange={(v) => setField("name", v)}
                    placeholder="Họ và tên"
                  />
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3 size-4 text-muted-foreground" />
                      <Input
                        id="email"
                        value={profile?.email || ""}
                        disabled
                        className="h-11 cursor-not-allowed pl-10"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Email không thể thay đổi.</p>
                  </div>
                  <Field
                    id="phone"
                    label="Số điện thoại"
                    icon={Phone}
                    value={form.phone}
                    onChange={(v) => setField("phone", v)}
                    placeholder="0987 xxx xxx"
                  />
                  <Field
                    id="jobTitle"
                    label="Chức danh"
                    icon={Briefcase}
                    value={form.jobTitle}
                    onChange={(v) => setField("jobTitle", v)}
                    placeholder="VD: Trưởng phòng SEO"
                  />
                  <Field
                    id="company"
                    label="Công ty"
                    icon={Building2}
                    value={form.company}
                    onChange={(v) => setField("company", v)}
                    placeholder="Tên công ty"
                  />
                </div>
              </section>

              {/* Liên hệ */}
              <section className="rounded-xl border border-primary/15 bg-card p-6 shadow-sm">
                <h2 className="mb-5 border-b border-border pb-3 text-base font-bold text-foreground">
                  Liên hệ
                </h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    id="website"
                    label="Website"
                    icon={Globe}
                    value={form.website}
                    onChange={(v) => setField("website", v)}
                    placeholder="https://..."
                  />
                  <Field
                    id="address"
                    label="Địa chỉ"
                    icon={MapPin}
                    value={form.address}
                    onChange={(v) => setField("address", v)}
                    placeholder="Địa chỉ liên hệ"
                  />
                </div>
              </section>

              {/* Giới thiệu */}
              <section className="rounded-xl border border-primary/15 bg-card p-6 shadow-sm">
                <h2 className="mb-5 border-b border-border pb-3 text-base font-bold text-foreground">
                  Giới thiệu
                </h2>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="bio">Mô tả ngắn về bạn</Label>
                  <Textarea
                    id="bio"
                    value={form.bio}
                    onChange={(e) => setField("bio", e.target.value)}
                    placeholder="Vài dòng giới thiệu về bạn hoặc doanh nghiệp..."
                    rows={4}
                    className="resize-none focus-visible:ring-primary"
                  />
                </div>
              </section>

              <div className="flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="cursor-pointer gap-2 px-6 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {saving && <Loader2 className="size-4 animate-spin" />}
                  Lưu thay đổi
                </Button>
              </div>

              {/* Đổi mật khẩu */}
              <section className="rounded-xl border border-primary/15 bg-card p-6 shadow-sm">
                <h2 className="mb-5 flex items-center gap-2 border-b border-border pb-3 text-base font-bold text-foreground">
                  <KeyRound className="size-4 text-primary" />
                  Đổi mật khẩu
                </h2>
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="oldPassword">Mật khẩu hiện tại</Label>
                    <div className="relative flex items-center">
                      <Input
                        id="oldPassword"
                        type={showPwd ? "text" : "password"}
                        value={pwd.oldPassword}
                        onChange={(e) => setPwd((p) => ({ ...p, oldPassword: e.target.value }))}
                        placeholder="Mật khẩu hiện tại"
                        className="h-11 pr-10 focus-visible:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd((v) => !v)}
                        className="absolute right-3 cursor-pointer text-muted-foreground hover:text-foreground"
                        aria-label={showPwd ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      >
                        {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="newPassword">Mật khẩu mới</Label>
                      <Input
                        id="newPassword"
                        type={showPwd ? "text" : "password"}
                        value={pwd.newPassword}
                        onChange={(e) => setPwd((p) => ({ ...p, newPassword: e.target.value }))}
                        placeholder="Tối thiểu 6 ký tự"
                        className="h-11 focus-visible:ring-primary"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="confirmNew">Xác nhận mật khẩu mới</Label>
                      <Input
                        id="confirmNew"
                        type={showPwd ? "text" : "password"}
                        value={pwd.confirm}
                        onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))}
                        placeholder="Nhập lại mật khẩu mới"
                        className="h-11 focus-visible:ring-primary"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={handleChangePassword}
                      disabled={changingPwd || !pwd.oldPassword || !pwd.newPassword}
                      variant="outline"
                      className="cursor-pointer gap-2"
                    >
                      {changingPwd && <Loader2 className="size-4 animate-spin" />}
                      Đổi mật khẩu
                    </Button>
                  </div>
                </div>
              </section>

              {/* Phiên đăng nhập */}
              <section className="rounded-xl border border-primary/15 bg-card p-6 shadow-sm">
                <h2 className="mb-5 flex items-center gap-2 border-b border-border pb-3 text-base font-bold text-foreground">
                  <MonitorSmartphone className="size-4 text-primary" />
                  Phiên đăng nhập ({sessions.length})
                </h2>
                {sessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Không có phiên nào.</p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {sessions.map((s) => (
                      <li
                        key={s.id}
                        className="flex items-start justify-between gap-3 rounded-lg border border-border bg-secondary/30 p-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {s.device || "Thiết bị không xác định"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            IP: {s.ip || "—"} · Hoạt động: {fmtTime(s.lastUsedAt)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRevoke(s.id)}
                          className="shrink-0 cursor-pointer rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          aria-label="Thu hồi phiên"
                          title="Thu hồi phiên"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Ô nhập có nhãn + icon — dùng lại cho nhiều trường.
function Field({
  id,
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  icon: React.ElementType;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative flex items-center">
        <Icon className="absolute left-3 size-4 text-muted-foreground" />
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-11 pl-10 focus-visible:ring-primary"
        />
      </div>
    </div>
  );
}
