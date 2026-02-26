import { NextRequest, NextResponse } from 'next/server';
import { supabase, generateId } from '@/lib/supabase';
import { verify } from 'jsonwebtoken';
import * as XLSX from 'xlsx';

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
  
  return Math.round((weightedSum / totalWeight) * 100) / 100;
}

// Import data from Excel
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const decoded = verify(token, JWT_SECRET) as { userId: string; role: string };
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Hanya admin yang dapat mengimpor data' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json({ success: false, error: 'File tidak ditemukan' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    if (type === 'students') {
      const { data: classes } = await supabase.from('classes').select('*');
      const { data: existingStudents } = await supabase.from('students').select('nisn');
      
      let imported = 0;
      let skipped = 0;

      for (const row of data as any[]) {
        const nis = row['NIS'] || row['nis'];
        const name = row['Nama'] || row['nama'] || row['Name'];
        const jenjang = row['Jenjang'] || row['jenjang'];
        const kelasName = row['Kelas'] || row['kelas'];

        if (!nis || !name || !jenjang || !kelasName) {
          skipped++;
          continue;
        }

        const kelas = classes?.find(c => c.level === jenjang && c.name === kelasName);
        if (!kelas) {
          skipped++;
          continue;
        }

        if (existingStudents?.some(s => s.nisn === String(nis))) {
          skipped++;
          continue;
        }

        const id = generateId('std-');
        const { error } = await supabase
          .from('students')
          .insert({
            id,
            nisn: String(nis),
            name: String(name),
            classId: kelas.id,
          });

        if (error) {
          skipped++;
        } else {
          imported++;
        }
      }

      return NextResponse.json({
        success: true,
        message: `Import selesai: ${imported} siswa diimpor, ${skipped} dilewati`,
        imported,
        skipped,
      });
    }

    if (type === 'grades') {
      const classId = formData.get('classId') as string;
      const subjectId = formData.get('subjectId') as string;

      if (!classId || !subjectId) {
        return NextResponse.json({ 
          success: false, 
          error: 'ClassId dan SubjectId diperlukan untuk import nilai' 
        }, { status: 400 });
      }

      const { data: students } = await supabase
        .from('students')
        .select('*')
        .eq('classId', classId);

      let imported = 0;
      let skipped = 0;

      for (const row of data as any[]) {
        const nis = row['NIS'] || row['nis'];
        const tugas1 = row['Tugas 1'] ?? row['tugas1'] ?? null;
        const tugas2 = row['Tugas 2'] ?? row['tugas2'] ?? null;
        const ulangan1 = row['Ulangan 1'] ?? row['ulangan1'] ?? null;
        const ulangan2 = row['Ulongan 2'] ?? row['ulangan2'] ?? null;
        const midTest = row['Mid Test'] ?? row['midTest'] ?? row['Mid'] ?? null;
        const uas = row['UAS'] ?? row['uas'] ?? null;

        const student = students?.find(s => s.nisn === String(nis));
        if (!student) {
          skipped++;
          continue;
        }

        const finalGrade = calculateFinalGrade(
          tugas1 ? Number(tugas1) : null,
          tugas2 ? Number(tugas2) : null,
          ulangan1 ? Number(ulangan1) : null,
          ulangan2 ? Number(ulangan2) : null,
          midTest ? Number(midTest) : null,
          uas ? Number(uas) : null
        );

        // Check if grade exists
        const { data: existing } = await supabase
          .from('grades')
          .select('id')
          .eq('studentId', student.id)
          .eq('subjectId', subjectId)
          .eq('academicYear', '2024/2025')
          .eq('semester', 1)
          .single();

        if (existing) {
          const { error } = await supabase
            .from('grades')
            .update({
              tugas1: tugas1 ? Number(tugas1) : null,
              tugas2: tugas2 ? Number(tugas2) : null,
              ulangan1: ulangan1 ? Number(ulangan1) : null,
              ulangan2: ulangan2 ? Number(ulangan2) : null,
              midTest: midTest ? Number(midTest) : null,
              finalTest: uas ? Number(uas) : null,
              finalGrade,
              updatedAt: new Date().toISOString(),
            })
            .eq('id', existing.id);

          if (error) skipped++;
          else imported++;
        } else {
          const id = generateId('grade-');
          const { error } = await supabase
            .from('grades')
            .insert({
              id,
              studentId: student.id,
              subjectId,
              tugas1: tugas1 ? Number(tugas1) : null,
              tugas2: tugas2 ? Number(tugas2) : null,
              ulangan1: ulangan1 ? Number(ulangan1) : null,
              ulangan2: ulangan2 ? Number(ulangan2) : null,
              midTest: midTest ? Number(midTest) : null,
              finalTest: uas ? Number(uas) : null,
              finalGrade,
              academicYear: '2024/2025',
              semester: 1,
            });

          if (error) skipped++;
          else imported++;
        }
      }

      return NextResponse.json({
        success: true,
        message: `Import selesai: ${imported} nilai diimpor, ${skipped} dilewati`,
        imported,
        skipped,
      });
    }

    if (type === 'teachers') {
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 10);
      let imported = 0;
      let skipped = 0;

      const { data: existingUsers } = await supabase.from('users').select('email');

      for (const row of data as any[]) {
        const name = row['Nama'] || row['nama'] || row['Name'];
        const email = row['Email'] || row['email'];
        const role = row['Role'] || row['role'] || 'GURU_MAPEL';

        if (!name || !email) {
          skipped++;
          continue;
        }

        const validRoles = ['ADMIN', 'GURU_MAPEL', 'WALI_KELAS'];
        const roleUpper = String(role).toUpperCase().replace(' ', '_');
        const finalRole = validRoles.includes(roleUpper) ? roleUpper : 'GURU_MAPEL';

        if (existingUsers?.some(u => u.email === String(email))) {
          skipped++;
          continue;
        }

        const id = generateId('user-');
        const { error } = await supabase
          .from('users')
          .insert({
            id,
            name: String(name),
            email: String(email),
            password: hashedPassword,
            role: finalRole as 'ADMIN' | 'GURU_MAPEL' | 'WALI_KELAS',
          });

        if (error) skipped++;
        else imported++;
      }

      return NextResponse.json({
        success: true,
        message: `Import selesai: ${imported} guru diimpor, ${skipped} dilewati. Password default: password123`,
        imported,
        skipped,
      });
    }

    if (type === 'subjects') {
      let imported = 0;
      let skipped = 0;

      const { data: existingSubjects } = await supabase.from('subjects').select('name, level');

      for (const row of data as any[]) {
        const name = row['Nama'] || row['nama'] || row['Name'] || row['Mata Pelajaran'];
        const jenjang = row['Jenjang'] || row['jenjang'];

        if (!name || !jenjang) {
          skipped++;
          continue;
        }

        const jenjangUpper = String(jenjang).toUpperCase();
        if (!['SMP', 'MA'].includes(jenjangUpper)) {
          skipped++;
          continue;
        }

        if (existingSubjects?.some(s => 
          s.name.toLowerCase() === String(name).toLowerCase() && s.level === jenjangUpper
        )) {
          skipped++;
          continue;
        }

        const id = generateId('sub-');
        const code = `${String(name).substring(0, 3).toUpperCase()}-${jenjangUpper}`;

        const { error } = await supabase
          .from('subjects')
          .insert({
            id,
            name: String(name),
            code,
            level: jenjangUpper as 'SMP' | 'MA',
          });

        if (error) skipped++;
        else imported++;
      }

      return NextResponse.json({
        success: true,
        message: `Import selesai: ${imported} mata pelajaran diimpor, ${skipped} dilewati`,
        imported,
        skipped,
      });
    }

    return NextResponse.json({ success: false, error: 'Tipe import tidak valid. Gunakan: students, teachers, subjects, grades' }, { status: 400 });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
