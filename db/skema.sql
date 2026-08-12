-- Skema database Kimura ERP.
-- Tabel ini dibuat OTOMATIS oleh api/data.js saat permintaan pertama masuk,
-- jadi berkas ini hanya perlu dijalankan kalau Anda ingin menyiapkannya lebih dulu.

-- Data aktif. Seluruh 49 koleksi disimpan sebagai SATU baris JSON, sama seperti di artifact.
-- Ini disengaja untuk tahap pertama pemindahan; pemecahan per tabel dikerjakan setelah stabil.
CREATE TABLE IF NOT EXISTS app_data (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Versi sebelumnya, 30 terakhir per key.
-- Karena seluruh pembukuan ada dalam satu baris, satu penulisan yang rusak berarti semuanya
-- hilang sekaligus. Tabel inilah jaring pengamannya.
CREATE TABLE IF NOT EXISTS app_data_riwayat (
  id          BIGSERIAL PRIMARY KEY,
  key         TEXT NOT NULL,
  value       TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_riwayat_key ON app_data_riwayat (key, created_at DESC);
