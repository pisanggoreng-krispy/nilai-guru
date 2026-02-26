import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/jsondb';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Get all classes or filter by jenjang
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jenjang = searchParams.get('jenjang') as 'SMP' | 'MA' | null;
    
    const classes = jenjang ? db.getClassesByJenjang(jenjang) : db.getClasses();
    const students = db.getStudents();
    const users = db.getUsers();

    const classesWithDetails = classes.map(c => ({
      ...c,
      waliKelas: users.find(u => u.id === c.waliKelasId)?.name || null,
      studentCount: students.filter(s => s.classId === c.id).length,
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
