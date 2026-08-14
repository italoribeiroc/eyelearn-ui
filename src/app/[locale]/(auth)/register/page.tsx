import { useTranslations } from "next-intl";
import { RegisterForm } from "@/components/auth/register-form";
import { Link } from "@/i18n/navigation";

export default function RegisterPage() {
  const t = useTranslations("auth.register");

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">{t("title")}</h1>
      <p className="mt-1.5 text-sm text-foreground-muted">{t("subtitle")}</p>

      <div className="mt-6">
        <RegisterForm />
      </div>

      <p className="mt-6 text-center text-sm text-foreground-muted">
        {t("haveAccount")}{" "}
        <Link href="/login" className="font-medium text-brand-turquoise hover:underline">
          {t("logInLink")}
        </Link>
      </p>
    </div>
  );
}
