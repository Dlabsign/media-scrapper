# Study Case: Nova — Scraper Berita & AI Caption Studio

## 1. Gambaran Proyek

**Nama**: Nova — Scraper Berita & AI Caption Studio
**Repositori**: `dlab-media-scrapper`
**Tumpukan Teknologi**: React 19 + Vite 8 (frontend), Flask + Python (backend), Tailwind CSS 3 (styling), Google Gemini API (AI), Google News RSS (data source)

Proyek ini adalah aplikasi full-stack berbasis web yang memungkinkan pengguna untuk:

- **Mengambil (scrape)** berita terbaru dari Google News berdasarkan topik, lokasi, dan rentang waktu.
- **Menghasilkan caption** media sosial otomatis untuk setiap artikel berita menggunakan AI Gemini.
- **Mengekspor** hasil ke format Excel (`.xlsx`) atau CSV.

---

## 2. Arsitektur & Struktur

### Frontend (React + Vite)

| File | Deskripsi |
|---|---|
| `src/App.jsx` | Komponen utama React yang mengelola seluruh state aplikasi (topik, lokasi, rentang waktu, hasil berita, loading state, caption loading per baris). |
| `src/main.jsx` | Entry point, merender `App` ke dalam `#root`. |
| `src/index.css` | Styling global dengan CSS custom properties (variabel warna dark theme) dan utility classes Tailwind. |
| `tailwind.config.js` | Konfigurasi tema custom (warna dark, border radius, keyframe shimmer untuk skeleton loading). |
| `vite.config.js` | Proxy `/api` ke backend Flask di `localhost:5000`. |

### Backend (Flask / Python)

| File | Deskripsi |
|---|---|
| `app.py` | Server Flask dengan 4 endpoint utama: `GET /`, `POST /api/scrape`, `POST /api/generate-caption`, `POST /api/export/excel`, `POST /api/export/csv`. |

### Data Flow

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

## 3. Detail Implementasi

### A. Scraping Google News (`app.py:69–100`)

- Membangun URL RSS Google News dengan parameter query, `hl` (language), `gl` (country), dan `ceid` (custom engine ID).
- Mendukung filter waktu: `when:1d`, `when:7d`, `when:30d`.
- Menggunakan `concurrent.futures.ThreadPoolExecutor(max_workers=8)` untuk memproses item RSS secara paralel — setiap item diekstrak deskripsinya dengan `BeautifulSoup` dari URL aslinya.

### B. Caption AI (`app.py:122–169`)

- Prompt sistem dirancang untuk menghasilkan caption Bahasa Indonesia yang formal, maksimal 3 paragraf, tanpa emoji/markdown, dengan 5 hashtag di bawah.
- Menggunakan model `gemini-3.1-flash-lite` via `google.genai` SDK.
- API key dikonfigurasi langsung di kode (baris 20) — ini merupakan **risiko keamanan** yang perlu diperbaiki.

### C. Ekspor Data (`app.py:172–236`)

- **Excel**: menggunakan `pandas.ExcelWriter` dengan `openpyxl`, auto-fit column width.
- **CSV**: menggunakan `pandas.to_csv` dengan encoding `utf-8-sig` (BOM untuk kompatibilitas Excel).

### D. Frontend State Management (`App.jsx`)

- State hooks: `berita` (array hasil), `loading` (boolean), `captionLoading` (object per-index).
- `syncCaptions()` — mengumpulkan nilai textarea manual sebelum operasi AI/export, memastikan perubahan pengguna tidak hilang.
- `deleteRow()` — menghapus baris dan meng-reindex caption yang tersisa.

---

## 4. Pola & Best Practices yang Digunakan

| Aspek | Implementasi |
|---|---|
| **Concurrent scraping** | `ThreadPoolExecutor` dengan 8 workers untuk mempercepat fetch metadata |
| **Dark theme UI** | CSS custom properties + Tailwind custom colors |
| **Skeleton loading** | Shimmer animation dengan `bg-gradient` + `animate-shimmer` |
| **Responsive layout** | Grid `lg:grid-cols-[340px_1fr]` dengan panel kiri sticky |
| **Proxy dev** | Vite proxy menghindari CORS saat development |
| **Graceful error handling** | Try/catch di setiap `fetch` dengan `alert()` untuk user feedback |

---

## 5. Risiko & Area Perbaikan

1. **Keamanan API Key** — Gemini API key tertulis langsung di `app.py:20`. Sebaiknya dipindahkan ke environment variable (`os.environ.get('GEMINI_API_KEY')`).
2. **Tidak ada templates folder** — `render_template('index2.html')` merujuk ke file yang tidak ditemukan di struktur proyek saat ini. Flask membutuhkan folder `templates/` untuk file HTML.
3. **Hardcoded endpoint** — Frontend menggunakan relative URL `/api/...` yang hanya bekerja saat dev server proxy aktif. Untuk production, perlu konfigurasi base URL.
4. **Tidak ada validasi input sisi server** — `max_results` dikonversi langsung ke `int` tanpa batasan aman (meskipun ada `max="50"` di frontend).
5. **Tidak ada caching** — Setiap request scraping mengambil data fresh dari Google News tanpa cache, yang bisa menyebabkan rate limiting.
6. **Tidak ada tes** — Tidak ditemukan file test (unit/integration) di proyek.

---

## 6. Kesimpulan

Proyek **Nova** adalah aplikasi full-stack yang solid untuk kebutuhan content gathering dan social media caption generation. Arsitekturnya bersih dengan pemisahan frontend (React) dan backend (Flask) yang jelas, serta memanfaatkan concurrent processing untuk performa scraping. Fokus utama pengembangan selanjutnya sebaiknya pada: keamanan (environment variables), penambahan tests, dan penyelesaian masalah template Flask agar aplikasi bisa di-deploy secara production-ready.