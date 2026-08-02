# Isi Website — Nova Scraper Berita & AI Caption Studio

## Ikhtisar

**Nama**: Nova — Scraper Berita & AI Caption Studio
**Repositori**: `dlab-media-scrapper`
**Tumpukan Teknologi**: React 19 + Vite 8 (frontend), Flask + Python (backend), Tailwind CSS 3 (styling), Google Gemini API (AI), Google News RSS (sumber data)

Website ini adalah aplikasi full-stack berbasis web yang memungkinkan pengguna untuk:

- **Mengambil (scrape)** berita terbaru dari Google News berdasarkan topik, lokasi, dan rentang waktu.
- **Menghasilkan caption** media sosial otomatis untuk setiap artikel berita menggunakan AI Gemini.
- **Mengekspor** hasil ke format Excel (`.xlsx`) atau CSV.

---

## Halaman Utama (UI)

### 1. Topbar (Header)

- **Brand**: Logo berupa ikon satelit (`fa-satellite-dish`) dengan nama **Nova Scraper**.
- **Navigasi**: Tampilan breadcrumb mobile `Nova / Pencarian Berita` dan judul halaman `Scraper Berita & AI Caption`.
- **Search bar**: Kolom pencarian cepat (tersembunyi di mobile, muncul di `md` ke atas).
- **Notifikasi**: Ikon lonceng (`fa-bell`).
- **Avatar**: Inisial pengguna `DK`.

### 2. Panel Kiri (Sidebar / Form Pencarian)

Berisi formulir pencarian dengan field berikut:

| Field | Tipe | Opsi / Default |
|---|---|---|
| **Topik Berita** | Input teks | Contoh: `Crypto`, `Gadget`, `AI` |
| **Lokasi** | Dropdown | `Indonesia` atau `Global (Internasional)` |
| **Rentang Waktu** | Dropdown | `Semua Waktu`, `24 Jam Terakhir`, `7 Hari Terakhir`, `30 Hari Terakhir` |
| **Jumlah Berita** | Input angka | Min 1, Max 50, default 15 |

Tombol aksi: **Cari Berita** (dengan ikon `fa-magnifying-glass`).

**Promo Card**: Banner informasi bahwa Gemini AI aktif dan bisa membuat caption otomatis.

### 3. Panel Kanan (Hasil)

Menampilkan hasil pencarian dalam bentuk tabel dengan kolom:

| Kolom | Deskripsi |
|---|---|
| **No** | Nomor urut |
| **Judul Artikel** | Judul berita (link ke sumber asli, truncate 2–3 baris) |
| **Sumber** | Nama website asli (tersembunyi di mobile, tampil di desktop) |
| **Caption AI** | Textarea untuk caption buatan AI (bisa diedit manual) |
| **Aksi** | Tombol aksi per baris |

Tombol aksi per baris:
- **Caption** — memanggil Gemini AI untuk menghasilkan caption otomatis (iklon `fa-wand-magic-sparkles`).
- **Link** — membuka sumber artikel di tab baru (iklon `fa-arrow-up-right-from-square`).
- **Hapus** — menghapus baris dari daftar hasil (iklon `fa-xmark`).

### 4. State Loading (Sedang Memuat)

- Tampilan skeleton loading dengan animasi shimmer (gradient placeholder).
- Teks: `Sedang Menghubungi Server Berita...` dan `Mengambil artikel terbaru dan menyusun daftar untuk Anda`.
- Spinner berputar berwarna ungu.

### 5. State Kosong (Belum Ada Hasil)

- Ikon inbox ungu (`fa-inbox`).
- Teks: `Belum ada berita ditemukan` dan petunjuk untuk mengubah kata kunci atau rentang waktu.

### 6. Ekspor Hasil

- Tombol **Excel** (`fa-file-excel`, warna hijau) dan **CSV** (`fa-file-csv`).
- File diunduh dengan nama `hasil_berita_dan_caption.xlsx` atau `.csv`.

---

## Arsitektur & Endpoint Backend

### Endpoint Flask (`app.py`)

| Endpoint | Metode | Fungsi |
|---|---|---|
| `/` | GET | Merender halaman utama (`index2.html`) |
| `/api/scrape` | POST | Menerima parameter pencarian, meng-scrape Google News RSS, mengembalikan daftar berita |
| `/api/generate-caption` | POST | Menerima `judul`, `deskripsi`, `sumber`, menghasilkan caption via Gemini API |
| `/api/export/excel` | POST | Mengekspor data berita + caption ke `.xlsx` |
| `/api/export/csv` | POST | Mengekspor data berita + caption ke `.csv` |

### Alur Data

```
User (Browser)
  → React App (fetch POST /api/scrape)
    → Vite Dev Server (proxy /api → localhost:5000)
      → Flask Backend (app.py)
        → Google News RSS (XML parsing)
        → Per-item metadata extraction (BeautifulSoup)
        → Gemini API (caption generation)
        → pandas + openpyxl (Excel export)
      ← JSON response
    ← JSON response
  ← Rendered UI
```

---

## Fitur Utama

### A. Scraping Google News
- Membangun URL RSS Google News dengan parameter query, `hl` (bahasa), `gl` (negara), dan `ceid` (custom engine ID).
- Mendukung filter waktu: `when:1d`, `when:7d`, `when:30d`.
- Menggunakan `concurrent.futures.ThreadPoolExecutor(max_workers=8)` untuk pemrosesan paralel.
- Setiap item diekstrak deskripsinya dari URL asli menggunakan `BeautifulSoup` (mencari `og:description` meta tag atau paragraf pertama yang panjang).

### B. Caption AI (Gemini)
- Prompt sistem menghasilkan caption Bahasa Indonesia yang formal, maksimal 3 paragraf.
- Tidak boleh menggunakan emoji, markdown, atau simbol dekoratif.
- Harus menyertakan tepat 5 hashtag di bawah caption.
- Model yang digunakan: `gemini-3.1-flash-lite`.

### C. Ekspor Data
- **Excel**: menggunakan `pandas.ExcelWriter` dengan `openpyxl`, auto-fit column width.
- **CSV**: menggunakan `pandas.to_csv` dengan encoding `utf-8-sig` (BOM untuk kompatibilitas Excel).
- Kolom yang diekspor: `Judul`, `Sumber Media`, `Deskripsi Artikel`, `Caption AI`, `Sumber`, `Tanggal`.

---

## Konfigurasi & File Pendukung

| File | Fungsi |
|---|---|
| `index.html` | Entry point HTML, title halaman `Nova — Scraper Berita & AI Caption Studio`, font Inter & Poppins, Font Awesome 6 |
| `src/main.jsx` | Entry point React, merender `App` ke `#root` |
| `src/App.jsx` | Komponen utama — seluruh state dan UI aplikasi |
| `src/index.css` | Global CSS, custom properties (variabel warna dark theme), utility classes Tailwind, komponen `.card`, `.btn`, `.badge`, `.promo-card`, dll. |
| `tailwind.config.js` | Tema custom: warna dark, border radius, keyframe shimmer untuk skeleton loading |
| `vite.config.js` | Proxy `/api` ke backend Flask di `localhost:5000` |
| `app.py` | Server Flask dengan 4 endpoint utama |
| `public/favicon.svg` | Favicon website |
| `public/icons.svg` | Ikon tambahan |
| `.env` | File environment (berisi `GEMINI_API_KEY`) |

---

## Desain & Tema Visual

- **Dark theme** dengan background `#09090b`, card `#121215`, input `#18181b`.
- **Warna aksen utama**: Ungu (`#7c3aed`) — digunakan untuk brand, tombol utama, dan highlight.
- **Tipografi**: Poppins untuk heading, Inter untuk body text.
- **Responsive**: Layout grid 2 kolom di desktop (`lg:grid-cols-[340px_1fr]`), single column di mobile.
- **Skeleton loading**: Animasi shimmer dengan gradient.
- **Border radius**: Custom (`--radius-lg: 16px`, `--radius-md: 10px`, `--radius-sm: 8px`).