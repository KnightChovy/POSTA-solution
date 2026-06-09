import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Plus,
  Globe,
  CheckCircle2,
  XCircle,
  Activity,
  ArrowUpRight,
  SquarePlus,
  FolderKanban,
  BookOpen,
  Sparkles,
  Gauge,
  PlayCircle,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import PostTable from "./posts/PostTable";
import postStore from "@/store/postStore";
import useSatelliteStore from "@/store/satetillite";

/** Tài nguyên thương hiệu POSTA (đặt trong public/, tham chiếu từ gốc). */
const POSTA_LOGO = "/logo-3.png";
const POSTA_TVC = "/tvc-posta.mp4";

/** Lời chào theo thời điểm trong ngày — chạm cảm xúc, vẫn tiếng Việt. */
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 11) return "Chào buổi sáng";
  if (hour < 14) return "Chào buổi trưa";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
};

/** Vòng tròn tiến trình vẽ bằng SVG thuần — không thêm thư viện chart. */
const SuccessRing = ({ value }: { value: number }) => {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          strokeWidth="10"
          className="stroke-amber-100 dark:stroke-amber-950/60"
        />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stroke-amber-500 transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-foreground">{value}%</span>
        <span className="text-xs text-muted-foreground">thành công</span>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  borderColor: string;
  delay: number;
}

const StatCard = ({
  title,
  value,
  description,
  icon: Icon,
  iconBg,
  iconColor,
  borderColor,
  delay,
}: StatCardProps) => (
  <Card
    className={`group relative overflow-hidden bg-card border-l-4 ${borderColor} border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-rise`}
    style={{ animationDelay: `${delay}ms` }}
  >
    {/* Vệt sáng nhẹ chạy qua khi hover — tạo cảm giác cao cấp */}
    <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-amber-200/40 to-transparent opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-300 dark:from-amber-500/10" />
    <CardContent className="relative p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground tabular-nums">
            {value}
          </p>
          <p className="text-xs text-muted-foreground/70">{description}</p>
        </div>
        <div
          className={`p-3 rounded-xl ${iconBg} group-hover:scale-110 transition-transform duration-300`}
        >
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

const Home = () => {
  const navigate = useNavigate();
  const [videoOpen, setVideoOpen] = useState(false);

  const {
    posts,
    getPost,
    getPostedPosts,
    getErrorPosts,
    totalPublishedPosts,
    totalErrorPosts,
  } = postStore();

  const { satellites, getSatellite } = useSatelliteStore();

  useEffect(() => {
    getPost();
  }, [getPost]);

  useEffect(() => {
    getSatellite();
  }, [getSatellite]);

  useEffect(() => {
    getPostedPosts();
    getErrorPosts();
  }, [posts]);

  // Vệ tinh đang hoạt động — luôn lọc status ACTIVE (quy ước nghiệp vụ).
  const activeSites = useMemo(
    () => satellites?.filter((s) => s.status === "ACTIVE").length ?? 0,
    [satellites]
  );

  const published = totalPublishedPosts || 0;
  const errors = totalErrorPosts || 0;
  const successRate =
    published + errors > 0
      ? Math.round((published / (published + errors)) * 100)
      : 0;

  const stats = [
    {
      title: "Tổng số bài viết",
      value: posts.length,
      description: "Bài viết trong hệ thống",
      icon: FileText,
      iconBg: "bg-amber-50 dark:bg-amber-950/50",
      iconColor: "text-amber-600 dark:text-amber-400",
      borderColor: "border-l-amber-500",
    },
    {
      title: "Đăng thành công",
      value: published,
      description: "Lượt xuất bản thành công",
      icon: CheckCircle2,
      iconBg: "bg-emerald-50 dark:bg-emerald-950/50",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      borderColor: "border-l-emerald-500",
    },
    {
      title: "Đăng thất bại",
      value: errors,
      description: "Lượt cần kiểm tra lại",
      icon: XCircle,
      iconBg: "bg-red-50 dark:bg-red-950/50",
      iconColor: "text-red-600 dark:text-red-400",
      borderColor: "border-l-red-500",
    },
    {
      title: "Website vệ tinh",
      value: activeSites,
      description: "Đang hoạt động",
      icon: Globe,
      iconBg: "bg-blue-50 dark:bg-blue-950/50",
      iconColor: "text-blue-600 dark:text-blue-400",
      borderColor: "border-l-blue-500",
    },
  ];

  const quickActions = [
    {
      title: "Thêm website vệ tinh",
      description: "Kết nối thêm site WordPress mới",
      icon: SquarePlus,
      path: "/create-site",
    },
    {
      title: "Quản lý website",
      description: "Xem & chỉnh sửa các vệ tinh",
      icon: FolderKanban,
      path: "/viewSat",
    },
    {
      title: "Hướng dẫn lấy mật khẩu",
      description: "Tạo Application Password WordPress",
      icon: BookOpen,
      path: "/help/app-password",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-subtle">
      <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-[1600px] mx-auto w-full space-y-8">
        {/* ===== HERO ===== */}
        <section className="relative overflow-hidden rounded-3xl border border-primary/15 bg-card shadow-sm animate-rise">
          <div className="relative grid lg:grid-cols-[1fr_auto] items-center gap-8 p-6 sm:p-8 md:p-10">
            <div className="space-y-5">
              {/* Thương hiệu POSTA */}
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-orange-200/60 dark:ring-orange-900/40">
                  <img
                    src={POSTA_LOGO}
                    alt="Logo POSTA"
                    className="h-9 w-9 object-contain"
                  />
                </div>
                <div className="leading-tight">
                  <p className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                    POSTA
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                    <Sparkles className="h-3 w-3" />
                    Bảng điều khiển đăng bài vệ tinh
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                  {getGreeting()}, Admin
                </h1>
                <p className="max-w-xl text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Soạn bài một lần, đăng đồng loạt lên{" "}
                  <span className="font-semibold text-foreground">
                    {activeSites}
                  </span>{" "}
                  website vệ tinh đang hoạt động. Nội dung được viết lại bằng AI
                  để tránh trùng lặp.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => navigate("/create-post")}
                  className="h-11 gap-2 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
                >
                  <Plus className="h-4 w-4" />
                  Tạo bài viết
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/viewSat")}
                  className="h-11 gap-2 px-6 border-border bg-card/60 backdrop-blur-sm hover:bg-secondary text-foreground transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
                >
                  <Globe className="h-4 w-4" />
                  Quản lý website
                </Button>
              </div>
            </div>

            {/* Thẻ kính hiển thị tỷ lệ thành công */}
            <div className="flex items-center justify-center rounded-2xl border border-white/40 dark:border-slate-700/50 bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl p-6 shadow-md">
              <div className="flex flex-col items-center gap-3">
                <SuccessRing value={successRate} />
                <div className="flex items-center gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {published}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Thành công
                    </p>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div>
                    <p className="text-lg font-bold text-red-500 dark:text-red-400 tabular-nums">
                      {errors}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Thất bại
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== STATS ===== */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat, index) => (
            <StatCard key={stat.title} {...stat} delay={index * 80} />
          ))}
        </section>

        {/* ===== TVC SHOWCASE ===== */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 shadow-xl animate-rise">
          {/* Logo mờ làm hoa văn nền */}
          <img
            src={POSTA_LOGO}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -right-8 -bottom-10 h-64 w-64 object-contain opacity-10 rotate-12 select-none"
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_55%)]" />

          <div className="relative grid md:grid-cols-[1fr_auto] items-center gap-6 p-6 sm:p-8 md:p-10">
            <div className="space-y-3 text-white">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                <Play className="h-3 w-3 fill-current" />
                TVC giới thiệu
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Câu chuyện thương hiệu POSTA
              </h2>
              <p className="max-w-lg text-sm sm:text-base text-white/85 leading-relaxed">
                Khám phá cách POSTA giúp bạn nhân bản nội dung và phủ sóng hàng
                loạt website vệ tinh chỉ trong một lần đăng.
              </p>
              <Button
                onClick={() => setVideoOpen(true)}
                className="mt-1 h-11 gap-2 px-6 bg-white text-orange-600 hover:bg-orange-50 font-semibold shadow-lg transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-orange-600"
              >
                <PlayCircle className="h-5 w-5" />
                Xem TVC
              </Button>
            </div>

            {/* Khung xem trước — bấm để mở video */}
            <button
              onClick={() => setVideoOpen(true)}
              aria-label="Phát TVC giới thiệu POSTA"
              className="group relative hidden md:flex h-44 w-72 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-black/30 ring-1 ring-white/30 backdrop-blur-sm cursor-pointer transition-all duration-300 hover:ring-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <span className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15),transparent_70%)]" />
              <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-orange-600 shadow-xl transition-transform duration-300 group-hover:scale-110">
                <Play className="h-7 w-7 translate-x-0.5 fill-current" />
              </span>
            </button>
          </div>
        </section>

        {/* ===== CONTENT GRID ===== */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Danh sách bài viết */}
          <Card
            id="posts-section"
            className="xl:col-span-2 border border-border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden animate-rise"
          >
            <CardHeader className="bg-gradient-to-r from-secondary/50 to-muted/50 border-b border-border">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50">
                    <Activity className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <CardTitle className="text-foreground text-lg">
                      Danh sách bài viết
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Quản lý và theo dõi tiến trình xuất bản
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/create-post")}
                  className="hidden sm:flex gap-1.5 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  <Plus className="h-4 w-4" />
                  Tạo mới
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <PostTable posts={posts} />
            </CardContent>
          </Card>

          {/* Cột phụ: sức khỏe hệ thống + lối tắt */}
          <div className="space-y-6">
            {/* Sức khỏe hệ thống */}
            <Card className="border border-border shadow-sm overflow-hidden animate-rise">
              <CardHeader className="border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50">
                    <Gauge className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <CardTitle className="text-foreground text-lg">
                      Sức khỏe hệ thống
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Tổng quan hiệu suất đăng bài
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Tỷ lệ thành công
                    </span>
                    <span className="font-semibold text-foreground tabular-nums">
                      {successRate}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-500 transition-[width] duration-700 ease-out"
                      style={{ width: `${successRate}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border bg-secondary/40 p-3">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                      </span>
                      <span className="text-xs font-medium">Hoạt động</span>
                    </div>
                    <p className="mt-1 text-2xl font-bold text-foreground tabular-nums">
                      {activeSites}
                    </p>
                    <p className="text-xs text-muted-foreground">vệ tinh</p>
                  </div>
                  <div className="rounded-xl border border-border bg-secondary/40 p-3">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                      <FileText className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">Bài viết</span>
                    </div>
                    <p className="mt-1 text-2xl font-bold text-foreground tabular-nums">
                      {posts.length}
                    </p>
                    <p className="text-xs text-muted-foreground">đã soạn</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lối tắt */}
            <Card className="border border-border shadow-sm overflow-hidden animate-rise">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-foreground text-lg">
                  Lối tắt
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Truy cập nhanh các tác vụ thường dùng
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3">
                <div className="space-y-1">
                  {quickActions.map((action) => (
                    <button
                      key={action.path}
                      onClick={() => navigate(action.path)}
                      className="group flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors duration-200 hover:bg-secondary cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/50 transition-colors duration-200">
                        <action.icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {action.title}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {action.description}
                        </p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground/50 group-hover:text-amber-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Modal phát TVC — video chỉ tải khi mở (tiết kiệm băng thông) */}
      <Dialog open={videoOpen} onOpenChange={setVideoOpen}>
        <DialogContent className="max-w-3xl border-none bg-black p-0 overflow-hidden">
          <DialogTitle className="sr-only">TVC giới thiệu POSTA</DialogTitle>
          {videoOpen && (
            <video
              src={POSTA_TVC}
              poster="/posta.jpg"
              controls
              autoPlay
              className="h-auto w-full rounded-lg"
            >
              Trình duyệt của bạn không hỗ trợ phát video.
            </video>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Home;
