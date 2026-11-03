// Original illustrations for the sample products. Importable from Node (scripts/mock-api.mjs), so no imports.

const toDataUri = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`

const frame = (background: string, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" preserveAspectRatio="xMidYMid slice">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">${background}</linearGradient></defs>
  <rect width="640" height="480" fill="url(#bg)"/>${body}</svg>`

const stops = (a: string, b: string) => `<stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/>`

const petals = (cx: number, cy: number, r: number, count: number, fill: string, size: number) =>
  Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2
    return `<circle cx="${(cx + Math.cos(angle) * r).toFixed(1)}" cy="${(cy + Math.sin(angle) * r).toFixed(1)}" r="${size}" fill="${fill}"/>`
  }).join('')

export const plaqueArt = toDataUri(
  frame(
    stops('#d9d2c5', '#b9b0a0'),
    `<rect x="150" y="110" width="340" height="250" rx="18" fill="#2e2e33"/>
     <rect x="164" y="124" width="312" height="222" rx="12" fill="none" stroke="#8f8a7d" stroke-width="2"/>
     <path d="M320 150v34M303 167h34" stroke="#d8c48a" stroke-width="4" stroke-linecap="round"/>
     <rect x="215" y="214" width="210" height="8" rx="4" fill="#cfc7b2"/>
     <rect x="245" y="240" width="150" height="6" rx="3" fill="#8f8a7d"/>
     <rect x="265" y="270" width="110" height="6" rx="3" fill="#8f8a7d"/>
     <rect x="120" y="360" width="400" height="26" rx="6" fill="#4b4b52"/>`,
  ),
)

export const wreathArt = toDataUri(
  frame(
    stops('#e8efe1', '#c9d8bf'),
    `<circle cx="320" cy="240" r="128" fill="none" stroke="#4f7a4a" stroke-width="46"/>
     ${petals(320, 240, 128, 14, '#f4f0e6', 22)}
     ${petals(320, 240, 128, 9, '#c8102e', 14)}
     ${petals(320, 240, 128, 7, '#e2c37b', 9)}
     <path d="M290 372l30 56 30-56z" fill="#c8102e" opacity="0.9"/>`,
  ),
)

export const repatriationArt = toDataUri(
  frame(
    stops('#bcd6e6', '#eaf3f4'),
    `<ellipse cx="170" cy="120" rx="70" ry="22" fill="#fff" opacity="0.8"/>
     <ellipse cx="490" cy="90" rx="56" ry="18" fill="#fff" opacity="0.7"/>
     <path d="M110 300 L520 190 Q560 180 570 200 Q560 224 520 230 L330 282 L250 360 L222 354 L268 286 L170 312 L140 350 L112 344 L134 300 Z" fill="#2e4c63"/>
     <path d="M40 410 Q320 350 600 410" stroke="#7fa3b8" stroke-width="3" fill="none" stroke-dasharray="10 12"/>`,
  ),
)

export const marqueeArt = toDataUri(
  frame(
    stops('#f3e7cf', '#e6d2a8'),
    `<path d="M90 300 L320 110 L550 300 Z" fill="#fbf8f0" stroke="#c9b27a" stroke-width="4"/>
     <path d="M90 300 H550 V380 H90 Z" fill="#efe6d0" stroke="#c9b27a" stroke-width="4"/>
     <path d="M200 380 V300 M320 380 V300 M440 380 V300" stroke="#c9b27a" stroke-width="4"/>
     ${[150, 210, 270, 330, 390, 450].map((x) => `<rect x="${x}" y="400" width="34" height="34" rx="6" fill="#8a6a1f" opacity="0.75"/>`).join('')}`,
  ),
)

export const videoArt = toDataUri(
  frame(
    stops('#3b3358', '#c8635a'),
    `<rect x="120" y="120" width="400" height="250" rx="20" fill="#16131f" opacity="0.88"/>
     <circle cx="320" cy="245" r="52" fill="#e2c37b"/>
     <path d="M304 218l50 27-50 27z" fill="#16131f"/>
     <rect x="150" y="338" width="340" height="8" rx="4" fill="#4b4560"/>
     <rect x="150" y="338" width="150" height="8" rx="4" fill="#e2c37b"/>`,
  ),
)

export const stationeryArt = toDataUri(
  frame(
    stops('#efe6d8', '#dccdb5'),
    `<g transform="rotate(-8 250 250)"><rect x="150" y="100" width="230" height="310" rx="10" fill="#fffdf8" stroke="#cdbb95" stroke-width="3"/>
       <rect x="185" y="150" width="160" height="10" rx="5" fill="#8a6a1f"/>
       <rect x="185" y="190" width="120" height="6" rx="3" fill="#b9b0a0"/>
       <rect x="185" y="215" width="150" height="6" rx="3" fill="#b9b0a0"/>
       <rect x="185" y="240" width="135" height="6" rx="3" fill="#b9b0a0"/></g>
     <g transform="rotate(7 400 260)"><rect x="300" y="130" width="200" height="280" rx="10" fill="#f7f0e1" stroke="#cdbb95" stroke-width="3"/>
       <path d="M400 200v50M380 225h40" stroke="#c8102e" stroke-width="5" stroke-linecap="round"/>
       <rect x="340" y="290" width="120" height="8" rx="4" fill="#b9b0a0"/></g>`,
  ),
)
