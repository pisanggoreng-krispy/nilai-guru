import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/jsondb';
import { verify } from 'jsonwebtoken';
import * as XLSX from 'xlsx';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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
    const type = formData.get('type') as string; // students, grades

    if (!file) {
      return NextResponse.json({ success: false, error: 'File tidak ditemukan' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    if (type === 'students') {
      // Import students
      const classes = db.getClasses();
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

        // Find class
        const kelas = classes.find(c => c.jenjang === jenjang && c.name === kelasName);
        if (!kelas) {
          skipped++;
          continue;
        }

        // Check if NIS already exists
        const existing = db.getStudents().find(s => s.nis === nis);
        if (existing) {
          skipped++;
          continue;
        }

        db.createStudent({
          nis: String(nis),
          name: String(name),
          classId: kelas.id,
        });
        imported++;
      }

      return NextResponse.json({
        success: true,
        message: `Import selesai: ${imported} siswa diimpor, ${skipped} dilewati`,
        imported,
        skipped,
      });
    }

    if (type === 'grades') {
      // Import grades - more complex, needs class and subject mapping
      const classId = formData.get('classId') as string;
      const subjectId = formData.get('subjectId') as string;

      if (!classId || !subjectId) {
        return NextResponse.json({ 
          success: false, 
          error: 'ClassId dan SubjectId diperlukan untuk import nilai' 
        }, { status: 400 });
      }

      const students = db.getStudentsByClass(classId);
      let imported = 0;
      let skipped = 0;

      for (const row of data as any[]) {
        const nis = row['NIS'] || row['nis'];
        const name = row['Nama'] || row['nama'] || row['Name'];
        const tugas1 = row['Tugas 1'] ?? row['tugas1'] ?? null;
        const tugas2 = row['Tugas 2'] ?? row['tugas2'] ?? null;
        const ulangan1 = row['Ulangan 1'] ?? row['ulangan1'] ?? null;
        const ulangan2 = row['Ulangan 2'] ?? row['ulangan2'] ?? null;
        const midTest = row['Mid Test'] ?? row['midTest'] ?? row['Mid'] ?? null;
        const uas = row['UAS'] ?? row['uas'] ?? null;

        // Find student by NIS
        const student = students.find(s => s.nis === nis);
        if (!student) {
          skipped++;
          continue;
        }

        const finalGrade = db.calculateFinalGrade(
          tugas1 ? Number(tugas1) : null,
          tugas2 ? Number(tugas2) : null,
          ulangan1 ? Number(ulangan1) : null,
          ulangan2 ? Number(ulangan2) : null,
          midTest ? Number(midTest) : null,
          uas ? Number(uas) : null
        );

        db.upsertGrade(student.id, subjectId, {
          teacherId: decoded.userId,
          classId,
          semester: '1',
          tahunAjaran: '2024/2025',
          tugas1: tugas1 ? Number(tugas1) : null,
          tugas2: tugas2 ? Number(tugas2) : null,
          ulangan1: ulangan1 ? Number(ulangan1) : null,
          ulangan2: ulangan2 ? Number(ulangan2) : null,
          midTest: midTest ? Number(midTest) : null,
          uas: uas ? Number(uas) : null,
          finalGrade,
        });
        imported++;
      }

      return NextResponse.json({
        success: true,
        message: `Import selesai: ${imported} nilai diimpor, ${skipped} dilewati`,
        imported,
        skipped,
      });
    }

    if (type === 'teachers') {
      // Import teachers/guru
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 10);
      let imported = 0;
      let skipped = 0;

      for (const row of data as any[]) {
        const name = row['Nama'] || row['nama'] || row['Name'];
        const email = row['Email'] || row['email'];
        const role = row['Role'] || row['role'] || 'GURU_MAPEL';

        if (!name || !email) {
          skipped++;
          continue;
        }

        // Validate role
        const validRoles = ['ADMIN', 'GURU_MAPEL', 'WALI_KELAS'];
        const roleUpper = String(role).toUpperCase().replace(' ', '_');
        const finalRole = validRoles.includes(roleUpper) ? roleUpper : 'GURU_MAPEL';

        // Check if email already exists
        const existing = db.getUserByEmail(String(email));
        if (existing) {
          skipped++;
          continue;
        }

        db.createUser({
          name: String(name),
          email: String(email),
          password: hashedPassword,
          role: finalRole as 'ADMIN' | 'GURU_MAPEL' | 'WALI_KELAS',
        });
        imported++;
      }

      return NextResponse.json({
        success: true,
        message: `Import selesai: ${imported} guru diimpor, ${skipped} dilewati. Password default: password123`,
        imported,
        skipped,
      });
    }

    if (type === 'subjects') {
      // Import mata pelajaran
      let imported = 0;
      let skipped = 0;

      for (const row of data as any[]) {
        const name = row['Nama'] || row['nama'] || row['Name'] || row['Mata Pelajaran'];
        const jenjang = row['Jenjang'] || row['jenjang'];

        if (!name || !jenjang) {
          skipped++;
          continue;
        }

        // Validate jenjang
        const jenjangUpper = String(jenjang).toUpperCase();
        if (!['SMP', 'MA'].includes(jenjangUpper)) {
          skipped++;
          continue;
        }

        // Check if subject already exists
        const existing = db.getSubjects().find(s => 
          s.name.toLowerCase() === String(name).toLowerCase() && s.jenjang === jenjangUpper
        );
        if (existing) {
          skipped++;
          continue;
        }

        db.createSubject({
          name: String(name),
          jenjang: jenjangUpper as 'SMP' | 'MA',
        });
        imported++;
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
