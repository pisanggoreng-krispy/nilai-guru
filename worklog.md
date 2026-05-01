# Worklog - Sistem Input Nilai Guru

---
Task ID: 1
Agent: Main Agent
Task: Membangun aplikasi sistem input nilai guru dengan database dan autentikasi

Work Log:
- Menganalisis kebutuhan sistem dengan fitur autentikasi, role management, input nilai, dan export/import
- Membuat JSON file database sebagai pengganti Prisma (karena kompatibilitas dengan Bun)
- Membuat lib/jsondb.ts untuk operasi database CRUD
- Membuat lib/seed.ts untuk data awal (guru, siswa, kelas, mata pelajaran)
- Membuat API routes: auth/login, auth/me, auth/logout, dashboard, classes, subjects, students, grades, recap, export, import, users
- Membuat halaman login dengan demo account
- Membuat dashboard layout dengan sidebar navigasi
- Membuat halaman dashboard utama dengan statistik
- Membuat halaman input nilai dengan tabel interaktif
- Membuat halaman rekap wali kelas dengan ranking
- Membuat halaman kelola siswa, kelola guru, kelola kelas untuk admin
- Implementasi fitur export/import Excel

Stage Summary:
- Database: JSON file storage (siap migrate ke Supabase)
- Autentikasi: JWT token dengan cookie
- Role: ADMIN, GURU_MAPEL, WALI_KELAS
- Fitur: Input nilai, rekap wali kelas, export Excel, import Excel
- Data dummy: 8 guru, 180 siswa, 12 kelas, 21 mata pelajaran
