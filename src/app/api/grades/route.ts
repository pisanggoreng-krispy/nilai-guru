import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/jsondb';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Get grades with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const subjectId = searchParams.get('subjectId');
    const studentId = searchParams.get('studentId');
    
    let grades = db.getGrades();

    if (classId) {
      grades = grades.filter(g => g.classId === classId);
    }
    if (subjectId) {
      grades = grades.filter(g => g.subjectId === subjectId);
    }
    if (studentId) {
      grades = grades.filter(g => g.studentId === studentId);
    }

    // Enrich with related data
    const students = db.getStudents();
    const subjects = db.getSubjects();
    const classes = db.getClasses();
    const users = db.getUsers();

    const enrichedGrades = grades.map(g => ({
      ...g,
      student: students.find(s => s.id === g.studentId),
      subject: subjects.find(s => s.id === g.subjectId),
      class: classes.find(c => c.id === g.classId),
      teacher: users.find(u => u.id === g.teacherId),
    }));

    return NextResponse.json({ success: true, data: enrichedGrades });
  } catch (error) {
    console.error('Get grades error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// Save or update grades
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const decoded = verify(token, JWT_SECRET) as { userId: string };
    const body = await request.json();
    const { studentId, subjectId, classId, semester, tahunAjaran, tugas1, tugas2, ulangan1, ulangan2, midTest, uas } = body;

    // Calculate final grade
    const finalGrade = db.calculateFinalGrade(tugas1, tugas2, ulangan1, ulangan2, midTest, uas);

    const grade = db.upsertGrade(studentId, subjectId, {
      teacherId: decoded.userId,
      classId,
      semester: semester || '1',
      tahunAjaran: tahunAjaran || '2024/2025',
      tugas1: tugas1 ?? null,
      tugas2: tugas2 ?? null,
      ulangan1: ulangan1 ?? null,
      ulangan2: ulangan2 ?? null,
      midTest: midTest ?? null,
      uas: uas ?? null,
      finalGrade,
    });

    return NextResponse.json({ success: true, data: grade });
  } catch (error) {
    console.error('Save grade error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// Bulk save grades
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const decoded = verify(token, JWT_SECRET) as { userId: string };
    const body = await request.json();
    const { grades } = body;

    if (!Array.isArray(grades)) {
      return NextResponse.json({ success: false, error: 'Format data tidak valid' }, { status: 400 });
    }

    const savedGrades = [];
    for (const gradeData of grades) {
      const { studentId, subjectId, classId, semester, tahunAjaran, tugas1, tugas2, ulangan1, ulangan2, midTest, uas } = gradeData;
      
      const finalGrade = db.calculateFinalGrade(tugas1, tugas2, ulangan1, ulangan2, midTest, uas);
      
      const grade = db.upsertGrade(studentId, subjectId, {
        teacherId: decoded.userId,
        classId,
        semester: semester || '1',
        tahunAjaran: tahunAjaran || '2024/2025',
        tugas1: tugas1 ?? null,
        tugas2: tugas2 ?? null,
        ulangan1: ulangan1 ?? null,
        ulangan2: ulangan2 ?? null,
        midTest: midTest ?? null,
        uas: uas ?? null,
        finalGrade,
      });
      savedGrades.push(grade);
    }

    return NextResponse.json({ 
      success: true, 
      message: `${savedGrades.length} nilai berhasil disimpan`,
      data: savedGrades 
    });
  } catch (error) {
    console.error('Bulk save grades error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
