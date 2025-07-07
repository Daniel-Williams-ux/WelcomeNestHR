import HeroSection from "@/components/HeroSection";
import FeaturesOverview from "@/components/FeaturesOverview";
import WhyWelcomeNestHR from "@/components/WhyWelcomeNestHR";
import  SmartOnboarding  from "@/components/homepage/SmartOnboarding";
import { LifeSync } from "@/components/homepage/LifeSync";
import { Collaborate } from "@/components/homepage/Collaborate";
import { Compliance } from "@/components/homepage/Compliance";
import { Primer } from "@/components/homepage/Primer";

import JourneyTimeline from "@/components/JourneyTimeline";
import TestimonialsSlide from "@/components/TestimonialsSlider";


export default function HomePage() {
  return (
    <>
      <main className="pt-16">
        {/* 1. Hero – Clear pitch */}
        <HeroSection />
        {/* 2. Why WelcomeNest – emotional + strategic hook */}
        <WhyWelcomeNestHR />
        {/* 3. Platform Modules Overview (high-level) */}
        <FeaturesOverview />
        {/* 4. Key Modules as Highlights – deeper dives */}
        <SmartOnboarding />
        <LifeSync />
        <Collaborate />
        <Compliance />
        <Primer />
        {/* 5. Journey Timeline – reinforces your lifecycle + outcomes */}
        <JourneyTimeline />
        <TestimonialsSlide />
        {/* 7. CTA or Pricing Overview */}
        {/* <CallToAction />  */}
        Demo”
      </main>
    </>
  );
}