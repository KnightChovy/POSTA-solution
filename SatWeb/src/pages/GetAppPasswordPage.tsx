import React, { useState } from "react";
import { Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const GetAppPasswordPage: React.FC = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  const curlExample = `curl -X POST "https://your-site.com/wp-json/wp/v2/media" \\
  -H "Authorization: Basic $(echo -n 'username:application_password' | base64)" \\
  -F "file=@/path/to/file.jpg"`;

  const fetchExample = `await fetch("https://your-site.com/wp-json/wp/v2/media", {
  method: "POST",
  headers: {
    "Authorization": "Basic " + btoa("username:application_password")
  },
  body: formData
});`;

  return (
    <div className="p-4 md:p-8 bg-gradient-subtle min-h-screen">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6 text-foreground">
          Hướng dẫn lấy{" "}
          <span className="text-primary bg-gradient-to-r from-amber-500 to-yellow-600 bg-clip-text text-transparent">
            Application Password
          </span>{" "}
          trên WordPress
        </h1>

        <section className="bg-card border border-border rounded-xl p-5 mb-5 shadow-sm hover:shadow-md transition-shadow duration-300">
          <h2 className="text-lg font-medium mb-3 text-foreground">
            1. Application Password là gì?
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Application Password là mật khẩu dùng tạm thời để ứng dụng bên ngoài
            (ví dụ script, tool hoặc ứng dụng của bạn) truy cập REST API của
            WordPress mà không cần chia sẻ mật khẩu chính. Sau khi tạo,
            WordPress sẽ hiển thị mật khẩu một lần duy nhất — bạn phải{" "}
            <strong className="text-foreground">sao chép ngay</strong> và lưu
            trữ an toàn.
          </p>
        </section>

        <section className="bg-card border border-border rounded-xl p-5 mb-5 shadow-sm hover:shadow-md transition-shadow duration-300">
          <h2 className="text-lg font-medium mb-3 text-foreground">
            2. Các bước tạo Application Password
          </h2>
          <ol className="list-decimal list-inside space-y-3 text-sm text-muted-foreground leading-relaxed">
            <li>
              Đăng nhập vào trang quản trị WordPress với tài khoản có quyền (ví
              dụ Administrator).
            </li>
            <li>
              Vào{" "}
              <strong className="text-foreground">Users &gt; Profile</strong>{" "}
              (hoặc{" "}
              <strong className="text-foreground">
                Users &gt; Your Profile
              </strong>
              ).
            </li>
            <li>
              Kéo xuống phần{" "}
              <strong className="text-foreground">Application Passwords</strong>
              .
            </li>
            <li>
              Nhập tên mô tả (ví dụ:{" "}
              <em className="text-amber-600 dark:text-amber-400">
                Admin API for uploader
              </em>
              ) rồi bấm{" "}
              <strong className="text-foreground">
                Add New Application Password
              </strong>
              .
            </li>
            <li>
              WordPress sẽ hiển thị một mật khẩu gồm 24 ký tự (thường có dấu
              cách). <strong className="text-foreground">Copy</strong> mật khẩu
              này ngay — bạn sẽ không thấy lại toàn bộ sau khi đóng.
            </li>
            <li>
              Lưu mật khẩu ở nơi an toàn (password manager) hoặc dán vào cấu
              hình server của bạn.
            </li>
          </ol>
        </section>
      </div>
    </div>
  );
};

export default GetAppPasswordPage;
