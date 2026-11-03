export type Role = 'customer' | 'staff' | 'provider' | 'admin'

export type Language = 'en' | 'sn' | 'nd'

export type User = {
  id: string
  name: string
  /** E.164, e.g. `+263771234567`. The sign-in identifier. */
  phone: string
  email?: string
  role: Role
  language: Language
}

export type SignInInput = { phone: string; code: string }

export type SignUpInput = { name: string; phone: string; code: string; email?: string }

export type ProfileUpdate = { name: string; email?: string; language: Language }

export type OtpReceipt = { expiresInSeconds: number }
