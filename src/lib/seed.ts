// Seed data for the JSON database
import * as bcrypt from 'bcryptjs';
import { db, User, Class, Subject, Student, UserRole, Jenjang } from './jsondb';

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
const TEACHERS: { name: string; email: string; role: UserRole }[] = [
  { name: 'Admin User', email: 'admin@sekolah.com', role: 'ADMIN' },
  { name: 'Budi Hartono, S.Pd', email: 'budi@sekolah.com', role: 'GURU_MAPEL' },
  { name: 'Sri Wahyuni, S.Pd', email: 'sri@sekolah.com', role: 'WALI_KELAS' },
  { name: 'Ahmad Fauzi, M.Pd', email: 'ahmad@sekolah.com', role: 'GURU_MAPEL' },
  { name: 'Dewi Sartika, S.Pd', email: 'dewi@sekolah.com', role: 'WALI_KELAS' },
  { name: 'Hendra Wijaya, S.Pd', email: 'hendra@sekolah.com', role: 'GURU_MAPEL' },
  { name: 'Nur Hidayah, S.Pd', email: 'nur@sekolah.com', role: 'WALI_KELAS' },
  { name: 'Eko Prasetyo, M.Pd', email: 'eko@sekolah.com', role: 'GURU_MAPEL' },
];

export async function initializeDatabase() {
  console.log('🌱 Initializing database...');

  // Check if already initialized
  const existingUsers = db.getUsers();
  if (existingUsers.length > 0) {
    console.log('✅ Database already initialized');
    return;
  }

  // Hash password default
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create users (guru)
  const users: User[] = [];
  for (const teacher of TEACHERS) {
    const user = db.createUser({
      name: teacher.name,
      email: teacher.email,
      password: hashedPassword,
      role: teacher.role,
    });
    users.push(user);
  }
  console.log(`✅ ${users.length} guru dibuat`);

  // Create subjects SMP
  for (const name of SMP_SUBJECTS) {
    db.createSubject({ name, jenjang: 'SMP' });
  }
  console.log(`✅ ${SMP_SUBJECTS.length} mata pelajaran SMP dibuat`);

  // Create subjects MA
  for (const name of MA_SUBJECTS) {
    db.createSubject({ name, jenjang: 'MA' });
  }
  console.log(`✅ ${MA_SUBJECTS.length} mata pelajaran MA dibuat`);

  // Get wali kelas users
  const waliKelasUsers = users.filter(u => u.role === 'WALI_KELAS');
  const guruMapelUsers = users.filter(u => u.role === 'GURU_MAPEL');

  // Create classes SMP (7A, 7B, 8A, 8B, 9A, 9B)
  const smpClasses: Class[] = [];
  const classSuffixes = ['A', 'B'];
  
  for (const grade of [7, 8, 9]) {
    for (const suffix of classSuffixes) {
      const waliIndex = (grade - 7) * 2 + (suffix === 'A' ? 0 : 1);
      const wali = waliKelasUsers[waliIndex % waliKelasUsers.length];
      
      const kelas = db.createClass({
        name: `${grade}${suffix}`,
        jenjang: 'SMP',
        grade,
        waliKelasId: wali.id,
      });
      smpClasses.push(kelas);
    }
  }
  console.log(`✅ ${smpClasses.length} kelas SMP dibuat`);

  // Create classes MA (10A, 10B, 11A, 11B, 12A, 12B)
  const maClasses: Class[] = [];
  for (const grade of [10, 11, 12]) {
    for (const suffix of classSuffixes) {
      const waliIndex = (grade - 10) * 2 + (suffix === 'A' ? 0 : 1);
      const wali = waliKelasUsers[waliIndex % waliKelasUsers.length];
      
      const kelas = db.createClass({
        name: `${grade}${suffix}`,
        jenjang: 'MA',
        grade,
        waliKelasId: wali.id,
      });
      maClasses.push(kelas);
    }
  }
  console.log(`✅ ${maClasses.length} kelas MA dibuat`);

  // Create students SMP
  let studentCount = 0;
  for (const kelas of smpClasses) {
    for (let i = 0; i < SMP_STUDENT_NAMES.length; i++) {
      const nis = `SMP${kelas.name}${String(i + 1).padStart(3, '0')}`;
      db.createStudent({
        nis,
        name: SMP_STUDENT_NAMES[i],
        classId: kelas.id,
      });
      studentCount++;
    }
  }
  console.log(`✅ ${studentCount} siswa SMP dibuat`);

  // Create students MA
  studentCount = 0;
  for (const kelas of maClasses) {
    for (let i = 0; i < MA_STUDENT_NAMES.length; i++) {
      const nis = `MA${kelas.name}${String(i + 1).padStart(3, '0')}`;
      db.createStudent({
        nis,
        name: MA_STUDENT_NAMES[i],
        classId: kelas.id,
      });
      studentCount++;
    }
  }
  console.log(`✅ ${studentCount} siswa MA dibuat`);

  // Assign guru mapel ke mata pelajaran
  const smpSubjects = db.getSubjectsByJenjang('SMP');
  const maSubjects = db.getSubjectsByJenjang('MA');

  for (let i = 0; i < smpSubjects.length; i++) {
    const guru = guruMapelUsers[i % guruMapelUsers.length];
    db.createTeacherSubject({
      teacherId: guru.id,
      subjectId: smpSubjects[i].id,
    });
  }

  for (let i = 0; i < maSubjects.length; i++) {
    const guru = guruMapelUsers[i % guruMapelUsers.length];
    db.createTeacherSubject({
      teacherId: guru.id,
      subjectId: maSubjects[i].id,
    });
  }
  console.log(`✅ Relasi guru-mata pelajaran dibuat`);

  console.log('\n🎉 Database initialization complete!');
  console.log('\n📋 Akun Login (password: password123):');
  TEACHERS.forEach(t => {
    console.log(`   ${t.email} - ${t.role}`);
  });
}

// Run initialization if called directly
if (require.main === module) {
  initializeDatabase().catch(console.error);
}
