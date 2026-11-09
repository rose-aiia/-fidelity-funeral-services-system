/**
 * BRD 6.4: a scripted demonstration of a grief support assistant.
 *
 * It matches keywords to pre-written replies. There is no AI model behind it, nothing is sent anywhere, and it
 * must never present itself as a counsellor or therapist. Anything that suggests the person may be in danger
 * is answered first, and points to human help.
 */

export type ReplyKind = 'crisis' | 'identity' | 'info' | 'fallback'
export type Link = { label: string; to: string }
export type Reply = { kind: ReplyKind; text: string; links?: Link[] }

export const OPENING =
  'Hello. I am a demonstration assistant: a program with pre-written answers, not a person, a counsellor or a therapist. I can share practical steps, remembrance ideas and journaling prompts. What would you like help with?'

export const suggestions = [
  'What should we do in the next 48 hours?',
  'Give me a journaling prompt',
  'Remembrance ideas for my father',
  'Where can I find counselling?',
]

const CRISIS = /\b(suicid\w*|kill (myself|me)|end (my|it all)|end my life|take my life|harm (myself|me)|hurt myself|self[- ]harm|(don'?t|do not) want to (live|be here)|want to die|better off (dead|without me))\b/i
const IDENTITY = /\b(are you (a |an )?(real|human|person|robot|bot|ai|therapist|counsel+or|doctor)|is this (a )?(real|human|person)|are you (the |my )?(deceased|dead)|talk(ing)? to (him|her|them|my (mum|mom|dad|father|mother)))\b/i

type Intent = { match: RegExp; reply: Reply }

const intents: Intent[] = [
  {
    match: /\b(48 hours|next steps?|what (should|do) (we|i) do|first (days|steps)|checklist|where (do|should) (we|i) start|just (died|passed))\b/i,
    reply: {
      kind: 'info',
      text: 'Here are some gentle first steps. Do only what you can manage, and ask others to help.\n1. Get the medical certificate or police report.\n2. Contact the funeral provider and any funeral plan.\n3. Tell close family, and agree who will coordinate.\n4. Eat, drink water and rest when you can.\n5. Keep paperwork in one place.\nI can show you the estate checklist for the documents and accounts.',
      links: [{ label: 'Estate checklist', to: '/account/estate' }],
    },
  },
  {
    match: /\b(journal\w*|writ(e|ing)|diary|prompt)\b/i,
    reply: {
      kind: 'info',
      text: 'A few journaling prompts. Write for five minutes and stop whenever you like.\n- A memory of them that made me smile was...\n- Something I wish I had said is...\n- Today I am feeling... and my body feels...\n- One small thing that helped today was...\nThere are no right answers, and you do not have to share what you write.',
    },
  },
  {
    match: /\b(remembr\w*|remember\w*|memorial|tribute|honou?r|legacy|keep (their|his|her) memory|candle|flowers?)\b/i,
    reply: {
      kind: 'info',
      text: 'Some ways to remember them:\n- Create a memorial page and invite relatives to add photographs and stories.\n- Light a virtual candle or leave flowers on their memorial.\n- Cook their favourite meal with the family on a special day.\n- Record a relative telling a favourite story.\n- Set a yearly reminder for a day that matters.',
      links: [{ label: 'Memorials', to: '/memorials' }, { label: 'Aftercare reminders', to: '/account/aftercare' }],
    },
  },
  {
    match: /\b(counsel+\w*|therap\w*|professional|support group|psycholog\w*|psychiatr\w*|doctor|help (me|us) cope|can'?t cope|cannot cope)\b/i,
    reply: {
      kind: 'info',
      text: 'Speaking to someone trained can really help. You could talk to your doctor or clinic, a counsellor, a faith leader you trust, or a bereavement support group in your area. If you tell me your town, I cannot look up services in this demonstration, but your funeral provider or local clinic can usually point you to one. If you are struggling to cope day to day, please reach out to one of them soon.',
    },
  },
  {
    match: /\b(birthday|anniversar\w*|special day|holiday|christmas|easter|first year)\b/i,
    reply: {
      kind: 'info',
      text: 'Dates like these can bring grief back strongly, even years later. It can help to plan the day ahead: decide who you will spend it with, do something in their memory, and allow yourself to feel whatever comes. You can set a reminder so the day does not take you by surprise.',
      links: [{ label: 'Aftercare reminders', to: '/account/aftercare' }],
    },
  },
  {
    match: /\b(children|kids|child|son|daughter|grandchild\w*)\b/i,
    reply: {
      kind: 'info',
      text: 'With children, simple and honest words usually work best. Say that the person has died, avoid phrases like "gone to sleep", and tell them they are not to blame. Let them ask questions, and let them take part in remembering in ways that suit their age, like drawing or choosing a photo.',
    },
  },
  {
    match: /\b(guilt\w*|angry|anger|blame|regret\w*|numb|can'?t sleep|cannot sleep|overwhelm\w*|sad|lonely|alone|cry\w*)\b/i,
    reply: {
      kind: 'info',
      text: 'I am sorry you are going through this. Feelings like sadness, anger, guilt, numbness and difficulty sleeping are very common in grief, and they come in waves. Try to be patient with yourself, keep to small routines, and talk to someone you trust. If these feelings stay very heavy or you cannot manage daily life, please speak to a doctor or counsellor.',
    },
  },
  {
    match: /\b(thanks?|thank you|bye|goodbye)\b/i,
    reply: { kind: 'info', text: 'You are welcome. Take care of yourself, and please reach out to the people around you.' },
  },
]

export const crisisReply: Reply = {
  kind: 'crisis',
  text: 'I am really sorry you are in so much pain. I am only a demonstration program and cannot help you safely with this, but please do not go through it alone.\n- If you might act on these thoughts or are in danger, contact your local emergency services now.\n- Reach out to a crisis line in your country, a doctor, or go to the nearest clinic or hospital.\n- Tell someone you trust how you feel and ask them to stay with you.',
}

export const identityReply: Reply = {
  kind: 'identity',
  text: 'I am a demonstration program with pre-written answers. I am not a person, a counsellor or a therapist, and I am not the person you have lost. I cannot replace professional care or the people who love you.',
}

export const fallbackReply: Reply = {
  kind: 'fallback',
  text: 'I only have a small set of pre-written answers, so I may not have understood. You could ask about next steps after a death, journaling, remembrance ideas, or finding counselling. If you need to talk to someone, a doctor, counsellor, faith leader or a trusted person can help more than I can.',
}

/** The reply to a message. Safety and honesty checks run before everything else. */
export function respond(input: string): Reply {
  const text = input.trim()
  if (CRISIS.test(text)) return crisisReply
  if (IDENTITY.test(text)) return identityReply
  return intents.find((i) => i.match.test(text))?.reply ?? fallbackReply
}
