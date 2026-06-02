import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "react-toastify";
import { Lock, Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import AuthShell from "@/components/auth/AuthShell";
import { resetPasswordService } from "@/service/authService";

const schema = z
  .object({
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [show, setShow] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const handleSubmit = async (data: FormData) => {
    if (!token) {
      toast.error("Liên kết không hợp lệ — thiếu mã.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await resetPasswordService(token, data.password);
      if (res?.error) {
        toast.error(res.message || "Đặt lại mật khẩu thất bại.");
      } else {
        toast.success(res.message || "Đặt lại mật khẩu thành công!");
        navigate("/login");
      }
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell title="Đặt lại mật khẩu" subtitle="Nhập mật khẩu mới cho tài khoản của bạn">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-5">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mật khẩu mới</FormLabel>
                <FormControl>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3 size-4 text-muted-foreground" />
                    <Input
                      {...field}
                      type={show ? "text" : "password"}
                      placeholder="Tối thiểu 6 ký tự"
                      disabled={isLoading}
                      className="h-11 pl-10 pr-10 focus-visible:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShow((v) => !v)}
                      className="absolute right-3 cursor-pointer text-muted-foreground hover:text-foreground"
                      aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Xác nhận mật khẩu</FormLabel>
                <FormControl>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3 size-4 text-muted-foreground" />
                    <Input
                      {...field}
                      type={show ? "text" : "password"}
                      placeholder="Nhập lại mật khẩu"
                      disabled={isLoading}
                      className="h-11 pl-10 focus-visible:ring-primary"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            disabled={isLoading}
            className="h-11 w-full cursor-pointer gap-2 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            {isLoading && <Loader2 className="size-4 animate-spin" />}
            Đặt lại mật khẩu
          </Button>
        </form>
      </Form>
      <Link
        to="/login"
        className="mt-2 inline-flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:underline"
      >
        <ArrowLeft className="size-4" />
        Quay lại đăng nhập
      </Link>
    </AuthShell>
  );
}
