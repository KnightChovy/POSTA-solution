// Tiện ích hiển thị gói dịch vụ (dùng chung cho landing / pricing / profile / admin).

export function formatVND(amount: number): string {
  if (!amount || amount <= 0) return "Miễn phí";
  return amount.toLocaleString("vi-VN") + "đ";
}

const PERIOD_LABEL: Record<string, string> = {
  week: "tuần",
  month: "tháng",
  none: "",
};

// Mô tả một giới hạn dạng "5 website", "không giới hạn AI", "3 bài/tháng".
export function limitText(value: number, noun: string, period?: string): string {
  if (value === -1) return `Không giới hạn ${noun}`;
  const suffix = period && PERIOD_LABEL[period] ? `/${PERIOD_LABEL[period]}` : "";
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
