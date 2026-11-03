import { useEffect, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { Toast } from '@/components/ui/Toast'

const TOAST_DURATION_MS = 2600

type ShareActionsProps = {
  name: string
  /** Absolute address of the memorial page. */
  url: string
}

/** WhatsApp first (it's how most families here pass this kind of news along), then copy and the system sheet. */
export function ShareActions({ name, url }: ShareActionsProps) {
  const [message, setMessage] = useState<string | null>(null)
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(() => setMessage(null), TOAST_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [message])

  const text = `In loving memory of ${name}. You are invited to leave a flower, light a candle or share a tribute: ${url}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setMessage('Link copied. Paste it anywhere to share.')
    } catch {
      setMessage('Couldn’t copy automatically. Copy the address from your browser instead.')
    }
  }

  const share = async () => {
    try {
      await navigator.share({ title: `In memory of ${name}`, text, url })
    } catch {
      // Dismissing the share sheet is not an error worth reporting.
    }
  }

  return (
    <>
      <div className="share">
        <a
          className="btn btn--outline btn--sm"
          href={`https://wa.me/?text=${encodeURIComponent(text)}`}
          target="_blank"
          rel="noreferrer noopener"
        >
          <Icon name="chat" size={16} />
          WhatsApp
        </a>
        <button type="button" className="btn btn--outline btn--sm" onClick={() => void copy()}>
          <Icon name="file" size={16} />
          Copy link
        </button>
        {canShare && (
          <button type="button" className="btn btn--outline btn--sm" onClick={() => void share()}>
            <Icon name="arrow-right" size={16} />
            More
          </button>
        )}
      </div>
      {message && <Toast>{message}</Toast>}
    </>
  )
}
