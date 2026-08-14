import { HeroSection } from "@/components/marketing/hero-section";
import { ValuePropSection } from "@/components/marketing/value-prop-section";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { AiFeatureShowcase } from "@/components/marketing/ai-feature-showcase";
import { StreakShowcase } from "@/components/marketing/streak-showcase";
import { ProductPreview } from "@/components/marketing/product-preview";
import { BenefitsSection } from "@/components/marketing/benefits-section";
import { PricingSection } from "@/components/marketing/pricing-section";
import { FinalCta } from "@/components/marketing/final-cta";

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <ValuePropSection />
      <HowItWorksSection />
      <AiFeatureShowcase />
      <StreakShowcase />
      <ProductPreview />
      <BenefitsSection />
      <PricingSection />
      <FinalCta />
    </>
  );
}
