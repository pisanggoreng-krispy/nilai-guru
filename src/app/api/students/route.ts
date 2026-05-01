import { NextRequest, NextResponse } from 'next/server';
import { supabase, generateId } from '@/lib/supabase';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Get all students or filter by class
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    
    let query = supabase.from('students').select('*');
    
    if (classId) {
      query = query.eq('classId', classId);
    }

    const { data: students, error } = await query.order('name');
    if (error) throw error;

    // Get classes for mapping
    const { data: classes } = await supabase.from('classes').select('*');

    const studentsWithClass = students.map(s => {
      const classData = classes?.find(c => c.id === s.classId);
      return {
        ...s,
        nis: s.nisn, // Map nisn to nis for frontend compatibility
        class: classData ? {
          ...classData,
          jenjang: classData.level,
        } : undefined,
      };
    });

    return NextResponse.json({ success: true, data: studentsWithClass });
  } catch (error) {
    console.error('Get students error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// Import students from Excel
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const decoded = verify(token, JWT_SECRET) as { userId: string; role: string };
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Tidak memiliki akses' }, { status: 403 });
    }

    const body = await request.json();
    const { students } = body;

    if (!Array.isArray(students)) {
      return NextResponse.json({ success: false, error: 'Format data tidak valid' }, { status: 400 });
    }

    // Get classes for mapping
    const { data: classes } = await supabase.from('classes').select('*');
    const { data: existingStudents } = await supabase.from('students').select('nisn');

    let count = 0;
    for (const student of students) {
      const { nis, name, classId, gender } = student;
      
      // Check if NISN already exists
      if (existingStudents?.some(s => s.nisn === String(nis))) {
        continue;
      }

      const id = generateId('std-');
      const { error } = await supabase
        .from('students')
        .insert({
          id,
          name,
          nisn: String(nis),
          classId,
          gender: gender || null,
        });

      if (!error) count++;
    }

    return NextResponse.json({
      success: true,
      message: `${count} siswa berhasil diimpor`,
      count
    });
  } catch (error) {
    console.error('Import students error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// Delete a student
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const decoded = verify(token, JWT_SECRET) as { userId: string; role: string };
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Tidak memiliki akses' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID siswa diperlukan' }, { status: 400 });
    }

    // Check if student exists
    const { data: student, error: findError } = await supabase
      .from('students')
      .select('id, name')
      .eq('id', id)
      .single();

    if (findError || !student) {
      return NextResponse.json({ success: false, error: 'Siswa tidak ditemukan' }, { status: 404 });
    }

    // Delete related grades first (manual cascade for Supabase)
    const { error: gradesDeleteError } = await supabase
      .from('grades')
      .delete()
      .eq('studentId', id);

    if (gradesDeleteError) {
      console.error('Error deleting grades:', gradesDeleteError);
      return NextResponse.json(
        { success: false, error: 'Gagal menghapus nilai siswa' },
        { status: 500 }
      );
    }

    // Delete the student
    const { error: deleteError } = await supabase
      .from('students')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting student:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Gagal menghapus siswa' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Siswa ${student.name} berhasil dihapus`
    });
  } catch (error) {
    console.error('Delete student error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
