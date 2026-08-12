// Pengganti window.storage bawaan artifact.
//
// Bentuk fungsinya dibuat SAMA PERSIS dengan aslinya — get(key) dan set(key, value) yang
// mengembalikan { key, value } — supaya 23.800 baris di App.jsx tidak perlu disentuh sama sekali.
// Ini yang membuat pemindahan ke hosting jadi pekerjaan sehari, bukan berminggu-minggu.
//
// Parameter `shared` diterima tapi diabaikan: di server sendiri semua data memang bersama.

const API = "/api/data";

async function bacaJson(res) {
  const teks = await res.text();
  try {
    return JSON.parse(teks);
  } catch {
    throw new Error(`Respons server tidak bisa dibaca (${res.status}): ${teks.slice(0, 200)}`);
  }
}

export const storage = {
  async get(key) {
    const res = await fetch(`${API}?key=${encodeURIComponent(key)}`, {
      headers: { "Cache-Control": "no-cache" },
    });
    // App.jsx menangkap error ini sebagai "data belum ada" dan memulai dari kosong.
    if (res.status === 404) throw new Error("Key belum pernah ditulis");
    if (!res.ok) throw new Error(`Gagal membaca data (${res.status})`);
    return await bacaJson(res);
  },

  async set(key, value) {
    const res = await fetch(API, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    if (res.status === 413) {
      throw new Error(
        "Data terlalu besar untuk dikirim ke server. Kurangi lampiran foto lewat " +
        "tab Backup & Restore → Kesehatan Penyimpanan."
      );
    }
    if (!res.ok) throw new Error(`Gagal menyimpan data (${res.status})`);
    return await bacaJson(res);
  },

  // Belum dipakai App.jsx, disediakan supaya bentuknya lengkap.
  async list() { return { keys: [] }; },
  async delete() { return { deleted: true }; },
};

// App.jsx memanggil window.storage secara langsung, jadi dipasang ke window.
if (typeof window !== "undefined") window.storage = storage;
