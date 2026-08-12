// Proxy pembacaan foto (OCR nota pembelian, rencana per outlet, surat jalan, lembar opname).
//
// App.jsx memanggil api.anthropic.com langsung di 8 tempat. Di artifact itu aman karena kuncinya
// disuntikkan platform. Di hosting sendiri TIDAK BOLEH — kunci yang dikirim dari peramban bisa
// dibaca siapa pun yang membuka Network tab, lalu dipakai atas tagihan Anda.
//
// Proxy ini menerima permintaan dari aplikasi, menambahkan kunci di sisi server, lalu meneruskannya.
// Di App.jsx, ganti alamat "https://api.anthropic.com/v1/messages" menjadi "/api/ai".

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Metode tidak didukung" });
  }

  const kunci = process.env.ANTHROPIC_API_KEY;
  if (!kunci) {
    return res.status(500).json({
      error: { message: "ANTHROPIC_API_KEY belum diatur di Environment Variables Vercel. Fitur baca foto tidak aktif." },
    });
  }

  try {
    const balasan = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": kunci,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(req.body),
    });
    const hasil = await balasan.json();
    return res.status(balasan.status).json(hasil);
  } catch (err) {
    console.error("api/ai:", err);
    return res.status(500).json({ error: { message: String(err?.message || err) } });
  }
}

// Foto dikirim sebagai base64, jadi badannya besar.
export const config = { api: { bodyParser: { sizeLimit: "12mb" } } };
