import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

type CalloutProps = {
  tone?: 'info' | 'success' | 'warning' | 'danger'
  icon?: IconName
  /** Use `alert` for errors that appear after an action, `status` for gentle confirmations. */
  role?: 'alert' | 'status'
  children: ReactNode
}

const defaultIcons: Record<NonNullable<CalloutProps['tone']>, IconName> = {
  info: 'sparkle',
  success: 'check',
  warning: 'alert',
  danger: 'alert',
}

export function Callout({ tone = 'info', icon, role, children }: CalloutProps) {
  return (
    <div className={`callout callout--${tone}`} role={role}>
      <Icon name={icon ?? defaultIcons[tone]} size={18} />
      <div>{children}</div>
    </div>
  )
}
