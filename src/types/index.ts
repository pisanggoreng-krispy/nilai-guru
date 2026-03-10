// Jenjang pendidikan
export type Jenjang = 'SMP' | 'MA';

// User roles
export type UserRole = 'ADMIN' | 'GURU_MAPEL' | 'WALI_KELAS';

// Interface untuk siswa
export interface Student {
  id: string;
  name: string;
  nis: string;
  classId: string;
  className?: string;
}

// Interface untuk kelas
export interface Class {
  id: string;
  name: string;
  jenjang: Jenjang;
  grade: number;
  waliKelasId?: string;
  waliKelasName?: string;
}

// Interface untuk mata pelajaran
export interface Subject {
  id: string;
  name: string;
  jenjang: Jenjang;
}

// Interface untuk nilai siswa
export interface StudentGrade {
  id?: string;
  studentId: string;
  studentName: string;
  studentNis: string;
  subjectId: string;
  subjectName?: string;
  tugas1: number | null;
  tugas2: number | null;
  ulangan1: number | null;
  ulangan2: number | null;
  midTest: number | null;
  uas: number | null;
  finalGrade: number | null;
}

// Interface untuk input nilai
export interface GradeInput {
  tugas1: number | null;
  tugas2: number | null;
  ulangan1: number | null;
  ulangan2: number | null;
  midTest: number | null;
  uas: number | null;
}

// Interface untuk rekap nilai
export interface GradeStatistics {
  highest: number;
  lowest: number;
  average: number;
  totalStudents: number;
  gradedStudents: number;
  gradeDistribution: {
    excellent: number; // 90-100
    veryGood: number;  // 80-89
    good: number;      // 70-79
    fair: number;      // 60-69
    poor: number;      // 0-59
  };
}

// Interface untuk rekap nilai per mata pelajaran (untuk wali kelas)
export interface SubjectRecap {
  subjectId: string;
  subjectName: string;
  averageGrade: number | null;
  highestGrade: number | null;
  lowestGrade: number | null;
  gradedCount: number;
  totalStudents: number;
}

// Interface untuk rekap siswa (untuk wali kelas)
export interface StudentRecap {
  studentId: string;
  studentName: string;
  studentNis: string;
  grades: {
    subjectId: string;
    subjectName: string;
    grade: StudentGrade;
  }[];
  averageGrade: number | null;
}

// Bobot nilai
export const GRADE_WEIGHTS = {
  tugas1: 0.05,
  tugas2: 0.05,
  ulangan1: 0.10,
  ulangan2: 0.10,
  midTest: 0.30,
  uas: 0.40,
} as const;

// Label komponen nilai
export const GRADE_LABELS = {
  tugas1: 'Tugas 1',
  tugas2: 'Tugas 2',
  ulangan1: 'Ulangan 1',
  ulangan2: 'Ulangan 2',
  midTest: 'Mid Test',
  uas: 'UAS',
} as const;

// Label role
export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrator',
  GURU_MAPEL: 'Guru Mata Pelajaran',
  WALI_KELAS: 'Wali Kelas',
};

// Label jenjang
export const JENJANG_LABELS: Record<Jenjang, string> = {
  SMP: 'SMP (Sekolah Menengah Pertama)',
  MA: 'MA (Madrasah Aliyah)',
};
