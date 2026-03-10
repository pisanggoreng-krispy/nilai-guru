# Sistem Input Nilai Guru

Aplikasi web untuk input nilai siswa oleh guru mata pelajaran.

## Fitur Utama

- Login dengan 3 role: Admin, Guru Mapel, Wali Kelas
- Input nilai dengan bobot otomatis (Tugas 5%, Ulangan 10%, Mid 30%, UAS 40%)
- Rekap nilai per kelas dengan ranking
- Export/Import Excel
- Kelola data siswa, guru, kelas

## Akun Demo

| Email | Password | Role |
|-------|----------|------|
| admin@sekolah.com | password123 | Administrator |
| budi@sekolah.com | password123 | Guru Mapel |
| sri@sekolah.com | password123 | Wali Kelas |

## Deployment ke Vercel

### Cara 1: Import dari GitHub
1. Push project ini ke repository GitHub Anda
2. Login ke vercel.com
3. Klik "Add New Project"
4. Import dari GitHub
5. Klik Deploy

### Cara 2: Drag & Drop
1. Login ke vercel.com
2. Klik "Add New Project"
3. Drag & drop folder project ini
4. Klik Deploy

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- JSON File Database (migrasi ke Supabase untuk multi-user)
