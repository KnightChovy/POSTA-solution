import { useState, useCallback } from "react";
import { toast } from "react-toastify";

interface PerformanceMetrics {
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: "running" | "success" | "error";
  details?: any;
}

export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);

  const startMeasure = useCallback((operation: string) => {
    const startTime = performance.now();
    const metric: PerformanceMetrics = {
      operation,
      startTime,
      status: "running",
    };

    setMetrics((prev) => [...prev, metric]);

    console.log(
      `🚀 [Performance] Bắt đầu đo: ${operation} tại ${startTime.toFixed(2)}ms`
    );

    return startTime;
  }, []);

  const endMeasure = useCallback(
    (
      operation: string,
      startTime: number,
      status: "success" | "error" = "success",
      details?: any
    ) => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      setMetrics((prev) =>
        prev.map((metric) =>
          metric.operation === operation && metric.startTime === startTime
            ? { ...metric, endTime, duration, status, details }
            : metric
        )
      );

      // Format thời gian cho dễ đọc
      const formatTime = (ms: number) => {
        if (ms < 1000) return `${ms.toFixed(2)}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
      };

      const statusEmoji = status === "success" ? "✅" : "❌";
      const message = `${statusEmoji} [Performance] ${operation}: ${formatTime(
        duration
      )}`;

      console.log(message, details ? details : "");

      // Hiển thị toast với thông tin performance
      const toastMessage = `${operation}: ${formatTime(duration)}`;
      if (status === "success") {
        toast.success(toastMessage, {
          position: "bottom-right",
          autoClose: 3000,
          hideProgressBar: false,
        });
      } else {
        toast.error(`${operation} thất bại sau ${formatTime(duration)}`, {
          position: "bottom-right",
          autoClose: 5000,
        });
      }

      return duration;
    },
    []
  );

  const measureAsync = useCallback(
    async <T>(
      operation: string,
      asyncFunction: () => Promise<T>
    ): Promise<T> => {
      const startTime = startMeasure(operation);

      try {
        const result = await asyncFunction();
        endMeasure(operation, startTime, "success");
        return result;
      } catch (error) {
        endMeasure(operation, startTime, "error", error);
        throw error;
      }
    },
    [startMeasure, endMeasure]
  );

  const getAverageTime = useCallback(
    (operation: string) => {
      const operationMetrics = metrics.filter(
        (m) => m.operation === operation && m.duration
      );
      if (operationMetrics.length === 0) return 0;

      const totalTime = operationMetrics.reduce(
        (sum, m) => sum + (m.duration || 0),
        0
      );
      return totalTime / operationMetrics.length;
    },
    [metrics]
  );

  const getMetricsSummary = useCallback(() => {
    const summary = metrics.reduce((acc, metric) => {
      if (!metric.duration) return acc;

      if (!acc[metric.operation]) {
        acc[metric.operation] = {
          count: 0,
          totalTime: 0,
          successCount: 0,
          errorCount: 0,
          avgTime: 0,
          minTime: Infinity,
          maxTime: 0,
        };
      }

      const op = acc[metric.operation];
      op.count++;
      op.totalTime += metric.duration;
      op.avgTime = op.totalTime / op.count;
      op.minTime = Math.min(op.minTime, metric.duration);
      op.maxTime = Math.max(op.maxTime, metric.duration);

      if (metric.status === "success") op.successCount++;
      if (metric.status === "error") op.errorCount++;

      return acc;
    }, {} as Record<string, any>);

    return summary;
  }, [metrics]);

  const clearMetrics = useCallback(() => {
    setMetrics([]);
  }, []);

  return {
    metrics,
    startMeasure,
    endMeasure,
    measureAsync,
    getAverageTime,
    getMetricsSummary,
    clearMetrics,
  };
};
