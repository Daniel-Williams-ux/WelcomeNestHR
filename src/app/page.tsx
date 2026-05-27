import HeroSection from "@/components/HeroSection";
import FeaturesOverview from "@/components/FeaturesOverview";
import WhyWelcomeNestHR from "@/components/WhyWelcomeNestHR";
import SmartOnboarding from "@/components/homepage/SmartOnboarding";
import { LifeSync } from "@/components/homepage/LifeSync";
import { Collaborate } from "@/components/homepage/Collaborate";
import { Compliance } from "@/components/homepage/Compliance";
import { Primer } from "@/components/homepage/Primer";
import JourneyTimeline from "@/components/JourneyTimeline";
import TestimonialsSlide from "@/components/TestimonialsSlider";

export default function HomePage() {
  return (
    <main className="pt-16">
      <HeroSection />
      <WhyWelcomeNestHR />
      <FeaturesOverview />
      <SmartOnboarding />
      <LifeSync />
      <Collaborate />
      <Compliance />
      <Primer />
      <JourneyTimeline />
      <TestimonialsSlide />
    </main>
  );
}
