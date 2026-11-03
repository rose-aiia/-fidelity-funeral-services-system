const API_MODES = ['mock', 'live'] as const
type ApiMode = (typeof API_MODES)[number]

function readApiMode(raw: string | undefined): ApiMode {
  if (raw === undefined || raw === '') return 'mock'
  if ((API_MODES as readonly string[]).includes(raw)) return raw as ApiMode
  throw new Error(`Invalid VITE_API_MODE "${raw}". Expected one of: ${API_MODES.join(', ')}.`)
}

const apiMode = readApiMode(import.meta.env.VITE_API_MODE)

export const env = {
  apiMode,
  /** True when the app should serve built-in sample data instead of calling the API. */
  useMock: apiMode === 'mock',
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, ''),
} as const
