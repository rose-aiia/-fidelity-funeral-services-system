// The alert templates are written once, in the frontend (pure TS), and copied here so both sides send
// identical wording. Run `npm run sync:alerts` after editing them; a test fails if the copies drift.
import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const from = join(root, '..', 'frontend', 'src', 'features', 'alerts')
const to = join(root, 'src', 'alerts', 'shared')
mkdirSync(to, { recursive: true })
for (const file of ['types.ts', 'templates.ts']) copyFileSync(join(from, file), join(to, file))
copyFileSync(join(root, '..', 'frontend', 'src', 'lib', 'phone.ts'), join(to, 'phone.ts'))
console.log('Synced alert templates from the frontend.')
