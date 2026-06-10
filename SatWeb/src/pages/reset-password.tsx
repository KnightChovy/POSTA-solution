import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
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

const makeSchema = (t: TFunction) =>
  z
    .object({
      password: z.string().min(6, t("auth.passwordMin")),
      confirmPassword: z.string().min(1, t("auth.confirmPasswordRequired")),
    })
    .refine((d) => d.password === d.confirmPassword, {
      message: t("auth.passwordMismatch"),
      path: ["confirmPassword"],
    });

type FormData = z.infer<ReturnType<typeof makeSchema>>;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [show, setShow] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(makeSchema(t)),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const handleSubmit = async (data: FormData) => {
    if (!token) {
      toast.error(t("auth.invalidLinkMissingToken"));
      return;
    }
    setIsLoading(true);
    try {
      const res = await resetPasswordService(token, data.password);
      if (res?.error) {
        toast.error(res.message || t("auth.resetFailed"));
      } else {
        toast.success(res.message || t("auth.resetSuccess"));
        navigate("/login");
      }
    } catch {
      toast.error(t("auth.errorGeneric"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell title={t("auth.resetTitle")} subtitle={t("auth.resetSubtitle")}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-5">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("auth.newPasswordLabel")}</FormLabel>
                <FormControl>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3 size-4 text-muted-foreground" />
                    <Input
                      {...field}
                      type={show ? "text" : "password"}
                      placeholder={t("auth.passwordMinPlaceholder")}
                      disabled={isLoading}
                      className="h-11 pl-10 pr-10 focus-visible:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShow((v) => !v)}
                      className="absolute right-3 cursor-pointer text-muted-foreground hover:text-foreground"
                      aria-label={show ? t("auth.hidePassword") : t("auth.showPassword")}
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
                <FormLabel>{t("auth.confirmPasswordLabel")}</FormLabel>
                <FormControl>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3 size-4 text-muted-foreground" />
                    <Input
                      {...field}
                      type={show ? "text" : "password"}
                      placeholder={t("auth.confirmPasswordPlaceholder")}
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
            {t("auth.resetButton")}
          </Button>
        </form>
      </Form>
      <Link
        to="/login"
        className="mt-2 inline-flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:underline"
      >
        <ArrowLeft className="size-4" />
        {t("auth.backToLogin")}
      </Link>
    </AuthShell>
  );
}
