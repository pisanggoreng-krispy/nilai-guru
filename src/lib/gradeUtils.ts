import { GRADE_WEIGHTS, GradeStatistics, StudentGrade } from '@/types';

/**
 * Menghitung nilai final berdasarkan bobot
 * Rumus: (Tugas1 × 0.05) + (Tugas2 × 0.05) + (Ulangan1 × 0.10) + (Ulangan2 × 0.10) + (MidTest × 0.30) + (UAS × 0.40)
 */
export const calculateFinalGrade = (
  tugas1: number | null,
  tugas2: number | null,
  ulangan1: number | null,
  ulangan2: number | null,
  midTest: number | null,
  uas: number | null
): number | null => {
  // Jika ada nilai yang belum diisi, return null
  if (
    tugas1 === null ||
    tugas2 === null ||
    ulangan1 === null ||
    ulangan2 === null ||
    midTest === null ||
    uas === null
  ) {
    return null;
  }

  const finalGrade =
    tugas1 * GRADE_WEIGHTS.tugas1 +
    tugas2 * GRADE_WEIGHTS.tugas2 +
    ulangan1 * GRADE_WEIGHTS.ulangan1 +
    ulangan2 * GRADE_WEIGHTS.ulangan2 +
    midTest * GRADE_WEIGHTS.midTest +
    uas * GRADE_WEIGHTS.uas;

  return Math.round(finalGrade * 100) / 100;
};

/**
 * Validasi nilai input (0-100)
 */
export const validateGrade = (value: number | null): boolean => {
  if (value === null) return true;
  return value >= 0 && value <= 100;
};

/**
 * Parse input nilai dengan validasi
 */
export const parseGradeInput = (value: string): number | null => {
  if (value === '' || value === '-') return null;
  const parsed = parseFloat(value);
  if (isNaN(parsed)) return null;
  if (parsed < 0) return 0;
  if (parsed > 100) return 100;
  return Math.round(parsed * 10) / 10;
};

/**
 * Menghitung statistik nilai
 */
export const calculateStatistics = (grades: StudentGrade[]): GradeStatistics => {
  const validGrades = grades.filter((g) => g.finalGrade !== null);
  const finalGrades = validGrades.map((g) => g.finalGrade as number);

  const totalStudents = grades.length;
  const gradedStudents = finalGrades.length;

  if (gradedStudents === 0) {
    return {
      highest: 0,
      lowest: 0,
      average: 0,
      totalStudents,
      gradedStudents: 0,
      gradeDistribution: {
        excellent: 0,
        veryGood: 0,
        good: 0,
        fair: 0,
        poor: 0,
      },
    };
  }

  const highest = Math.max(...finalGrades);
  const lowest = Math.min(...finalGrades);
  const average = finalGrades.reduce((sum, grade) => sum + grade, 0) / gradedStudents;

  // Distribusi nilai
  const gradeDistribution = {
    excellent: finalGrades.filter((g) => g >= 90).length,
    veryGood: finalGrades.filter((g) => g >= 80 && g < 90).length,
    good: finalGrades.filter((g) => g >= 70 && g < 80).length,
    fair: finalGrades.filter((g) => g >= 60 && g < 70).length,
    poor: finalGrades.filter((g) => g < 60).length,
  };

  return {
    highest: Math.round(highest * 100) / 100,
    lowest: Math.round(lowest * 100) / 100,
    average: Math.round(average * 100) / 100,
    totalStudents,
    gradedStudents,
    gradeDistribution,
  };
};

/**
 * Mendapatkan predikat nilai
 */
export const getGradePredicate = (grade: number | null): string => {
  if (grade === null) return '-';
  if (grade >= 90) return 'Sangat Baik';
  if (grade >= 80) return 'Baik';
  if (grade >= 70) return 'Cukup Baik';
  if (grade >= 60) return 'Cukup';
  return 'Kurang';
};

/**
 * Mendapatkan warna berdasarkan nilai
 */
export const getGradeColor = (grade: number | null): string => {
  if (grade === null) return 'text-muted-foreground';
  if (grade >= 90) return 'text-emerald-600';
  if (grade >= 80) return 'text-green-600';
  if (grade >= 70) return 'text-blue-600';
  if (grade >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

/**
 * Format nilai untuk tampilan
 */
export const formatGrade = (grade: number | null): string => {
  if (grade === null) return '-';
  return grade.toFixed(2);
};

/**
 * LocalStorage keys
 */
export const STORAGE_KEY = 'grade_input_data';

/**
 * Save data to localStorage
 */
export const saveToLocalStorage = (data: unknown): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
};

/**
 * Load data from localStorage
 */
export const loadFromLocalStorage = <T>(): T | null => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      try {
        return JSON.parse(data) as T;
      } catch {
        return null;
      }
    }
  }
  return null;
};

/**
 * Clear localStorage
 */
export const clearLocalStorage = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
};
