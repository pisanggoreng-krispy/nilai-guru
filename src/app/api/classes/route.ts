import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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
