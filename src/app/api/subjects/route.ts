import { NextRequest, NextResponse } from 'next/server';
import { supabase, generateId } from '@/lib/supabase';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Get all subjects or filter by level/grade
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jenjang = searchParams.get('jenjang');
    const grade = searchParams.get('grade');
    
    let query = supabase.from('subjects').select('*');
    
    if (jenjang) {
      query = query.eq('level', jenjang);
    }
    if (grade) {
      query = query.eq('grade', parseInt(grade));
    }

    const { data: subjects, error } = await query.order('name');
    if (error) throw error;

    // Map level to jenjang for frontend compatibility
    const mappedSubjects = subjects.map(s => ({
      ...s,
      jenjang: s.level,
    }));

    return NextResponse.json({ success: true, data: mappedSubjects });
  } catch (error) {
    console.error('Get subjects error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// Create new subject
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

    const { name, jenjang, grade } = await request.json();

    if (!name || !jenjang || !grade) {
      return NextResponse.json({ success: false, error: 'Nama, jenjang, dan kelas harus diisi' }, { status: 400 });
    }

    // Check if subject already exists for this grade
    const { data: existing } = await supabase
      .from('subjects')
      .select('id')
      .eq('name', name)
      .eq('level', jenjang)
      .eq('grade', grade)
      .single();

    if (existing) {
      return NextResponse.json({ success: false, error: 'Mata pelajaran sudah ada untuk kelas ini' }, { status: 400 });
    }

    const id = generateId('sub-');
    const code = `${name.substring(0, 3).toUpperCase()}-${jenjang}-${grade}`;

    const { data: subject, error } = await supabase
      .from('subjects')
      .insert({
        id,
        name,
        code,
        level: jenjang,
        grade: parseInt(grade),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      message: 'Mata pelajaran berhasil ditambahkan',
      data: { ...subject, jenjang: subject.level }
    });
  } catch (error) {
    console.error('Create subject error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// Update subject
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const decoded = verify(token, JWT_SECRET) as { userId: string; role: string };
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Tidak memiliki akses' }, { status: 403 });
    }

    const { id, name, jenjang, grade } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID tidak ditemukan' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (name) updateData.name = name;
    if (jenjang) updateData.level = jenjang;
    if (grade) updateData.grade = parseInt(grade);

    const { data: subject, error } = await supabase
      .from('subjects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!subject) {
      return NextResponse.json({ success: false, error: 'Mata pelajaran tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Mata pelajaran berhasil diperbarui',
      data: { ...subject, jenjang: subject.level }
    });
  } catch (error) {
    console.error('Update subject error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// Delete subject
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
    const level = searchParams.get('level');
    const grade = searchParams.get('grade');

    // If level and grade provided, delete all subjects for that grade
    if (level && grade) {
      // First, get the subject IDs for this level and grade
      const { data: subjectsToDelete } = await supabase
        .from('subjects')
        .select('id')
        .eq('level', level)
        .eq('grade', parseInt(grade));

      if (subjectsToDelete && subjectsToDelete.length > 0) {
        const subjectIds = subjectsToDelete.map(s => s.id);

        // Delete related teacher_subjects records first (foreign key constraint)
        await supabase
          .from('teacher_subjects')
          .delete()
          .in('subjectId', subjectIds);

        // Delete related grades records
        await supabase
          .from('grades')
          .delete()
          .in('subjectId', subjectIds);

        // Now delete the subjects
        const { error } = await supabase
          .from('subjects')
          .delete()
          .eq('level', level)
          .eq('grade', parseInt(grade));

        if (error) throw error;
      }

      return NextResponse.json({ success: true, message: 'Semua mata pelajaran untuk kelas ini berhasil dihapus' });
    }

    // Otherwise delete single subject
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID tidak ditemukan' }, { status: 400 });
    }

    // Delete related teacher_subjects records first (foreign key constraint)
    await supabase
      .from('teacher_subjects')
      .delete()
      .eq('subjectId', id);

    // Delete related grades records
    await supabase
      .from('grades')
      .delete()
      .eq('subjectId', id);

    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Mata pelajaran berhasil dihapus' });
  } catch (error) {
    console.error('Delete subject error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
