import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
// PENTING: storage harus diimpor SEBELUM App, karena App memanggil window.storage
// saat komponen pertama kali dijalankan.
import "./lib/storage.js";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
