# Report Generator — PT CSI

Generator laporan foto lapangan dengan output **PDF formal**.
UI memakai gaya **Neo-Brutalism**; PDF sengaja dibuat formal (navy PT CSI) karena
menghadap klien/HRD/vendor.

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **@react-pdf/renderer** — engine PDF (grid foto ber-caption, header/footer berulang)
- **Tailwind CSS** — styling neo-brutalist
- **Client-side image resize** (canvas) — kompres foto sebelum di-embed

Alasan `@react-pdf` dipilih (bukan Puppeteer): output ini grid foto seragam +
tanpa Chromium, jadi **deploy Vercel tanpa `@sparticuz/chromium`**, tanpa cold start.

---

## Langkah Menjalankan (step-by-step)

### 1. Prasyarat
Pastikan Node.js 18.18+ terpasang:
```bash
node -v
```

### 2. Install dependency
Dari dalam folder project:
```bash
npm install
```

### 3. Jalankan mode development
```bash
npm run dev
```
Buka http://localhost:3000

### 4. Pakai aplikasinya
1. Isi **Info Laporan** (merchant, MID, tiket, dst).
2. Set **caption default** (mis. `EDC BARU`), lalu **+ Tambah Foto** (bisa banyak sekaligus).
3. Foto otomatis dikompres (sisi terpanjang ≤1400px, JPEG q0.72).
4. Edit caption / index number per foto, atur urutan (← →), atau hapus (✕).
5. Klik **Export PDF**. File terunduh langsung dari browser.

### 5. Build untuk produksi
```bash
npm run build
npm run start
```

---

## Deploy ke Vercel

1. Push folder ini ke sebuah repo GitHub.
2. Di Vercel: **New Project → Import** repo tersebut.
3. Framework auto-terdeteksi (Next.js). Klik **Deploy**. Tidak ada env var wajib.

> Tidak perlu konfigurasi Chromium/serverless khusus — seluruh proses PDF berjalan
> di browser pengguna.

---

## Catatan teknis & batasan

- **Semua di client-side.** Foto tidak dikirim ke server; privasi aman, tapi
  beban ada di perangkat pengguna. Untuk ~40 foto, laptop biasa aman.
  Kalau ratusan foto, pertimbangkan pipeline server (lihat di bawah).
- **Kompresi foto** diatur di `lib/imageResize.ts` (`MAX_EDGE`, `QUALITY`).
  Naikkan kalau butuh lebih tajam untuk cetak; turunkan kalau PDF terlalu besar.
- **Belum ada:** OCR watermark GPS (index number diisi manual), penyimpanan
  draft, dan halaman FSE Report/Tanda Terima terstruktur (bisa ditambah nanti).

## Struktur file
```
report-gen/
├─ app/
│  ├─ components/
│  │  ├─ MetaForm.tsx        # form info laporan (neo-brutalist)
│  │  ├─ PhotoUploader.tsx   # upload + preview + caption + urutan
│  │  └─ ExportButton.tsx    # trigger export (dynamic import react-pdf)
│  ├─ globals.css            # utility neo-brutalist (nb-card, nb-btn, ...)
│  ├─ layout.tsx
│  └─ page.tsx               # merangkai semua
├─ lib/
│  ├─ types.ts               # ReportMeta, PhotoItem, ReportData
│  ├─ imageResize.ts         # kompres gambar di browser
│  └─ ReportPDF.tsx          # dokumen PDF FORMAL (bukan neo-brutalist)
├─ package.json
├─ next.config.mjs
├─ tailwind.config.ts
├─ postcss.config.mjs
└─ tsconfig.json
```
