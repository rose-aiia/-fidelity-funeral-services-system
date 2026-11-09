import { Link } from 'react-router-dom'
import { Section } from '@/components/ui/Section'
import { paths } from '@/config/routes'

export function SupportSection() {
  return (
    <Section id="support" containerClassName="split split--center">
      <div className="support-copy stack">
        <p className="eyebrow">AI assistance & aftercare</p>
        <h2>Responsible digital support for families and communities.</h2>
        <p>
          The optional AI assistant offers guidance on grief resources, journaling prompts and remembrance exercises while clearly identifying AI-generated content and pointing users to professional help when needed.
        </p>
        <Link className="btn btn--primary btn--sm" to={paths.assistant}>Try the demonstration assistant</Link>
      </div>

      <div className="card stack ai-card" aria-label="Sample AI grief support assistant">
        <div className="ai-bubble ai-bubble--assistant">
          I’m here to help with practical support, remembrance ideas and grief resources. Would you like a checklist for the next 48 hours?
        </div>
        <div className="ai-bubble ai-bubble--user">Please suggest simple steps for my family and remembrance ideas.</div>
      </div>
    </Section>
  )
}
