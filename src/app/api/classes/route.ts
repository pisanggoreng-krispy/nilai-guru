import { NextRequest, NextResponse } from 'next/server';
import { supabase, generateId } from '@/lib/supabase';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Get all classes or filter by level
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jenjang = searchParams.get('jenjang') as 'SMP' | 'MA' | null;
    
    let query = supabase.from('classes').select('*');
    
    if (jenjang) {
      query = query.eq('level', jenjang);
    }

    const { data: classes, error } = await query.order('name');
    if (error) throw error;

    // Get students count for each class
    const { data: students } = await supabase.from('students').select('classId');
    const { data: users } = await supabase.from('users').select('id, name');

    const classesWithDetails = classes.map(c => ({
      ...c,
      jenjang: c.level,
      waliKelas: users?.find(u => u.id === c.waliKelasId)?.name || null,
      studentCount: students?.filter(s => s.classId === c.id).length || 0,
    }));

    return NextResponse.json({ success: true, data: classesWithDetails });
  } catch (error) {
    console.error('Get classes error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// Create new class
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
    const { name, level, academicYear, waliKelasId } = body;

    if (!name || !level) {
      return NextResponse.json({ success: false, error: 'Nama dan jenjang harus diisi' }, { status: 400 });
    }

    const id = generateId('class-');

    const { data: kelas, error } = await supabase
      .from('classes')
      .insert({
        id,
        name,
        level,
        academicYear: academicYear || '2024/2025',
        waliKelasId: waliKelasId || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      message: 'Kelas berhasil ditambahkan',
      data: { ...kelas, jenjang: kelas.level }
    });
  } catch (error) {
    console.error('Create class error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// Update class
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

    const body = await request.json();
    const { id, name, level, waliKelasId } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID tidak ditemukan' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (name) updateData.name = name;
    if (level) updateData.level = level;
    updateData.waliKelasId = waliKelasId || null;

    const { data: kelas, error } = await supabase
      .from('classes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!kelas) {
      return NextResponse.json({ success: false, error: 'Kelas tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Data kelas berhasil diperbarui',
      data: { ...kelas, jenjang: kelas.level }
    });
  } catch (error) {
    console.error('Update class error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// Delete class
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
      return NextResponse.json({ success: false, error: 'ID tidak ditemukan' }, { status: 400 });
    }

    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Kelas berhasil dihapus' });
  } catch (error) {
    console.error('Delete class error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
