# Deploy ke Vercel

Aplikasi ini akan di-deploy ke Vercel. ikuti langkah-langkahnya:

## Langkah 1: Buat Akun Vercel

1. Kunjungi **https://vercel.com/signup**
2. Daftar dengan:
   - Pilih **"Continue with GitHub"** (paling mudah)
   - Authorize Vercel untuk mengakses repositori GitHub Anda

## Langkah 2: Install Vercel CLI

Buka terminal/command prompt di komputer lokal lalu jalankan:

\```bash
npm install -g vercel
\```

## Langkah 3: Download Project

Pilih salah satu cara di bawah:

### Opsi A: Download sebagai ZIP

Klik link download di bawah untuk mendapatkan file ZIP proyek ini.

Setelah di-download, extract file tersebut di komputer Anda.

### Opsi B: Clone dari GitHub

```bash
git clone <repository-url>
cd nama-project
```

## Langkah 4: Deploy

Di dalam folder project, jalankan:

\```bash
vercel
\```

Ikuti instruksi di terminal:
1. Pilih scope: **"Link to existing project"** atau **"Create new project"**
2. Pilih root directory: **./** (tekan Enter)
3. Tunggu proses deployment selesai

## Langkah 5: Akses Aplikasi

Setelah deployment selesai, Vercel akan memberikan URL seperti:
- `https://nama-project.vercel.app`

## 🔧 Troubleshooting

Jika ada error saat deployment, coba:
- Hapus folder `.next` dan jalankan `vercel` lagi
- Pastikan semua dependencies terinstall dengan `npm install`

## 📱 Cara Akses dari HP
Setelah deploy, bagikan URL tersebut ke guru-guru:
- Dapat dibuka di browser HP
- Tidak perlu install aplikasi apapun
