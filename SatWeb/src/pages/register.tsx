import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
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

const makeRegisterSchema = (t: TFunction) =>
  z
    .object({
      name: z.string().min(1, t("auth.nameRequired")),
      email: z
        .string()
        .min(1, t("auth.emailRequired"))
        .email(t("auth.emailInvalid")),
      password: z
        .string()
        .min(1, t("auth.passwordRequired"))
        .min(6, t("auth.passwordMin")),
      confirmPassword: z.string().min(1, t("auth.confirmPasswordRequired")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("auth.passwordMismatch"),
      path: ["confirmPassword"],
    });

type RegisterFormData = z.infer<ReturnType<typeof makeRegisterSchema>>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const register = useAuthStore((state) => state.register);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(makeRegisterSchema(t)),
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
        toast.error(response.message || t("auth.registerFailed"));
      } else {
        toast.success(
          response?.message || t("auth.registerSuccess")
        );
        navigate("/login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell title={t("auth.registerTitle")} subtitle={t("auth.registerSubtitle")}>
      <div className="flex flex-col gap-5">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleRegister)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auth.nameLabel")}</FormLabel>
                  <FormControl>
                    <div className="relative flex items-center">
                      <User className="absolute left-3 size-4 text-muted-foreground" />
                      <Input
                        {...field}
                        placeholder={t("auth.namePlaceholder")}
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
                  <FormLabel>{t("auth.emailLabel")}</FormLabel>
                  <FormControl>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3 size-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type="email"
                        placeholder={t("auth.emailPlaceholder")}
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
                  <FormLabel>{t("auth.passwordLabel")}</FormLabel>
                  <FormControl>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-3 size-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type={showPassword ? "text" : "password"}
                        placeholder={t("auth.passwordMinPlaceholder")}
                        disabled={isLoading}
                        className="h-11 pl-10 pr-10 focus-visible:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 cursor-pointer text-muted-foreground hover:text-foreground"
                        aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
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
                  <FormLabel>{t("auth.confirmPasswordLabel")}</FormLabel>
                  <FormControl>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-3 size-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type={showPassword ? "text" : "password"}
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
              className="mt-1 h-11 w-full cursor-pointer gap-2 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading && <Loader2 className="size-4 animate-spin" />}
              {t("auth.registerButton")}
            </Button>
          </form>
        </Form>

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">{t("auth.or")}</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <GoogleLoginButton label={t("auth.registerWithGoogle")} />

        <p className="text-center text-sm text-muted-foreground">
          {t("auth.haveAccount")}{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            {t("auth.loginLink")}
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
