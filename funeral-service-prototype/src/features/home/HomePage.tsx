import { FaqSection } from '@/features/faq/FaqSection'
import { MarketplaceSection } from '@/features/marketplace/MarketplaceSection'
import { PlansSection } from '@/features/plans/PlansSection'
import { ProviderTeaserSection } from '@/features/provider/ProviderTeaserSection'
import { DiasporaSection } from './sections/DiasporaSection'
import { EmergencyStrip } from './sections/EmergencyStrip'
import { HeroSection } from './sections/HeroSection'
import { LegacyStudioSection } from './sections/LegacyStudioSection'
import { MemorialsSection } from './sections/MemorialsSection'
import { PathwaysSection } from './sections/PathwaysSection'
import { ServicesSection } from './sections/ServicesSection'
import { SupportSection } from './sections/SupportSection'
import './home.css'

export function HomePage() {
  return (
    <>
      <HeroSection />
      <EmergencyStrip />
      <PathwaysSection />
      <ServicesSection />
      <PlansSection />
      <DiasporaSection />
      <MemorialsSection />
      <LegacyStudioSection />
      <MarketplaceSection />
      <ProviderTeaserSection />
      <SupportSection />
      <FaqSection />
    </>
  )
}
