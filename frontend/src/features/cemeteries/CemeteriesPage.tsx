import { useId, useState, type FormEvent } from 'react'
import { Callout } from '@/components/ui/Callout'
import { Section } from '@/components/ui/Section'
import { SectionHead } from '@/components/ui/SectionHead'
import { StatusChip } from '@/components/ui/StatusChip'
import { TextField } from '@/components/ui/TextField'
import { availabilityLabels, cemeteries, priceRange, searchCemeteries, searchGraves, type Cemetery, type GraveRecord, type PlotEnquiry } from './data'
import { plotEnquiryStore } from './store'
import './cemeteries.css'

const tone = { available: 'success', limited: 'warning', full: 'neutral' } as const

function EnquiryForm({ cemetery, onDone }: { cemetery: Cemetery; onDone: () => void }) {
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [kind, setKind] = useState<PlotEnquiry['kind']>('information')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const kindId = useId()

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !contact.trim()) { setError('Please add your name and a phone number or email.'); return }
    plotEnquiryStore.add({ cemeteryId: cemetery.id, name: name.trim(), contact: contact.trim(), kind, message: message.trim() })
    setSent(true)
  }

  if (sent) {
    return (
      <Callout tone="success" role="status">
        Sample enquiry saved in this browser only. In a real service it would go to the cemetery operator, who must confirm availability, prices and any purchase or reservation.{' '}
        <button type="button" className="btn btn--outline btn--sm" onClick={onDone}>Close</button>
      </Callout>
    )
  }
  return (
    <form className="cem-form" onSubmit={submit} noValidate aria-label={`Plot enquiry for ${cemetery.name}`}>
      <TextField label="Your name" value={name} onChange={setName} autoComplete="name" />
      <TextField label="Phone or email" value={contact} onChange={setContact} error={error} />
      <div className="field">
        <label htmlFor={kindId} className="field__label">I would like to</label>
        <select id={kindId} className="select" value={kind} onChange={(e) => setKind(e.target.value as PlotEnquiry['kind'])}>
          <option value="information">Ask about plots</option>
          <option value="reserve">Enquire about reserving a plot</option>
          <option value="purchase">Enquire about buying a plot</option>
        </select>
      </div>
      <TextField label="Message" tag="Optional" value={message} onChange={setMessage} />
      <div className="cem-actions">
        <button className="btn btn--primary btn--sm" type="submit">Send sample enquiry</button>
        <button className="btn btn--outline btn--sm" type="button" onClick={onDone}>Cancel</button>
      </div>
    </form>
  )
}

function CemeteryCard({ c }: { c: Cemetery }) {
  const [open, setOpen] = useState(false)
  return (
    <article className="card stack">
      <div className="cem-top">
        <div>
          <p className="eyebrow">{c.town} · {c.region}</p>
          <h3 style={{ margin: 0 }}>{c.name}</h3>
        </div>
        <StatusChip tone={tone[c.availability]}>{availabilityLabels[c.availability]}</StatusChip>
      </div>
      <p>{c.about}</p>
      <div className="cem-kv">
        <div><span>Published plot guidance</span><strong>{priceRange(c)}</strong></div>
        <div><span>Sections</span><strong>{c.sections.join(', ')}</strong></div>
        <div><span>Opening hours</span><strong>{c.hours}</strong></div>
        <div><span>Phone</span><strong>{c.phone}</strong></div>
        <div><span>Email</span><strong>{c.email}</strong></div>
      </div>
      <p className="muted"><strong>Directions.</strong> {c.directions}</p>
      {open ? <EnquiryForm cemetery={c} onDone={() => setOpen(false)} /> : (
        <div className="cem-actions"><button className="btn btn--primary btn--sm" type="button" onClick={() => setOpen(true)}>Plot enquiry</button></div>
      )}
    </article>
  )
}

function GraveResult({ g }: { g: GraveRecord }) {
  const c = cemeteries.find((x) => x.id === g.cemeteryId)
  return (
    <li className="card stack">
      <div className="cem-top">
        <strong>{g.fullName} ({g.birthYear} to {g.deathYear})</strong>
        <StatusChip tone={g.verified ? 'success' : 'warning'}>{g.verified ? 'Verified record' : 'Awaiting operator verification'}</StatusChip>
      </div>
      <p className="muted">{c?.name}, {c?.town}. Section {g.section}, plot {g.plot}.</p>
      {!g.verified && <p className="muted">The cemetery operator has not verified this record, so please confirm it with them before visiting.</p>}
    </li>
  )
}

export default function CemeteriesPage() {
  const [query, setQuery] = useState('')
  const [publishedOnly, setPublishedOnly] = useState(false)
  const [graveName, setGraveName] = useState('')
  const [graveYear, setGraveYear] = useState('')
  const [graveResults, setGraveResults] = useState<GraveRecord[] | null>(null)
  const checkId = useId()

  const results = searchCemeteries(query, publishedOnly)

  function findGrave(e: FormEvent) {
    e.preventDefault()
    const year = Number(graveYear)
    setGraveResults(searchGraves(graveName, year >= 1800 && year <= 2100 ? year : undefined))
  }

  return (
    <>
      <Section>
        <SectionHead as="h1" eyebrow="Smart cemetery" title="Find a cemetery, ask about a plot or locate a grave." />
        <Callout tone="warning">
          <strong>Demonstration only.</strong> Every cemetery, price and grave record on this page is fictional sample data. Real availability, prices, purchases and grave records must be confirmed by the authorised cemetery operator.
        </Callout>
      </Section>

      <Section soft>
        <h2>Search cemeteries</h2>
        <div className="cem-search">
          <TextField label="Town or area" value={query} onChange={setQuery} placeholder="e.g. Harare, Bulawayo" type="search" />
          <label htmlFor={checkId} className="cem-check">
            <input id={checkId} type="checkbox" checked={publishedOnly} onChange={(e) => setPublishedOnly(e.target.checked)} /> Only with published plots
          </label>
        </div>
        <p className="muted" role="status">{results.length} of {cemeteries.length} sample cemeteries shown.</p>
        <div className="cem-list">
          {results.map((c) => <CemeteryCard key={c.id} c={c} />)}
          {results.length === 0 && <p className="muted">No sample cemetery matches. Try a town such as Harare, or clear the filter.</p>}
        </div>
      </Section>

      <Section>
        <h2>Find an existing grave</h2>
        <p className="muted" style={{ maxWidth: '68ch' }}>Search sample burial records by name and, if you know it, the year of death.</p>
        <form className="cem-search" onSubmit={findGrave} noValidate>
          <TextField label="Full name of the deceased" value={graveName} onChange={setGraveName} />
          <TextField label="Year of death" tag="Optional" value={graveYear} onChange={setGraveYear} inputMode="numeric" />
          <button className="btn btn--primary" type="submit">Search records</button>
        </form>
        {graveResults && (
          <div role="status" className="stack" style={{ marginTop: 16 }}>
            {graveResults.length === 0
              ? <p className="muted">No sample record found. Try fewer details, or ask the cemetery operator to search their register.</p>
              : <ul className="cem-list" style={{ listStyle: 'none', padding: 0 }}>{graveResults.map((g) => <GraveResult key={g.id} g={g} />)}</ul>}
          </div>
        )}
        <p className="muted" style={{ marginTop: 16 }}>Satellite imagery alone cannot establish the identity or exact location of an individual grave, so this prototype relies on recorded plot references.</p>
      </Section>
    </>
  )
}
