import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
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
    
    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (!user) {
      return NextResponse.json({ success: false, error: 'User tidak ditemukan' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');

    // Get all classes
    const { data: classes } = await supabase.from('classes').select('*');

    // Get class
    let targetClass = classId 
      ? classes?.find(c => c.id === classId)
      : classes?.find(c => c.waliKelasId === user.id);

    if (!targetClass) {
      return NextResponse.json({ success: false, error: 'Kelas tidak ditemukan' }, { status: 404 });
    }

    // Check permission
    if (user.role !== 'ADMIN' && targetClass.waliKelasId !== user.id) {
      return NextResponse.json({ success: false, error: 'Tidak memiliki akses' }, { status: 403 });
    }

    // Get students in this class
    const { data: students } = await supabase
      .from('students')
      .select('*')
      .eq('classId', targetClass.id);
    
    // Get subjects for this level
    const { data: subjects } = await supabase
      .from('subjects')
      .select('*')
      .eq('level', targetClass.level);
    
    // Get all grades
    const { data: grades } = await supabase.from('grades').select('*');
    const { data: users } = await supabase.from('users').select('*');

    // Filter grades for students in this class
    const studentIds = students?.map(s => s.id) || [];
    const classGrades = grades?.filter(g => studentIds.includes(g.studentId)) || [];

    // Build recap data
    const recap = (students || []).map(student => {
      const studentGrades = classGrades.filter(g => g.studentId === student.id);
      
      const subjectGrades: Record<string, { 
        tugas1: number | null; 
        tugas2: number | null;
        ulangan1: number | null;
        ulangan2: number | null;
        midTest: number | null;
        uas: number | null;
        finalGrade: number | null;
      }> = {};

      for (const subject of (subjects || [])) {
        const grade = studentGrades.find(g => g.subjectId === subject.id);
        subjectGrades[subject.id] = {
          tugas1: grade?.tugas1 ?? null,
          tugas2: grade?.tugas2 ?? null,
          ulangan1: grade?.ulangan1 ?? null,
          ulangan2: grade?.ulangan2 ?? null,
          midTest: grade?.midTest ?? null,
          uas: grade?.finalTest ?? null,
          finalGrade: grade?.finalGrade ?? null,
        };
      }

      // Calculate average
      const finalGrades = Object.values(subjectGrades).map(g => g.finalGrade).filter(g => g !== null) as number[];
      const average = finalGrades.length > 0 
        ? Math.round((finalGrades.reduce((a, b) => a + b, 0) / finalGrades.length) * 100) / 100 
        : null;

      return {
        student: { ...student, nis: student.nisn },
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
      totalStudents: students?.length || 0,
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
          jenjang: targetClass.level,
          waliKelas: users?.find(u => u.id === targetClass.waliKelasId)?.name || null,
        },
        subjects: subjects?.map(s => ({ ...s, jenjang: s.level })) || [],
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
