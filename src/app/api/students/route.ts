import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/jsondb';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Get all students or filter by class
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    
    const students = classId ? db.getStudentsByClass(classId) : db.getStudents();
    const classes = db.getClasses();

    const studentsWithClass = students.map(s => ({
      ...s,
      class: classes.find(c => c.id === s.classId),
    }));

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

    const count = db.importStudents(students);

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
