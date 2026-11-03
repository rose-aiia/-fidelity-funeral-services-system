import { CheckList } from '@/components/ui/CheckList'
import { SectionHead } from '@/components/ui/SectionHead'
import { StatCard } from '@/components/ui/StatCard'
import { attentionStats, dashboardStats, weeklyStats } from './data'
import './provider.css'

export default function ProviderPortalPage() {
  return (
    <main className="container section provider-page__content" id="main-content">
      <SectionHead eyebrow="Provider portal" title="Operational support for funeral professionals." align="left" />

      <div className="split">
        <div className="provider-copy stack">
          <p>
            Review service requests, coordinate arrangements, track urgent follow-ups and keep family communication organised in one place.
          </p>
          <CheckList
            items={[
              'Service request queue and arrangement tracking',
              'Approved staff access and role-specific updates',
              'Family memorial milestones and callback reminders',
            ]}
          />
        </div>

        <StatCard rows={dashboardStats} />
      </div>

      <section className="provider-page__panels">
        <StatCard rows={weeklyStats} />
        <StatCard rows={attentionStats} />
      </section>
    </main>
  )
}
