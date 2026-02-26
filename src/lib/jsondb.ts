// JSON File Database - Simple and reliable storage solution
// Can be migrated to Supabase/PostgreSQL later

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const FILES = {
  users: path.join(DATA_DIR, 'users.json'),
  classes: path.join(DATA_DIR, 'classes.json'),
  subjects: path.join(DATA_DIR, 'subjects.json'),
  students: path.join(DATA_DIR, 'students.json'),
  grades: path.join(DATA_DIR, 'grades.json'),
  teacherSubjects: path.join(DATA_DIR, 'teacherSubjects.json'),
};

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to read JSON file
function readJSON<T>(filePath: string, defaultValue: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
  }
  return defaultValue;
}

// Helper to write JSON file
function writeJSON<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
  }
}

// Types
export type UserRole = 'ADMIN' | 'GURU_MAPEL' | 'WALI_KELAS';
export type Jenjang = 'SMP' | 'MA';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Class {
  id: string;
  name: string;
  jenjang: Jenjang;
  grade: number;
  waliKelasId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  name: string;
  jenjang: Jenjang;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  nis: string;
  name: string;
  classId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Grade {
  id: string;
  studentId: string;
  subjectId: string;
  teacherId: string;
  classId: string;
  semester: string;
  tahunAjaran: string;
  tugas1: number | null;
  tugas2: number | null;
  ulangan1: number | null;
  ulangan2: number | null;
  midTest: number | null;
  uas: number | null;
  finalGrade: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherSubject {
  id: string;
  teacherId: string;
  subjectId: string;
  createdAt: string;
  updatedAt: string;
}

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Database operations
export const db = {
  // Users
  getUsers: (): User[] => readJSON(FILES.users, []),
  getUserById: (id: string): User | undefined => db.getUsers().find(u => u.id === id),
  getUserByEmail: (email: string): User | undefined => db.getUsers().find(u => u.email === email),
  createUser: (data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User => {
    const users = db.getUsers();
    const user: User = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    users.push(user);
    writeJSON(FILES.users, users);
    return user;
  },
  updateUser: (id: string, data: Partial<User>): User | null => {
    const users = db.getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return null;
    users[index] = { ...users[index], ...data, updatedAt: new Date().toISOString() };
    writeJSON(FILES.users, users);
    return users[index];
  },
  deleteUser: (id: string): boolean => {
    const users = db.getUsers();
    const filtered = users.filter(u => u.id !== id);
    if (filtered.length === users.length) return false;
    writeJSON(FILES.users, filtered);
    return true;
  },

  // Classes
  getClasses: (): Class[] => readJSON(FILES.classes, []),
  getClassById: (id: string): Class | undefined => db.getClasses().find(c => c.id === id),
  getClassesByJenjang: (jenjang: Jenjang): Class[] => db.getClasses().filter(c => c.jenjang === jenjang),
  createClass: (data: Omit<Class, 'id' | 'createdAt' | 'updatedAt'>): Class => {
    const classes = db.getClasses();
    const newClass: Class = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    classes.push(newClass);
    writeJSON(FILES.classes, classes);
    return newClass;
  },
  updateClass: (id: string, data: Partial<Class>): Class | null => {
    const classes = db.getClasses();
    const index = classes.findIndex(c => c.id === id);
    if (index === -1) return null;
    classes[index] = { ...classes[index], ...data, updatedAt: new Date().toISOString() };
    writeJSON(FILES.classes, classes);
    return classes[index];
  },
  deleteClass: (id: string): boolean => {
    const classes = db.getClasses();
    const filtered = classes.filter(c => c.id !== id);
    if (filtered.length === classes.length) return false;
    writeJSON(FILES.classes, filtered);
    return true;
  },

  // Subjects
  getSubjects: (): Subject[] => readJSON(FILES.subjects, []),
  getSubjectById: (id: string): Subject | undefined => db.getSubjects().find(s => s.id === id),
  getSubjectsByJenjang: (jenjang: Jenjang): Subject[] => db.getSubjects().filter(s => s.jenjang === jenjang),
  createSubject: (data: Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>): Subject => {
    const subjects = db.getSubjects();
    const subject: Subject = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    subjects.push(subject);
    writeJSON(FILES.subjects, subjects);
    return subject;
  },
  updateSubject: (id: string, data: Partial<Subject>): Subject | null => {
    const subjects = db.getSubjects();
    const index = subjects.findIndex(s => s.id === id);
    if (index === -1) return null;
    subjects[index] = { ...subjects[index], ...data, updatedAt: new Date().toISOString() };
    writeJSON(FILES.subjects, subjects);
    return subjects[index];
  },
  deleteSubject: (id: string): boolean => {
    const subjects = db.getSubjects();
    const filtered = subjects.filter(s => s.id !== id);
    if (filtered.length === subjects.length) return false;
    writeJSON(FILES.subjects, filtered);
    return true;
  },

  // Students
  getStudents: (): Student[] => readJSON(FILES.students, []),
  getStudentById: (id: string): Student | undefined => db.getStudents().find(s => s.id === id),
  getStudentsByClass: (classId: string): Student[] => db.getStudents().filter(s => s.classId === classId),
  createStudent: (data: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>): Student => {
    const students = db.getStudents();
    const student: Student = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    students.push(student);
    writeJSON(FILES.students, students);
    return student;
  },
  updateStudent: (id: string, data: Partial<Student>): Student | null => {
    const students = db.getStudents();
    const index = students.findIndex(s => s.id === id);
    if (index === -1) return null;
    students[index] = { ...students[index], ...data, updatedAt: new Date().toISOString() };
    writeJSON(FILES.students, students);
    return students[index];
  },
  deleteStudent: (id: string): boolean => {
    const students = db.getStudents();
    const filtered = students.filter(s => s.id !== id);
    if (filtered.length === students.length) return false;
    writeJSON(FILES.students, filtered);
    return true;
  },
  importStudents: (newStudents: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>[]): number => {
    const students = db.getStudents();
    let count = 0;
    for (const data of newStudents) {
      // Check if NIS already exists
      if (!students.find(s => s.nis === data.nis)) {
        students.push({
          ...data,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        count++;
      }
    }
    writeJSON(FILES.students, students);
    return count;
  },

  // Grades
  getGrades: (): Grade[] => readJSON(FILES.grades, []),
  getGradeById: (id: string): Grade | undefined => db.getGrades().find(g => g.id === id),
  getGradesByClass: (classId: string): Grade[] => db.getGrades().filter(g => g.classId === classId),
  getGradesByStudent: (studentId: string): Grade[] => db.getGrades().filter(g => g.studentId === studentId),
  getGradesBySubject: (subjectId: string): Grade[] => db.getGrades().filter(g => g.subjectId === subjectId),
  getGradesByClassAndSubject: (classId: string, subjectId: string): Grade[] => 
    db.getGrades().filter(g => g.classId === classId && g.subjectId === subjectId),
  getGradeByStudentAndSubject: (studentId: string, subjectId: string): Grade | undefined =>
    db.getGrades().find(g => g.studentId === studentId && g.subjectId === subjectId),
  createGrade: (data: Omit<Grade, 'id' | 'createdAt' | 'updatedAt'>): Grade => {
    const grades = db.getGrades();
    const grade: Grade = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    grades.push(grade);
    writeJSON(FILES.grades, grades);
    return grade;
  },
  updateGrade: (id: string, data: Partial<Grade>): Grade | null => {
    const grades = db.getGrades();
    const index = grades.findIndex(g => g.id === id);
    if (index === -1) return null;
    grades[index] = { ...grades[index], ...data, updatedAt: new Date().toISOString() };
    writeJSON(FILES.grades, grades);
    return grades[index];
  },
  upsertGrade: (studentId: string, subjectId: string, data: Partial<Grade>): Grade => {
    const grades = db.getGrades();
    const index = grades.findIndex(g => g.studentId === studentId && g.subjectId === subjectId);
    
    if (index !== -1) {
      grades[index] = { 
        ...grades[index], 
        ...data, 
        updatedAt: new Date().toISOString() 
      };
      writeJSON(FILES.grades, grades);
      return grades[index];
    } else {
      const newGrade: Grade = {
        id: generateId(),
        studentId,
        subjectId,
        teacherId: data.teacherId || '',
        classId: data.classId || '',
        semester: data.semester || '1',
        tahunAjaran: data.tahunAjaran || '2024/2025',
        tugas1: data.tugas1 ?? null,
        tugas2: data.tugas2 ?? null,
        ulangan1: data.ulangan1 ?? null,
        ulangan2: data.ulangan2 ?? null,
        midTest: data.midTest ?? null,
        uas: data.uas ?? null,
        finalGrade: data.finalGrade ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      grades.push(newGrade);
      writeJSON(FILES.grades, grades);
      return newGrade;
    }
  },

  // Teacher Subjects
  getTeacherSubjects: (): TeacherSubject[] => readJSON(FILES.teacherSubjects, []),
  getTeacherSubjectsByTeacher: (teacherId: string): TeacherSubject[] => 
    db.getTeacherSubjects().filter(ts => ts.teacherId === teacherId),
  createTeacherSubject: (data: Omit<TeacherSubject, 'id' | 'createdAt' | 'updatedAt'>): TeacherSubject => {
    const teacherSubjects = db.getTeacherSubjects();
    const ts: TeacherSubject = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    teacherSubjects.push(ts);
    writeJSON(FILES.teacherSubjects, teacherSubjects);
    return ts;
  },

  // Utility functions
  calculateFinalGrade: (
    tugas1: number | null,
    tugas2: number | null,
    ulangan1: number | null,
    ulangan2: number | null,
    midTest: number | null,
    uas: number | null
  ): number | null => {
    if (tugas1 === null || tugas2 === null || ulangan1 === null || 
        ulangan2 === null || midTest === null || uas === null) {
      return null;
    }
    const final = (tugas1 * 0.05) + (tugas2 * 0.05) + (ulangan1 * 0.10) + 
                  (ulangan2 * 0.10) + (midTest * 0.30) + (uas * 0.40);
    return Math.round(final * 100) / 100;
  },

  // Initialize with seed data
  initializeData: async () => {
    const { initializeDatabase } = await import('./seed');
    await initializeDatabase();
  }
};
