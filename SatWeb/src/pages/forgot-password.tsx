import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "react-toastify";
import { Loader2, Mail, ArrowLeft, MailCheck } from "lucide-react";
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
import { forgotPasswordService } from "@/service/authService";

const forgotSchema = z.object({
  email: z.string().min(1, "Email là bắt buộc").email("Email không hợp lệ"),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const form = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  const handleSubmit = async (data: ForgotFormData) => {
    setIsLoading(true);
    try {
      const res = await forgotPasswordService(data.email);
      if (res?.error) {
        toast.error(res.message || "Có lỗi xảy ra, vui lòng thử lại.");
      } else {
        setSent(true);
        toast.success(res.message || "Đã gửi hướng dẫn đặt lại mật khẩu.");
      }
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Quên mật khẩu?"
      subtitle="Nhập email để nhận liên kết đặt lại mật khẩu"
    >
      {sent ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-primary/15 bg-card p-8 text-center shadow-sm">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailCheck className="size-7" />
          </span>
          <div>
            <p className="font-bold text-foreground">Kiểm tra hộp thư của bạn</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Chúng tôi đã gửi liên kết đặt lại mật khẩu tới{" "}
              <span className="font-semibold text-foreground">{form.getValues("email")}</span>.
            </p>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="size-4" />
            Quay lại đăng nhập
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-5">
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

              <Button
                type="submit"
                disabled={isLoading}
                className="h-11 w-full cursor-pointer gap-2 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading && <Loader2 className="size-4 animate-spin" />}
                Gửi liên kết đặt lại
              </Button>
            </form>
          </Form>

          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="size-4" />
            Quay lại đăng nhập
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
