# AI Study Companion

**AI Study Companion** adalah platform asisten belajar pribadi modern berbasis Artificial Intelligence (AI) yang dirancang untuk membantu pelajar, mahasiswa, dan profesional menguasai materi secara adaptif, mendalam, dan terstruktur.

Aplikasi ini dibangun menggunakan arsitektur full-stack modular dengan frontend **Next.js (App Router)**, backend **FastAPI**, basis data **SQLAlchemy & Alembic** (mendukung SQLite untuk zero-config lokal dan PostgreSQL/pgvector untuk produksi), serta terintegrasi langsung dengan gateway **GutsAI API** (`https://api.gutsai.id/v1`).

---

## 🌟 Fitur Utama

### 1. Dashboard Pembelajaran Dinamis
- **Sapaan Personal:** Berdasarkan profil dan nama pengguna.
- **Metrik Real-Time:** Total waktu belajar (menit/jam), jumlah sesi belajar, rata-rata nilai kuis, dan jumlah kartu review yang jatuh tempo.
- **Rekomendasi AI:** Rekomendasi tindakan harian otomatis berdasarkan materi yang perlu diperkuat.
- **Grafik Tren Mingguan:** Visualisasi durasi belajar 7 hari terakhir menggunakan Recharts.
- **Aktivitas & Target:** Tinjauan tugas belajar aktif dan progres pencapaian target.

### 2. AI Tutor Adaptif
- **Percakapan Multi-Turn:** Berkelanjutan dengan konteks riwayat percakapan.
- **Pilihan Gaya Penjelasan:**
  - *Bertahap (Step-by-step)*: Membangun fondasi konsep dari awal.
  - *Contoh Praktis*: Studi kasus kehidupan nyata dan implementasi kode.
  - *Analogi*: Perumpamaan ramah untuk menyederhanakan materi abstrak.
  - *Latihan Soal*: Penjelasan ringkas disertai latihan interaktif.
- **Pilihan Tingkat Pemahaman:** *Pemula*, *Menengah*, dan *Mendalam*.
- **Document Grounding (RAG):** AI Tutor dapat mengacu pada dokumen pembelajaran yang telah Anda unggah.
- **Fitur Interaktif:** Salin teks jawaban, simpan jawaban langsung sebagai Catatan, dan buat kuis otomatis dari jawaban tutor.
- **Syntax Highlighting & Markdown:** Rendering rumus dan kode pemrograman yang rapi.

### 3. My Materials (Dokumen Pembelajaran)
- **Multi-Format:** Unggah file PDF, DOCX, TXT, dan Markdown (.md).
- **Ekstraksi & Chunking:** Ekstraksi teks otomatis dan pemotongan chunk terstruktur dengan overlap.
- **Ringkasan & Konsep Kunci AI:** Menghasilkan intisari dokumen dan daftar istilah secara otomatis.
- **Tanya Dokumen:** Menjawab pertanyaan berdasarkan isi dokumen dengan kutipan nomor halaman rujukan.
- **Pembuatan Kuis:** Menghasilkan soal evaluasi langsung dari dokumen yang diunggah.

### 4. Quiz Center (Generator & Evaluasi Objektif)
- **AI Quiz Generation:** Menghasilkan soal pilihan ganda, benar/salah, jawaban singkat, atau esai.
- **Keamanan Nilai (Server-Side Evaluation):** Kunci jawaban tidak pernah dikirim ke frontend sebelum pengguna menyelesaikan kuis.
- **Analisis Kesalahan:** Ulasan komprehensif untuk setiap butir soal beserta pembahasan dari AI.
- **Sinkronisasi Otomatis ke Smart Review:** Setiap soal yang salah dijawab langsung otomatis dijadwalkan ke kartu review Spaced Repetition.

### 5. Smart Review (Spaced Repetition SM-2)
- **Algoritma SuperMemo-2 (SM-2):** Penjadwalan pengulangan berkala transparan berdasarkan 6 tingkat kesulitan mengingat (skala 0-5).
- **Interactive Flashcard:** Kartu bolak-balik (klik untuk membuka jawaban dan pembahasan).
- **Deteksi Topik Lemah:** Melacak kartu dengan tingkat kegagalan (*failure count*) tertinggi untuk diprioritaskan.

### 6. Study Planner (Target & Tugas Harian)
- **Target Pembelajaran (Goals):** Menentukan target materi dan deadline dengan progress bar otomatis.
- **Tugas Belajar (Tasks):** Checklist tugas harian yang ketika diselesaikan otomatis mencatat sesi waktu belajar ke analitik.
- **Saran Rencana AI:** AI memecah target belajar besar menjadi langkah tugas terukur berdasarkan jumlah hari dan jam belajar harian.

### 7. Learning Analytics
- **Durasi Belajar Nyata:** Dihitung dari sesi belajar dan pengerjaan kuis di database.
- **Akurasi per Bidang Studi:** Grafik perbandingan tingkat penguasaan tiap mata pelajaran.
- **Deteksi Materi Lemah (Weak Topics):** Menampilkan konsep-konsep yang paling sering salah dijawab.
- **Skor Konsistensi:** Menghitung keaktifan belajar dalam 14 hari terakhir.
- **Pencatat Sesi Manual:** Dukungan untuk mencatat sesi belajar mandiri / Pomodoro.

### 8. Personal Learning Memory & Pengaturan
- **Memori Personal:** Menyimpan preferensi belajar, kebiasaan, dan topik lemah tanpa mencampurnya dengan riwayat chat.
- **Kontrol Privasi:** Opsi untuk mengaktifkan atau menonaktifkan fitur Personal Memory kapan saja.
- **Uji Koneksi AI:** Pengujian koneksi ke GutsAI Gateway secara langsung dari antarmuka.

---

## 🏗️ Arsitektur Proyek

```
ai-study-companion/
├── backend/
│   ├── app/
│   │   ├── main.py                  # Entrypoint FastAPI & Middleware CORS
│   │   ├── core/                    # Konfigurasi, DB engine, dan JWT security
│   │   ├── models/                  # SQLAlchemy models (User, Quiz, Material, Review, dll.)
│   │   ├── schemas/                 # Pydantic validation schemas
│   │   ├── ai/                      # GutsAIClient modular & prompt templates
│   │   ├── services/                # Logika bisnis: dokumen, kuis, SM-2 review, analitik
│   │   └── api/                     # REST API routes modular
│   ├── tests/                       # Automated pytest suite
│   ├── alembic/                     # Migrasi skema database
│   ├── requirements.txt             # Dependensi Python
│   └── venv/                        # Virtual environment Python 3.12
├── frontend/
│   ├── app/                         # Next.js App Router (Dashboard, Tutor, Quiz, dll.)
│   ├── components/                  # UI components, layout sidebar, header, theme toggle
│   ├── lib/                         # API client, types, utility functions
│   └── package.json                 # Dependensi Next.js & UI libraries
├── .env.example                     # Template konfigurasi environment
├── start_backend.ps1                # Skrip startup backend PowerShell
├── start_frontend.ps1               # Skrip startup frontend PowerShell
└── README.md                        # Dokumentasi lengkap
```

---

## ⚡ Cara Menjalankan Aplikasi (Hanya 1 Perintah)

Anda dapat menjalankan **Backend (FastAPI)** dan **Frontend (Next.js)** secara bersamaan dengan **satu perintah**:

### Pilihan 1: Menggunakan NPM (Terminal)
```powershell
npm run dev
```

### Pilihan 2: Menggunakan Skrip PowerShell
```powershell
.\start.ps1
```

### Pilihan 3: Menggunakan File Batch (Bisa Langsung Diklik Ganda)
```cmd
.\start.bat
```

> **Apa yang terjadi saat dijalankan?**
> 1. Memeriksa dan memastikan file `.env` sudah siap.
> 2. Menjalankan server backend FastAPI di port `8000`.
> 3. Menjalankan server frontend Next.js di port `3000`.
> 4. Membuka otomatis halaman aplikasi di peramban ke **http://localhost:3000**.
> 5. Saat Anda menekan `Ctrl+C`, seluruh proses latar belakang akan dihentikan secara otomatis dan bersih.

Atau jalankan secara manual:
```powershell
cd backend
# Mengaktifkan virtual environment
.\venv\Scripts\activate
# Menjalankan server Uvicorn
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

- Backend API berjalan di: **http://127.0.0.1:8000**
- Dokumentasi interaktif Swagger UI: **http://127.0.0.1:8000/docs**
- Health Check: **http://127.0.0.1:8000/health**

---

### 3. Menjalankan Frontend (Next.js)

Buka terminal PowerShell terpisah:
```powershell
# Jalankan menggunakan skrip otomatis:
.\start_frontend.ps1
```

Atau jalankan secara manual:
```powershell
cd frontend
npm run dev
```

- Buka peramban di: **http://localhost:3000**

---

## 🧪 Menjalankan Automated Tests

Aplikasi dilengkapi unit dan integration test otomatis yang menguji client GutsAI, validasi skema, evaluasi kuis, ekstraksi dokumen, algoritma SM-2, dan analitik tanpa menghabiskan kuota token:

```powershell
cd backend
.\venv\Scripts\activate
python -m pytest tests -v
```

Semua 7 skenario pengujian diverifikasi lulus dengan status:
```
tests/test_guts_client.py::test_health_endpoint PASSED
tests/test_guts_client.py::test_guts_client_missing_key PASSED
tests/test_guts_client.py::test_guts_client_fallback_models PASSED
tests/test_services.py::test_sm2_spaced_repetition_logic PASSED
tests/test_services.py::test_quiz_evaluation_and_review_card_creation PASSED
tests/test_services.py::test_document_chunking_and_keyword_search PASSED
tests/test_services.py::test_analytics_metrics_calculation PASSED
```

Untuk menguji build produksi frontend:
```powershell
cd frontend
npm run build
```

---

## 🗄️ Konfigurasi Database (SQLite & PostgreSQL)

- **Lokal (Default):** Menggunakan SQLite (`sqlite:///./study_companion.db`) yang langsung berfungsi tanpa konfigurasi tambahan.
- **Produksi (PostgreSQL + pgvector):**
  Ubah nilai `DATABASE_URL` di file `.env`:
  ```env
  DATABASE_URL=postgresql://user:password@localhost:5432/ai_study_companion
  ```
  Kemudian jalankan migrasi Alembic:
  ```powershell
  cd backend
  .\venv\Scripts\activate
  alembic upgrade head
  ```

---

## 🛡️ Keamanan & Privasi

1. **API Key Isolation:** Kunci rahasia `GUTS_API_KEY` hanya tersimpan di backend melalui environment variable dan tidak pernah diekspos ke browser atau file bundle publik.
2. **Server-Side Scoring:** Evaluasi kuis dan kunci jawaban disimpan secara aman di backend untuk mencegah manipulasi skor oleh peramban klien.
3. **Data Isolation:** Seluruh entitas dibatasi berdasarkan `user_id` pemilik data.
4. **Resilience & Backoff:** Client GutsAI dilengkapi timeout, penanganan status kode (401, 402, 429, 5xx), serta pembatasan retry dengan exponential backoff untuk mencegah spam dan tagihan ganda.
5. **No Secret Leaks:** Endpoint healthcheck dan settings menyamarkan (*masking*) format kunci API dan tidak membocorkan stack trace error mentah ke pengguna.

---

## 📋 Status Fitur & Konfigurasi Eksternal

| Modul | Status | Keterangan |
| :--- | :--- | :--- |
| **Dashboard** | ✅ Selesai | Metrik nyata dari database, grafik Recharts, target belajar |
| **AI Tutor** | ✅ Selesai | Multi-turn, pilihan gaya & kesulitan, grounding dokumen, salin & simpan catatan |
| **GutsAI Gateway** | ✅ Selesai | Terhubung ke `https://api.gutsai.id/v1`, fallback model, token tracking |
| **My Materials** | ✅ Selesai | Ekstraksi PDF/DOCX/TXT/MD, ringkasan AI, RAG Q&A |
| **Quiz Center** | ✅ Selesai | Generator kuis AI, evaluasi skor di backend, pembahasan mendalam |
| **Smart Review** | ✅ Selesai | Algoritma SuperMemo-2 (SM-2), flipcards, sinkronisasi otomatis dari kuis salah |
| **Study Planner** | ✅ Selesai | Target belajar, checklist tugas harian, generator jadwal AI |
| **Analytics** | ✅ Selesai | Tren waktu belajar, akurasi per mata pelajaran, deteksi materi lemah |
| **Settings & Memory** | ✅ Selesai | Profil pengguna, memori personal, toggle privasi, uji koneksi AI |
| **Automated Tests** | ✅ Selesai | Pytest backend & Next.js production type-check lulus 100% |

Selamat belajar dengan **AI Study Companion**!
