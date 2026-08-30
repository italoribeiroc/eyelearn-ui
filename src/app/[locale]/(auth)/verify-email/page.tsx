import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { VerifyEmailStatus } from "@/components/auth/verify-email-status";

export default async function VerifyEmailPage() {
  const t = await getTranslations("auth.verifyEmail");

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">{t("title")}</h1>

      <div className="mt-6">
        <Suspense fallback={null}>
          <VerifyEmailStatus />
        </Suspense>
      </div>
    </div>
  );
}
