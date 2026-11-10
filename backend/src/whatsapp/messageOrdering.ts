const pendingByKey = new Map<string, Promise<void>>();

/** Ordering is process-local; the WhatsApp bridge runs as a single PM2 instance. */
export async function runWhatsAppInOrder<T>(key: string, operation: () => Promise<T>): Promise<T> {
  const previous = pendingByKey.get(key) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  const tail = previous.catch(() => {}).then(() => current);
  pendingByKey.set(key, tail);

  await previous.catch(() => {});
  try {
    return await operation();
  } finally {
    release();
    if (pendingByKey.get(key) === tail) pendingByKey.delete(key);
  }
}
