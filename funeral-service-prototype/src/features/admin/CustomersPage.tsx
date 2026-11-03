import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { QueryState } from '@/components/ui/QueryState'
import { Sheet } from '@/components/ui/Sheet'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusChip } from '@/components/ui/StatusChip'
import { requestKindLabel } from '@/features/account/data'
import { statusDisplay } from '@/features/account/cover'
import { orderStatusDisplay } from '@/features/marketplace/status'
import { formatDate, formatUsd } from '@/lib/format'
import { formatPhone } from '@/lib/phone'
import type { AdminCustomer } from './data'
import { requestStatusDisplay } from './portal-ui'
import { useCustomer, useCustomers } from './queries'
import './portal.css'

export default function CustomersPage() {
  const customers = useCustomers()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const focus = params.get('focus')

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return (customers.data ?? []).filter(
      (customer) => !needle || [customer.name, customer.phone, customer.policyNumber ?? '', customer.email ?? ''].some((text) => text.toLowerCase().includes(needle)),
    )
  }, [customers.data, search])

  const open = (id: string) => setParams({ focus: id }, { replace: true })

  return (
    <div className="page-stack">
      <header className="page-head reveal">
        <p className="eyebrow">Customers</p>
        <h1>The families you serve.</h1>
      </header>

      {customers.data ? (
        <>
          <div className="portal-toolbar">
            <p className="muted">
              {rows.length} {rows.length === 1 ? 'customer' : 'customers'}
            </p>
            <label className="portal-search">
              <span className="visually-hidden">Search customers</span>
              <input type="search" className="input" placeholder="Search by name, phone or policy" value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Customer</th>
                  <th scope="col">Policy</th>
                  <th scope="col" className="num">
                    Requests
                  </th>
                  <th scope="col" className="num">
                    Orders
                  </th>
                  <th scope="col" className="num">
                    Memorials
                  </th>
                  <th scope="col" className="num">
                    Spend
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((customer) => (
                  <CustomerRow key={customer.id} customer={customer} onOpen={() => open(customer.id)} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : customers.isPending ? (
        <div className="page-stack" role="status" aria-busy="true">
          <span className="visually-hidden">Loading customers…</span>
          <Skeleton height="16rem" className="skeleton--card" />
        </div>
      ) : (
        <QueryState isPending={false} error={customers.error} onRetry={() => void customers.refetch()} noun="customers" />
      )}

      <CustomerSheet id={focus ?? undefined} onClose={() => setParams({}, { replace: true })} />
    </div>
  )
}

function CustomerRow({ customer, onOpen }: { customer: AdminCustomer; onOpen: () => void }) {
  return (
    <tr onClick={onOpen}>
      <td>
        <button type="button" className="row-link" onClick={(event) => { event.stopPropagation(); onOpen() }}>
          {customer.name}
        </button>
        <span className="cell-stack">
          <span>{formatPhone(customer.phone)}</span>
        </span>
      </td>
      <td>
        {customer.policyNumber && customer.policyStatus ? (
          <span className="cell-stack">
            <strong>{customer.policyNumber}</strong>
            <span>
              <StatusChip tone={statusDisplay[customer.policyStatus].tone}>{statusDisplay[customer.policyStatus].label}</StatusChip>
            </span>
          </span>
        ) : (
          <span className="muted">No policy</span>
        )}
      </td>
      <td className="num">
        {customer.requestCount}
        {customer.openRequests > 0 && <span className="muted"> ({customer.openRequests} open)</span>}
      </td>
      <td className="num">{customer.orderCount}</td>
      <td className="num">{customer.memorialCount}</td>
      <td className="num">{formatUsd(customer.totalSpend)}</td>
    </tr>
  )
}

function CustomerSheet({ id, onClose }: { id: string | undefined; onClose: () => void }) {
  const customer = useCustomer(id)
  const data = customer.data

  return (
    <Sheet open={Boolean(id)} onClose={onClose} eyebrow="Customer" title={data?.name ?? 'Customer'}>
      {data ? (
        <>
          <section className="sheet-section" aria-labelledby="profile-title">
            <h3 id="profile-title">Profile</h3>
            <dl className="kv">
              <div>
                <dt>Phone</dt>
                <dd>{formatPhone(data.phone)}</dd>
              </div>
              {data.email && (
                <div>
                  <dt>Email</dt>
                  <dd>{data.email}</dd>
                </div>
              )}
              <div>
                <dt>Spend</dt>
                <dd>{formatUsd(data.totalSpend)}</dd>
              </div>
            </dl>
          </section>

          <section className="sheet-section" aria-labelledby="policy-title">
            <h3 id="policy-title">Policy</h3>
            {data.policy ? (
              <dl className="kv">
                <div>
                  <dt>Plan</dt>
                  <dd>
                    {data.policy.planName} ({data.policy.number})
                  </dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>
                    <StatusChip tone={statusDisplay[data.policy.status].tone}>{statusDisplay[data.policy.status].label}</StatusChip>
                  </dd>
                </div>
                <div>
                  <dt>Cover</dt>
                  <dd>{formatUsd(data.policy.coverAmount)}</dd>
                </div>
                <div>
                  <dt>Premium</dt>
                  <dd>{formatUsd(data.policy.monthlyPremium)} a month</dd>
                </div>
                <div>
                  <dt>Beneficiaries</dt>
                  <dd>{data.policy.beneficiaries.map((person) => `${person.name} (${person.share}%)`).join(', ')}</dd>
                </div>
              </dl>
            ) : (
              <p className="muted">No policy linked.</p>
            )}
          </section>

          <section className="sheet-section" aria-labelledby="req-title">
            <h3 id="req-title">Requests</h3>
            {data.requests.length === 0 ? (
              <p className="muted">None.</p>
            ) : (
              <ul className="mini-list">
                {data.requests.map((request) => (
                  <li key={request.id}>
                    <span>
                      <strong>
                        {request.reference} · {requestKindLabel[request.kind]}
                      </strong>
                      <small>{formatDate(request.createdAt)}</small>
                    </span>
                    <StatusChip tone={requestStatusDisplay[request.status].tone}>{requestStatusDisplay[request.status].label}</StatusChip>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="sheet-section" aria-labelledby="ord-title">
            <h3 id="ord-title">Orders</h3>
            {data.orders.length === 0 ? (
              <p className="muted">None.</p>
            ) : (
              <ul className="mini-list">
                {data.orders.map((order) => (
                  <li key={order.id}>
                    <span>
                      <strong>
                        {order.reference} · {formatUsd(order.total)}
                      </strong>
                      <small>{order.lines.map((line) => line.title).join(', ')}</small>
                    </span>
                    <StatusChip tone={orderStatusDisplay[order.status].tone}>{orderStatusDisplay[order.status].label}</StatusChip>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="sheet-section" aria-labelledby="mem-title">
            <h3 id="mem-title">Memorials</h3>
            {data.memorials.length === 0 ? (
              <p className="muted">None.</p>
            ) : (
              <ul className="mini-list">
                {data.memorials.map((memorial) => (
                  <li key={memorial.id}>
                    <span>
                      <strong>{memorial.name}</strong>
                      {memorial.pendingTributes > 0 && <small>{memorial.pendingTributes} tribute waiting for the family</small>}
                    </span>
                    <StatusChip tone={memorial.published ? 'success' : 'neutral'}>{memorial.published ? 'Published' : 'Draft'}</StatusChip>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : customer.isPending ? (
        <div role="status" aria-busy="true">
          <span className="visually-hidden">Loading the customer…</span>
          <Skeleton height="10rem" className="skeleton--card" />
        </div>
      ) : (
        <QueryState isPending={false} error={customer.error} onRetry={() => void customer.refetch()} noun="the customer" />
      )}
    </Sheet>
  )
}
