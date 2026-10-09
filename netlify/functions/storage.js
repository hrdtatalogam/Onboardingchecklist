import { getStore } from '@netlify/blobs';

const STORE_NAME = 'checklist-hc-tatalogam';
const HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: HEADERS });
const parse = (s) => { try { return typeof s === 'string' ? JSON.parse(s) : s; } catch { return null; } };

export default async (req) => {
  // strong consistency: data yang baru disimpan langsung terbaca (tanpa delay/data lama)
  const store = getStore({ name: STORE_NAME, consistency: 'strong' });
  const url = new URL(req.url);

  try {
    if (req.method === 'GET') {
      const key = url.searchParams.get('key');
      const prefix = url.searchParams.get('prefix');

      if (key) {
        const value = await store.get(key);
        return json({ key, value: value === null ? null : value });
      }
      // Ambil semua data sekaligus (1 request) -> loading jauh lebih cepat
      if (url.searchParams.get('bulk')) {
        const { blobs } = await store.list();
        const entries = await Promise.all(blobs.map(async (b) => [b.key, await store.get(b.key)]));
        return json({ items: Object.fromEntries(entries.filter(([, v]) => v !== null)) });
      }
      if (prefix !== null) {
        const { blobs } = await store.list({ prefix });
        return json({ keys: blobs.map((b) => b.key) });
      }
      return json({ error: 'key, bulk, or prefix query param required' }, 400);
    }

    if (req.method === 'POST') {
      const { key, value } = (await req.json()) || {};
      if (!key) return json({ error: 'key required' }, 400);

      // Riwayat revisi bersifat append-only: revisi yang sudah selesai tidak boleh diubah/dikurangi
      if (key.startsWith('employee:')) {
        const prev = parse(await store.get(key));
        const next = parse(value);
        const prevRevs = prev && Array.isArray(prev.revisions) ? prev.revisions : [];
        if (prevRevs.length) {
          const nextRevs = next && Array.isArray(next.revisions) ? next.revisions : null;
          if (!nextRevs || nextRevs.length < prevRevs.length) {
            return json({ error: 'Riwayat revisi tidak boleh dihapus atau dikurangi' }, 409);
          }
          for (let i = 0; i < prevRevs.length; i++) {
            if (JSON.stringify(prevRevs[i]) !== JSON.stringify(nextRevs[i])) {
              return json({ error: 'Revisi yang sudah selesai tidak boleh diubah' }, 409);
            }
          }
        }
      }
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
