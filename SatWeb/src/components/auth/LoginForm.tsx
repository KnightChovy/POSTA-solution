import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, User, Lock } from "lucide-react";
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
import GoogleLoginButton from "./GoogleLoginButton";

const loginSchema = z.object({
  username: z.string().min(1, "Tên đăng nhập là bắt buộc"),
  password: z
    .string()
    .min(1, "Mật khẩu là bắt buộc")
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<void>;
  isLoading?: boolean;
}

export function LoginForm({ onSubmit, isLoading = false }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  return (
    <div className="flex flex-col gap-5">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email hoặc tên đăng nhập</FormLabel>
                <FormControl>
                  <div className="relative flex items-center">
                    <User className="absolute left-3 size-4 text-muted-foreground" />
                    <Input
                      {...field}
                      type="text"
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
                <div className="flex items-center justify-between">
                  <FormLabel>Mật khẩu</FormLabel>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
                <FormControl>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3 size-4 text-muted-foreground" />
                    <Input
                      {...field}
                      type={showPassword ? "text" : "password"}
                      placeholder="Nhập mật khẩu"
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

          <Button
            type="submit"
            disabled={isLoading}
            className="h-11 w-full cursor-pointer gap-2 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            {isLoading && <Loader2 className="size-4 animate-spin" />}
            Đăng nhập
          </Button>
        </form>
      </Form>

      {/* Phân cách */}
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">hoặc</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <GoogleLoginButton label="Đăng nhập với Google" />

      <p className="text-center text-sm text-muted-foreground">
        Chưa có tài khoản?{" "}
        <Link to="/register" className="font-semibold text-primary hover:underline">
          Đăng ký ngay
        </Link>
      </p>
    </div>
  );
}
