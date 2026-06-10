// Tiện ích hiển thị gói dịch vụ (dùng chung cho landing / pricing / profile / admin).
import i18n from "@/i18n";

export function formatVND(amount: number): string {
  if (!amount || amount <= 0) return i18n.t("plan.free");
  const locale = i18n.language === "en" ? "en-US" : "vi-VN";
  return amount.toLocaleString(locale) + "đ";
}

// Khoá i18n cho hậu tố kỳ hạn ("/tháng", "/tuần"); "none" = không hiển thị.
const PERIOD_KEY: Record<string, string> = {
  week: "plan.periodWeek",
  month: "plan.periodMonth",
  none: "",
};

// Mô tả một giới hạn dạng "5 website", "không giới hạn AI", "3 bài/tháng".
export function limitText(value: number, noun: string, period?: string): string {
  if (value === -1) return i18n.t("plan.unlimited", { noun });
  const suffix = period && PERIOD_KEY[period] ? `/${i18n.t(PERIOD_KEY[period])}` : "";
  return `${value} ${noun}${suffix}`;
}

// Phần trăm đã dùng (cho thanh quota). -1 (vô hạn) → 0%.
export function usagePercent(used: number, limit: number): number {
  if (limit === -1 || limit === 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

// Hiển thị "3 / 5" hoặc "3 / ∞".
export function usageText(used: number, limit: number): string {
  return `${used} / ${limit === -1 ? "∞" : limit}`;
}
