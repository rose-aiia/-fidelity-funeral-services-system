// Original illustrations used as sample "photos" so the demo has imagery without shipping anyone's pictures.
// Importable from Node (scripts/mock-api.mjs), so no imports.

const toDataUri = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`

const frame = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">${body}</svg>`

/** Sun rising behind layered hills. */
export const hillsAtSunrise = toDataUri(
  frame(`
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3c98b"/><stop offset="0.6" stop-color="#f6e2b8"/><stop offset="1" stop-color="#fbf3e0"/></linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#sky)"/>
  <circle cx="520" cy="330" r="90" fill="#f1a85b" opacity="0.55"/>
  <circle cx="520" cy="330" r="56" fill="#e98a3c"/>
  <path d="M0 400 C150 340 260 380 400 350 S650 320 800 380 V600 H0Z" fill="#c99a5a" opacity="0.7"/>
  <path d="M0 450 C140 400 300 450 430 420 S680 390 800 440 V600 H0Z" fill="#9c7a46"/>
  <path d="M0 520 C160 480 320 520 470 500 S690 480 800 520 V600 H0Z" fill="#5f4a2c"/>`),
)

/** An acacia against a dusk sky. */
export const acaciaAtDusk = toDataUri(
  frame(`
  <defs>
    <linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b3358"/><stop offset="0.55" stop-color="#c8635a"/><stop offset="1" stop-color="#f0b46a"/></linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#dusk)"/>
  <circle cx="610" cy="395" r="48" fill="#f7d58a" opacity="0.9"/>
  <path d="M0 470 H800 V600 H0Z" fill="#2a2234"/>
  <path d="M390 470 C392 410 384 380 372 350 M390 420 C410 392 440 380 470 372 M386 392 C360 372 330 366 300 372" stroke="#1d1727" stroke-width="12" fill="none" stroke-linecap="round"/>
  <ellipse cx="335" cy="352" rx="120" ry="26" fill="#1d1727"/>
  <ellipse cx="470" cy="360" rx="110" ry="24" fill="#1d1727"/>
  <ellipse cx="400" cy="326" rx="140" ry="28" fill="#1d1727"/>`),
)

/** A slow river under a pale sky. */
export const riverAtMidday = toDataUri(
  frame(`
  <defs>
    <linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bcdbe6"/><stop offset="1" stop-color="#eef6f3"/></linearGradient>
    <linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fa9b4"/><stop offset="1" stop-color="#2f6f7c"/></linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#sky2)"/>
  <path d="M0 300 C120 270 240 290 380 280 S640 260 800 290 V340 H0Z" fill="#7a9a6a"/>
  <path d="M0 340 C200 320 420 360 800 330 V600 H0Z" fill="url(#water)"/>
  <g stroke="#e8f4f2" stroke-width="5" stroke-linecap="round" opacity="0.7">
    <path d="M120 420 H260"/><path d="M360 470 H540"/><path d="M180 520 H300"/><path d="M520 400 H680"/><path d="M600 520 H720"/>
  </g>`),
)
