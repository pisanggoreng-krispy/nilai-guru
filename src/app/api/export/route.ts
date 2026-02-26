import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/jsondb';
import { verify } from 'jsonwebtoken';
import * as XLSX from 'xlsx';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Export grades to Excel
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const decoded = verify(token, JWT_SECRET) as { userId: string; role: string };
    const user = db.getUserById(decoded.userId);

    if (!user) {
      return NextResponse.json({ success: false, error: 'User tidak ditemukan' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'grades'; // grades, students, teachers, classes
    const classId = searchParams.get('classId');

    const users = db.getUsers();
    const classes = db.getClasses();
    const subjects = db.getSubjects();
    const students = db.getStudents();
    const grades = db.getGrades();

    let workbook: XLSX.WorkBook;
    let filename: string;

    switch (type) {
      case 'students': {
        // Export students
        const studentData = students.map(s => {
          const kelas = classes.find(c => c.id === s.classId);
          return {
            NIS: s.nis,
            Nama: s.name,
            Jenjang: kelas?.jenjang || '',
            Kelas: kelas?.name || '',
          };
        });

        const ws = XLSX.utils.json_to_sheet(studentData);
        workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, ws, 'Siswa');
        filename = 'data_siswa.xlsx';
        break;
      }

      case 'teachers': {
        // Export teachers
        const teacherData = users.map(u => ({
          Nama: u.name,
          Email: u.email,
          Role: u.role,
        }));

        const ws = XLSX.utils.json_to_sheet(teacherData);
        workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, ws, 'Guru');
        filename = 'data_guru.xlsx';
        break;
      }

      case 'classes': {
        // Export classes
        const classData = classes.map(c => {
          const wali = users.find(u => u.id === c.waliKelasId);
          const studentCount = students.filter(s => s.classId === c.id).length;
          return {
            Kelas: c.name,
            Jenjang: c.jenjang,
            Tingkat: c.grade,
            'Wali Kelas': wali?.name || '',
            'Jumlah Siswa': studentCount,
          };
        });

        const ws = XLSX.utils.json_to_sheet(classData);
        workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, ws, 'Kelas');
        filename = 'data_kelas.xlsx';
        break;
      }

      case 'grades':
      default: {
        // Export grades
        let targetClass = classId ? db.getClassById(classId) : null;
        
        // For wali kelas, use their class
        if (!targetClass && user.role === 'WALI_KELAS') {
          targetClass = classes.find(c => c.waliKelasId === user.id) || null;
        }

        if (!targetClass) {
          return NextResponse.json({ success: false, error: 'Kelas tidak ditemukan' }, { status: 400 });
        }

        const classStudents = students.filter(s => s.classId === targetClass!.id);
        const classSubjects = subjects.filter(s => s.jenjang === targetClass!.jenjang);
        const classGrades = grades.filter(g => g.classId === targetClass!.id);

        // Build grade export data
        const gradeData = classStudents.map(student => {
          const row: Record<string, any> = {
            NIS: student.nis,
            Nama: student.name,
          };

          for (const subject of classSubjects) {
            const grade = classGrades.find(g => g.studentId === student.id && g.subjectId === subject.id);
            row[`${subject.name} - Tugas 1`] = grade?.tugas1 ?? '';
            row[`${subject.name} - Tugas 2`] = grade?.tugas2 ?? '';
            row[`${subject.name} - Ulangan 1`] = grade?.ulangan1 ?? '';
            row[`${subject.name} - Ulangan 2`] = grade?.ulangan2 ?? '';
            row[`${subject.name} - Mid Test`] = grade?.midTest ?? '';
            row[`${subject.name} - UAS`] = grade?.uas ?? '';
            row[`${subject.name} - Nilai Akhir`] = grade?.finalGrade ?? '';
          }

          // Calculate average
          const finalGrades = classSubjects.map(s => {
            const g = classGrades.find(g => g.studentId === student.id && g.subjectId === s.id);
            return g?.finalGrade;
          }).filter(g => g !== null) as number[];

          row['Rata-rata'] = finalGrades.length > 0 
            ? Math.round((finalGrades.reduce((a, b) => a + b, 0) / finalGrades.length) * 100) / 100 
            : '';

          return row;
        });

        const ws = XLSX.utils.json_to_sheet(gradeData);
        workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, ws, 'Nilai');
        filename = `nilai_${targetClass.jenjang}_${targetClass.name}.xlsx`;
        break;
      }

      case 'leger': {
        // Export leger nilai (ringkasan nilai per kelas)
        let targetClass = classId ? db.getClassById(classId) : null;
        
        // For wali kelas, use their class
        if (!targetClass && user.role === 'WALI_KELAS') {
          targetClass = classes.find(c => c.waliKelasId === user.id) || null;
        }

        if (!targetClass) {
          return NextResponse.json({ success: false, error: 'Kelas tidak ditemukan' }, { status: 400 });
        }

        const classStudents = students.filter(s => s.classId === targetClass!.id);
        const classSubjects = subjects.filter(s => s.jenjang === targetClass!.jenjang);
        const classGrades = grades.filter(g => g.classId === targetClass!.id);
        const wali = users.find(u => u.id === targetClass!.waliKelasId);

        // Calculate ranking
        const studentAverages = classStudents.map(student => {
          const finalGrades = classSubjects.map(subject => {
            const grade = classGrades.find(g => g.studentId === student.id && g.subjectId === subject.id);
            return grade?.finalGrade;
          }).filter(g => g !== null) as number[];
          
          const average = finalGrades.length > 0
            ? Math.round((finalGrades.reduce((a, b) => a + b, 0) / finalGrades.length) * 100) / 100
            : null;
          
          return { student, average };
        });

        // Sort by average and assign ranks
        const sortedStudents = [...studentAverages]
          .filter(s => s.average !== null)
          .sort((a, b) => (b.average || 0) - (a.average || 0));
        
        let rank = 1;
        sortedStudents.forEach((s, i) => {
          if (i > 0 && s.average !== sortedStudents[i-1].average) {
            rank = i + 1;
          }
          (s as any).rank = rank;
        });

        // Build leger data
        const legerData = classStudents.map(student => {
          const row: Record<string, any> = {
            'No': '',
            'NIS': student.nis,
            'Nama Siswa': student.name,
          };

          // Add each subject's final grade
          for (const subject of classSubjects) {
            const grade = classGrades.find(g => g.studentId === student.id && g.subjectId === subject.id);
            row[subject.name] = grade?.finalGrade ?? '';
          }

          // Calculate average
          const finalGrades = classSubjects.map(subject => {
            const grade = classGrades.find(g => g.studentId === student.id && g.subjectId === subject.id);
            return grade?.finalGrade;
          }).filter(g => g !== null) as number[];

          row['Rata-rata'] = finalGrades.length > 0 
            ? Math.round((finalGrades.reduce((a, b) => a + b, 0) / finalGrades.length) * 100) / 100 
            : '';

          // Find rank
          const studentRank = sortedStudents.find(s => s.student.id === student.id);
          row['Ranking'] = studentRank ? (studentRank as any).rank || '' : '';

          return row;
        });

        // Sort by ranking and add row numbers
        legerData.sort((a, b) => {
          const rankA = a['Ranking'] || 999;
          const rankB = b['Ranking'] || 999;
          return rankA - rankB;
        });
        legerData.forEach((row, i) => row['No'] = i + 1);

        // Create workbook with multiple sheets
        workbook = XLSX.utils.book_new();

        // Sheet 1: Leger Nilai
        const ws = XLSX.utils.json_to_sheet(legerData);
        XLSX.utils.book_append_sheet(workbook, ws, 'Leger Nilai');

        // Sheet 2: Info Kelas
        const infoData = [
          { 'Informasi': 'Jenjang', 'Nilai': targetClass.jenjang },
          { 'Informasi': 'Kelas', 'Nilai': targetClass.name },
          { 'Informasi': 'Wali Kelas', 'Nilai': wali?.name || '-' },
          { 'Informasi': 'Jumlah Siswa', 'Nilai': classStudents.length },
          { 'Informasi': 'Tahun Ajaran', 'Nilai': '2024/2025' },
          { 'Informasi': 'Semester', 'Nilai': '1 (Ganjil)' },
        ];
        const wsInfo = XLSX.utils.json_to_sheet(infoData);
        XLSX.utils.book_append_sheet(workbook, wsInfo, 'Info Kelas');

        // Sheet 3: Statistik
        const validAverages = studentAverages.filter(s => s.average !== null).map(s => s.average) as number[];
        const statsData = [
          { 'Statistik': 'Nilai Tertinggi', 'Nilai': validAverages.length > 0 ? Math.max(...validAverages) : '-' },
          { 'Statistik': 'Nilai Terendah', 'Nilai': validAverages.length > 0 ? Math.min(...validAverages) : '-' },
          { 'Statistik': 'Rata-rata Kelas', 'Nilai': validAverages.length > 0 ? Math.round((validAverages.reduce((a, b) => a + b, 0) / validAverages.length) * 100) / 100 : '-' },
          { 'Statistik': 'Jumlah Siswa dengan Nilai Lengkap', 'Nilai': validAverages.length },
        ];
        const wsStats = XLSX.utils.json_to_sheet(statsData);
        XLSX.utils.book_append_sheet(workbook, wsStats, 'Statistik');

        filename = `leger_${targetClass.jenjang}_${targetClass.name}.xlsx`;
        break;
      }
    }

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
