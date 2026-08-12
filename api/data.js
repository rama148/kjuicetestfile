import { sql } from "@vercel/postgres";

// Penyimpanan data ERP.
//
// TAHAP SATU: seluruh data disimpan sebagai SATU baris JSON, sama persis seperti di artifact.
// Ini disengaja — memindahkan hosting dan memecah struktur data sekaligus membuat Anda tidak bisa
// tahu penyebabnya di sisi mana kalau ada yang salah. Pemecahan per tabel dikerjakan setelah
// aplikasi berjalan stabil.
//
// Setiap penyimpanan menyimpan VERSI SEBELUMNYA ke tabel riwayat. Karena seluruh pembukuan ada
// dalam satu baris, satu penulisan yang rusak berarti semuanya hilang sekaligus — riwayat inilah
// jaring pengamannya.

const MAKS_RIWAYAT = 30;

async function siapkanTabel() {
  await sql`
    CREATE TABLE IF NOT EXISTS app_data (
      key         TEXT PRIMARY KEY,
      value       TEXT NOT NULL,
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS app_data_riwayat (
      id          BIGSERIAL PRIMARY KEY,
      key         TEXT NOT NULL,
      value       TEXT NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_riwayat_key ON app_data_riwayat (key, created_at DESC)`;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  try {
    await siapkanTabel();

    if (req.method === "GET") {
      const key = req.query.key;
      if (!key) return res.status(400).json({ error: "Parameter 'key' wajib diisi" });

      const { rows } = await sql`SELECT value FROM app_data WHERE key = ${key}`;
      if (rows.length === 0) return res.status(404).json({ error: "Belum ada data" });

      return res.status(200).json({ key, value: rows[0].value, shared: true });
    }

    if (req.method === "PUT") {
      const { key, value } = req.body || {};
      if (!key) return res.status(400).json({ error: "Field 'key' wajib diisi" });
      if (typeof value !== "string") return res.status(400).json({ error: "Field 'value' harus berupa teks JSON" });

      // Pemeriksaan terakhir sebelum menimpa: kalau value bukan JSON yang sah, tolak.
      // Menyimpan data rusak jauh lebih mahal daripada satu penyimpanan yang gagal.
      try { JSON.parse(value); } catch { return res.status(400).json({ error: "Isi data bukan JSON yang sah" }); }

      const lama = await sql`SELECT value FROM app_data WHERE key = ${key}`;
      if (lama.rows.length > 0) {
        await sql`INSERT INTO app_data_riwayat (key, value) VALUES (${key}, ${lama.rows[0].value})`;
        await sql`
          DELETE FROM app_data_riwayat
          WHERE key = ${key}
            AND id NOT IN (
              SELECT id FROM app_data_riwayat WHERE key = ${key}
              ORDER BY created_at DESC LIMIT ${MAKS_RIWAYAT}
            )
        `;
      }

      await sql`
        INSERT INTO app_data (key, value, updated_at) VALUES (${key}, ${value}, NOW())
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
      `;

      return res.status(200).json({ key, value, shared: true });
    }

    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "Metode tidak didukung" });
  } catch (err) {
    console.error("api/data:", err);
    return res.status(500).json({ error: "Kesalahan server", detail: String(err?.message || err) });
  }
}

// Batas ukuran badan permintaan dinaikkan. Data ERP ini sudah 4 MB dan akan terus tumbuh;
// batas bawaan Vercel (1 MB) akan menolak penyimpanan tanpa penjelasan yang jelas.
export const config = { api: { bodyParser: { sizeLimit: "12mb" } } };
