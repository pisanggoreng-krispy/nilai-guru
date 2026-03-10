import { NextRequest, NextResponse } from 'next/server';
import { supabase, generateId } from '@/lib/supabase';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Helper to calculate final grade
function calculateFinalGrade(
  tugas1: number | null,
  tugas2: number | null,
  ulangan1: number | null,
  ulangan2: number | null,
  midTest: number | null,
  finalTest: number | null
): number | null {
  const values = [tugas1, tugas2, ulangan1, ulangan2, midTest, finalTest];
  const weights = [0.05, 0.05, 0.10, 0.10, 0.30, 0.40];
  
  let totalWeight = 0;
  let weightedSum = 0;

  for (let i = 0; i < values.length; i++) {
    if (values[i] !== null && values[i] !== undefined) {
      weightedSum += values[i] * weights[i];
      totalWeight += weights[i];
    }
  }

  if (totalWeight === 0) return null;
  
  // Normalize to 100%
  return Math.round((weightedSum / totalWeight) * 100) / 100;
}

// Get grades with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const subjectId = searchParams.get('subjectId');
    const studentId = searchParams.get('studentId');
    
    let query = supabase.from('grades').select('*');

    if (studentId) {
      query = query.eq('studentId', studentId);
    }
    if (subjectId) {
      query = query.eq('subjectId', subjectId);
    }

    const { data: grades, error } = await query;
    if (error) throw error;

    // Filter by classId if needed (requires join)
    let filteredGrades = grades;
    if (classId) {
      const { data: classStudents } = await supabase
        .from('students')
        .select('id')
        .eq('classId', classId);
      
      const studentIds = classStudents?.map(s => s.id) || [];
      filteredGrades = grades.filter(g => studentIds.includes(g.studentId));
    }

    // Enrich with related data
    const { data: students } = await supabase.from('students').select('*');
    const { data: subjects } = await supabase.from('subjects').select('*');
    const { data: classes } = await supabase.from('classes').select('*');

    const enrichedGrades = filteredGrades.map(g => ({
      ...g,
      uas: g.finalTest, // Map for frontend compatibility
      tahunAjaran: g.academicYear,
      student: students?.find(s => s.id === g.studentId),
      subject: subjects?.find(s => s.id === g.subjectId),
      class: classes?.find(c => c.id === students?.find(s => s.id === g.studentId)?.classId),
    }));

    return NextResponse.json({ success: true, data: enrichedGrades });
  } catch (error) {
    console.error('Get grades error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// Save or update grades
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const decoded = verify(token, JWT_SECRET) as { userId: string };
    const body = await request.json();
    const { studentId, subjectId, classId, semester, tahunAjaran, tugas1, tugas2, ulangan1, ulangan2, midTest, uas } = body;

    const finalGrade = calculateFinalGrade(tugas1, tugas2, ulangan1, ulangan2, midTest, uas);

    // Check if grade exists
    const { data: existing } = await supabase
      .from('grades')
      .select('id')
      .eq('studentId', studentId)
      .eq('subjectId', subjectId)
      .eq('academicYear', tahunAjaran || '2024/2025')
      .eq('semester', semester || 1)
      .single();

    let result;
    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('grades')
        .update({
          tugas1: tugas1 ?? null,
          tugas2: tugas2 ?? null,
          ulangan1: ulangan1 ?? null,
          ulangan2: ulangan2 ?? null,
          midTest: midTest ?? null,
          finalTest: uas ?? null,
          finalGrade,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();
      
      result = data;
      if (error) throw error;
    } else {
      // Create new
      const id = generateId('grade-');
      const { data, error } = await supabase
        .from('grades')
        .insert({
          id,
          studentId,
          subjectId,
          tugas1: tugas1 ?? null,
          tugas2: tugas2 ?? null,
          ulangan1: ulangan1 ?? null,
          ulangan2: ulangan2 ?? null,
          midTest: midTest ?? null,
          finalTest: uas ?? null,
          finalGrade,
          academicYear: tahunAjaran || '2024/2025',
          semester: semester || 1,
        })
        .select()
        .single();
      
      result = data;
      if (error) throw error;
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Save grade error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// Bulk save grades
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const decoded = verify(token, JWT_SECRET) as { userId: string };
    const body = await request.json();
    const { grades } = body;

    if (!Array.isArray(grades)) {
      return NextResponse.json({ success: false, error: 'Format data tidak valid' }, { status: 400 });
    }

    const savedGrades = [];
    for (const gradeData of grades) {
      const { studentId, subjectId, classId, semester, tahunAjaran, tugas1, tugas2, ulangan1, ulangan2, midTest, uas } = gradeData;
      
      const finalGrade = calculateFinalGrade(tugas1, tugas2, ulangan1, ulangan2, midTest, uas);

      // Check if grade exists
      const { data: existing } = await supabase
        .from('grades')
        .select('id')
        .eq('studentId', studentId)
        .eq('subjectId', subjectId)
        .eq('academicYear', tahunAjaran || '2024/2025')
        .eq('semester', semester || 1)
        .single();

      let result;
      if (existing) {
        const { data, error } = await supabase
          .from('grades')
          .update({
            tugas1: tugas1 ?? null,
            tugas2: tugas2 ?? null,
            ulangan1: ulangan1 ?? null,
            ulangan2: ulangan2 ?? null,
            midTest: midTest ?? null,
            finalTest: uas ?? null,
            finalGrade,
            updatedAt: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();
        
        result = data;
        if (error) throw error;
      } else {
        const id = generateId('grade-');
        const { data, error } = await supabase
          .from('grades')
          .insert({
            id,
            studentId,
            subjectId,
            tugas1: tugas1 ?? null,
            tugas2: tugas2 ?? null,
            ulangan1: ulangan1 ?? null,
            ulangan2: ulangan2 ?? null,
            midTest: midTest ?? null,
            finalTest: uas ?? null,
            finalGrade,
            academicYear: tahunAjaran || '2024/2025',
            semester: semester || 1,
          })
          .select()
          .single();
        
        result = data;
        if (error) throw error;
      }
      savedGrades.push(result);
    }

    return NextResponse.json({ 
      success: true, 
      message: `${savedGrades.length} nilai berhasil disimpan`,
      data: savedGrades 
    });
  } catch (error) {
    console.error('Bulk save grades error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
