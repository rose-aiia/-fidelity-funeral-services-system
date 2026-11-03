export type FaqItem = {
  question: string
  answer: string
}

export const faqs: FaqItem[] = [
  {
    question: 'Are these sample quotes and prices live?',
    answer:
      'No. All figures are demonstration values for the prototype. Final pricing, cemetery availability and service terms must be confirmed by licensed providers and authorised cemetery operators.',
  },
  {
    question: 'Can families create a digital memorial?',
    answer:
      'Yes. The prototype shows how families could upload photographs, memories and tribute messages, then invite selected relatives to contribute to a shared memorial album.',
  },
  {
    question: 'Does the AI support tool replace therapy?',
    answer:
      'No. The concept is presented as a supportive resource for reflection and information, with clear direction to professional counselling and human support when needed.',
  },
  {
    question: 'What is included in the provider dashboard?',
    answer:
      'The dashboard demonstrates service administration, customer enquiries, funeral schedule tracking and listing management for approved provider staff only.',
  },
]
