import { useState } from 'react'

function App() {
  const [topik, setTopik] = useState('')
  const [lokasi, setLokasi] = useState('Indonesia')
  const [rentangWaktu, setRentangWaktu] = useState('all')
  const [maxResults, setMaxResults] = useState(15)
  const [berita, setBerita] = useState([])
  const [loading, setLoading] = useState(false)
  const [captionLoading, setCaptionLoading] = useState({})

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topik,
          lokasi,
          rentang_waktu: rentangWaktu,
          max_results: maxResults,
        }),
      })
      const data = await response.json()
      if (data.berita && data.berita.length > 0) {
        setBerita(data.berita)
      } else {
        setBerita([])
      }
    } catch (error) {
      alert('Terjadi kesalahan saat mengambil data.')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const syncCaptions = () => {
    const captions = {}
    berita.forEach((item, idx) => {
      const el = document.getElementById(`caption-${idx}`)
      if (el) {
        captions[idx] = el.value
      }
    })
    return captions
  }

  const deleteRow = async (index) => {
    const captions = syncCaptions()
    const updated = [...berita]
    updated.splice(index, 1)
    updated.forEach((item, idx) => {
      if (captions[idx] !== undefined) {
        item.Caption = captions[idx]
      }
    })
    setBerita(updated)
  }

  const generateCaption = async (index) => {
    const captions = syncCaptions()
    const updated = [...berita]
    if (captions[index] !== undefined) {
      updated[index].Caption = captions[index]
    }
    setBerita(updated)

    const item = updated[index]
    setCaptionLoading((prev) => ({ ...prev, [index]: true }))

    try {
      const response = await fetch('/api/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          judul: item.Judul,
          deskripsi: item['Deskripsi Artikel'],
          sumber: item['Sumber Nama Website'],
        }),
      })
      const data = await response.json()
      if (data.status === 'success') {
        setBerita((prev) => {
          const next = [...prev]
          next[index] = { ...next[index], Caption: data.caption }
          return next
        })
      } else {
        alert(`Gagal membuat caption: ${data.message}`)
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi ke server.')
      console.error(err)
    } finally {
      setCaptionLoading((prev) => ({ ...prev, [index]: false }))
    }
  }

  const downloadFile = async (format) => {
    if (berita.length === 0) {
      alert('Tidak ada data untuk diunduh.')
      return
    }

    const captions = syncCaptions()
    const dataToSend = berita.map((item, idx) => ({
      ...item,
      Caption: captions[idx] !== undefined ? captions[idx] : item.Caption,
    }))

    const endpoint = format === 'excel' ? '/api/export/excel' : '/api/export/csv'
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ berita: dataToSend }),
      })
      if (!response.ok) throw new Error('Gagal mendownload file')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `hasil_berita_dan_caption.${format === 'excel' ? 'xlsx' : 'csv'}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert('Terjadi kesalahan saat mengunduh file.')
      console.error(err)
    }
  }

  return (
    <div className="min-h-screen bg-bg-main text-text-hi">
      {/* Topbar */}
      <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-[#0d0d10] px-4 py-3 md:gap-5 md:px-7 md:py-[14px]">
        <div className="flex items-center gap-3 md:gap-5">
          <div className="brand flex items-center gap-2 text-base font-bold md:text-lg">
            <span className="mark flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-purple-main text-sm text-white">
              <i className="fa-solid fa-satellite-dish"></i>
            </span>
            <span className="hidden sm:inline">Nova Scraper</span>
          </div>
          <div className="hidden sm:flex sm:flex-col sm:gap-0.5 sm:border-l sm:border-border sm:pl-4">
            <div className="text-xs text-text-low">
              Nova <span>/</span> <span className="text-purple-main">Pencarian Berita</span>
            </div>
            <h1 className="text-sm font-semibold md:text-base">Scraper Berita & AI Caption</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <div className="top-search hidden md:flex md:items-center md:gap-2 md:rounded-full md:border md:border-border md:bg-bg-input md:px-3.5 md:py-[7px] md:w-[220px]">
            <i className="fa-solid fa-magnifying-glass text-xs text-text-low"></i>
            <input
              type="text"
              placeholder="Cari cepat..."
              className="w-full bg-transparent border-none outline-none text-sm text-text-hi"
            />
          </div>
          <button className="icon-btn">
            <i className="fa-regular fa-bell"></i>
          </button>
          <div className="avatar hidden sm:flex">DK</div>
        </div>
      </header>

      {/* Mobile Page Title */}
      <div className="border-b border-border px-4 py-3 sm:hidden">
        <h1 className="text-base font-semibold">Scraper Berita & AI Caption</h1>
        <p className="text-xs text-text-low">Nova / Pencarian Berita</p>
      </div>

      {/* Content */}
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-4 p-4 lg:grid-cols-[340px_1fr] lg:gap-6 lg:p-6 xl:grid-cols-[360px_1fr] xl:gap-8 xl:p-8">
        {/* Left Panel */}
        <section className="card lg:sticky lg:top-[76px] lg:max-h-[calc(100vh-96px)] lg:self-start lg:overflow-y-auto lg:scrollbar-thin flex flex-col gap-4 p-4 lg:p-5 xl:p-6">
          <div>
            <h2 className="m-0 mb-1 text-base font-semibold">Cari Berita</h2>
            <p className="m-0 text-xs text-text-mid lg:text-sm">Hasil akan tampil di panel kanan lengkap dengan opsi caption AI dan ekspor.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 lg:gap-4">
            <div className="field">
              <label htmlFor="topik" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-mid">
                Topik Berita
              </label>
              <input
                type="text"
                id="topik"
                value={topik}
                onChange={(e) => setTopik(e.target.value)}
                placeholder="Contoh: Crypto, Gadget, AI"
                required
                className="h-[40px] w-full rounded-md border border-border bg-bg-input px-3 text-sm text-text-hi outline-none transition-colors focus:border-border-focus"
              />
            </div>

            <div className="field">
              <label htmlFor="lokasi" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-mid">
                Lokasi
              </label>
              <select
                id="lokasi"
                value={lokasi}
                onChange={(e) => setLokasi(e.target.value)}
                className="h-[40px] w-full rounded-md border border-border bg-bg-input px-3 text-sm text-text-hi outline-none transition-colors focus:border-border-focus"
              >
                <option value="Indonesia">Indonesia</option>
                <option value="Global">Global (Internasional)</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="rentangWaktu" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-mid">
                Rentang Waktu
              </label>
              <select
                id="rentangWaktu"
                value={rentangWaktu}
                onChange={(e) => setRentangWaktu(e.target.value)}
                className="h-[40px] w-full rounded-md border border-border bg-bg-input px-3 text-sm text-text-hi outline-none transition-colors focus:border-border-focus"
              >
                <option value="all">Semua Waktu</option>
                <option value="24h">24 Jam Terakhir</option>
                <option value="7d">7 Hari Terakhir</option>
                <option value="30d">30 Hari Terakhir</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="maxResults" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-mid">
                Jumlah Berita
              </label>
              <input
                type="number"
                id="maxResults"
                value={maxResults}
                onChange={(e) => setMaxResults(Number(e.target.value))}
                min="1"
                max="50"
                className="h-[40px] w-full rounded-md border border-border bg-bg-input px-3 text-sm text-text-hi outline-none transition-colors focus:border-border-focus"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-block"
            >
              <i className="fa-solid fa-magnifying-glass"></i>
              <span>{loading ? 'Mencari...' : 'Cari Berita'}</span>
            </button>
          </form>

          <div className="promo-card">
            <p>
              <i className="fa-solid fa-bolt text-purple-main"></i>
              Gemini AI aktif — buat caption otomatis untuk tiap artikel langsung dari tabel hasil.
            </p>
          </div>
        </section>

        {/* Right Panel */}
        <section className="flex min-w-0 flex-col gap-4 lg:gap-5">
          {/* Loading */}
          {loading && (
            <div className="card flex flex-col items-center gap-5 p-6 text-center md:p-9">
              <div className="flex flex-col items-center gap-3">
                <div className="h-[42px] w-[42px] animate-spin rounded-full border-[3px] border-[rgba(124,58,237,0.2)] border-t-purple-main"></div>
                <div>
                  <h3 className="m-0 text-sm font-semibold">Sedang Menghubungi Server Berita...</h3>
                  <p className="mt-1 text-xs text-text-mid lg:text-sm">Mengambil artikel terbaru dan menyusun daftar untuk Anda</p>
                </div>
              </div>
              <div className="flex w-full flex-col gap-2.5">
                <div className="h-[52px] w-full rounded-md bg-gradient-to-r from-bg-input via-[#222228] to-bg-input bg-[length:200%_100%] animate-shimmer"></div>
                <div className="h-[52px] w-full rounded-md bg-gradient-to-r from-bg-input via-[#222228] to-bg-input bg-[length:200%_100%] animate-shimmer"></div>
                <div className="h-[52px] w-full rounded-md bg-gradient-to-r from-bg-input via-[#222228] to-bg-input bg-[length:200%_100%] animate-shimmer"></div>
                <div className="h-[52px] w-full rounded-md bg-gradient-to-r from-bg-input via-[#222228] to-bg-input bg-[length:200%_100%] animate-shimmer"></div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && berita.length === 0 && (
            <div className="card flex flex-col items-center justify-center gap-3 p-8 text-center text-text-mid md:p-14">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-main/10">
                <i className="fa-solid fa-inbox text-2xl text-purple-main"></i>
              </div>
              <div>
                <h3 className="m-0 text-sm font-semibold text-text-hi">Belum ada berita ditemukan</h3>
                <p className="m-0 mt-1 text-xs text-text-mid lg:text-sm">Coba ubah kata kunci topik atau rentang waktu pencarian Anda.</p>
              </div>
            </div>
          )}

          {/* Results */}
          {!loading && berita.length > 0 && (
            <div className="card overflow-hidden">
              <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between md:gap-4 md:px-5.5 md:py-[18px]">
                <div className="flex items-center gap-2.5">
                  <h2 className="m-0 text-sm font-semibold">Hasil Pencarian</h2>
                  <span className="badge">{berita.length} Berita</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => downloadFile('excel')}
                    className="btn btn-secondary btn-sm flex-1 md:flex-none"
                  >
                    <i className="fa-solid fa-file-excel text-success"></i>
                    <span className="hidden md:inline">Excel</span>
                  </button>
                  <button
                    onClick={() => downloadFile('csv')}
                    className="btn btn-secondary btn-sm flex-1 md:flex-none"
                  >
                    <i className="fa-solid fa-file-csv"></i>
                    <span className="hidden md:inline">CSV</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto px-3 py-3 md:px-5.5 md:py-4">
                <table className="w-full border-collapse min-w-[640px] table-fixed md:min-w-[880px]">
                  <thead>
                    <tr>
                      <th className="w-[40px] text-center text-left text-[11px] font-semibold uppercase tracking-wider text-text-low md:w-[45px]">No</th>
                      <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-text-low md:w-[32%]">Judul Artikel</th>
                      <th className="hidden text-left text-[11px] font-semibold uppercase tracking-wider text-text-low md:table-cell md:w-[18%]">Sumber</th>
                      <th className="hidden text-left text-[11px] font-semibold uppercase tracking-wider text-text-low md:table-cell md:w-[34%]">Caption AI</th>
                      <th className="text-center text-left text-[11px] font-semibold uppercase tracking-wider text-text-low md:w-[130px]">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {berita.map((item, index) => (
                      <tr key={index} className="border-b border-border hover:bg-[rgba(255,255,255,0.02)]">
                        <td className="px-2 py-3 text-center text-xs text-text-low md:px-3 md:py-[14px]">{index + 1}</td>
                        <td className="px-2 py-3 md:px-3 md:py-[14px]">
                          <a
                            href={item.Sumber}
                            target="_blank"
                            rel="noreferrer"
                            title={item.Judul}
                            className="text-sm font-semibold text-text-hi no-underline line-clamp-2 break-words hover:text-[#a78bfa] md:line-clamp-3"
                          >
                            {item.Judul}
                          </a>
                          <div className="mt-1.5 md:hidden">
                            <span className="block text-xs font-semibold">{item['Sumber Nama Website']}</span>
                            <span className="block text-[11px] text-text-low">{item.Tanggal}</span>
                          </div>
                        </td>
                        <td className="hidden px-3 py-[14px] md:table-cell">
                          <span className="block text-sm font-semibold break-words">{item['Sumber Nama Website']}</span>
                          <span className="block text-xs text-text-low leading-tight">{item.Tanggal}</span>
                        </td>
                        <td className="hidden px-3 py-[14px] md:table-cell">
                          <textarea
                            id={`caption-${index}`}
                            placeholder="Klik 'Caption' untuk buat otomatis via Gemini AI..."
                            className="h-[96px] w-full resize-y rounded-md border border-border bg-bg-input p-2 text-xs text-text-hi outline-none"
                          ></textarea>
                        </td>
                        <td className="px-2 py-3 md:px-3 md:py-[14px]">
                          <div className="flex flex-row flex-wrap gap-1.5 md:flex-col md:gap-1.5">
                            <button
                              onClick={() => generateCaption(index)}
                              disabled={captionLoading[index]}
                              className="btn btn-magic btn-sm flex-1 md:flex-none"
                            >
                              {captionLoading[index] ? (
                                <i className="fa-solid fa-circle-notch fa-spin"></i>
                              ) : (
                                <i className="fa-solid fa-wand-magic-sparkles"></i>
                              )}
                              <span className="hidden md:inline">Caption</span>
                            </button>
                            <a
                              href={item.Sumber}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-secondary btn-sm flex-1 justify-center md:flex-none md:justify-center"
                            >
                              <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                              <span className="hidden md:inline">Link</span>
                            </a>
                            <button
                              onClick={() => deleteRow(index)}
                              className="btn btn-danger btn-sm flex-1 md:flex-none"
                              title="Hapus berita ini dari daftar"
                            >
                              <i className="fa-solid fa-xmark"></i>
                              <span className="hidden md:inline">Hapus</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default App
