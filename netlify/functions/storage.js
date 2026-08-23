import { getStore } from '@netlify/blobs';

const STORE_NAME = 'checklist-hc-tatalogam';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export default async (req) => {
  const store = getStore(STORE_NAME);
  const url = new URL(req.url);

  try {
    if (req.method === 'GET') {
      const key = url.searchParams.get('key');
      const prefix = url.searchParams.get('prefix');

      if (key) {
        const value = await store.get(key);
        return json({ key, value: value === null ? null : value });
      }

      if (prefix !== null) {
        const { blobs } = await store.list({ prefix });
        return json({ keys: blobs.map((b) => b.key) });
      }

      return json({ error: 'key or prefix query param required' }, 400);
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { key, value } = body || {};
      if (!key) return json({ error: 'key required' }, 400);
      await store.set(key, typeof value === 'string' ? value : JSON.stringify(value));
      return json({ ok: true, key });
    }

    if (req.method === 'DELETE') {
      const key = url.searchParams.get('key');
      if (!key) return json({ error: 'key required' }, 400);
      await store.delete(key);
      return json({ ok: true, key });
    }

    return json({ error: 'method not allowed' }, 405);
  } catch (err) {
    return json({ error: err.message || 'internal error' }, 500);
  }
};

export const config = { path: '/api/storage' };
