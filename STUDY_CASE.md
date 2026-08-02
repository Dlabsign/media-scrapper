# Case Study: Nova — News Scraper & AI Caption Studio

## 1. Executive Summary

**Nama Aplikasi**: Nova — Scraper Berita & AI Caption Studio
**Repositori**: `dlab-media-scrapper`
**Tipe**: Web Application (Full-Stack)
**Status**: Development / Beta

Nova adalah aplikasi full-stack berbasis web yang dirancang untuk mengotomatisasi workflow content gathering dan pembuatan caption media sosial. Aplikasi ini menggabungkan tiga teknologi kunci — **Google News RSS** (sumber data berita), **Google Gemini AI** (generasi caption berbasis LLM), dan **pandas + openpyxl** (ekspor data terstruktur) — dalam satu antarmuka terpadu.

Dengan Nova, seorang konten kreator dapat memasukkan sebuah topik (misalnya *Crypto*, *Gadget*, atau *AI*), memilih lokasi dan rentang waktu, dan dalam hitungan detik mendapatkan sekumpulan artikel berita terbaru lengkap dengan caption siap pakai untuk media sosial, yang kemudian dapat diekspor ke format Excel atau CSV.

---

## 2. Latar Belakang & Masalah

### Konteks
Di era AI, content creator dan tim marketing digital butuh solusi yang dapat:

1. **Mengumpulkan berita terbaru** dari sumber tepercaya (Google News) secara cepat dan terprogram.
2. **Menghasilkan caption media sosial** yang konsisten, relevan, dan dalam bahasa Indonesia — tanpa harus menulis ulang untuk setiap artikel.
3. **Mengekspor hasil** ke format yang siap pakai di spreadsheet untuk kolaborasi tim.

### Tantangan yang Dihadapi
| Tantangan | Solusi di Nova |
|---|---|
| Google News tidak menyediakan API publik yang gratis | Menggunakan RSS feed Google News sebagai sumber data alternatif |
| Setiap halaman berita memiliki struktur HTML yang berbeda | Menggunakan BeautifulSoup untuk ekstraksi metadata (og:description) dengan fallback ke paragraf pertama |
| Pembuatan caption manual memakan waktu | Memanfaatkan Gemini AI (flash-lite) dengan prompt yang terstruktur untuk menghasilkan caption yang konsisten |
| Ekspor data harus kompatibel dengan Excel | Menggunakan pandas dengan encoding `utf-8-sig` untuk CSV dan `openpyxl` untuk Excel |

---

## 3. Arsitektur & Tumpukan Teknologi

### Tech Stack

| Layer | Teknologi | Versi/Referensi |
|---|---|---|
| **Frontend** | React (UI library), Vite 8 (build tool), Tailwind CSS 3 (styling) | React 19.2.8, Vite 8.2.0 |
| **Backend** | Flask (Python web framework), BeautifulSoup (HTML parsing), pandas (data processing) | Flask, pandas, openpyxl |
| **AI** | Google Gemini (`gemini-3.1-flash-lite`), `google-genai` SDK | `google.genai` package |
| **Data Source** | Google News RSS Feed | XML over HTTP |
| **Dev Tools** | ESLint, dotenv | `eslint` 10, `python-dotenv` |

### Diagram Arsitektur

```
┌─────────────────────────────────────────────────────────────────────┐
│                        User (Browser)                              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              React App (SPA di Vite Dev Server)             │  │
│  │                                                              │  │
│  │  ┌──────────────┐  ┌─────────────────┐  ┌──────────────┐    │  │
│  │  │ Search Form  │  │ Results Table   │  │ Export Btn   │    │  │
│  │  │ (topik,      │  │ (judul, sumber, │  │ (Excel/CSV)  │    │  │
│  │  │  lokasi,     │  │  caption editor)│  │              │    │  │
│  │  │  time range)  │  │                 │  │              │    │  │
│  │  └──────────────┘  └─────────────────┘  └──────────────┘    │  │
│  └──────────────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ HTTP request (POST /api/*)
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Vite Dev Server (proxy)                        │
│              /api/* → http://localhost:5000                       │
└─────────────────────────────────────────────────────────────────────┘
                           │ HTTP request
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Flask Backend (app.py)                          │
│                                                                     │
│  ┌─────────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ /api/scrape     │  │ /api/        │  │ /api/export │          │
│  │                 │  │ generate-    │  │  │          │          │
│  │ • HTTP GET      │  │ caption      │  │  │  │       │          │
│  │   Google News   │  │              │  │  │  │       │          │
│  │   RSS (XML)     │  │ • Gemini AI  │  │  │  │       │          │
│  │ • BeautifulSoup │  │   prompt     │  │  │  │       │          │
│  │   metadata      │  │   (Indonesian)│ │  │  │       │          │
│  │ • ThreadPoolExecutor│ │            │  │Excel│ CSV   │          │
│  │   (8 workers)   │  │              │  │     │       │          │
│  └─────────────────┘  └──────────────┘  └──────────────┘          │
│         │                      │                      │            │
│         │                      │                      │            │
│         ▼                      ▼                      ▼            │
│  ┌─────────────┐      ┌──────────────┐      ┌─────────────────┐     │
│  │ Google News │      │ Gemini LLM    │      │ pandas +         │     │
│  │ RSS Feed    │      │ (flash-lite)  │      │ openpyxl         │     │
│  │ (XML)       │      │               │      │ (in-memory)      │     │
│  └─────────────┘      └──────────────┘      └─────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

### Struktur Direktori

```
dlab-media-scrapper/
├── app.py                    # Flask backend server
├── .env                      # Environment variables (GEMINI_API_KEY)
├── vite.config.js            # Vite config + dev proxy
├── tailwind.config.js        # Tailwind theme customization
├── index.html                # HTML entry point
├── postcss.config.js
├── package.json              # Frontend dependencies
├── eslint.config.js
│
├── src/
│   ├── main.jsx              # React entry point
│   ├── App.jsx               # Main React component (all state + UI)
│   ├── index.css             # Global CSS + custom components
│   └── assets/               # SVG logos (vite.svg, react.svg, hero.png)
│
├── public/
│   ├── favicon.svg
│   └── icons.svg
│
└── dist/                     # Production build output
```

---

## 4. Detail Implementasi

### A. Scraper: Google News RSS (`app.py:77–108`)

#### Mekanisme
1. **URL RSS Construction**: Nova membangun URL Google News RSS secara dinamis dengan empat parameter:
   - `q` — topik pencarian (disanitasi dengan `urllib.parse.quote`)
   - `hl` — bahasa interface (mis. `id` untuk Indonesia, `en-US` untuk global)
   - `gl` — country geolokasi (mis. `ID`, `US`)
   - `ceid` — custom entry ID (mis. `ID:id` atau `US:en`)

2. **Time Filter**: Rentang waktu di-filter langsung di query string RSS:
   - `24h` → ditambahkan `when:1d` di query
   - `7d` → ditambahkan `when:7d`
   - `30d` → ditambahkan `when:30d`
   - `all` (Semua Waktu) → tidak ada filter tambahan

3. **Parallel Metadata Extraction**: Setelah RSS di-parse (menggunakan `xml.etree.ElementTree`), setiap item RSS diekstrak metadata detailnya secara paralel menggunakan `concurrent.futures.ThreadPoolExecutor(max_workers=8)`. Ini memungkinkan aplikasi untuk memproses hingga 50 artikel dan mengekstrak deskripsi dari masing-masing halaman asli secara bersamaan.

4. **Metadata Extraction** (`app.py:35–55`): Untuk setiap URL artikel, `BeautifulSoup` mencari:
   - Prioritas 1: `<meta property="og:description">` atau `<meta name="description">`
   - Fallback: paragraf pertama (`<p>`) yang panjangnya > 40 karakter
   - Jika gagal: mengembalikan `"-"`

#### Output Struktur Data
Setiap artikel di-representasikan sebagai dictionary Python:
```python
{
    "Judul": "Judul Berita",
    "Sumber Nama Website": "CNN Indonesia",
    "Deskripsi Artikel": "Deskripsi lengkap dari halaman...",
    "Sumber": "https://example.com/artikel",
    "Tanggal": "Mon, 01 Jan 2026 10:00:00 GMT",
    "Caption": ""  # Default kosong, diisi nanti oleh AI
}
```

#### Kode Inti (Potongan)
```python
def scrape_google_news(topik, lokasi, rentang_waktu, max_results):
    query = topik
    ceid, hl, gl = ("ID:id", "id", "ID") if lokasi.lower() in ['indonesia', 'id'] else ("US:en", "en-US", "US")

    if rentang_waktu == "24h": query += " when:1d"
    elif rentang_waktu == "7d": query += " when:7d"
    elif rentang_waktu == "30d": query += " when:30d"

    rss_url = f"https://news.google.com/rss/search?q={quote(query)}&hl={hl}&gl={gl}&ceid={ceid}"
    res = requests.get(rss_url, headers=HEADERS, timeout=10)
    root = ET.fromstring(res.content)
    items = root.findall('./channel/item')[:max_results]

    with ThreadPoolExecutor(max_workers=8) as executor:
        berita_list = list(executor.map(proses_item_berita, items))
    return berita_list
```

---

### B. Caption AI: Gemini Integration (`app.py:130–177`)

#### Prompt Engineering
Prompt sistem didesain untuk menghasilkan caption yang:
- **Bahasa Indonesia**, formal, lugas, dan profesional (untuk audiens 18–40 tahun)
- **Maksimal 3 paragraf** (hook + 2 paragraf rangkuman)
- **Tanpa format Markdown** (tidak boleh ada `**`, `*`, dll.)
- **Tanpa emoji** atau simbol dekoratif
- **Tidak boleh ada pertanyaan interaktif** atau ajakan komentar
- **Harus menyertakan tepat 5 hashtag** di bagian paling bawah

#### Model
- Model yang digunakan: `gemini-3.1-flash-lite` (optimisasi untuk kecepatan dan biaya)
- SDK: `google.genai` (Python SDK resmi Google)
- API Key dikelola melalui environment variable `GEMINI_API_KEY` yang dimuat dari file `.env` menggunakan `python-dotenv`

#### Error Handling
- Jika API key tidak ditemukan atau tidak valid, aplikasi memberikan peringatan di console dan mengembalikan error 500 ke frontend
- Semua exception ditangkap dan dikembalikan sebagai JSON error response

---

### C. Ekspor Data: Excel & CSV (`app.py:180–244`)

#### Excel Export (`/api/export/excel`)
- Menggunakan `pandas.ExcelWriter` dengan `openpyxl` engine
- Nama sheet: `Berita & Caption AI`
- **Auto-fit column width**: lebar kolom dihitung berdasarkan panjang konten terpanjang, dengan batas minimum 12 dan maksimum 50 karakter
- Kolom yang diekspor: `Judul`, `Sumber Media`, `Deskripsi Artikel`, `Caption AI (Sosmed)`, `Sumber`, `Tanggal`

#### CSV Export (`/api/export/csv`)
- Menggunakan `pandas.to_csv` dengan `encoding='utf-8-sig'` (BOM header untuk kompatibilitas dengan Excel yang membaca file CSV)
- Kolom yang diekspor: `Judul`, `Sumber Media`, `Deskripsi Artikel`, `Caption AI`, `Sumber`, `Tanggal`

#### Download
- Kedua endpoint mengembalikan file sebagai `multipart/form-data` attachment
- Frontend menggunakan `fetch().blob()` untuk mengunduh file langsung tanpa navigasi halaman

---

### D. Frontend: React State Management (`src/App.jsx`)

#### State Hooks
| State | Tipe | Deskripsi |
|---|---|---|
| `topik` | `string` | Topik pencarian berita |
| `lokasi` | `string` | Lokasi filter (`Indonesia` / `Global`) |
| `rentangWaktu` | `string` | Rentang waktu (`all`, `24h`, `7d`, `30d`) |
| `maxResults` | `number` | Jumlah maksimal berita (1–50) |
| `berita` | `array` | Array hasil berita (setiap elemen adalah object artikel) |
| `loading` | `boolean` | State loading saat scraping |
| `captionLoading` | `object` | Object per-index untuk track loading generate caption per baris |

#### State Synchronization Pattern
Aplikasi menggunakan pola **DOM-based state synchronization** yang cukup kreatif:

```javascript
const syncCaptions = () => {
  const captions = {}
  berita.forEach((item, idx) => {
    const el = document.getElementById(`caption-${idx}`)
    if (el) captions[idx] = el.value
  })
  return captions
}
```

Metode ini dipanggil sebelum setiap operasi penting (`generateCaption`, `deleteRow`, `downloadFile`) untuk memastikan:
1. Semua perubahan manual yang belum disinkronkan dari textarea caption pengguna tidak hilang
2. Data yang dikirim ke backend (export) mencerminkan state terbaru dari UI

#### Key Functions
| Fungsi | Deskripsi |
|---|---|
| `handleSubmit(e)` | Mengirim POST ke `/api/scrape` dengan parameter form, mengatur state `loading`, menampilkan skeleton shimmer |
| `syncCaptions()` | Membaca nilai semua textarea caption dari DOM dan mengembalikan sebagai object index-based |
| `deleteRow(index)` | Menghapus baris dari state `berita`, lalu melakukan reindexing untuk memastikan `caption-${idx}` tetap selaras |
| `generateCaption(index)` | Memanggil `/api/generate-caption` per baris, menggunakan `captionLoading` object untuk spinner per-baris |
| `downloadFile(format)` | Sinkronisasi caption, kemudian POST ke `/api/export/excel` atau `/api/export/csv`, mengunduh via `Blob` |

---

### E. UI/UX Design

#### Tema: Dark Mode
- Background utama: `#09090b` (`--bg-main`)
- Card background: `#121215` (`--bg-card`)
- Input background: `#18181b` (`--bg-input`)
- Aksen ungu: `#7c3aed` (`--purple-main`), hover `#6d28d9`

#### Komponen UI (didefinisikan di `src/index.css` sebagai Tailwind `@layer components`)
- **`.card`**: Container dengan background card, border, border-radius 16px
- **`.btn`** + varian: `.btn-primary` (ungu), `.btn-secondary` (outline), `.btn-danger` (merah), `.btn-sm` (ukuran kecil), `.btn-block` (full width)
- **`.badge`**: Badge pill berwarna ungu untuk menampilkan jumlah berita
- **`.icon-btn`**: Tombol ikon bulat (lonceng, avatar)
- **`.avatar`**: Circle avatar dengan inisial `DK` berwarna ungu

#### Responsive Layout
- Desktop: Grid 2 kolom dengan lebar panel kiri `340px–360px` dan panel kanan fleksibel
- Mobile: Single kolom, panel kiri muncul pertama kali
- Panel kiri **sticky** pada desktop (`lg:sticky lg:top-[76px]`) dengan scroll terbatas

#### Loading States
- **Scrape loading**: Skeleton shimmer (4 baris placeholder dengan gradien animasi) + spinner Putih-Biru berputar
- **Caption loading**: Spinner `fa-circle-notch fa-spin` per tombol "Caption"
- **Empty state**: Icon inbox ungu + pesan "Belum ada berita ditemukan"

#### Font & Ikon
- **Font**: Inter (body), Poppins (heading & brand)
- **Ikon**: Font Awesome 6 (via CDN di `index.html`)

---

## 5. Data Flow End-to-End

Berikut alur data lengkap dari interaksi pengguna hingga hasil akhir:

### Flow 1: Scraping Berita
```
1. User mengisi form (topik, lokasi, rentang waktu, jumlah) dan klik "Cari Berita"
2. React handleSubmit() → POST /api/scrape (dengan JSON body)
3. Vite dev server proxy /api → localhost:5000
4. Flask handle_scrape() → scrape_google_news()
5. Flask GET Google News RSS URL (XML response)
6. XML parsing → ekstraksi item RSS → ThreadPoolExecutor (8 workers)
7. Untuk setiap item → HTTP GET ke URL artikel asli → BeautifulSoup parse → ekstrak og:description
8. Kumpulkan semua berita → jsonify() → kirim JSON response ke Vite
9. Vite proxy → React App menerima JSON → setBerita(data)
10. React re-render → tabel hasil tampil
```

### Flow 2: Generate Caption
```
1. User klik tombol "Caption" pada sebuah baris
2. React generateCaption(index) → syncCaptions() → POST /api/generate-caption
3. Flask generate_caption() → buat prompt → panggil Gemini API (gemini-3.1-flash-lite)
4. Gemini mengembalikan caption text → jsonify({status: success, caption: ...})
5. React menerima → setBerita(prev => update caption per index)
6. React re-render → textarea caption terisi
```

### Flow 3: Export
```
1. User klik tombol "Excel" atau "CSV"
2. React downloadFile(format) → syncCaptions() → POST /api/export/excel (atau /csv)
3. Flask buat DataFrame dari berita+caption → export ke in-memory BytesIO
4. Flask send_file() sebagai response dengan mimetype yang tepat
5. React fetch() → response.blob() → buat ObjectURL → klik link untuk download
```

---

## 6. Pola Desain & Best Practices

| Prinsip | Implementasi |
|---|---|
| **Concurrent I/O** | `ThreadPoolExecutor(max_workers=8)` untuk paralel HTTP requests saat scraping metadata — mengurangi latency dari sekadar 50 request serial |
| **State Isolation** | `captionLoading` sebagai object (key: index, value: boolean) memungkinkan loading state per-baris yang independen |
| **Graceful Degradation** | BeautifulSoup dengan fallback chain (og:description → meta description → first paragraph) memastikan selalu ada deskripsi |
| **Dev CORS Avoidance** | Vite proxy `/api` → Flask port 5000 menghindari CORS issues selama development |
| **User Feedback** | `alert()` untuk error koneksi, skeleton shimmer untuk loading, spinner per-baris untuk async action |
| **Environment Variable** | `.env` + `python-dotenv` untuk menyimpan `GEMINI_API_KEY` (meskipun validasi hanya sekadar warning) |
| **Memory-Efficient File Generation** | Kedua export endpoint menggunakan `io.BytesIO` (in-memory buffer) — tidak perlu menulis file sementara ke disk |

---

## 7. Risiko, Keterbatasan, & Rekomendasi Pengembangan

### Risiko & Masalah yang Ditemukan
| No | Risiko | Lokasi | Dampak | Rekomendasi |
|---|---|---|---|---|
| 1 | **API key dalam .env yang ter-exposed** | `.env:1` | `.env` tidak ada di `.gitignore` secara eksplisit terlihat, tapi karena ada di `.gitignore` standard, berisiko jika committed | Pastikan `.env` selalu di `.gitignore`; gunakan `.env.example` sebagai template; gunakan **Google Cloud Secret Manager** untuk production |
| 2 | **Flask template `index2.html` tidak ditemukan** | `app.py:112` | `render_template('index2.html')` akan error 500 pada route `/` karena tidak ada folder `templates/` dan file `index2.html` | Frontend sudah berjalan di Vite dev server; route `/` di Flask tidak diperlukan. Hapus route tersebut atau buat symlink ke `dist/index.html` |
| 3 | **Tidak ada input validation di sisi server** | `app.py:120` | `max_results` dikonversi ke `int` tanpa validasi rentang — eksploitasi potensial pada server (DoS) | Tambahkan validasi: `max(1, min(int(max_results), 50))` di backend |
| 4 | **Hardcoded relative URL di frontend** | `App.jsx:16,75,114` | `/api/...` hanya bekerja dengan Vite dev proxy; akan break di production | Gunakan variable `BASE_URL` dari env (`import.meta.env.VITE_API_URL`) atau gunakan path relatif yang konsisten |
| 5 | **Tidak ada caching untuk scraping** | `app.py:94-108` | Setiap request mengambil data fresh dari Google News → potensi rate limiting & performance buruk | Implementasikan caching sederhana (mis. `functools.lru_cache` dengan TTL, atau Redis untuk production) |
| 6 | **Timeout HTTP request singkat** | `app.py:39,95` | Timeout 5 detik (metadata) & 10 detik (RSS) bisa terlalu singkat untuk situs lambat | Gunakan timeout yang lebih fleksibel, atau retry mechanism (mis. `tenacity` library) |
| 7 | **Tidak ada unit/integration tests** | — | Risiko regresi saat pengembangan lanjutan | Tambahkan pytest untuk backend, dan @testing-library/react untuk frontend |
| 8 | **Model `gemini-3.1-flash-lite` mungkin tidak valid** | `app.py:167` | Nama model bisa berubah; jika tidak ditemukan akan error API | Verifikasi nama model di Google Cloud docs; pertimbangkan fallback ke `gemini-1.5-flash` |
| 9 | **Textarea tidak terikat state (uncontrolled component)** | `App.jsx:362-366` | Textarea menggunakan `id` dan `document.getElementById()` — tidak reaktif, tidak dapat di-serialize secara langsung | Pertimbangkan untuk mengubah ke controlled component dengan state tracking, atau gunakan `useRef` |

### Prioritas Pengembangan Lanjutan
| Priority | Fokus | Deskripsi |
|---|---|---|
| **Tinggi** | Environment & Security | Pastikan `.env` di-ignored, gunakan env vars yang aman |
| **Tinggi** | Server-side Validation | Tambahkan sanitasi input untuk semua parameter |
| **Sedang** | Production Deployment | Konfigurasi `BASE_URL` untuk production build, perbaiki Flask routing |
| **Sedang** | Caching Layer | Tambahkan cache untuk RSS feed agar tidak over-scrape |
| **Rendah** | Testing | Tambahkan unit test & integration test |
| **Rendah** | CI/CD | GitHub Actions untuk lint + build verification |

---

## 8. Kesimpulan

Proyek **Nova** adalah sebuah aplikasi full-stack yang **solid dan fungsional** untuk workflow content gathering dan AI-powered social media caption generation. Arsitekturnya bersih dengan pemisahan frontend (React+Vite) dan backend (Flask) yang jelas, serta memanfaatkan **concurrent processing** untuk memaksimalkan performa scraping.

Penggunaan **prompt engineering** yang terstruktur untuk Gemini AI memastikan caption yang dihasilkan konsisten dan siap pakai untuk media sosial Bahasa Indonesia. Fitur ekspor dual-format (Excel + CSV) meningkatkan utilitas aplikasi untuk kolaborasi tim dan workflow profesional.

Yang paling menarik dari Nova adalah **keputusan desain bertumpu pada kebutuhan praktis pengguna akhir** — dari skeleton loading animations hingga per-baris caption generation, setiap detail UI/UX dirancang untuk mengurangi friction dalam workflow content creator.

**Langkah selanjutnya yang disarankan**: Memperbaiki keamanan (environment variables & input validation), menyiapkan deployment production-ready, dan menambahkan test coverage untuk memastikan stabilitas saat pengembangan lanjutan.

---

*Dokumen ini dibuat berdasarkan analisis kode sumber proyek `dlab-media-scrapper` pada 2026-08-02.*
