import { useState } from 'react'
import { Section } from '@/components/ui/Section'
import { SectionHead } from '@/components/ui/SectionHead'
import { formatUsd } from '@/lib/format'
import { DEFAULT_PLAN_ID, plans } from './data'
import { QuoteForm } from './QuoteForm'
import './plans.css'

export function PlansSection() {
  const [selectedPlanId, setSelectedPlanId] = useState(DEFAULT_PLAN_ID)
  const activePlan = plans.find((plan) => plan.id === selectedPlanId) ?? plans[0]

  return (
    <Section id="plans" containerClassName="split">
      <div>
        <SectionHead eyebrow="Funeral plans" title="Sample plans and quotation guidance." align="left" />

        <div className="grid grid--3 plan-grid">
          {plans.map((plan) => {
            const isSelected = plan.id === activePlan.id
            return (
              <button
                type="button"
                key={plan.id}
                className={`card card--interactive stack plan-card ${isSelected ? 'plan-card--selected' : ''} ${plan.popular ? 'plan-card--popular' : ''}`}
                onClick={() => setSelectedPlanId(plan.id)}
                aria-pressed={isSelected}
              >
                {plan.popular && <span className="badge">Most chosen</span>}
                <div className="plan-card__header">
                  <h3>{plan.name}</h3>
                  <div className="plan-card__price">
                    {formatUsd(plan.price)}
                    <small>starting estimate</small>
                  </div>
                </div>
                <p>{plan.description}</p>
                <ul className="check-list">
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </button>
            )
          })}
        </div>
      </div>

      <QuoteForm plan={activePlan} />
    </Section>
  )
}
