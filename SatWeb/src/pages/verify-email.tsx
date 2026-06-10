import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { Loader2, CheckCircle2, XCircle, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuthShell from "@/components/auth/AuthShell";
import {
  verifyEmailService,
  resendVerificationService,
} from "@/service/authService";

type Status = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { t } = useTranslation();

  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);
  const verifiedRef = useRef(false); // tránh gọi 2 lần do StrictMode

  useEffect(() => {
    if (verifiedRef.current) return;
    verifiedRef.current = true;

    if (!token) {
      setStatus("error");
      setMessage(t("auth.invalidLinkMissingVerifyToken"));
      return;
    }

    verifyEmailService(token)
      .then((res) => {
        if (res?.error) {
          setStatus("error");
          setMessage(res.message || t("auth.verifyFailed"));
        } else {
          setStatus("success");
          setMessage(res.message || t("auth.verifySuccess"));
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage(t("auth.errorGeneric"));
      });
  }, [token, t]);

  const handleResend = async () => {
    if (!email) {
      toast.error(t("auth.enterEmailToResend"));
      return;
    }
    setResending(true);
    try {
      const res = await resendVerificationService(email);
      if (res?.error) {
        toast.error(res.message || t("auth.resendFailed"));
      } else {
        toast.success(res.message || t("auth.resendSuccessShort"));
      }
    } catch {
      toast.error(t("auth.errorGeneric"));
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell title={t("auth.verifyTitle")} subtitle={t("auth.verifySubtitle")}>
      <div className="flex flex-col items-center gap-5 rounded-xl border border-primary/15 bg-card p-8 text-center shadow-sm">
        {status === "loading" && (
          <>
            <Loader2 className="size-12 animate-spin text-primary" />
            <p className="font-semibold text-foreground">{t("auth.verifying")}</p>
          </>
        )}

        {status === "success" && (
          <>
            <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="size-7" />
            </span>
            <div>
              <p className="text-lg font-bold text-foreground">{t("auth.success")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{message}</p>
            </div>
            <Button asChild className="w-full cursor-pointer gap-2">
              <Link to="/login">
                {t("auth.loginNow")}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <span className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <XCircle className="size-7" />
            </span>
            <div>
              <p className="text-lg font-bold text-foreground">{t("auth.verifyError")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{message}</p>
            </div>

            {/* Gửi lại email xác thực */}
            <div className="flex w-full flex-col gap-3 border-t border-border pt-5">
              <p className="text-sm text-muted-foreground">{t("auth.resendVerificationLabel")}</p>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 size-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth.registeredEmailPlaceholder")}
                  className="h-11 pl-10 focus-visible:ring-primary"
                />
              </div>
              <Button
                onClick={handleResend}
                disabled={resending}
                className="h-11 w-full cursor-pointer gap-2"
              >
                {resending && <Loader2 className="size-4 animate-spin" />}
                {t("auth.resendVerification")}
              </Button>
              <Link
                to="/login"
                className="text-sm font-semibold text-primary hover:underline"
              >
                {t("auth.backToLogin")}
              </Link>
            </div>
          </>
        )}
      </div>
    </AuthShell>
  );
}
