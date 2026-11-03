export type StatRow = {
  label: string
  value: string
  alert?: boolean
}

export function StatCard({ rows }: { rows: StatRow[] }) {
  return (
    <div className="card stat-card">
      {rows.map((row) => (
        <div className={`stat-card__row${row.alert ? ' stat-card__row--alert' : ''}`} key={row.label}>
          <span>{row.label}</span>
          <strong>{row.value}</strong>
        </div>
      ))}
    </div>
  )
}
