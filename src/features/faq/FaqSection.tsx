import { useState } from 'react'
import { Section } from '@/components/ui/Section'
import { SectionHead } from '@/components/ui/SectionHead'
import { faqs } from './data'
import './faq.css'

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <Section id="faq" soft containerClassName="faq-layout">
      <SectionHead eyebrow="FAQs" title="Helpful clarity for families and providers." align="left" />

      <div className="faq-list" aria-label="Frequently asked questions">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index
          return (
            <div className="accordion-item" key={faq.question}>
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
    </Section>
  )
}
