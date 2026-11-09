import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Callout } from '@/components/ui/Callout'
import { Section } from '@/components/ui/Section'
import { SectionHead } from '@/components/ui/SectionHead'
import { TextField } from '@/components/ui/TextField'
import { OPENING, respond, suggestions, type Link as ReplyLink, type ReplyKind } from './engine'
import './assistant.css'

type Message = { id: number; from: 'bot' | 'user'; text: string; kind?: ReplyKind; links?: ReplyLink[] }

const opening = (): Message[] => [{ id: 0, from: 'bot', text: OPENING }]

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>(opening)
  const [draft, setDraft] = useState('')
  const logRef = useRef<HTMLDivElement>(null)
  const nextId = useRef(1)

  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  function ask(text: string) {
    const q = text.trim()
    if (!q) return
    const reply = respond(q)
    setMessages((m) => [
      ...m,
      { id: nextId.current++, from: 'user', text: q },
      { id: nextId.current++, from: 'bot', text: reply.text, kind: reply.kind, links: reply.links },
    ])
    setDraft('')
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    ask(draft)
  }

  return (
    <Section>
      <div className="as-wrap">
        <SectionHead as="h1" eyebrow="Grief support assistant" title="Practical help and remembrance ideas." />
        <Callout tone="warning">
          <strong>Demonstration only, and not AI.</strong> This assistant picks from pre-written answers. It is not a counsellor or therapist, cannot replace professional care, and is not the person you have lost. Nothing you type is sent anywhere or saved. If you are in danger, contact your local emergency services.
        </Callout>

        <div ref={logRef} className="as-log" role="log" aria-live="polite" aria-label="Conversation">
          {messages.map((m) => (
            <div key={m.id} className={`as-msg as-msg--${m.from}${m.kind === 'crisis' ? ' as-msg--crisis' : ''}`}>
              <span className="as-tag">{m.from === 'bot' ? 'Demonstration assistant (scripted)' : 'You'}</span>
              {m.text}
              {m.links && (
                <div className="as-links">
                  {m.links.map((l) => <Link key={l.to} className="btn btn--outline btn--sm" to={l.to}>{l.label}</Link>)}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="as-chips" aria-label="Suggested questions">
          {suggestions.map((s) => <button key={s} type="button" className="btn btn--outline btn--sm" onClick={() => ask(s)}>{s}</button>)}
        </div>

        <form className="as-form" onSubmit={submit}>
          <TextField label="Your message" value={draft} onChange={setDraft} autoComplete="off" />
          <button className="btn btn--primary" type="submit" disabled={!draft.trim()}>Send</button>
        </form>
        <div>
          <button className="btn btn--outline btn--sm" type="button" onClick={() => { setMessages(opening()); nextId.current = 1 }}>Clear conversation</button>
        </div>
      </div>
    </Section>
  )
}
