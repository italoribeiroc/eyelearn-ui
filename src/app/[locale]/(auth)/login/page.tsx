import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/components/auth/login-form";
import { Link } from "@/i18n/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const [t, { plan }] = await Promise.all([getTranslations("auth.login"), searchParams]);

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
        <Link
          href={plan ? `/register?plan=${plan}` : "/register"}
          className="font-medium text-brand-turquoise hover:underline"
        >
          {t("signUpLink")}
        </Link>
      </p>
    </div>
  );
}
