# RideCare 🛵

**RideCare** adalah aplikasi manajemen perawatan kendaraan pribadi berbasis web (PWA) yang membantu Anda mencatat riwayat servis, memantau odometer, dan menganalisis pengeluaran biaya perawatan motor Anda.

Aplikasi ini dirancang untuk pengguna yang memiliki lebih dari satu kendaraan dan ingin memastikan jadwal servis tidak terlewat.

## 🌟 Fitur Utama

-   **Multi-Motor**: Kelola banyak motor dalam satu aplikasi tanpa batas.
-   **Pencatatan Servis**: Simpan riwayat servis lengkap (Oli, Busi, Ban, dll) beserta biaya dan foto struk/nota.
-   **Pelacakan Odometer**: Update kilometer kendaraan kapan saja untuk mengetahui jarak tempuh harian.
-   **Statistik Pengeluaran**:
    -   Lihat total biaya servis per motor.
    -   Grafik breakdown kategori pengeluaran (misal: berapa habis untuk Oli vs Ban).
-   **Sinkronisasi Cloud (Supabase)**: Data tersimpan aman di Cloud, bisa diakses dari perangkat berbeda secara real-time.
-   **Progressive Web App (PWA)**: Bisa diinstal di HP layaknya aplikasi native.

## 🛠️ Teknologi yang Digunakan

-   **Frontend**: React + Vite
-   **Styling**: Tailwind CSS + Lucide Icons
-   **Backend & Database**: Supabase (PostgreSQL)
-   **Routing**: React Router DOM

## 🚀 Cara Menjalankan Project

Untuk menjalankan aplikasi ini di komputer lokal Anda:

1.  **Clone Repository**
    ```bash
    git clone https://github.com/hsnmuha/ridecare.git
    cd ridecare
    ```

2.  **Install Dependencies**
    Pastikan Anda sudah menginstall NodeJS.
    ```bash
    npm install
    ```

3.  **Setup Environment Variables**
    Buat file `.env` dan isi dengan kredensial Supabase Anda:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```
    *(Hubungi pemilik repo untuk akses kredensial jika Anda kolaborator)*

4.  **Jalankan Aplikasi**
    ```bash
    npm run dev
    ```
    Buka `http://localhost:5173` di browser Anda.

## ☁️ Update ke GitHub (Otomatis)

Project ini dilengkapi script otomatis untuk mempermudah upload kode ke GitHub tanpa mengetik perintah git manual.

1.  Buka file **`push.bat`** (klik 2x).
2.  Masukkan pesan update (contoh: "tambah fitur baru").
3.  Tekan Enter. Kode akan otomatis ter-upload.

---

Dibuat dengan ❤️ untuk pecinta otomotif.
