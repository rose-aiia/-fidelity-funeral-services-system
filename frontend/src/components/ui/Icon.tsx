import type { ReactNode } from 'react'

/** 24px stroke icons. Paths are drawn on a 24x24 grid and inherit `currentColor`. */
const paths = {
  shield: (
    <>
      <path d="M12 3 4.5 6v5.5c0 4.4 3.1 7.7 7.5 9.5 4.4-1.8 7.5-5.1 7.5-9.5V6L12 3z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.2 2.7-5.5 6-5.5s6 2.3 6 5.5" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M17 14.2c2.5 0 4.5 1.6 4.5 4" />
    </>
  ),
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />,
  file: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" />
      <path d="M14 3v5h5M9 13h6M9 17h6" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </>
  ),
  heart: <path d="M12 20s-7.5-4.6-7.5-10.2a4.2 4.2 0 0 1 7.5-2.5 4.2 4.2 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z" />,
  flower: (
    <>
      <circle cx="12" cy="6" r="3" />
      <circle cx="18" cy="10.5" r="3" />
      <circle cx="15.8" cy="17.5" r="3" />
      <circle cx="8.2" cy="17.5" r="3" />
      <circle cx="6" cy="10.5" r="3" />
      <circle cx="12" cy="12" r="1.6" />
    </>
  ),
  candle: (
    <>
      <path d="M12 2.5c1.6 2 2.6 3.2 2.6 4.8a2.6 2.6 0 0 1-5.2 0c0-1.6 1-2.8 2.6-4.8z" />
      <rect x="8.5" y="11" width="7" height="10" rx="1.2" />
    </>
  ),
  chat: <path d="M21 11.5a8 8 0 0 1-11.6 7.1L4 20l1.5-4.6A8 8 0 1 1 21 11.5z" />,
  bag: (
    <>
      <path d="M6 8h12l1 12H5L6 8z" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7" />,
  'arrow-right': <path d="M5 12h14m-6-6 6 6-6 6" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  home: <path d="M3 11 12 3l9 8v10h-6v-6H9v6H3V11z" />,
  logout: <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 8l4 4-4 4M19 12H9" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3.5 2.5 20h19L12 3.5z" />
      <path d="M12 10v4M12 17.2v.01" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  download: <path d="M12 4v11m-4-4 4 4 4-4M5 20h14" />,
  sparkle: <path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3zM19 17l.7 1.8L21.5 19.5l-1.8.7L19 22l-.7-1.8-1.8-.7 1.8-.7L19 17z" />,
  video: (
    <>
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="m16 10 5-3v10l-5-3z" />
    </>
  ),
  archive: (
    <>
      <path d="M4 7h16v13H4zM3 4h18v3H3z" />
      <path d="M10 11h4" />
    </>
  ),
  history: <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 7v5l3 2" />,
  map: (
    <>
      <path d="M12 21s-6.5-5.4-6.5-11a6.5 6.5 0 0 1 13 0c0 5.6-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.3" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
} satisfies Record<string, ReactNode>

export type IconName = keyof typeof paths

type IconProps = {
  name: IconName
  size?: number
  className?: string
}

/** Decorative by default (`aria-hidden`); pair with visible text or an `aria-label` on the control. */
export function Icon({ name, size = 20, className }: IconProps) {
  return (
    <svg
      className={className ? `icon ${className}` : 'icon'}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  )
}
