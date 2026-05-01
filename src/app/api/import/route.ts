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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    // Permission check based on import type
    if (type === 'grades') {
      // Admin and Guru Mapel can import grades
      if (decoded.role !== 'ADMIN' && decoded.role !== 'GURU_MAPEL') {
        return NextResponse.json({ success: false, error: 'Tidak memiliki akses untuk import nilai' }, { status: 403 });
      }
    } else {
      // Only Admin can import students, teachers, subjects
      if (decoded.role !== 'ADMIN') {
        return NextResponse.json({ success: false, error: 'Hanya admin yang dapat mengimpor data' }, { status: 403 });
      }
    }

    if (!file) {
      return NextResponse.json({ success: false, error: 'File tidak ditemukan' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    if (type === 'students') {
      const mergeMode = formData.get('mergeMode') === 'true';
      const { data: classes } = await supabase.from('classes').select('*');
      const { data: existingStudents } = await supabase.from('students').select('*');
      
      let imported = 0;
      let updated = 0;
      let skipped = 0;
      let deleted = 0;
      let classesCreated = 0;
      const classCache = classes || [];
      const processedNisns = new Set<string>();

      for (const row of data as any[]) {
        const nis = row['NIS'] || row['nis'];
        const name = row['Nama'] || row['nama'] || row['Name'];
        const jenjang = row['Jenjang'] || row['jenjang'];
        const kelasName = row['Kelas'] || row['kelas'];

        if (!nis || !name || !jenjang || !kelasName) {
          skipped++;
          continue;
        }

        const nisString = String(nis).trim();
        processedNisns.add(nisString);

        const jenjangUpper = String(jenjang).toUpperCase();
        if (!['SMP', 'MA'].includes(jenjangUpper)) {
          skipped++;
          continue;
        }

        // Find class - check both exact match and with/without "Kelas " prefix
        let kelas = classCache.find(c => 
          c.level === jenjangUpper && (
            c.name === kelasName || 
            c.name === `Kelas ${kelasName}` ||
            c.name.replace('Kelas ', '') === kelasName ||
            `Kelas ${c.name}` === kelasName
          )
        );

        // If class doesn't exist, create it automatically
        if (!kelas) {
          const newClassId = generateId('class-');
          const newClassName = kelasName.startsWith('Kelas') ? kelasName : `Kelas ${kelasName}`;
          
          const { data: newClass, error: classError } = await supabase
            .from('classes')
            .insert({
              id: newClassId,
              name: newClassName,
              level: jenjangUpper,
              academicYear: '2024/2025',
            })
            .select()
            .single();

          if (classError) {
            skipped++;
            continue;
          }

          kelas = newClass;
          classCache.push(newClass);
          classesCreated++;
        }

        // Check if student exists
        const existingStudent = existingStudents?.find(s => s.nisn === nisString);

        if (existingStudent) {
          if (mergeMode) {
            // Update existing student
            const { error } = await supabase
              .from('students')
              .update({
                name: String(name).trim(),
                classId: kelas.id,
                updatedAt: new Date().toISOString(),
              })
              .eq('id', existingStudent.id);

            if (error) skipped++;
            else updated++;
          } else {
            skipped++;
          }
        } else {
          // Insert new student
          const id = generateId('std-');
          const { error } = await supabase
            .from('students')
            .insert({
              id,
              nisn: nisString,
              name: String(name).trim(),
              classId: kelas.id,
            });

          if (error) skipped++;
          else imported++;
        }
      }

      // In merge mode, delete students not in file
      if (mergeMode && existingStudents) {
        const toDelete = existingStudents.filter(s => !processedNisns.has(s.nisn));
        if (toDelete.length > 0) {
          const idsToDelete = toDelete.map(s => s.id);
          
          // Delete related grades first
          await supabase.from('grades').delete().in('studentId', idsToDelete);
          
          const { error: deleteError } = await supabase
            .from('students')
            .delete()
            .in('id', idsToDelete);
          
          if (!deleteError) deleted = toDelete.length;
        }
      }

      let message = `Import selesai: ${imported} siswa baru`;
      if (updated > 0) message += `, ${updated} diupdate`;
      if (deleted > 0) message += `, ${deleted} dihapus`;
      if (classesCreated > 0) message += `, ${classesCreated} kelas baru dibuat`;
      if (skipped > 0) message += `, ${skipped} dilewati`;

      return NextResponse.json({
        success: true,
        message,
        imported,
        updated,
        deleted,
        skipped,
        classesCreated,
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
        const tugas1 = row['Tugas 1'] ?? row['tugas1'] ?? row['Tugas1'] ?? null;
        const tugas2 = row['Tugas 2'] ?? row['tugas2'] ?? row['Tugas2'] ?? null;
        // Support various spellings including common typos like "Ulongan"
        const ulangan1 = row['Ulangan 1'] ?? row['ulangan1'] ?? row['Ulangan1'] ?? row['Ulongan 1'] ?? row['Ulongan1'] ?? null;
        const ulangan2 = row['Ulangan 2'] ?? row['ulangan2'] ?? row['Ulangan2'] ?? row['Ulongan 2'] ?? row['Ulongan2'] ?? null;
        const midTest = row['Mid Test'] ?? row['midTest'] ?? row['Mid'] ?? row['MidTest'] ?? row['UTS'] ?? null;
        const uas = row['UAS'] ?? row['uas'] ?? row['Uas'] ?? row['Final Test'] ?? null;

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
      const mergeMode = formData.get('mergeMode') === 'true';
      const bcrypt = await import('bcryptjs');
      let imported = 0;
      let updated = 0;
      let skipped = 0;
      let deleted = 0;
      
      // Store generated credentials to return to client
      const generatedCredentials: { name: string; email: string; password: string }[] = [];

      const { data: existingUsers } = await supabase.from('users').select('*');
      const processedEmails = new Set<string>();

      // Helper function to generate random password
      const generatePassword = (length: number = 8): string => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
        let password = '';
        for (let i = 0; i < length; i++) {
          password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
      };

      for (const row of data as any[]) {
        const name = row['Nama'] || row['nama'] || row['Name'];
        const email = row['Email'] || row['email'];
        const role = row['Role'] || row['role'] || 'GURU_MAPEL';
        const customPassword = row['Password'] || row['password'] || row['Kata Sandi'] || null;

        if (!name || !email) {
          skipped++;
          continue;
        }

        const emailString = String(email).toLowerCase().trim();
        processedEmails.add(emailString);

        const validRoles = ['ADMIN', 'GURU_MAPEL'];
        const roleUpper = String(role).toUpperCase().replace(' ', '_');
        const finalRole = validRoles.includes(roleUpper) ? roleUpper : 'GURU_MAPEL';

        // Determine password: custom from file or auto-generated
        const finalPassword = customPassword ? String(customPassword).trim() : generatePassword(8);
        const hashedPassword = await bcrypt.hash(finalPassword, 10);

        const existingUser = existingUsers?.find(u => u.email.toLowerCase() === emailString);

        if (existingUser) {
          if (mergeMode) {
            // Update existing user - also update password if provided
            const updateData: Record<string, any> = {
              name: String(name).trim(),
              role: finalRole as 'ADMIN' | 'GURU_MAPEL',
              updatedAt: new Date().toISOString(),
            };
            
            // Only update password if a new one is provided
            if (customPassword) {
              updateData.password = hashedPassword;
            }
            
            const { error } = await supabase
              .from('users')
              .update(updateData)
              .eq('id', existingUser.id);

            if (error) skipped++;
            else updated++;
          } else {
            skipped++;
          }
        } else {
          // Insert new user
          const id = generateId('user-');
          const { error } = await supabase
            .from('users')
            .insert({
              id,
              name: String(name).trim(),
              email: emailString,
              password: hashedPassword,
              role: finalRole as 'ADMIN' | 'GURU_MAPEL',
            });

          if (error) skipped++;
          else {
            imported++;
            // Store credential for new users (to be downloaded)
            generatedCredentials.push({
              name: String(name).trim(),
              email: emailString,
              password: finalPassword,
            });
          }
        }
      }

      // In merge mode, delete teachers not in file (only GURU_MAPEL, keep ADMIN)
      if (mergeMode && existingUsers) {
        const toDelete = existingUsers.filter(u => 
          u.role === 'GURU_MAPEL' && 
          !processedEmails.has(u.email.toLowerCase())
        );
        
        if (toDelete.length > 0) {
          const idsToDelete = toDelete.map(u => u.id);
          
          // Remove waliKelasId from classes first
          await supabase
            .from('classes')
            .update({ waliKelasId: null })
            .in('waliKelasId', idsToDelete);
          
          // Delete teacher_subjects
          await supabase
            .from('teacher_subjects')
            .delete()
            .in('userId', idsToDelete);
          
          const { error: deleteError } = await supabase
            .from('users')
            .delete()
            .in('id', idsToDelete);
          
          if (!deleteError) deleted = toDelete.length;
        }
      }

      let message = `Import selesai: ${imported} guru baru`;
      if (updated > 0) message += `, ${updated} diupdate`;
      if (deleted > 0) message += `, ${deleted} dihapus`;
      if (skipped > 0) message += `, ${skipped} dilewati`;
      if (imported > 0) message += '. Kredensial guru baru dapat diunduh.';

      return NextResponse.json({
        success: true,
        message,
        imported,
        updated,
        deleted,
        skipped,
        credentials: generatedCredentials,
      });
    }

    if (type === 'subjects') {
      // Get level and grade from form data for replace mode
      const level = formData.get('level') as string;
      const grade = formData.get('grade') as string;
      const replaceMode = formData.get('replaceMode') === 'true';

      let imported = 0;
      let deleted = 0;

      // If replace mode with specific level and grade, delete old data first
      if (replaceMode && level && grade) {
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
          const { count } = await supabase
            .from('subjects')
            .delete()
            .eq('level', level)
            .eq('grade', parseInt(grade));
          deleted = count || 0;
        }
      }

      const skipped: { name: string; reason: string }[] = [];

      for (const row of data as any[]) {
        // Trim name to remove extra spaces
        const name = String(row['Nama'] || row['nama'] || row['Name'] || row['Mata Pelajaran'] || '').trim();
        // Get level from row or use the provided level
        const rowLevel = row['Jenjang'] || row['jenjang'] || level;

        if (!name) {
          skipped.push({ name: '(kosong)', reason: 'Nama mapel kosong' });
          continue;
        }

        if (!rowLevel && !level) {
          skipped.push({ name, reason: 'Jenjang kosong' });
          continue;
        }

        const jenjangUpper = String(rowLevel || level).toUpperCase().trim();
        if (!['SMP', 'MA'].includes(jenjangUpper)) {
          skipped.push({ name, reason: `Jenjang tidak valid: ${rowLevel}` });
          continue;
        }

        // Use grade from parameter (selected card), ignore Kelas column in Excel
        const gradeNum = parseInt(grade);
        if (isNaN(gradeNum)) {
          skipped.push({ name, reason: `Kelas tidak valid: ${grade}` });
          continue;
        }

        // Validate grade based on level
        const validGrades = jenjangUpper === 'SMP' ? [7, 8, 9] : [10, 11, 12];
        if (!validGrades.includes(gradeNum)) {
          skipped.push({ name, reason: `Kelas ${gradeNum} tidak valid untuk ${jenjangUpper}. Gunakan ${validGrades.join(', ')}` });
          continue;
        }

        // Generate unique code - use more characters and random suffix to avoid duplicates
        const id = generateId('sub-');
        const code = `${name.substring(0, 3).toUpperCase()}-${jenjangUpper}-${gradeNum}-${Date.now().toString(36).slice(-4)}`;

        const { error } = await supabase
          .from('subjects')
          .insert({
            id,
            name,
            code,
            level: jenjangUpper as 'SMP' | 'MA',
            grade: gradeNum,
          });

        if (error) {
          if (error.code === '23505') {
            skipped.push({ name, reason: `Duplikat: ${error.message}` });
          } else {
            skipped.push({ name, reason: `Error (${error.code}): ${error.message}` });
          }
        } else {
          imported++;
        }
      }

      let message = `Import selesai: ${imported} mata pelajaran diimpor`;
      if (deleted > 0) {
        message += ` (${deleted} data lama diganti)`;
      }
      if (skipped.length > 0) {
        message += `, ${skipped.length} dilewati`;
      }

      return NextResponse.json({
        success: true,
        message,
        imported,
        deleted,
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
