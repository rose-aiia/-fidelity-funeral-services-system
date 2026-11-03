import { useEffect, useState } from 'react'
import { Toast } from '@/components/ui/Toast'
import { formatUsd } from '@/lib/format'
import { submitQuoteRequest } from './api'
import type { Plan } from './data'
import { estimateTotal, SERVICE_TYPES, TOWNS, type ServiceType, type Town } from './pricing'

const TOAST_DURATION_MS = 3000

type Status = 'idle' | 'submitting' | 'success' | 'error'

export function QuoteForm({ plan }: { plan: Plan }) {
  const [serviceType, setServiceType] = useState<ServiceType>(SERVICE_TYPES[0])
  const [town, setTown] = useState<Town>(TOWNS[0])
  const [status, setStatus] = useState<Status>('idle')

  const estimatedTotal = estimateTotal(plan, town, serviceType)

  useEffect(() => {
    if (status !== 'success' && status !== 'error') return
    const timer = window.setTimeout(() => setStatus('idle'), TOAST_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [status])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('submitting')
    try {
      await submitQuoteRequest({ planId: plan.id, serviceType, town, estimatedTotal })
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  return (
    <aside className="card quote-card" id="quote-form">
      <div className="quote-card__header">
        <p className="eyebrow">Quick quotation</p>
        <h3>Request a sample arrangement estimate</h3>
      </div>

      <form onSubmit={handleSubmit} className="quote-form">
        <label className="field">
          <span>Service type</span>
          <select className="select" value={serviceType} onChange={(event) => setServiceType(event.target.value as ServiceType)}>
            {SERVICE_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Location</span>
          <select className="select" value={town} onChange={(event) => setTown(event.target.value as Town)}>
            {TOWNS.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Plan selected</span>
          <input className="input" value={plan.name} readOnly aria-readonly="true" />
        </label>

        <div className="quote-summary">
          <span>Estimated total</span>
          <strong>{formatUsd(estimatedTotal)}</strong>
        </div>

        <button type="submit" className="btn btn--primary btn--lg w-full" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Sending…' : 'Submit sample enquiry'}
        </button>
      </form>

      {status === 'success' && (
        <Toast>Sample enquiry submitted. A provider adviser would follow up with a formal quotation.</Toast>
      )}
      {status === 'error' && <Toast>We couldn’t send your enquiry. Please try again.</Toast>}
    </aside>
  )
}
