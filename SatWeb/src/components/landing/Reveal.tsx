import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Độ trễ hiệu ứng (ms) — dùng để tạo hiệu ứng nối tiếp giữa các phần tử. */
  delay?: number;
}

/**
 * Bọc nội dung để nó hiện dần (mờ + trượt lên) khi cuộn vào khung nhìn.
 * Hiệu ứng chỉ chạy một lần; người dùng bật "giảm chuyển động" sẽ không thấy
 * animation (xử lý ở index.css qua prefers-reduced-motion).
 */
const Reveal = ({ children, className, delay = 0 }: RevealProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "transition-all duration-700 ease-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        className
      )}
    >
      {children}
    </div>
  );
};

export default Reveal;
