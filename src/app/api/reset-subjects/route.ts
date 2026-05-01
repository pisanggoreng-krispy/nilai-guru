import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Reset all subjects data (delete all and clean up foreign key relations)
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const decoded = verify(token, JWT_SECRET) as { userId: string; role: string };
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Hanya admin yang dapat mereset data' }, { status: 403 });
    }

    // Get all subject IDs
    const { data: allSubjects } = await supabase
      .from('subjects')
      .select('id');

    if (allSubjects && allSubjects.length > 0) {
      const subjectIds = allSubjects.map(s => s.id);

      // Delete related teacher_subjects records
      const { error: tsError } = await supabase
        .from('teacher_subjects')
        .delete()
        .in('subjectId', subjectIds);

      if (tsError) console.error('Error deleting teacher_subjects:', tsError);

      // Delete related grades records
      const { error: gradesError } = await supabase
        .from('grades')
        .delete()
        .in('subjectId', subjectIds);

      if (gradesError) console.error('Error deleting grades:', gradesError);
    }

    // Delete all subjects
    const { error: subjectsError, count } = await supabase
      .from('subjects')
      .delete()
      .neq('id', ''); // Delete all

    if (subjectsError) throw subjectsError;

    return NextResponse.json({
      success: true,
      message: `Berhasil menghapus ${count || 0} mata pelajaran dan data terkait`,
      deleted: count || 0,
    });
  } catch (error) {
    console.error('Reset subjects error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
