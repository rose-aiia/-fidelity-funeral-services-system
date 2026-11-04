import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { QueryState } from '@/components/ui/QueryState'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusChip } from '@/components/ui/StatusChip'
import { requestKindLabel } from '@/features/account/data'
import { formatAge } from '@/lib/format'
import { formatPhone } from '@/lib/phone'
import type { AdminRequest } from './data'
import { assignmentDisplay, requestStatusDisplay, usePortalRole } from './portal-ui'
import { useRequests } from './queries'
import { RequestSheet } from './RequestSheet'
import './portal.css'

type Filter = 'all' | 'action' | 'progress' | 'complete'

const matches: Record<Filter, (request: AdminRequest, role: 'admin' | 'provider') => boolean> = {
  all: () => true,
  // Administrators act on requests nobody holds; providers act on ones waiting for their answer.
  action: (request, role) => (role === 'admin' ? request.status === 'received' : request.assignment?.status === 'assigned'),
  progress: (request) => request.status === 'assigned' || request.status === 'in_progress',
  complete: (request) => request.status === 'complete',
}

export default function RequestsPage() {
  const role = usePortalRole()
  const requests = useRequests()
  const [params, setParams] = useSearchParams()
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const focus = params.get('focus')

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return (requests.data ?? [])
      .filter((request) => matches[filter](request, role))
      .filter(
        (request) =>
          !needle ||
          [request.reference, request.customer.name, request.message, request.assignedTo ?? ''].some((text) => text.toLowerCase().includes(needle)),
      )
  }, [requests.data, filter, search, role])

  const selected = requests.data?.find((request) => request.id === focus)
  const close = () => setParams({}, { replace: true })

  const chips: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'action', label: role === 'admin' ? 'Needs assigning' : 'Waiting for me' },
    { id: 'progress', label: 'In progress' },
    { id: 'complete', label: 'Complete' },
  ]

  return (
    <div className="page-stack">
      <header className="page-head reveal">
        <p className="eyebrow">{role === 'admin' ? 'Requests' : 'Assignments'}</p>
        <h1>{role === 'admin' ? 'Families asking for help.' : 'Requests handed to you.'}</h1>
      </header>

      {requests.data ? (
        <>
          <div className="portal-toolbar">
            <div className="portal-toolbar__chips" role="group" aria-label="Filter requests">
              {chips.map((chip) => (
                <button key={chip.id} type="button" className="chip" aria-pressed={filter === chip.id} onClick={() => setFilter(chip.id)}>
                  {chip.label}
                </button>
              ))}
            </div>
            <label className="portal-search">
              <span className="visually-hidden">Search requests</span>
              <input type="search" className="input" placeholder="Search by reference, name or message" value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
          </div>

          {rows.length > 0 ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Reference</th>
                    <th scope="col">Family</th>
                    <th scope="col">Request</th>
                    <th scope="col">Status</th>
                    {role === 'admin' && <th scope="col">Handled by</th>}
                    <th scope="col">Received</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((request) => (
                    <tr key={request.id} onClick={() => setParams({ focus: request.id }, { replace: true })}>
                      <td data-label="Reference">
                        <button type="button" className="row-link" onClick={(event) => { event.stopPropagation(); setParams({ focus: request.id }, { replace: true }) }}>
                          {request.reference}
                        </button>
                        {request.urgent && <span className="urgent-tag">Urgent</span>}
                      </td>
                      <td data-label="Family">
                        <span className="cell-stack">
                          <strong>{request.customer.name}</strong>
                          <span>{formatPhone(request.customer.phone)}</span>
                        </span>
                      </td>
                      <td data-label="Request">
                        <span className="cell-stack">
                          <strong>{requestKindLabel[request.kind]}</strong>
                          <span className="cell-excerpt">{request.message || 'No message'}</span>
                        </span>
                      </td>
                      <td data-label="Status">
                        <StatusChip tone={requestStatusDisplay[request.status].tone}>{requestStatusDisplay[request.status].label}</StatusChip>
                      </td>
                      {role === 'admin' && (
                        <td data-label="Handled by">
                          {request.assignment ? (
                            <span className="cell-stack">
                              <strong>{request.assignment.providerName}</strong>
                              <span>{assignmentDisplay[request.assignment.status].label}</span>
                            </span>
                          ) : (
                            <span className="muted">Nobody yet</span>
                          )}
                        </td>
                      )}
                      <td data-label="Received">{formatAge(request.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card empty empty--large">
              <span className="icon-tile icon-tile--lg">
                <Icon name="check" size={24} />
              </span>
              <p>
                <strong>Nothing here.</strong>
                <span className="muted"> No requests match that filter.</span>
              </p>
            </div>
          )}
        </>
      ) : requests.isPending ? (
        <div className="page-stack" role="status" aria-busy="true">
          <span className="visually-hidden">Loading requests…</span>
          <Skeleton height="3rem" className="skeleton--card" />
          <Skeleton height="16rem" className="skeleton--card" />
        </div>
      ) : (
        <QueryState isPending={false} error={requests.error} onRetry={() => void requests.refetch()} noun="requests" />
      )}

      <RequestSheet request={selected} onClose={close} />
    </div>
  )
}
