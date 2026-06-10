import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Clock, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PerformanceDisplayProps {
  metrics: any[];
  onClear: () => void;
}

export const PerformanceDisplay: React.FC<PerformanceDisplayProps> = ({
  metrics,
  onClear,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useTranslation();

  // Tính toán thống kê realtime
  const realtimeStats = React.useMemo(() => {
    const completedMetrics = metrics.filter(
      (m) => m.duration && m.status !== "running"
    );
    const runningMetrics = metrics.filter((m) => m.status === "running");

    if (completedMetrics.length === 0) {
      return {
        totalOperations: metrics.length,
        averageTime: 0,
        successRate: 0,
        runningCount: runningMetrics.length,
        lastOperation: null,
      };
    }

    const totalTime = completedMetrics.reduce(
      (sum, m) => sum + (m.duration || 0),
      0
    );
    const successCount = completedMetrics.filter(
      (m) => m.status === "success"
    ).length;

    return {
      totalOperations: completedMetrics.length,
      averageTime: totalTime / completedMetrics.length,
      successRate: (successCount / completedMetrics.length) * 100,
      runningCount: runningMetrics.length,
      lastOperation: completedMetrics[completedMetrics.length - 1],
    };
  }, [metrics]);

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getPerformanceColor = (time: number) => {
    if (time < 1000) return "text-green-600";
    if (time < 3000) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">{t("nav.performanceMonitor")}</CardTitle>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? t("nav.collapse") : t("nav.details")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClear}
              disabled={metrics.length === 0}
            >
              {t("nav.clear")}
            </Button>
          </div>
        </div>
        <CardDescription>{t("nav.performanceDescription")}</CardDescription>
      </CardHeader>

      <CardContent>
        {/* Thống kê tổng quan */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {realtimeStats.totalOperations}
            </div>
            <div className="text-sm text-gray-600">{t("nav.totalOperations")}</div>
          </div>

          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div
              className={`text-2xl font-bold ${getPerformanceColor(
                realtimeStats.averageTime
              )}`}
            >
              {formatTime(realtimeStats.averageTime)}
            </div>
            <div className="text-sm text-gray-600">{t("nav.averageTime")}</div>
          </div>

          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {realtimeStats.successRate.toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600">{t("nav.successRate")}</div>
          </div>

          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {realtimeStats.runningCount}
            </div>
            <div className="text-sm text-gray-600">{t("nav.running")}</div>
          </div>
        </div>

        {/* Thao tác gần nhất */}
        {realtimeStats.lastOperation && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">{t("nav.lastOperation")}</span>
              <span className="text-sm text-gray-500">
                {new Date(
                  Date.now() -
                    (performance.now() - realtimeStats.lastOperation.endTime)
                ).toLocaleTimeString()}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm">
                {realtimeStats.lastOperation.operation}
              </span>
              <div className="flex items-center space-x-2">
                {realtimeStats.lastOperation.status === "success" ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span
                  className={`font-medium ${getPerformanceColor(
                    realtimeStats.lastOperation.duration
                  )}`}
                >
                  {formatTime(realtimeStats.lastOperation.duration)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Chi tiết metrics */}
        {isExpanded && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">{t("nav.operationHistory")}</h4>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {metrics
                .slice()
                .reverse()
                .map((metric, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded text-sm ${
                      metric.status === "running"
                        ? "bg-blue-50"
                        : metric.status === "success"
                        ? "bg-green-50"
                        : "bg-red-50"
                    }`}
                  >
                    <span className="flex-1">{metric.operation}</span>
                    <div className="flex items-center space-x-2">
                      {metric.status === "running" ? (
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                          <span className="text-blue-600">{t("nav.runningEllipsis")}</span>
                        </div>
                      ) : (
                        <>
                          {metric.status === "success" ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-red-600">✗</span>
                          )}
                          <span
                            className={getPerformanceColor(metric.duration)}
                          >
                            {formatTime(metric.duration)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {metrics.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{t("nav.noPerformanceData")}</p>
            <p className="text-sm">{t("nav.startTrackingHint")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
