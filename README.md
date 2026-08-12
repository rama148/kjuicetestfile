# Kimura ERP — SKR Pusat

ERP produksi dan pengadaan untuk SKR Pusat: pembelian, goods receipt, job costing,
persediaan, surat jalan ke outlet, kemitraan, dan akuntansi lengkap.

Dipindahkan dari artifact ke Vite + React + Vercel + Postgres.

---

## Susunan berkas

```
kimura-erp/
├── api/
│   ├── data.js          Baca & simpan data (satu blob JSON)
│   ├── riwayat.js       Lihat & pulihkan versi sebelumnya
│   └── ai.js            Proxy pembaca foto — kunci API disimpan di server
├── src/
│   ├── App.jsx          Seluruh aplikasi (23.800+ baris)
│   ├── main.jsx         Titik masuk
│   ├── index.css        Tailwind
│   └── lib/
│       └── storage.js   Pengganti window.storage
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env.example
└── .gitignore
```

---

## Menyiapkan dari nol

### 1. Repo GitHub

Buat repo **privat**. Bukan karena kodenya rahasia, tapi karena di dalamnya ada logika harga
transfer, struktur COA, dan pola bisnis Anda.

```bash
git init
git add .
git commit -m "Pindah dari artifact ke Vite + React"
git branch -M main
git remote add origin https://github.com/USERNAME/kimura-erp.git
git push -u origin main
```

### 2. Database

Buka Vercel → Storage → Create Database → **Postgres**. Sambungkan ke proyek; variabel
`POSTGRES_URL` terisi sendiri.

Tabelnya dibuat otomatis saat permintaan pertama masuk — tidak perlu menjalankan SQL manual.
Kalau ingin membuatnya lebih dulu, skemanya ada di `db/skema.sql`.

### 3. Variabel lingkungan

Vercel → Settings → Environment Variables:

| Nama | Isi | Wajib |
|---|---|---|
| `POSTGRES_URL` | terisi otomatis saat database disambungkan | ya |
| `ANTHROPIC_API_KEY` | kunci dari console.anthropic.com | hanya untuk fitur baca foto |

Tanpa `ANTHROPIC_API_KEY`, seluruh aplikasi tetap jalan — hanya tombol baca foto yang menolak
dengan pesan yang jelas.

### 4. Deploy

Vercel → Add New Project → pilih repo → Deploy. Setiap `git push` berikutnya membangun ulang
sendiri.

### 5. Pindahkan data

1. Buka aplikasi lama, tab **Backup & Restore** → **Export Backup**
2. Buka aplikasi baru di Vercel — tampilannya kosong, itu normal
3. **Import Backup**, pilih berkas tadi
4. Periksa: rekonsiliasi hutang nol selisih, Neraca seimbang, tidak ada banner integritas merah

---

## Menjalankan di komputer sendiri

```bash
npm install
npm i -g vercel
vercel dev          # menjalankan React + API sekaligus di localhost:3000
```

`npm run dev` saja hanya menjalankan sisi React — `/api` tidak akan menjawab.

---

## Kalau data rusak

Setiap penyimpanan menyisihkan versi sebelumnya, 30 versi terakhir disimpan.

```bash
# Lihat daftar versi
curl "https://APLIKASI-ANDA.vercel.app/api/riwayat?key=fruit-stock-app-data-v2"

# Pulihkan salah satunya
curl -X POST https://APLIKASI-ANDA.vercel.app/api/riwayat \
  -H "Content-Type: application/json" \
  -d '{"key":"fruit-stock-app-data-v2","id":123}'
```

Data yang sedang aktif ikut disisihkan dulu sebelum ditimpa, jadi pemulihan yang keliru masih
bisa dibatalkan.

---

## Yang HARUS dikerjakan sebelum tim masuk

Tiga hal ini bukan saran, tapi syarat.

### Login sungguhan

PIN pengguna sekarang disimpan sebagai teks biasa di dalam data, dan siapa pun yang punya
tautan bisa membuka seluruh pembukuan. Di artifact itu sudah buruk; di server yang bisa diakses
publik, itu tidak bisa dipertahankan.

Minimal: satu titik login yang memeriksa kata sandi ter-hash, dan `/api/data` menolak permintaan
tanpa sesi yang sah.

### Batas ukuran

Data sudah 4 MB dan terus tumbuh. Batas sudah dinaikkan ke 12 MB di `api/data.js`, tapi itu
menunda masalah, bukan menyelesaikannya. Pantau lewat tab **Backup & Restore → Kesehatan
Penyimpanan**.

### Cadangan berkala

Riwayat 30 versi melindungi dari penulisan yang rusak, bukan dari database yang hilang.
Export backup ke luar sistem setidaknya seminggu sekali.

---

## Rencana berikutnya

**Pecah App.jsx.** 23.800 baris dalam satu file itu batasan artifact, bukan pilihan desain.
Di VS Code bisa dipecah mengikuti struktur yang sudah ada: satu file per tab, helper ke `lib/`,
komponen bersama ke `components/`. Kerjakan satu tab per kali sambil aplikasi tetap dipakai.

**Pecah data per tabel.** Sekarang seluruh data satu blob — setiap simpan menulis ulang semuanya,
dan pencarian dilakukan di peramban setelah 4 MB dimuat. Pecah jadi tabel per koleksi, sebaiknya
bersamaan dengan pemisahan dua entitas SKR dan KJuice.

**Jangan lakukan keduanya bersamaan dengan pemindahan ini.** Kalau ada yang salah, Anda tidak
akan tahu penyebabnya di sisi mana.
