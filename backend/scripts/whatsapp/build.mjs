/**
 * Bundles the WhatsApp bridge (src/whatsapp/bridge.ts) into one plain-Node ES module, dist-whatsapp/bridge.mjs.
 *
 * Why a separate bundle: the API compiles to CommonJS, but Baileys 7 depends on `whatsapp-rust-bridge`, whose
 * export map has only an "import" condition, so it cannot be require()d. Bundling the bridge's own TypeScript
 * as ESM (and leaving every package external for Node to load) is how Kuwana solved it too.
 */
import { build } from 'esbuild'

await build({
  entryPoints: ['src/whatsapp/bridge.ts'],
  outfile: 'dist-whatsapp/bridge.mjs',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  packages: 'external',
  sourcemap: true,
  // A bundled ES module has no `require`; some CommonJS-style code paths still call it.
  banner: { js: 'import { createRequire as __fidelityRequire } from "node:module"; const require = __fidelityRequire(import.meta.url);' },
  logLevel: 'info',
})
