# OOs E-Commerce (MVP Streetwear Shop)

Sebuah platform E-Commerce fashion full-stack minimalist (OOs-style) yang dirancang dengan pendekatan **mobile-first**, performa tinggi, dan alur transaksi yang sangat cepat.

---

## 🚀 Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS (Streetwear Minimalist layout)
- **Backend**: Next.js Route Handlers (API Routes) & Server Components
- **Database**: SQLite (Default Lokal) / PostgreSQL Support melalui Prisma ORM
- **State Management**: Zustand (Keranjang Belanja / Cart Store dengan LocalStorage Persist)
- **Autentikasi**: NextAuth.js (Email & Password Credentials Provider)

---

## 🔥 Fitur Utama (MVP)

1. **Desain Streetwear Minimalis**: Estetika modern dengan dominasi warna hitam/putih, banyak white space, font sans-serif tebal, dan sudut-sudut tegas (sharp borders).
2. **Katalog & Filter Produk**: Grid responsive (2 kolom di mobile, 4 kolom di desktop) dengan visual hover swap image dan filter kategori (T-Shirt, Outerwear, dll).
3. **Sistem Induk-Varian**: Manajemen stok melekat pada varian ukuran (S, M, L, XL). Tombol ukuran pada halaman produk otomatis di-disable jika stok = 0 (out of stock).
4. **Side Cart Drawer**: Keranjang belanja slide-in yang praktis dengan kontrol tambah/kurang jumlah item, hapus item, dan perhitungan subtotal langsung.
5. **Gated Single-Page Checkout**: Alur pembelian satu halaman yang aman (memerlukan login). Menyimpan alamat pengiriman secara otomatis ke database, pilihan ekspedisi mock, dan pembayaran instan mock (Virtual Account & QRIS).
6. **Customer Dashboard**: Halaman khusus pelanggan untuk melihat profil, daftar alamat tersimpan, riwayat transaksi, status pesanan, serta nomor resi pengiriman.
7. **Authorized Admin Panel (`/admin`)**:
   - Dilindungi NextAuth Middleware (Hanya role `ADMIN` yang diizinkan masuk).
   - **Tabel Produk**: CRUD katalog produk, link gambar, dan manajemen stok per ukuran.
   - **Tabel Pesanan**: Memantau pesanan masuk, merubah status pesanan (`PENDING` -> `PAID` -> `PROCESSING` -> `SHIPPED` -> `COMPLETED`), dan memasukkan nomor resi kurir.

---

## 🛠️ Langkah Instalasi & Setup Lokal

Aplikasi ini telah dikonfigurasi menggunakan **SQLite** secara default agar dapat berjalan instan tanpa perlu menyiapkan server PostgreSQL eksternal.

### 1. Kloning dan Instalasi Dependensi
Pastikan Anda berada di direktori project `c:\Perkuliahan\Project\E-Commerce` lalu jalankan:
```bash
npm install
```

### 2. Konfigurasi Environment Variables (`.env`)
File `.env` sudah dikonfigurasi secara otomatis. Sebagai referensi, isi file `.env` adalah sebagai berikut:
```env
# Database Connection (SQLite)
DATABASE_URL="file:./dev.db"

# NextAuth Configuration
NEXTAUTH_SECRET="f657a2d8bc98ef5c1102b4ad8259d6852e9a5ab8b1f5e8e3d09a25b8cd7bc4e9"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Sinkronkan Database & Migrasi Skema
Jalankan perintah ini untuk membuat file database SQLite `dev.db` dan menyelaraskan tabel sesuai skema Prisma:
```bash
npx prisma db push
```

### 4. Seeding Data Awal (Akun & Produk Mock)
Jalankan script seed untuk memasukkan produk streetwear awal serta akun pengujian:
```bash
npm run seed
```

### 5. Jalankan Server Development
Mulai server lokal Anda:
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## 👥 Akun Pengujian Default

Gunakan akun berikut untuk menguji alur aplikasi:

### 👤 Akun Customer
- **Email**: `customer@streetwear.com`
- **Password**: `customerpassword`
- **Tujuan**: Menambahkan barang ke cart, checkout, mengisi alamat, membayar mock-up, dan melihat riwayat pesanan di dashboard customer.

### 🔑 Akun Admin
- **Email**: `admin@streetwear.com`
- **Password**: `adminpassword`
- **Tujuan**: Mengakses `/admin`, menambah produk baru, mengedit stok varian ukuran, memproses pesanan customer, dan menginput nomor resi.

---

## 📂 Struktur Direktori Utama

```text
E-Commerce/
├── prisma/
│   ├── schema.prisma   # Skema Database (SQLite)
│   ├── seed.js         # Script Seeding Data
│   └── dev.db          # Database SQLite Lokal (Auto-generated)
├── src/
│   ├── app/            # Next.js App Router Pages & API Routes
│   │   ├── api/        # REST API Route Handlers
│   │   ├── admin/      # Halaman Admin Panel
│   │   ├── auth/       # Halaman Sign In / Register
│   │   ├── checkout/   # Halaman Single-Page Checkout
│   │   ├── dashboard/  # Halaman Customer Dashboard
│   │   └── products/   # Halaman Detail Produk (PDP)
│   ├── components/     # Reusable UI Components (Navbar, CartDrawer, Client Components)
│   ├── lib/            # Utility Helpers (Prisma client db, NextAuth options)
│   ├── store/          # Zustand State Management (Cart Store)
│   └── types/          # TypeScript Type Definitions & Enums
├── public/             # Static Assets (Images, Icons)
├── docker-compose.yml  # Docker PostgreSQL (Opsional jika ingin pindah dari SQLite)
├── tailwind.config.ts  # Konfigurasi Tailwind CSS
└── tsconfig.json       # Konfigurasi TypeScript
```
# Katalog-Online
# Katalog-Online
