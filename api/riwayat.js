import { sql } from "@vercel/postgres";

// Melihat dan memulihkan versi data sebelumnya.
//
// Seluruh pembukuan tersimpan dalam satu baris, jadi satu penulisan yang salah bisa menghapus
// semuanya sekaligus. Setiap penyimpanan menyisihkan versi lamanya; berkas ini yang membuatnya
// bisa dipanggil kembali tanpa perlu membuka database secara manual.
//
//   GET  /api/riwayat?key=fruit-stock-app-data-v2         -> daftar 30 versi terakhir
//   GET  /api/riwayat?key=...&id=123                      -> isi satu versi
//   POST /api/riwayat  { key, id }                        -> pulihkan versi itu jadi data aktif

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  try {
    if (req.method === "GET") {
      const { key, id } = req.query;
      if (!key) return res.status(400).json({ error: "Parameter 'key' wajib diisi" });

      if (id) {
        const { rows } = await sql`SELECT id, value, created_at FROM app_data_riwayat WHERE id = ${id} AND key = ${key}`;
        if (rows.length === 0) return res.status(404).json({ error: "Versi tidak ditemukan" });
        return res.status(200).json(rows[0]);
      }

      // Daftar tanpa isi datanya — hanya ukuran, supaya balasannya ringan.
      const { rows } = await sql`
        SELECT id, created_at, LENGTH(value) AS ukuran
        FROM app_data_riwayat WHERE key = ${key}
        ORDER BY created_at DESC LIMIT 30
      `;
      return res.status(200).json({ key, versi: rows });
    }

    if (req.method === "POST") {
      const { key, id } = req.body || {};
      if (!key || !id) return res.status(400).json({ error: "Field 'key' dan 'id' wajib diisi" });

      const { rows } = await sql`SELECT value FROM app_data_riwayat WHERE id = ${id} AND key = ${key}`;
      if (rows.length === 0) return res.status(404).json({ error: "Versi tidak ditemukan" });

      // Data yang sedang aktif ikut disimpan dulu sebelum ditimpa — supaya pemulihan yang keliru
      // masih bisa dibatalkan.
      const aktif = await sql`SELECT value FROM app_data WHERE key = ${key}`;
      if (aktif.rows.length > 0) {
        await sql`INSERT INTO app_data_riwayat (key, value) VALUES (${key}, ${aktif.rows[0].value})`;
      }

      await sql`
        INSERT INTO app_data (key, value, updated_at) VALUES (${key}, ${rows[0].value}, NOW())
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
      `;
      return res.status(200).json({ ok: true, dipulihkan: id });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Metode tidak didukung" });
  } catch (err) {
    console.error("api/riwayat:", err);
    return res.status(500).json({ error: "Kesalahan server", detail: String(err?.message || err) });
  }
}
