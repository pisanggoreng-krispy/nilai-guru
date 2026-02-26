import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://zgrqtxmikthqhhiiejvh.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpncnF0eG1pa3RocWhoaWllanZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjEyMzE4MywiZXhwIjoyMDg3Njk5MTgzfQ.ceebOdYHxZu5UxASSOFug3eKOSB3zSvFc_rOpl3fwLY';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'GURU_MAPEL' | 'WALI_KELAS';
  createdAt: string;
  updatedAt: string;
}

export interface Class {
  id: string;
  name: string;
  level: 'SMP' | 'MA';
  academicYear: string;
  waliKelasId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  level: 'SMP' | 'MA';
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  name: string;
  nisn: string;
  classId: string;
  gender?: 'L' | 'P';
  createdAt: string;
  updatedAt: string;
}

export interface TeacherSubject {
  id: string;
  userId: string;
  subjectId: string;
  classId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Grade {
  id: string;
  studentId: string;
  subjectId: string;
  tugas1: number | null;
  tugas2: number | null;
  ulangan1: number | null;
  ulangan2: number | null;
  midTest: number | null;
  finalTest: number | null;
  finalGrade: number | null;
  academicYear: string;
  semester: number;
  createdAt: string;
  updatedAt: string;
}

// Helper to generate ID
export function generateId(prefix: string = ''): string {
  return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
