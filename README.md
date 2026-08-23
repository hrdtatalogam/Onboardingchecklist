# Checklist Digital Human Capital — PT Tatalogam Group

Aplikasi checklist untuk 3 jenis proses HR:
1. Onboarding (Karyawan Baru)
2. Mutasi & Rotasi (Promosi/Demosi/Rotasi)
3. Resign

Data tersimpan di **Netlify Blobs** (server-side), jadi bisa diakses bareng-bareng oleh tim HC dari device manapun.

## Struktur folder

```
├── netlify.toml              # konfigurasi build Netlify
├── package.json              # dependency @netlify/blobs
├── public/
│   └── index.html            # seluruh aplikasi (UI + logic)
└── netlify/
    └── functions/
        └── storage.js        # serverless function: get/set/delete/list ke Netlify Blobs
```

## Cara deploy

### Opsi A — Drag & drop lewat Netlify UI (paling cepat)
1. Buka https://app.netlify.com → "Add new site" → "Deploy manually"
2. Drag folder project ini (yang berisi `netlify.toml`, `public/`, `netlify/`) ke area upload
3. Netlify otomatis detect `netlify.toml` dan deploy function-nya
4. Tunggu build selesai, buka URL yang diberikan

> Catatan: untuk metode drag & drop, pastikan Netlify tetap menjalankan `npm install` agar dependency `@netlify/blobs` ter-install. Kalau function error "cannot find module", pakai Opsi B (lewat Git) supaya Netlify build dari awal termasuk `npm install`.

### Opsi B — Lewat GitHub (direkomendasikan, auto-redeploy tiap ada perubahan)
1. Push folder ini ke repo GitHub baru
2. Di Netlify: "Add new site" → "Import an existing project" → pilih repo tersebut
3. Build settings akan otomatis kebaca dari `netlify.toml`:
   - Publish directory: `public`
   - Functions directory: `netlify/functions`
4. Klik "Deploy site"

### Opsi C — Netlify CLI
```bash
npm install -g netlify-cli
cd checklist-hc-tatalogam
netlify deploy --prod
```

## Catatan penting

- **Netlify Blobs otomatis aktif** begitu site di-deploy di Netlify — tidak perlu setup API key atau environment variable tambahan.
- Semua data (template checklist, kategori, data karyawan per proses, tanda tangan) tersimpan di satu Blob store bernama `checklist-hc-tatalogam`, sifatnya **shared** — semua orang yang buka link ini melihat data yang sama.
- Kalau butuh membatasi siapa yang bisa akses (misal cuma tim HC), bisa tambahkan **Netlify Identity** atau proteksi password di menu Site settings → Access control setelah deploy.
- Kalau mau reset semua data, tinggal hapus Blob store lewat Netlify Dashboard → Blobs, atau buat store baru dengan mengganti `STORE_NAME` di `netlify/functions/storage.js`.
