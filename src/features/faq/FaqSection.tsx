import { useState } from 'react'
import { QueryState } from '@/components/ui/QueryState'
import { Section } from '@/components/ui/Section'
import { SectionHead } from '@/components/ui/SectionHead'
import type { FaqItem } from './data'
import { useFaqs } from './queries'
import './faq.css'

export function FaqSection() {
  const { data: faqs, isPending, error, refetch } = useFaqs()

  return (
    <Section id="faq" soft containerClassName="faq-layout">
      <SectionHead eyebrow="FAQs" title="Helpful clarity for families and providers." align="left" />

      {faqs ? (
        <FaqList faqs={faqs} />
      ) : (
        <QueryState isPending={isPending} error={error} onRetry={() => void refetch()} noun="FAQs" skeleton />
      )}
    </Section>
  )
}

function FaqList({ faqs }: { faqs: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="faq-list" aria-label="Frequently asked questions">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index
        return (
          <div className="accordion-item" key={faq.id}>
            <button
              type="button"
              className="accordion-trigger"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              aria-expanded={isOpen}
            >
              <span>{faq.question}</span>
              <span aria-hidden="true">{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && <div className="accordion-panel">{faq.answer}</div>}
          </div>
        )
      })}
    </div>
  )
}
