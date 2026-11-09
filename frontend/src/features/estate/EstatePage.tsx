import { useState, type FormEvent } from 'react'
import { Callout } from '@/components/ui/Callout'
import { TextField } from '@/components/ui/TextField'
import { defaultState, groupLabels, groupOrder, newId, progress, type EstateState } from './data'
import { loadEstate, saveEstate } from './store'
import './estate.css'

export default function EstatePage() {
  const [state, setState] = useState<EstateState>(loadEstate)
  const [task, setTask] = useState('')
  const [doc, setDoc] = useState('')
  const [appt, setAppt] = useState({ title: '', date: '', note: '' })
  const [contact, setContact] = useState({ name: '', role: '', phone: '' })

  function update(next: EstateState) { setState(next); saveEstate(next) }
  const { done, total, percent } = progress(state.tasks)

  const addTask = (e: FormEvent) => {
    e.preventDefault()
    if (!task.trim()) return
    update({ ...state, tasks: [...state.tasks, { id: newId('t'), group: 'later', title: task.trim(), hint: 'Added by you.', done: false, custom: true }] })
    setTask('')
  }
  const addDoc = (e: FormEvent) => {
    e.preventDefault()
    if (!doc.trim()) return
    update({ ...state, documents: [...state.documents, { id: newId('d'), name: doc.trim(), obtained: false }] })
    setDoc('')
  }
  const addAppt = (e: FormEvent) => {
    e.preventDefault()
    if (!appt.title.trim() || !appt.date) return
    update({ ...state, appointments: [...state.appointments, { id: newId('a'), title: appt.title.trim(), date: appt.date, note: appt.note.trim() }].sort((a, b) => a.date.localeCompare(b.date)) })
    setAppt({ title: '', date: '', note: '' })
  }
  const addContact = (e: FormEvent) => {
    e.preventDefault()
    if (!contact.name.trim()) return
    update({ ...state, contacts: [...state.contacts, { id: newId('c'), name: contact.name.trim(), role: contact.role.trim(), phone: contact.phone.trim() }] })
    setContact({ name: '', role: '', phone: '' })
  }

  return (
    <div className="page-stack est-grid">
      <header className="page-head reveal">
        <p className="eyebrow">Estate support</p>
        <h1>After a death: your checklist</h1>
        <p className="muted" style={{ maxWidth: '72ch' }}>Keep track of tasks, documents, appointments and contacts in one place. Your notes are saved in this browser only.</p>
      </header>

      <Callout tone="info">
        This page helps you stay organised. It is <strong>not legal advice</strong>, and it does not administer an estate or make legal decisions. For the legal steps, speak to a qualified lawyer or the relevant government office.
      </Callout>

      <section className="card stack" aria-labelledby="est-progress">
        <div className="est-row">
          <h2 id="est-progress" className="panel__title" style={{ margin: 0 }}>Progress</h2>
          <strong>{done} of {total} tasks done</strong>
        </div>
        <div className="est-bar" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Checklist progress"><span style={{ width: `${percent}%` }} /></div>
      </section>

      {groupOrder.map((g) => {
        const items = state.tasks.filter((x) => x.group === g)
        if (!items.length) return null
        return (
          <section key={g} className="card stack" aria-labelledby={`g-${g}`}>
            <h2 id={`g-${g}`} className="panel__title" style={{ margin: 0 }}>{groupLabels[g]}</h2>
            <ul className="est-list">
              {items.map((x) => (
                <li key={x.id} className={`est-item${x.done ? ' est-item--done' : ''}`}>
                  <label>
                    <span><input type="checkbox" checked={x.done} onChange={() => update({ ...state, tasks: state.tasks.map((y) => y.id === x.id ? { ...y, done: !y.done } : y) })} /> <strong>{x.title}</strong></span>
                    <span className="est-hint">{x.hint}</span>
                  </label>
                  {x.custom && <button className="btn btn--outline btn--sm" type="button" aria-label={`Remove task ${x.title}`} onClick={() => update({ ...state, tasks: state.tasks.filter((y) => y.id !== x.id) })}>Remove</button>}
                </li>
              ))}
            </ul>
          </section>
        )
      })}

      <form className="est-form" onSubmit={addTask} aria-label="Add a task">
        <TextField label="Add your own task" value={task} onChange={setTask} />
        <div><button className="btn btn--primary btn--sm" type="submit">Add task</button></div>
      </form>

      <div className="est-two">
        <section className="card stack" aria-labelledby="est-docs">
          <h2 id="est-docs" className="panel__title" style={{ margin: 0 }}>Documents</h2>
          <ul className="est-list">
            {state.documents.map((d) => (
              <li key={d.id} className="est-item">
                <label><span><input type="checkbox" checked={d.obtained} onChange={() => update({ ...state, documents: state.documents.map((y) => y.id === d.id ? { ...y, obtained: !y.obtained } : y) })} /> {d.name}</span><span className="est-hint">{d.obtained ? 'Have it' : 'Still to find or collect'}</span></label>
              </li>
            ))}
          </ul>
          <form className="est-form" onSubmit={addDoc} aria-label="Add a document">
            <TextField label="Add a document" value={doc} onChange={setDoc} />
            <div><button className="btn btn--outline btn--sm" type="submit">Add</button></div>
          </form>
        </section>

        <section className="card stack" aria-labelledby="est-appts">
          <h2 id="est-appts" className="panel__title" style={{ margin: 0 }}>Appointments</h2>
          {state.appointments.length === 0 && <p className="muted">No appointments yet.</p>}
          <ul className="est-list">
            {state.appointments.map((a) => (
              <li key={a.id} className="est-item">
                <div style={{ flex: 1 }}><strong>{a.title}</strong><div className="est-hint">{a.date}{a.note ? ` · ${a.note}` : ''}</div></div>
                <button className="btn btn--outline btn--sm" type="button" aria-label={`Remove appointment ${a.title}`} onClick={() => update({ ...state, appointments: state.appointments.filter((y) => y.id !== a.id) })}>Remove</button>
              </li>
            ))}
          </ul>
          <form className="est-form" onSubmit={addAppt} aria-label="Add an appointment">
            <TextField label="What is it for?" value={appt.title} onChange={(v) => setAppt({ ...appt, title: v })} />
            <TextField label="Date" type="date" value={appt.date} onChange={(v) => setAppt({ ...appt, date: v })} />
            <TextField label="Note" tag="Optional" value={appt.note} onChange={(v) => setAppt({ ...appt, note: v })} />
            <div><button className="btn btn--outline btn--sm" type="submit">Add appointment</button></div>
          </form>
        </section>
      </div>

      <section className="card stack" aria-labelledby="est-contacts">
        <h2 id="est-contacts" className="panel__title" style={{ margin: 0 }}>Estate contacts</h2>
        <p className="muted">For example a lawyer, a bank contact or an insurer.</p>
        {state.contacts.length === 0 && <p className="muted">No contacts yet.</p>}
        <ul className="est-list">
          {state.contacts.map((c) => (
            <li key={c.id} className="est-item">
              <div style={{ flex: 1 }}><strong>{c.name}</strong><div className="est-hint">{[c.role, c.phone].filter(Boolean).join(' · ')}</div></div>
              <button className="btn btn--outline btn--sm" type="button" aria-label={`Remove contact ${c.name}`} onClick={() => update({ ...state, contacts: state.contacts.filter((y) => y.id !== c.id) })}>Remove</button>
            </li>
          ))}
        </ul>
        <form className="est-form" onSubmit={addContact} aria-label="Add a contact">
          <TextField label="Name" value={contact.name} onChange={(v) => setContact({ ...contact, name: v })} />
          <TextField label="Role" tag="Optional" value={contact.role} onChange={(v) => setContact({ ...contact, role: v })} />
          <TextField label="Phone" tag="Optional" type="tel" value={contact.phone} onChange={(v) => setContact({ ...contact, phone: v })} />
          <div><button className="btn btn--outline btn--sm" type="submit">Add contact</button></div>
        </form>
      </section>

      <div>
        <button className="btn btn--outline btn--sm" type="button" onClick={() => { if (window.confirm('Reset the checklist and delete everything you added?')) update(defaultState()) }}>Reset checklist</button>
      </div>
    </div>
  )
}
