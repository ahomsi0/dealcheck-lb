import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { WhatWeLookFor } from "@/components/landing/WhatWeLookFor";
import { BuiltForLebanon } from "@/components/landing/BuiltForLebanon";
import { CategoryGrid } from "@/components/landing/CategoryGrid";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <HowItWorks />
      <WhatWeLookFor />
      <BuiltForLebanon />
      <CategoryGrid />
    </>
  );
}
