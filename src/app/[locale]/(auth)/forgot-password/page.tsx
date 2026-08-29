import { getTranslations } from "next-intl/server";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Link } from "@/i18n/navigation";

export default async function ForgotPasswordPage() {
  const t = await getTranslations("auth.forgotPassword");

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">{t("title")}</h1>
      <p className="mt-1.5 text-sm text-foreground-muted">{t("subtitle")}</p>

      <div className="mt-6">
        <ForgotPasswordForm />
      </div>

      <p className="mt-6 text-center text-sm text-foreground-muted">
        <Link href="/login" className="font-medium text-brand-turquoise hover:underline">
          {t("backToLoginLink")}
        </Link>
      </p>
    </div>
  );
}
