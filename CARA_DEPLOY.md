# 🎯 Cara Paling Mudah Deploy ke Vercel

## Langkah 1: Buat Akun GitHub (Jika Belum Punya)
1. Buka: **https://github.com**
2. Klik **Sign Up**
3. Ikuti proses pendaftaran

## Langkah 2: Upload Project ke GitHub

### Opsi A: Download lalu Upload Manual
1. **Download** semua file project (saya sediakan dalam bentuk ZIP)
2. Di GitHub, buat repository baru dengan nama `sistem-nilai`
3. **Upload** semua file ke repository tersebut

### Opsi B: Via Git Command
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/USERNAME/sistem-nilai.git
git push -u origin main
```

## Langkah 3: Deploy di Vercel
1. Buka: **https://vercel.com**
2. Klik **"Sign Up"** → pilih **"Continue with GitHub"**
3. Setelah login, klik **"Add New Project"**
4. Pilih repository `sistem-nilai`
5. Klik **"Deploy"**
6. Tunggu 1-2 menit

## Langkah 4: Selesai! 🎉
Vercel akan memberikan URL seperti:
```
https://sistem-nilai.vercel.app
```

---

## 📌 Yang Perlu Anda Lakukan Sekarang:

**Download project ini terlebih dahulu**, lalu upload ke GitHub.

Apakah Anda bisa download file dari workspace ini? (Biasanya ada tombol download di menu)
