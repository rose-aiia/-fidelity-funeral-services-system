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
import { Reveal } from '@/components/ui/Reveal'
import './home.css'

export function HomePage() {
  return (
    <>
      <HeroSection />
      <EmergencyStrip />
      <PathwaysSection />
      <ServicesSection />
      <Reveal><PlansSection /></Reveal>
      <Reveal><DiasporaSection /></Reveal>
      <Reveal><MemorialsSection /></Reveal>
      <Reveal><LegacyStudioSection /></Reveal>
      <Reveal><MarketplaceSection /></Reveal>
      <Reveal><ProviderTeaserSection /></Reveal>
      <Reveal><SupportSection /></Reveal>
      <Reveal><FaqSection /></Reveal>
    </>
  )
}
