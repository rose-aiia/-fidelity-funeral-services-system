import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { QueryState } from '@/components/ui/QueryState'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusChip } from '@/components/ui/StatusChip'
import { orderStatusDisplay } from '@/features/marketplace/status'
import { formatAge, formatUsd } from '@/lib/format'
import type { AdminOrder } from './data'
import { OrderSheet } from './OrderSheet'
import { usePortalRole } from './portal-ui'
import { useOrders } from './queries'
import './portal.css'

type Filter = 'all' | 'confirm' | 'progress' | 'payment' | 'done'

const matches: Record<Filter, (order: AdminOrder) => boolean> = {
  all: () => true,
  confirm: (order) => order.status === 'paid',
  progress: (order) => order.status === 'confirmed' || order.status === 'in_progress',
  payment: (order) => order.status === 'awaiting_payment' || order.status === 'payment_failed',
  done: (order) => order.status === 'delivered' || order.status === 'cancelled',
}

const chips: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'confirm', label: 'To confirm' },
  { id: 'progress', label: 'In progress' },
  { id: 'payment', label: 'Payment issues' },
  { id: 'done', label: 'Finished' },
]

export default function OrdersPage() {
  const role = usePortalRole()
  const orders = useOrders()
  const [params, setParams] = useSearchParams()
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const focus = params.get('focus')

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return (orders.data ?? [])
      .filter(matches[filter])
      .filter((order) => !needle || [order.reference, order.customer.name, ...order.lines.map((line) => line.title)].some((text) => text.toLowerCase().includes(needle)))
  }, [orders.data, filter, search])

  const selected = orders.data?.find((order) => order.id === focus)
  const close = () => setParams({}, { replace: true })

  return (
    <div className="page-stack">
      <header className="page-head reveal">
        <p className="eyebrow">Orders</p>
        <h1>{role === 'admin' ? 'What families have ordered.' : 'Orders for your products.'}</h1>
      </header>

      {orders.data ? (
        <>
          <div className="portal-toolbar">
            <div className="portal-toolbar__chips" role="group" aria-label="Filter orders">
              {chips.map((chip) => (
                <button key={chip.id} type="button" className="chip" aria-pressed={filter === chip.id} onClick={() => setFilter(chip.id)}>
                  {chip.label}
                </button>
              ))}
            </div>
            <label className="portal-search">
              <span className="visually-hidden">Search orders</span>
              <input type="search" className="input" placeholder="Search by reference, name or product" value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
          </div>

          {rows.length > 0 ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Order</th>
                    <th scope="col">Customer</th>
                    <th scope="col">Items</th>
                    <th scope="col" className="num">
                      {role === 'admin' ? 'Total' : 'Your share'}
                    </th>
                    <th scope="col">Status</th>
                    <th scope="col">Placed</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((order) => {
                    const status = orderStatusDisplay[order.status]
                    const more = order.lines.length - 1
                    return (
                      <tr key={order.id} onClick={() => setParams({ focus: order.id }, { replace: true })}>
                        <td>
                          <button type="button" className="row-link" onClick={(event) => { event.stopPropagation(); setParams({ focus: order.id }, { replace: true }) }}>
                            {order.reference}
                          </button>
                          {order.shared && role === 'admin' && <span className="muted"> · shared</span>}
                        </td>
                        <td>{order.customer.name}</td>
                        <td>
                          <span className="cell-stack">
                            <strong>{order.lines[0]?.title}</strong>
                            {more > 0 && <span>+ {more} more</span>}
                          </span>
                        </td>
                        <td className="num">{formatUsd(order.total)}</td>
                        <td>
                          <StatusChip tone={status.tone}>{status.label}</StatusChip>
                        </td>
                        <td>{formatAge(order.createdAt)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card empty empty--large">
              <span className="icon-tile icon-tile--lg">
                <Icon name="bag" size={24} />
              </span>
              <p>
                <strong>No orders here.</strong>
                <span className="muted"> Nothing matches that filter.</span>
              </p>
            </div>
          )}
        </>
      ) : orders.isPending ? (
        <div className="page-stack" role="status" aria-busy="true">
          <span className="visually-hidden">Loading orders…</span>
          <Skeleton height="3rem" className="skeleton--card" />
          <Skeleton height="16rem" className="skeleton--card" />
        </div>
      ) : (
        <QueryState isPending={false} error={orders.error} onRetry={() => void orders.refetch()} noun="orders" />
      )}

      <OrderSheet order={selected} onClose={close} />
    </div>
  )
}
