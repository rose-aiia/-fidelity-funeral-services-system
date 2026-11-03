import { CheckList } from '@/components/ui/CheckList'
import { Section } from '@/components/ui/Section'
import { StatCard } from '@/components/ui/StatCard'
import { dashboardStats } from './data'
import './provider.css'

export function ProviderTeaserSection() {
  return (
    <Section id="provider-portal" soft containerClassName="split">
      <div className="provider-copy stack">
        <p className="eyebrow">Provider portal</p>
        <h2>Operational support for funeral professionals.</h2>
        <p>
          This concept demonstrates how authorised providers can review quotations, manage service requests, update family communications and maintain listing information.
        </p>
        <CheckList
          items={[
            'Service request queue and arrangement tracking',
            'Family enquiry follow-up tools',
            'Approved staff access with defined visibility controls',
          ]}
        />
      </div>

      <StatCard rows={dashboardStats} />
    </Section>
  )
}
