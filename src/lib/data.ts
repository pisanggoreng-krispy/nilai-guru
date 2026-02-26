import { Jenjang, Kelas, Student, Subject } from '@/types';

// Data mata pelajaran SMP
const SMP_SUBJECTS: Omit<Subject, 'jenjang'>[] = [
  { id: 'smp-math', name: 'Matematika' },
  { id: 'smp-bindo', name: 'Bahasa Indonesia' },
  { id: 'smp-bing', name: 'Bahasa Inggris' },
  { id: 'smp-ipa', name: 'IPA' },
  { id: 'smp-ips', name: 'IPS' },
  { id: 'smp-pkn', name: 'PKN' },
  { id: 'smp-agama', name: 'Pendidikan Agama' },
  { id: 'smp-senbud', name: 'Seni Budaya' },
  { id: 'smp-pjok', name: 'PJOK' },
];

// Data mata pelajaran MA
const MA_SUBJECTS: Omit<Subject, 'jenjang'>[] = [
  { id: 'ma-math', name: 'Matematika' },
  { id: 'ma-bindo', name: 'Bahasa Indonesia' },
  { id: 'ma-bing', name: 'Bahasa Inggris' },
  { id: 'ma-fisika', name: 'Fisika' },
  { id: 'ma-kimia', name: 'Kimia' },
  { id: 'ma-biologi', name: 'Biologi' },
  { id: 'ma-sejarah', name: 'Sejarah' },
  { id: 'ma-geografi', name: 'Geografi' },
  { id: 'ma-ekonomi', name: 'Ekonomi' },
  { id: 'ma-pkn', name: 'PKN' },
  { id: 'ma-agama', name: 'Pendidikan Agama' },
  { id: 'ma-barab', name: 'Bahasa Arab' },
];

// Nama-nama siswa SMP
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

// Nama-nama siswa MA
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

// Generate NIS
const generateNIS = (prefix: string, index: number): string => {
  return `${prefix}${String(index + 1).padStart(4, '0')}`;
};

// Generate students for a class
const generateStudents = (names: string[], nisPrefix: string): Student[] => {
  return names.map((name, index) => ({
    id: `${nisPrefix}-${index + 1}`,
    name,
    nis: generateNIS(nisPrefix, index),
  }));
};

// Get subjects by jenjang
export const getSubjectsByJenjang = (jenjang: Jenjang): Subject[] => {
  const subjects = jenjang === 'SMP' ? SMP_SUBJECTS : MA_SUBJECTS;
  return subjects.map((s) => ({ ...s, jenjang }));
};

// Get classes by jenjang
export const getClassesByJenjang = (jenjang: Jenjang): Kelas[] => {
  if (jenjang === 'SMP') {
    return ['7', '8', '9'];
  }
  return ['10', '11', '12'];
};

// Get students by jenjang and class
export const getStudentsByClass = (jenjang: Jenjang, kelas: Kelas): Student[] => {
  const names = jenjang === 'SMP' ? SMP_STUDENT_NAMES : MA_STUDENT_NAMES;
  const prefix = jenjang === 'SMP' ? `SMP${kelas}` : `MA${kelas}`;
  return generateStudents(names, prefix);
};

// Get all subjects
export const getAllSubjects = (): Subject[] => {
  const smpSubjects = SMP_SUBJECTS.map((s) => ({ ...s, jenjang: 'SMP' as Jenjang }));
  const maSubjects = MA_SUBJECTS.map((s) => ({ ...s, jenjang: 'MA' as Jenjang }));
  return [...smpSubjects, ...maSubjects];
};

// Jenjang options
export const JENJANG_OPTIONS = [
  { value: 'SMP', label: 'SMP (Sekolah Menengah Pertama)' },
  { value: 'MA', label: 'MA (Madrasah Aliyah)' },
] as const;

// Get kelas label
export const getKelasLabel = (jenjang: Jenjang, kelas: Kelas): string => {
  return `${jenjang} Kelas ${kelas}`;
};
