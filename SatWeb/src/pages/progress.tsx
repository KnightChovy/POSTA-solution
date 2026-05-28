import React, { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import postStore from "@/store/postStore";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import useProgressStore from "@/store/progress";
import { stripHtmlTags } from "@/lib/utils";
import useSatelliteStore from "@/store/satetillite";
import { get } from "http";

type SiteStatus = "pending" | "in-progress" | "success" | "failed";

interface Site {
  id: number;
  name: string;
  status: SiteStatus;
  updatedAt: Date;
  url: string;
  msg: string;
  id_repost?: string;
}

const ProgressPage = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [activeFilter, setActiveFilter] = useState<SiteStatus | "all">("all");

  const posts = postStore((state) => state.posts);
  const addPost = postStore((state) => state.addPost);
  const getPost = postStore((state) => state.getPost);
  const getPostById = postStore((state) => state.getPostById);
  const rePost = postStore((state) => state.rePost);
  const { satelliteUrls } = useProgressStore();
  const { satellites } = useSatelliteStore();
  const location = useLocation();
  const post = location.state?.post;
  const newPost = location.state?.newPost;
  const realPost = useMemo(() => {
    return posts.find((p) => p._id === newPost?._id) || post;
  }, [posts, newPost, post, satellites]);

  const [realPostv2, setRealPostv2] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPost();
  }, [satellites]);

  useEffect(() => {
    const fetchPost = async () => {
      if (!realPost._id) return;
      setLoading(true);
      const result = await getPostById(realPost._id);
      if (result) setRealPostv2(result);
      setLoading(false);
    };

    fetchPost();
  }, [realPost._id, getPostById]);

  useEffect(() => {
    if (realPostv2) {
      const rate = realPostv2.successfulRate || 0;
      setOverallProgress(Number((rate * 100).toFixed(1)));
    }
  }, [realPostv2]);

  useEffect(() => {
    if (!realPostv2) return;

    const postedList = realPostv2.postedSatellite || [];
    const errorList = realPostv2.errorSatellite || [];

    const allSites: Site[] = [
      ...postedList.map((url: string, i: number) => ({
        id: i + 1,
        name: `Satellite ${i + 1}`,
        status: "success" as SiteStatus,
        updatedAt: new Date(),
        url,
        msg: "",
      })),
      ...errorList.map((err: any, i: number) => ({
        id: postedList.length + i + 1,
        name: `Satellite ${postedList.length + i + 1}`,
        status: "failed" as SiteStatus,
        updatedAt: new Date(),
        url: err.url,
        msg: getErrorMessage(err.errorCode),
        id_repost: realPostv2._id,
      })),
    ];

    setSites(allSites);
  }, [realPostv2, satelliteUrls]);

  const restartPublishing = async () => {
    toast.info("Đang làm mới dữ liệu...");
    await getPost();
  };

  const getErrorMessage = (code: number) => {
    switch (code) {
      case 400:
        return "Yêu cầu không hợp lệ.";
      case 401:
        return "Chưa xác thực.";
      case 403:
        return "Bị cấm truy cập.";
      case 404:
        return "Không tìm thấy trang web.";
      case 500:
        return "Lỗi máy chủ nội bộ.";
      default:
        return "Lỗi không xác định.";
    }
  };

  const filteredSites =
    activeFilter === "all"
      ? sites
      : sites.filter((site) => site.status === activeFilter);

  const StatusIcon = ({ status }: { status: SiteStatus }) => {
    const icons: Record<SiteStatus, JSX.Element> = {
      pending: <Clock className="h-5 w-5 text-gray-400" />,
      "in-progress": <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />,
      success: <CheckCircle className="h-5 w-5 text-green-500" />,
      failed: <XCircle className="h-5 w-5 text-red-500" />,
    };
    return icons[status];
  };

  const handleRepost = async (id) => {
    toast.info("Đang gửi lại bài viết...");

    const result = await rePost(id);

    if (result) {
      toast.success("Đã gửi lại bài viết thành công!");

      const updated = await getPostById(realPost._id);
      if (updated) {
        setRealPostv2(updated);
      }
    } else {
      toast.error("Gửi lại bài viết thất bại.");
    }
  };

  const SitesList = ({ sites }: { sites: Site[] }) => (
    <div className="space-y-3">
      {sites.length === 0 ? (
        <div className="text-center py-12">
          <div className="p-4 rounded-full bg-gray-50 inline-block mb-3">
            <Clock className="h-8 w-8 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">Không có dữ liệu</p>
          <p className="text-gray-400 text-sm mt-1">
            Đã xảy ra lỗi hoặc không có trang vệ tinh để hiển thị.
          </p>
        </div>
      ) : (
        sites.map((site) => (
          <div
            key={site.id}
            className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
              site.status === "success"
                ? "bg-emerald-50/50 border-emerald-100"
                : site.status === "failed"
                ? "bg-red-50/50 border-red-100"
                : "bg-white border-gray-100"
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`p-2 rounded-lg ${
                  site.status === "success"
                    ? "bg-emerald-100"
                    : site.status === "failed"
                    ? "bg-red-100"
                    : "bg-gray-100"
                }`}
              >
                <StatusIcon status={site.status} />
              </div>
              <div>
                <h3 className="font-medium text-foreground">{site.name}</h3>
                <p className="text-xs text-muted-foreground">
                  Cập nhật {site.updatedAt.toLocaleTimeString()}
                </p>
                <a
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:underline text-sm font-medium"
                >
                  {site.url}
                </a>
                {site.msg && (
                  <p className="text-red-500 text-sm mt-1 font-medium">
                    {site.msg}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        <div className="flex flex-col space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 shadow-lg shadow-amber-500/25">
                <Loader2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Tiến trình xuất bản
                </h1>
                <p className="text-muted-foreground text-sm">
                  Theo dõi trạng thái đăng bài lên các website vệ tinh
                </p>
              </div>
            </div>
            <Button
              onClick={() => handleRepost(realPostv2._id)}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white shadow-md shadow-amber-500/25"
            >
              <RefreshCw className="h-4 w-4" />
              Đăng lại bài viết
            </Button>
          </div>

          {/* Selected Post */}
          <Card className="border border-border shadow-sm overflow-hidden bg-card">
            <CardHeader className="bg-secondary/50 border-b border-border">
              <CardTitle className="text-lg text-foreground">
                Bài viết đã chọn
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {realPost ? (
                <div className="flex flex-col space-y-2">
                  <h3 className="font-semibold text-lg text-foreground">
                    {realPost.title}
                  </h3>
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {realPost.content ? stripHtmlTags(realPost.content) : ""}
                  </p>
                  {realPost.link && (
                    <a
                      href={realPost.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:underline text-sm font-medium"
                    >
                      {realPost.link}
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Chưa chọn bài viết</p>
              )}
            </CardContent>
          </Card>

          {/* Overall Progress */}
          <Card className="border border-border shadow-sm overflow-hidden bg-card">
            <CardHeader className="bg-secondary/50 border-b border-border">
              <CardTitle className="text-lg text-foreground">
                Tiến trình tổng thể
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-foreground">
                    {overallProgress
                      ? `${overallProgress}% Hoàn thành`
                      : "0% Hoàn thành"}
                  </span>
                  <span className="text-sm text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                    {sites.filter((s) => s.status === "success").length} /{" "}
                    {sites.length} sites
                  </span>
                </div>
                <Progress
                  value={overallProgress}
                  className="h-3 bg-secondary"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Card className="border border-border shadow-sm overflow-hidden bg-card">
            <CardHeader className="bg-secondary/50 border-b border-border">
              <CardTitle className="text-lg text-foreground">
                Website vệ tinh
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <Tabs
                value={activeFilter}
                onValueChange={(v) => setActiveFilter(v as SiteStatus | "all")}
                className="w-full"
              >
                <TabsList className="mb-4 bg-secondary/80 p-1 rounded-lg">
                  <TabsTrigger
                    value="all"
                    className="rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm"
                  >
                    Tất cả ({sites.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="success"
                    className="rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400"
                  >
                    Thành công (
                    {sites.filter((s) => s.status === "success").length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="failed"
                    className="rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400"
                  >
                    Thất bại (
                    {sites.filter((s) => s.status === "failed").length})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value={activeFilter}>
                  <SitesList sites={filteredSites} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProgressPage;
