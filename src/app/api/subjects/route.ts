import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/jsondb';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Get all subjects
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jenjang = searchParams.get('jenjang');
    
    const subjects = jenjang ? db.getSubjectsByJenjang(jenjang as 'SMP' | 'MA') : db.getSubjects();

    return NextResponse.json({ success: true, data: subjects });
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

    const { name, jenjang } = await request.json();

    if (!name || !jenjang) {
      return NextResponse.json({ success: false, error: 'Nama dan jenjang harus diisi' }, { status: 400 });
    }

    // Check if subject already exists
    const existing = db.getSubjects().find(s => 
      s.name.toLowerCase() === name.toLowerCase() && s.jenjang === jenjang
    );
    if (existing) {
      return NextResponse.json({ success: false, error: 'Mata pelajaran sudah ada' }, { status: 400 });
    }

    const subject = db.createSubject({ name, jenjang });

    return NextResponse.json({ 
      success: true, 
      message: 'Mata pelajaran berhasil ditambahkan',
      data: subject
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

    const { id, name, jenjang } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID tidak ditemukan' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (jenjang) updateData.jenjang = jenjang;

    const subject = db.updateSubject(id, updateData);
    if (!subject) {
      return NextResponse.json({ success: false, error: 'Mata pelajaran tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Mata pelajaran berhasil diperbarui',
      data: subject
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

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID tidak ditemukan' }, { status: 400 });
    }

    const deleted = db.deleteSubject(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Mata pelajaran tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Mata pelajaran berhasil dihapus' });
  } catch (error) {
    console.error('Delete subject error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
