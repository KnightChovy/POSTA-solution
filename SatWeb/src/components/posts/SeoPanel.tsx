import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  Loader2,
  Send,
  Tag,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  SeoEvaluation,
  SeoMetrics,
  SeoStatus,
} from "@/store/seoStore";

interface SeoPanelProps {
  evaluation: SeoEvaluation;
  metrics: SeoMetrics | null;
  optimizing: boolean;
  onOptimize: () => void;
  // Khi có onPublish, panel hiện nút "Đăng bài ngay" (chấm điểm xong mới đăng).
  onPublish?: () => void;
  publishing?: boolean;
}

// Màu theo điểm tổng: >=80 tốt (xanh), >=50 khá (vàng), còn lại yếu (đỏ).
const scoreColor = (score: number) =>
  score >= 80
    ? "text-emerald-600"
    : score >= 50
    ? "text-amber-500"
    : "text-red-500";

const ringColor = (score: number) =>
  score >= 80
    ? "border-emerald-500"
    : score >= 50
    ? "border-amber-400"
    : "border-red-400";

// Icon + màu cho từng trạng thái tiêu chí.
const statusIcon: Record<SeoStatus, React.ReactNode> = {
  pass: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
  warn: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
  fail: <XCircle className="w-4 h-4 text-red-500 shrink-0" />,
};

const MetricChip = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col items-center px-3 py-1.5 rounded-md bg-muted/60">
    <span className="text-sm font-semibold text-foreground">{value}</span>
    <span className="text-[11px] text-muted-foreground">{label}</span>
  </div>
);

const SeoPanel = ({
  evaluation,
  metrics,
  optimizing,
  onOptimize,
  onPublish,
  publishing = false,
}: SeoPanelProps) => {
  const { score, grade, keyword, summary, checks, suggestions } = evaluation;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="w-5 h-5 text-amber-500" />
          Đánh giá SEO
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Điểm tổng + nhận xét */}
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex flex-col items-center justify-center w-20 h-20 rounded-full border-4",
              ringColor(score)
            )}
          >
            <span className={cn("text-2xl font-bold", scoreColor(score))}>
              {score}
            </span>
            <span className="text-[10px] text-muted-foreground">/100</span>
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {grade || "—"}
              </Badge>
              {keyword && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Tag className="w-3 h-3" />
                  Từ khóa: {keyword}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{summary}</p>
          </div>
        </div>

        {/* Chỉ số đo nhanh */}
        {metrics && (
          <div className="flex flex-wrap gap-2">
            <MetricChip label="Số từ" value={String(metrics.wordCount)} />
            <MetricChip
              label="Mật độ KW"
              value={`${metrics.keywordDensity}%`}
            />
            <MetricChip
              label="KW/Tiêu đề"
              value={metrics.keywordInTitle ? "Có" : "Không"}
            />
            <MetricChip label="H2" value={String(metrics.h2Count)} />
            <MetricChip
              label="Ảnh thiếu alt"
              value={String(metrics.imagesMissingAlt)}
            />
          </div>
        )}

        {/* Checklist tiêu chí */}
        <div className="space-y-2">
          {checks.map((check, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              {statusIcon[check.status]}
              <div>
                <span className="font-medium text-foreground">
                  {check.label}
                </span>
                {check.detail && (
                  <span className="text-muted-foreground"> — {check.detail}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Gợi ý cải thiện */}
        {suggestions.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-foreground">
              Gợi ý cải thiện
            </p>
            <ul className="list-disc pl-5 space-y-1">
              {suggestions.map((s, i) => (
                <li key={i} className="text-sm text-muted-foreground">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Hành động: tối ưu lại hoặc đăng ngay */}
        <div className="pt-3 border-t space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onOptimize}
              disabled={optimizing || publishing}
              className="cursor-pointer"
            >
              {optimizing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang tối ưu...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Tối ưu lại chuẩn SEO
                </>
              )}
            </Button>

            {onPublish && (
              <Button
                type="button"
                onClick={onPublish}
                disabled={optimizing || publishing}
                className="cursor-pointer"
              >
                {publishing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang đăng...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Đăng bài ngay
                  </>
                )}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            "Tối ưu lại" sẽ viết lại nội dung trong trình soạn thảo (giữ nguyên
            ảnh và cấu trúc HTML). Xem điểm rồi bấm "Đăng bài ngay" để xuất bản.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SeoPanel;
