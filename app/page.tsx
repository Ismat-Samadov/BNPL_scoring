import Hero from '@/components/landing/hero';
import StatsBar from '@/components/landing/stats-bar';
import FeaturesGrid from '@/components/landing/features-grid';
import HowItWorks from '@/components/landing/how-it-works';
import CtaSection from '@/components/landing/cta-section';

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsBar />
      <FeaturesGrid />
      <HowItWorks />
      <CtaSection />
    </>
  );
}
