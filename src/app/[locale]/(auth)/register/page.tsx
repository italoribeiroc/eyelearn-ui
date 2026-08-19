import { getTranslations } from "next-intl/server";
import { RegisterForm } from "@/components/auth/register-form";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const [t, tCommon, { plan }] = await Promise.all([
    getTranslations("auth.register"),
    getTranslations("auth.common"),
    searchParams,
  ]);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">{t("title")}</h1>
      <p className="mt-1.5 text-sm text-foreground-muted">{t("subtitle")}</p>

      <div className="mt-6 space-y-4">
        <GoogleAuthButton hideDivider plan={plan} />
        <p className="text-center text-sm text-foreground-muted">
          {t("haveAccount")}{" "}
          <Link
            href={plan ? `/login?plan=${plan}` : "/login"}
            className="font-medium text-brand-turquoise hover:underline"
          >
            {t("logInLink")}
          </Link>
        </p>
      </div>

      <div className="my-6 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">{tCommon("orSignUpWithEmail")}</span>
        <Separator className="flex-1" />
      </div>

      <RegisterForm plan={plan} />
    </div>
  );
}
