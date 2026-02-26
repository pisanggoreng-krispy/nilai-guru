import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/jsondb';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Get recap for wali kelas
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const decoded = verify(token, JWT_SECRET) as { userId: string; role: string };
    const user = db.getUserById(decoded.userId);

    if (!user) {
      return NextResponse.json({ success: false, error: 'User tidak ditemukan' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');

    // Get class
    const targetClass = classId 
      ? db.getClassById(classId)
      : db.getClasses().find(c => c.waliKelasId === user.id);

    if (!targetClass) {
      return NextResponse.json({ success: false, error: 'Kelas tidak ditemukan' }, { status: 404 });
    }

    // Check permission
    if (user.role !== 'ADMIN' && targetClass.waliKelasId !== user.id) {
      return NextResponse.json({ success: false, error: 'Tidak memiliki akses' }, { status: 403 });
    }

    // Get students in this class
    const students = db.getStudentsByClass(targetClass.id);
    
    // Get subjects for this jenjang
    const subjects = db.getSubjectsByJenjang(targetClass.jenjang);
    
    // Get grades for this class
    const grades = db.getGradesByClass(targetClass.id);
    const users = db.getUsers();

    // Build recap data
    const recap = students.map(student => {
      const studentGrades = grades.filter(g => g.studentId === student.id);
      
      const subjectGrades: Record<string, { 
        tugas1: number | null; 
        tugas2: number | null;
        ulangan1: number | null;
        ulangan2: number | null;
        midTest: number | null;
        uas: number | null;
        finalGrade: number | null;
      }> = {};

      for (const subject of subjects) {
        const grade = studentGrades.find(g => g.subjectId === subject.id);
        subjectGrades[subject.id] = {
          tugas1: grade?.tugas1 ?? null,
          tugas2: grade?.tugas2 ?? null,
          ulangan1: grade?.ulangan1 ?? null,
          ulangan2: grade?.ulangan2 ?? null,
          midTest: grade?.midTest ?? null,
          uas: grade?.uas ?? null,
          finalGrade: grade?.finalGrade ?? null,
        };
      }

      // Calculate average
      const finalGrades = Object.values(subjectGrades).map(g => g.finalGrade).filter(g => g !== null) as number[];
      const average = finalGrades.length > 0 
        ? Math.round((finalGrades.reduce((a, b) => a + b, 0) / finalGrades.length) * 100) / 100 
        : null;

      return {
        student,
        subjectGrades,
        average,
      };
    });

    // Sort by average (descending)
    recap.sort((a, b) => {
      if (a.average === null) return 1;
      if (b.average === null) return -1;
      return b.average - a.average;
    });

    // Add ranking
    let rank = 1;
    let prevAverage: number | null = null;
    for (let i = 0; i < recap.length; i++) {
      if (recap[i].average !== null) {
        if (prevAverage !== null && recap[i].average !== prevAverage) {
          rank = i + 1;
        }
        (recap[i] as any).rank = rank;
        prevAverage = recap[i].average;
      } else {
        (recap[i] as any).rank = null;
      }
    }

    // Calculate class statistics
    const averages = recap.map(r => r.average).filter(a => a !== null) as number[];
    const classStats = {
      highest: averages.length > 0 ? Math.max(...averages) : null,
      lowest: averages.length > 0 ? Math.min(...averages) : null,
      average: averages.length > 0 
        ? Math.round((averages.reduce((a, b) => a + b, 0) / averages.length) * 100) / 100 
        : null,
      totalStudents: students.length,
      gradedStudents: averages.length,
    };

    // Grade distribution
    const distribution = {
      excellent: 0, // >= 90
      veryGood: 0,  // 80-89
      good: 0,      // 70-79
      fair: 0,      // 60-69
      poor: 0,      // < 60
    };

    for (const avg of averages) {
      if (avg >= 90) distribution.excellent++;
      else if (avg >= 80) distribution.veryGood++;
      else if (avg >= 70) distribution.good++;
      else if (avg >= 60) distribution.fair++;
      else distribution.poor++;
    }

    return NextResponse.json({
      success: true,
      data: {
        class: {
          ...targetClass,
          waliKelas: users.find(u => u.id === targetClass.waliKelasId)?.name || null,
        },
        subjects,
        recap,
        statistics: classStats,
        distribution,
      },
    });
  } catch (error) {
    console.error('Recap error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
