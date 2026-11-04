# Brand assets

Files the site uses from `frontend/public/`. They come from Fidelity Life Assurance of Zimbabwe's own website (fidelitylife.co.zw), used with the organisation's permission.

| File | What it is | Notes |
| --- | --- | --- |
| `brand/logo.png`, `brand/logo-light.png` | The full stacked logo, colour and white | 763 x 539, transparent. A vector (SVG) version would be crisper on large screens |
| `brand/mark.png`, `brand/mark-light.png` | The scales symbol alone, colour and white. Used beside the live-text name in the header, footer and sign-in panel | Cropped from the logo |
| `brand/icon.png` | Site icon: favicon and Apple touch icon | 300 x 300, from the company site |
| `brand/head-office.jpg` | Photograph of Fidelity House, shown in the "Visit or call us" section | 1024 x 903, from the company site |
| `hero/farewell.jpg` | Landing-page hero photograph: mourners with their hands on a coffin and white flowers | 547 x 365, a small web thumbnail. Source and licence not recorded: replace with a licensed, higher-resolution photograph (2000px or wider) before launch |

Better originals, when available:
- **Logo as SVG** (and a white SVG for dark backgrounds). The code does not change when a file is replaced by one with the same name; point `site.ts` at the new extension if it is not `.png`.
- **Hero photograph** at 2000px or wider with no text in it. The current file is sharp at the size it is shown (about 520px wide) but will look soft on very large or high-density screens, and the scene is a house under construction, which suits an insurer more than a funeral service. A warm dusk photograph of a family without the building site would fit better.

The header sets the name next to the mark as live text, so it stays sharp at every size.
