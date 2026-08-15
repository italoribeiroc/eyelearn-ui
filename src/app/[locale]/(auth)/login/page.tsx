import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { LoginForm } from "@/components/auth/login-form";
import { Link } from "@/i18n/navigation";

export default function LoginPage() {
  const t = useTranslations("auth.login");

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">{t("title")}</h1>
      <p className="mt-1.5 text-sm text-foreground-muted">{t("subtitle")}</p>

      <div className="mt-6">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>

      <p className="mt-6 text-center text-sm text-foreground-muted">
        {t("noAccount")}{" "}
        <Link href="/register" className="font-medium text-brand-turquoise hover:underline">
          {t("signUpLink")}
        </Link>
      </p>
    </div>
  );
}
