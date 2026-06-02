import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "react-toastify";
import { Eye, EyeOff, Loader2, User, Mail, Lock } from "lucide-react";
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
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";
import { useAuthStore } from "@/store/authStore";

const registerSchema = z
  .object({
    name: z.string().min(1, "Họ tên là bắt buộc"),
    email: z.string().min(1, "Email là bắt buộc").email("Email không hợp lệ"),
    password: z
      .string()
      .min(1, "Mật khẩu là bắt buộc")
      .min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const register = useAuthStore((state) => state.register);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: (location.state as any)?.email || "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleRegister = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const response = await register(data.name, data.email, data.password);
      if (response?.error) {
        toast.error(response.message || "Đăng ký thất bại!");
      } else {
        toast.success(
          response?.message ||
            "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản."
        );
        navigate("/login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell title="Tạo tài khoản POSTA" subtitle="Bắt đầu tự động hóa đăng bài chỉ trong vài phút">
      <div className="flex flex-col gap-5">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleRegister)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Họ và tên</FormLabel>
                  <FormControl>
                    <div className="relative flex items-center">
                      <User className="absolute left-3 size-4 text-muted-foreground" />
                      <Input
                        {...field}
                        placeholder="Nguyễn Văn A"
                        disabled={isLoading}
                        className="h-11 pl-10 focus-visible:ring-primary"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3 size-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type="email"
                        placeholder="ban@congty.vn"
                        disabled={isLoading}
                        className="h-11 pl-10 focus-visible:ring-primary"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mật khẩu</FormLabel>
                  <FormControl>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-3 size-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type={showPassword ? "text" : "password"}
                        placeholder="Tối thiểu 6 ký tự"
                        disabled={isLoading}
                        className="h-11 pl-10 pr-10 focus-visible:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 cursor-pointer text-muted-foreground hover:text-foreground"
                        aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
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
                        type={showPassword ? "text" : "password"}
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
              className="mt-1 h-11 w-full cursor-pointer gap-2 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading && <Loader2 className="size-4 animate-spin" />}
              Đăng ký
            </Button>
          </form>
        </Form>

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">hoặc</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <GoogleLoginButton label="Đăng ký với Google" />

        <p className="text-center text-sm text-muted-foreground">
          Đã có tài khoản?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
