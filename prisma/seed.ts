import { PrismaClient, UserRole, Jenjang } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Data mata pelajaran SMP
const SMP_SUBJECTS = [
  'Matematika',
  'Bahasa Indonesia',
  'Bahasa Inggris',
  'IPA',
  'IPS',
  'PKN',
  'Pendidikan Agama',
  'Seni Budaya',
  'PJOK',
];

// Data mata pelajaran MA
const MA_SUBJECTS = [
  'Matematika',
  'Bahasa Indonesia',
  'Bahasa Inggris',
  'Fisika',
  'Kimia',
  'Biologi',
  'Sejarah',
  'Geografi',
  'Ekonomi',
  'PKN',
  'Pendidikan Agama',
  'Bahasa Arab',
];

// Nama siswa SMP
const SMP_STUDENT_NAMES = [
  'Ahmad Rizki Pratama',
  'Siti Nurhaliza',
  'Muhammad Fadli Rahman',
  'Putri Wulandari',
  'Dimas Adi Saputra',
  'Anisa Fitriani',
  'Bagus Setiawan',
  'Dewi Lestari',
  'Fajar Nugroho',
  'Rina Kartika Sari',
  'Yusuf Hidayat',
  'Nabila Azzahra',
  'Rizky Ramadhan',
  'Sinta Dewi',
  'Budi Santoso',
];

// Nama siswa MA
const MA_STUDENT_NAMES = [
  'Abdullah Hakim',
  'Fatimah Azzahra',
  'Umar Faruq',
  'Khadijah Nuraini',
  'Ali Imran',
  'Aisyah Putri',
  'Hasan Basri',
  'Zainab Salsabila',
  'Husain Muhammad',
  'Maryam Jannah',
  'Bilal Ramadhan',
  'Hafshah Indah',
  'Khalid Yusuf',
  'Ruqayyah Amina',
  'Salman Al-Farisi',
];

// Data guru
const TEACHERS = [
  { name: 'Admin User', email: 'admin@sekolah.com', role: UserRole.ADMIN },
  { name: 'Budi Hartono, S.Pd', email: 'budi@sekolah.com', role: UserRole.GURU_MAPEL },
  { name: 'Sri Wahyuni, S.Pd', email: 'sri@sekolah.com', role: UserRole.WALI_KELAS },
  { name: 'Ahmad Fauzi, M.Pd', email: 'ahmad@sekolah.com', role: UserRole.GURU_MAPEL },
  { name: 'Dewi Sartika, S.Pd', email: 'dewi@sekolah.com', role: UserRole.WALI_KELAS },
];

// Suffix kelas
const CLASS_SUFFIXES = ['A', 'B'];

async function main() {
  console.log('🌱 Mulai seeding database...');

  // Hapus data lama
  await prisma.grade.deleteMany();
  await prisma.teacherSubject.deleteMany();
  await prisma.student.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.class.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Data lama dihapus');

  // Hash password default
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Buat users (guru)
  const users = await Promise.all(
    TEACHERS.map((teacher) =>
      prisma.user.create({
        data: {
          name: teacher.name,
          email: teacher.email,
          password: hashedPassword,
          role: teacher.role,
        },
      })
    )
  );
  console.log(`✅ ${users.length} guru dibuat`);

  // Buat subjects SMP
  const smpSubjects = await Promise.all(
    SMP_SUBJECTS.map((name) =>
      prisma.subject.create({
        data: { name, jenjang: Jenjang.SMP },
      })
    )
  );
  console.log(`✅ ${smpSubjects.length} mata pelajaran SMP dibuat`);

  // Buat subjects MA
  const maSubjects = await Promise.all(
    MA_SUBJECTS.map((name) =>
      prisma.subject.create({
        data: { name, jenjang: Jenjang.MA },
      })
    )
  );
  console.log(`✅ ${maSubjects.length} mata pelajaran MA dibuat`);

  // Buat kelas SMP (7A, 7B, 8A, 8B, 9A, 9B)
  const smpClasses = [];
  const waliKelasUsers = users.filter((u) => u.role === UserRole.WALI_KELAS);
  
  for (const grade of [7, 8, 9]) {
    for (const suffix of CLASS_SUFFIXES) {
      const waliIndex = (grade - 7) * 2 + (suffix === 'A' ? 0 : 1);
      const wali = waliKelasUsers[waliIndex % waliKelasUsers.length];
      
      const kelas = await prisma.class.create({
        data: {
          name: `${grade}${suffix}`,
          jenjang: Jenjang.SMP,
          grade,
          waliKelasId: wali.id,
        },
      });
      smpClasses.push(kelas);
    }
  }
  console.log(`✅ ${smpClasses.length} kelas SMP dibuat`);

  // Buat kelas MA (10A, 10B, 11A, 11B, 12A, 12B)
  const maClasses = [];
  for (const grade of [10, 11, 12]) {
    for (const suffix of CLASS_SUFFIXES) {
      const waliIndex = (grade - 10) * 2 + (suffix === 'A' ? 0 : 1);
      const wali = waliKelasUsers[waliIndex % waliKelasUsers.length];
      
      const kelas = await prisma.class.create({
        data: {
          name: `${grade}${suffix}`,
          jenjang: Jenjang.MA,
          grade,
          waliKelasId: wali.id,
        },
      });
      maClasses.push(kelas);
    }
  }
  console.log(`✅ ${maClasses.length} kelas MA dibuat`);

  // Buat siswa SMP untuk setiap kelas
  let studentCount = 0;
  for (const kelas of smpClasses) {
    for (let i = 0; i < SMP_STUDENT_NAMES.length; i++) {
      const nis = `SMP${kelas.name}${String(i + 1).padStart(3, '0')}`;
      await prisma.student.create({
        data: {
          nis,
          name: SMP_STUDENT_NAMES[i],
          classId: kelas.id,
        },
      });
      studentCount++;
    }
  }
  console.log(`✅ ${studentCount} siswa SMP dibuat`);

  // Buat siswa MA untuk setiap kelas
  studentCount = 0;
  for (const kelas of maClasses) {
    for (let i = 0; i < MA_STUDENT_NAMES.length; i++) {
      const nis = `MA${kelas.name}${String(i + 1).padStart(3, '0')}`;
      await prisma.student.create({
        data: {
          nis,
          name: MA_STUDENT_NAMES[i],
          classId: kelas.id,
        },
      });
      studentCount++;
    }
  }
  console.log(`✅ ${studentCount} siswa MA dibuat`);

  // Assign guru mapel ke mata pelajaran
  const guruMapelUsers = users.filter((u) => u.role === UserRole.GURU_MAPEL);
  
  // Assign guru ke subjects SMP
  for (let i = 0; i < smpSubjects.length; i++) {
    const guru = guruMapelUsers[i % guruMapelUsers.length];
    await prisma.teacherSubject.create({
      data: {
        teacherId: guru.id,
        subjectId: smpSubjects[i].id,
      },
    });
  }

  // Assign guru ke subjects MA
  for (let i = 0; i < maSubjects.length; i++) {
    const guru = guruMapelUsers[i % guruMapelUsers.length];
    await prisma.teacherSubject.create({
      data: {
        teacherId: guru.id,
        subjectId: maSubjects[i].id,
      },
    });
  }
  console.log(`✅ Relasi guru-mata pelajaran dibuat`);

  console.log('\n🎉 Seeding selesai!');
  console.log('\n📋 Akun Login:');
  TEACHERS.forEach((t) => {
    console.log(`   ${t.email} (password: password123) - ${t.role}`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
