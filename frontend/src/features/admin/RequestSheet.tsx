import { useState } from 'react'
import { Callout } from '@/components/ui/Callout'
import { Icon } from '@/components/ui/Icon'
import { Sheet } from '@/components/ui/Sheet'
import { StatusChip } from '@/components/ui/StatusChip'
import { requestKindLabel, CONTACT_OPTIONS } from '@/features/account/data'
import { getErrorMessage } from '@/lib/api-error'
import { formatAge, formatServiceTime } from '@/lib/format'
import { formatPhone } from '@/lib/phone'
import type { AdminRequest } from './data'
import { assignmentDisplay, requestActionLabel, requestStatusDisplay, usePortalRole } from './portal-ui'
import { useAssignRequest, useProviders, useRespondToRequest } from './queries'
import './portal.css'

type RequestSheetProps = {
  /** The request to show; `undefined` closes the sheet. */
  request: AdminRequest | undefined
  onClose: () => void
}

const contactLabel = (value: string) => CONTACT_OPTIONS.find((option) => option.value === value)?.label ?? value

export function RequestSheet({ request, onClose }: RequestSheetProps) {
  return (
    <Sheet open={Boolean(request)} onClose={onClose} eyebrow={request?.reference} title={request ? requestKindLabel[request.kind] : 'Request'}>
      {request && <RequestBody request={request} />}
    </Sheet>
  )
}

function RequestBody({ request }: { request: AdminRequest }) {
  const role = usePortalRole()
  const respond = useRespondToRequest()
  const status = requestStatusDisplay[request.status]
  const responses = request.actions.filter((action): action is 'accepted' | 'declined' | 'completed' => action !== 'assign')

  return (
    <>
      <div className="sheet-actions">
        <StatusChip tone={status.tone}>{status.label}</StatusChip>
        {request.urgent && <span className="urgent-tag">Urgent</span>}
      </div>

      <section className="sheet-section" aria-labelledby="family-title">
        <h3 id="family-title">The family</h3>
        <dl className="kv">
          <div>
            <dt>Name</dt>
            <dd>{request.customer.name}</dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>{formatPhone(request.customer.phone)}</dd>
          </div>
          <div>
            <dt>Prefers</dt>
            <dd>{contactLabel(request.contactPreference)}</dd>
          </div>
          {role === 'admin' && (
            <div>
              <dt>Policy</dt>
              <dd>{request.customer.policyNumber ? `${request.customer.policyNumber} (${request.customer.policyStatus})` : 'No policy linked'}</dd>
            </div>
          )}
          <div>
            <dt>Received</dt>
            <dd>
              {formatAge(request.createdAt)} · {formatServiceTime(request.createdAt)}
            </dd>
          </div>
        </dl>
      </section>

      <section className="sheet-section" aria-labelledby="message-title">
        <h3 id="message-title">What they said</h3>
        {request.message ? <blockquote className="quote">“{request.message}”</blockquote> : <p className="muted">They didn’t leave a message. Please call.</p>}
      </section>

      {request.assignment && (
        <section className="sheet-section" aria-labelledby="assignment-title">
          <h3 id="assignment-title">Handled by</h3>
          <dl className="kv">
            <div>
              <dt>Provider</dt>
              <dd>{request.assignment.providerName}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <StatusChip tone={assignmentDisplay[request.assignment.status].tone}>{assignmentDisplay[request.assignment.status].label}</StatusChip>
              </dd>
            </div>
            <div>
              <dt>Assigned</dt>
              <dd>{formatServiceTime(request.assignment.assignedAt)}</dd>
            </div>
            {request.assignment.respondedAt && (
              <div>
                <dt>Answered</dt>
                <dd>{formatServiceTime(request.assignment.respondedAt)}</dd>
              </div>
            )}
          </dl>
          {request.assignment.note && <p className="note-box">Note: {request.assignment.note}</p>}
        </section>
      )}

      {request.actions.includes('assign') && <AssignForm request={request} />}

      {respond.error && (
        <Callout tone="danger" role="alert">
          {getErrorMessage(respond.error)}
        </Callout>
      )}

      {responses.length > 0 && (
        <section className="sheet-section" aria-labelledby="actions-title">
          <h3 id="actions-title">{role === 'admin' ? 'Or close it' : 'Your answer'}</h3>
          <div className="sheet-actions">
            {responses.map((action) => (
              <button
                key={action}
                type="button"
                className={`btn btn--sm ${action === 'declined' ? 'btn--outline' : action === 'completed' && role === 'admin' ? 'btn--outline' : 'btn--primary'}`}
                disabled={respond.isPending}
                onClick={() => respond.mutate({ id: request.id, status: action })}
              >
                {action === 'accepted' && <Icon name="check" size={16} />}
                {requestActionLabel[action]}
              </button>
            ))}
          </div>
        </section>
      )}
    </>
  )
}

function AssignForm({ request }: { request: AdminRequest }) {
  const providers = useProviders()
  const assign = useAssignRequest()
  const [providerId, setProviderId] = useState('')
  const [note, setNote] = useState('')
  const [problem, setProblem] = useState<string>()

  const choices = (providers.data ?? []).filter((provider) => provider.isActive)
  const reassign = Boolean(request.assignment) && request.assignment?.status !== 'declined'

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!providerId) {
      setProblem('Choose who should take this on.')
      return
    }
    setProblem(undefined)
    assign.mutate({ id: request.id, providerId, note: note.trim() || undefined })
  }

  return (
    <form className="sheet-section" onSubmit={submit} noValidate aria-labelledby="assign-title">
      <h3 id="assign-title">{reassign ? 'Hand it to someone else' : 'Assign a provider'}</h3>
      {request.assignment?.status === 'declined' && (
        <Callout tone="warning" role="status">
          {request.assignment.providerName} declined this one. Choose another provider.
        </Callout>
      )}

      <div className="field">
        <label className="field__label" htmlFor="assign-provider">
          Provider
        </label>
        <select
          id="assign-provider"
          className="select"
          value={providerId}
          onChange={(event) => setProviderId(event.target.value)}
          aria-invalid={problem ? true : undefined}
          disabled={!providers.data}
        >
          <option value="">{providers.data ? 'Choose a provider' : 'Loading providers…'}</option>
          {choices.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.name} · {provider.providerType}, {provider.city}
            </option>
          ))}
        </select>
        {problem && (
          <small className="field__error" role="alert">
            {problem}
          </small>
        )}
      </div>

      <div className="field">
        <label className="field__label" htmlFor="assign-note">
          Note for the provider <small className="field__tag">Optional</small>
        </label>
        <textarea id="assign-note" className="textarea" rows={3} maxLength={300} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Anything they should know before they call." />
        <small className="field__hint">The family never sees this note.</small>
      </div>

      {assign.error && (
        <Callout tone="danger" role="alert">
          {getErrorMessage(assign.error)}
        </Callout>
      )}

      <div>
        <button type="submit" className="btn btn--primary btn--sm" disabled={assign.isPending}>
          {assign.isPending ? 'Assigning…' : reassign ? 'Reassign' : 'Assign'}
        </button>
      </div>
    </form>
  )
}
