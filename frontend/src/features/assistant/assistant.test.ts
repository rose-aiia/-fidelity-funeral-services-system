import { describe, expect, it } from 'vitest'
import { crisisReply, fallbackReply, identityReply, respond, suggestions } from './engine'

describe('safety first', () => {
  it.each([
    'I want to die',
    'I dont want to live anymore',
    "I'm thinking of suicide",
    'sometimes I want to kill myself',
    'They would be better off without me',
    'I might hurt myself',
  ])('answers "%s" with the crisis reply', (text) => {
    expect(respond(text)).toBe(crisisReply)
  })
  it('puts crisis ahead of every other topic', () => {
    expect(respond('I want to die and need a journaling prompt')).toBe(crisisReply)
  })
  it('points to human help and never offers a hotline number it cannot stand behind', () => {
    expect(crisisReply.text).toMatch(/emergency services/i)
    expect(crisisReply.text).not.toMatch(/\d{4,}/)
  })
})

describe('honesty', () => {
  it.each(['Are you a real person?', 'are you a therapist', 'Am I talking to my dad?', 'is this a human'])('"%s" gets the identity reply', (text) => {
    expect(respond(text)).toBe(identityReply)
  })
  it('never claims to be qualified', () => {
    for (const t of ['what should we do in the next 48 hours', 'journal', 'where can I find counselling']) {
      expect(respond(t).text).not.toMatch(/i am (a|your) (counsel+or|therapist)/i)
    }
  })
})

describe('topics', () => {
  it('answers every suggested question with a real topic, not the fallback', () => {
    for (const s of suggestions) expect(respond(s)).not.toBe(fallbackReply)
  })
  it('links the first steps to the estate checklist', () => {
    expect(respond('What should we do in the next 48 hours?').links?.[0].to).toBe('/account/estate')
  })
  it('falls back politely on things it does not know', () => {
    expect(respond('what is the weather')).toBe(fallbackReply)
    expect(respond('   ')).toBe(fallbackReply)
  })
})
