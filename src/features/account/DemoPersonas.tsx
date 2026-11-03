import { Avatar } from '@/components/ui/Avatar'
import { Icon } from '@/components/ui/Icon'
import { demoPersonas, type DemoPersona } from '@/features/auth'

type DemoPersonasProps = {
  onPick: (persona: DemoPersona) => void
  pendingId?: string
  disabled: boolean
}

/** One-click sign-ins for demos (mock mode only; the caller decides whether to render it). */
export function DemoPersonas({ onPick, pendingId, disabled }: DemoPersonasProps) {
  return (
    <section className="personas" aria-labelledby="personas-title">
      <div className="personas__head">
        <h2 id="personas-title" className="personas__title">
          Explore as a demo user
        </h2>
        <span className="personas__tag">Demo mode</span>
      </div>

      <ul className="personas__list">
        {demoPersonas.map((persona) => (
          <li key={persona.user.id}>
            <button
              type="button"
              className="persona"
              disabled={disabled}
              aria-busy={pendingId === persona.user.id}
              onClick={() => onPick(persona)}
            >
              <Avatar name={persona.user.name} />
              <span className="persona__text">
                <strong>{persona.user.name}</strong>
                <span>
                  {persona.title}. {persona.blurb}
                </span>
              </span>
              <Icon name="arrow-right" size={18} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
