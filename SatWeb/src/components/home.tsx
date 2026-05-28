import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  BarChart2,
  Plus,
  Globe,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Activity,
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PostTable from "./posts/PostTable";
import PostForm from "./posts/PostForm";
import postStore from "@/store/postStore";
import useSatelliteStore from "@/store/satetillite";
import { Post } from "../../index";

const Home = () => {
  const navigate = useNavigate();

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

  const handleCreatePostClick = () => {
    navigate("/create-post");
  };

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
      value: totalPublishedPosts || 0,
      description: "Bài viết đã xuất bản",
      icon: CheckCircle2,
      iconBg: "bg-emerald-50 dark:bg-emerald-950/50",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      borderColor: "border-l-emerald-500",
    },
    {
      title: "Đăng thất bại",
      value: totalErrorPosts || 0,
      description: "Cần kiểm tra lại",
      icon: XCircle,
      iconBg: "bg-red-50 dark:bg-red-950/50",
      iconColor: "text-red-600 dark:text-red-400",
      borderColor: "border-l-red-500",
    },
    {
      title: "Website vệ tinh",
      value: satellites?.length ?? 0,
      description: "Đang hoạt động",
      icon: Globe,
      iconBg: "bg-blue-50 dark:bg-blue-950/50",
      iconColor: "text-blue-600 dark:text-blue-400",
      borderColor: "border-l-blue-500",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-subtle">
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-[1600px] mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-1">
                Quản lý bài viết
              </h1>
              <p className="hidden sm:block text-sm text-muted-foreground">
                Tạo, chỉnh sửa và xuất bản bài viết lên các website vệ tinh của
                bạn.
              </p>
            </div>
            <Button
              onClick={handleCreatePostClick}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 transition-all duration-200 px-6"
            >
              <Plus className="h-4 w-4" />
              <span>Tạo bài viết</span>
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {stats.map((stat, index) => (
              <Card
                key={index}
                className={`relative overflow-hidden bg-card border-l-4 ${stat.borderColor} border border-border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-bold text-foreground">
                        {stat.value}
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        {stat.description}
                      </p>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.iconBg}`}>
                      <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Post Table */}
          <Card
            id="posts-section"
            className="border border-border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
          >
            <CardHeader className="bg-gradient-to-r from-secondary/50 to-muted/50 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50">
                  <Activity className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <CardTitle className="text-foreground text-lg">
                    Danh sách bài viết
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Quản lý và theo dõi tiến trình xuất bản bài viết
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <PostTable posts={posts} />
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Home;
