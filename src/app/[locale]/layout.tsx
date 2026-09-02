import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Baloo_2, Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/auth-context";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/seo/constants";
import "../globals.css";

const baloo = Baloo_2({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    // Base for every relative URL used in this app's metadata (og:image,
    // canonical, etc.) -- required once any of those are added, see
    // (marketing)/page.tsx's generateMetadata for where that happens.
    metadataBase: new URL(SITE_URL),
    title: t("title"),
    description: t("description"),
    // Keeps the iOS "Add to Home Screen" suggested name short ("Eye Learn")
    // instead of the full <title> tag, which iOS otherwise truncates awkwardly.
    appleWebApp: {
      title: "Eye Learn",
    },
    // Placeholder: replace with the real content value Google Search
    // Console shows after adding https://eyelearn.app as a property there
    // (HTML tag verification method) -- see the SEO plan for the full
    // manual verification flow. Harmless no-op meta tag until then.
    verification: {
      google: "GOOGLE_SITE_VERIFICATION_PLACEHOLDER",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${baloo.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased" suppressHydrationWarning>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider
            attribute="data-theme"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>{children}</AuthProvider>
            <Toaster />
          </ThemeProvider>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
