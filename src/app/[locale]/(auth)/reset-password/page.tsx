import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default async function ResetPasswordPage() {
  const t = await getTranslations("auth.resetPassword");

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">{t("title")}</h1>
      <p className="mt-1.5 text-sm text-foreground-muted">{t("subtitle")}</p>

      <div className="mt-6">
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
