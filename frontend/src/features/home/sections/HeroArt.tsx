/**
 * An original dusk scene used behind the hero: sky, low sun, layered hills and a family seen from behind.
 * It is the hero's backdrop until a photograph is supplied, and the fallback if the photograph fails to load.
 */
export function HeroArt() {
  return (
    <svg className="hero__art" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="hero-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1d1620" />
          <stop offset="0.38" stopColor="#4a2030" />
          <stop offset="0.66" stopColor="#a84f3c" />
          <stop offset="0.84" stopColor="#e9965a" />
          <stop offset="1" stopColor="#f6c586" />
        </linearGradient>
        <radialGradient id="hero-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffe3a8" stopOpacity="0.95" />
          <stop offset="0.35" stopColor="#f6a860" stopOpacity="0.55" />
          <stop offset="1" stopColor="#f6a860" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hero-hill-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6b3340" />
          <stop offset="1" stopColor="#3a1c29" />
        </linearGradient>
      </defs>

      <rect width="1600" height="900" fill="url(#hero-sky)" />
      <circle cx="1130" cy="640" r="360" fill="url(#hero-sun)" />
      <circle cx="1130" cy="650" r="46" fill="#ffe9bd" opacity="0.92" />

      <g fill="none" stroke="#f6c586" strokeLinecap="round" opacity="0.18">
        <path d="M700 330H1380" strokeWidth="3" />
        <path d="M860 380H1500" strokeWidth="2" />
        <path d="M520 450H1000" strokeWidth="2" />
      </g>

      <path d="M0 690C180 650 340 700 520 676S860 630 1060 668 1420 700 1600 650V900H0Z" fill="url(#hero-hill-far)" />
      <path d="M0 760C220 720 420 770 640 748S1000 716 1240 752 1500 770 1600 740V900H0Z" fill="#2a1520" />

      <g fill="#150d14">
        <path d="M0 830C260 790 520 840 800 812S1260 770 1600 820V900H0Z" />
        {/* Two adults and a child, standing together on the ridge, seen from behind. */}
        <g transform="translate(1066 566)">
          <circle r="21" />
          <path d="M-9 20h18v12h-18z" />
          <path d="M-31 62Q-31 32 -9 30H9Q31 32 31 62L27 118H-27Z" />
          <path d="M-22 114H-2L-5 196H-21ZM2 114H22L21 196H5Z" />
        </g>
        <g transform="translate(1130 586)">
          <circle r="19" />
          <path d="M-8 18h16v10h-16z" />
          <path d="M-26 56Q-26 28 -8 27H8Q26 28 26 56L40 168H-40Z" />
          <path d="M-14 164H-3L-5 176H-15ZM3 164H14L15 176H5Z" opacity="0" />
        </g>
        <g transform="translate(1184 652) scale(0.62)">
          <circle r="21" />
          <path d="M-9 20h18v12h-18z" />
          <path d="M-31 62Q-31 32 -9 30H9Q31 32 31 62L27 118H-27Z" />
          <path d="M-22 114H-2L-5 196H-21ZM2 114H22L21 196H5Z" />
        </g>
      </g>
    </svg>
  )
}
