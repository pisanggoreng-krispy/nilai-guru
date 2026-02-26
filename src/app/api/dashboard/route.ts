import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/jsondb';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Tidak terautentikasi' },
        { status: 401 }
      );
    }

    const decoded = verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
    const user = db.getUserById(decoded.userId);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    // Get data based on role
    const classes = db.getClasses();
    const subjects = db.getSubjects();
    const students = db.getStudents();
    const grades = db.getGrades();
    const users = db.getUsers();

    // Get classes where user is wali kelas
    const waliKelasClasses = classes.filter(c => c.waliKelasId === user.id);

    // Get subjects taught by this teacher
    const teacherSubjects = db.getTeacherSubjectsByTeacher(user.id);
    const taughtSubjectIds = teacherSubjects.map(ts => ts.subjectId);
    const taughtSubjects = subjects.filter(s => taughtSubjectIds.includes(s.id));

    // Calculate statistics
    const totalStudents = students.length;
    const totalClasses = classes.length;
    const totalSubjects = subjects.length;
    
    // Count graded entries
    const gradedCount = grades.filter(g => g.finalGrade !== null).length;
    const totalGradeEntries = students.length * subjects.length;
    const completionRate = totalGradeEntries > 0 
      ? Math.round((gradedCount / totalGradeEntries) * 100) 
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        stats: {
          totalStudents,
          totalClasses,
          totalSubjects,
          gradedCount,
          completionRate,
        },
        waliKelasClasses: waliKelasClasses.map(c => ({
          ...c,
          waliKelas: users.find(u => u.id === c.waliKelasId)?.name || null,
          studentCount: students.filter(s => s.classId === c.id).length,
        })),
        taughtSubjects: taughtSubjects.map(s => ({
          ...s,
          jenjang: s.jenjang,
        })),
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
