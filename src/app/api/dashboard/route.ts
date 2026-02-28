import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
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
    
    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    // Get all data
    const { data: classes } = await supabase.from('classes').select('*');
    const { data: subjects } = await supabase.from('subjects').select('*');
    const { data: students } = await supabase.from('students').select('*');
    const { data: grades } = await supabase.from('grades').select('*');
    const { data: users } = await supabase.from('users').select('*');
    const { data: teacherSubjects } = await supabase.from('teacher_subjects').select('*');

    // Get classes where user is wali kelas
    const waliKelasClasses = classes?.filter(c => c.waliKelasId === user.id) || [];

    // Get subjects taught by this teacher
    const taughtSubjectIds = teacherSubjects?.filter(ts => ts.userId === user.id).map(ts => ts.subjectId) || [];
    const taughtSubjects = subjects?.filter(s => taughtSubjectIds.includes(s.id)) || [];

    // Calculate statistics
    const totalStudents = students?.length || 0;
    const totalClasses = classes?.length || 0;
    const totalSubjects = subjects?.length || 0;
    
    // Count graded entries
    const gradedCount = grades?.filter(g => g.finalGrade !== null).length || 0;
    const totalGradeEntries = totalStudents * totalSubjects;
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
          jenjang: c.level,
          waliKelas: users?.find(u => u.id === c.waliKelasId)?.name || null,
          studentCount: students?.filter(s => s.classId === c.id).length || 0,
        })),
        taughtSubjects: taughtSubjects.map(s => ({
          ...s,
          jenjang: s.level,
        })),
        isWaliKelas: waliKelasClasses.length > 0,
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
