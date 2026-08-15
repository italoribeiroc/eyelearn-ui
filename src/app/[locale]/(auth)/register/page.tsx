import { useTranslations } from "next-intl";
import { RegisterForm } from "@/components/auth/register-form";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";

export default function RegisterPage() {
  const t = useTranslations("auth.register");
  const tCommon = useTranslations("auth.common");

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">{t("title")}</h1>
      <p className="mt-1.5 text-sm text-foreground-muted">{t("subtitle")}</p>

      <div className="mt-6 space-y-4">
        <GoogleAuthButton hideDivider />
        <p className="text-center text-sm text-foreground-muted">
          {t("haveAccount")}{" "}
          <Link href="/login" className="font-medium text-brand-turquoise hover:underline">
            {t("logInLink")}
          </Link>
        </p>
      </div>

      <div className="my-6 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">{tCommon("orSignUpWithEmail")}</span>
        <Separator className="flex-1" />
      </div>

      <RegisterForm />
    </div>
  );
}
