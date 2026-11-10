// pm2 process file. Three processes, as in Kuwana: the API, the worker, and the WhatsApp bridge.
// Run `npm run build && npm run whatsapp:build` first. Only ever run ONE bridge instance: the paired
// session and message ordering live in that process.
module.exports = {
  apps: [
    {
      name: 'fidelity-api',
      script: 'dist/server.js',
      env: { NODE_ENV: 'production' },
      max_memory_restart: '600M',
    },
    {
      name: 'fidelity-worker',
      script: 'node_modules/tsx/dist/cli.mjs',
      args: 'src/worker.ts',
      env: { NODE_ENV: 'production' },
      max_memory_restart: '512M',
      kill_timeout: 30000,
    },
    {
      name: 'fidelity-whatsapp',
      script: 'dist-whatsapp/bridge.mjs',
      node_args: '--enable-source-maps',
      instances: 1,
      exec_mode: 'fork',
      env: { NODE_ENV: 'production' },
      max_memory_restart: '300M',
      exp_backoff_restart_delay: 100,
      kill_timeout: 10000,
    },
  ],
}
