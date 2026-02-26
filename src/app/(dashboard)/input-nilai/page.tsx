'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  GraduationCap, 
  BookOpen, 
  Users, 
  Save, 
  Loader2,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Class {
  id: string;
  name: string;
  jenjang: string;
  grade: number;
  studentCount: number;
}

interface Subject {
  id: string;
  name: string;
  jenjang: string;
}

interface Student {
  id: string;
  nis: string;
  name: string;
  classId: string;
}

interface GradeData {
  studentId: string;
  tugas1: number | null;
  tugas2: number | null;
  ulangan1: number | null;
  ulangan2: number | null;
  midTest: number | null;
  uas: number | null;
  finalGrade: number | null;
}

export default function InputNilaiPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Record<string, GradeData>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [selectedJenjang, setSelectedJenjang] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchStudents();
    }
  }, [selectedClassId]);

  useEffect(() => {
    if (selectedClassId && selectedSubjectId) {
      fetchExistingGrades();
    }
  }, [selectedClassId, selectedSubjectId]);

  const fetchData = async () => {
    try {
      const [classesRes, subjectsRes] = await Promise.all([
        fetch('/api/classes'),
        fetch('/api/subjects'),
      ]);
      
      const classesData = await classesRes.json();
      const subjectsData = await subjectsRes.json();
      
      if (classesData.success) setClasses(classesData.data);
      if (subjectsData.success) setSubjects(subjectsData.data);
    } catch (error) {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch(`/api/students?classId=${selectedClassId}`);
      const data = await res.json();
      if (data.success) {
        setStudents(data.data);
        // Initialize grades
        const initialGrades: Record<string, GradeData> = {};
        data.data.forEach((s: Student) => {
          initialGrades[s.id] = {
            studentId: s.id,
            tugas1: null,
            tugas2: null,
            ulangan1: null,
            ulangan2: null,
            midTest: null,
            uas: null,
            finalGrade: null,
          };
        });
        setGrades(initialGrades);
      }
    } catch (error) {
      toast.error('Gagal memuat data siswa');
    }
  };

  const fetchExistingGrades = async () => {
    try {
      const res = await fetch(`/api/grades?classId=${selectedClassId}&subjectId=${selectedSubjectId}`);
      const data = await res.json();
      if (data.success && data.data) {
        const updatedGrades = { ...grades };
        data.data.forEach((g: any) => {
          if (updatedGrades[g.studentId]) {
            updatedGrades[g.studentId] = {
              studentId: g.studentId,
              tugas1: g.tugas1,
              tugas2: g.tugas2,
              ulangan1: g.ulangan1,
              ulangan2: g.ulangan2,
              midTest: g.midTest,
              uas: g.uas,
              finalGrade: g.finalGrade,
            };
          }
        });
        setGrades(updatedGrades);
      }
    } catch (error) {
      console.error('Error fetching grades:', error);
    }
  };

  const filteredClasses = classes.filter(c => !selectedJenjang || c.jenjang === selectedJenjang);
  const filteredSubjects = subjects.filter(s => !selectedJenjang || s.jenjang === selectedJenjang);
  const selectedClass = classes.find(c => c.id === selectedClassId);
  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

  const calculateFinalGrade = (grade: GradeData): number | null => {
    const { tugas1, tugas2, ulangan1, ulangan2, midTest, uas } = grade;
    if (tugas1 === null || tugas2 === null || ulangan1 === null || 
        ulangan2 === null || midTest === null || uas === null) {
      return null;
    }
    return Math.round(
      (tugas1 * 0.05 + tugas2 * 0.05 + ulangan1 * 0.10 + 
       ulangan2 * 0.10 + midTest * 0.30 + uas * 0.40) * 100
    ) / 100;
  };

  const handleGradeChange = (studentId: string, field: keyof GradeData, value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    if (numValue !== null && (numValue < 0 || numValue > 100)) return;
    
    setGrades(prev => {
      const updated = {
        ...prev[studentId],
        [field]: numValue,
      };
      updated.finalGrade = calculateFinalGrade(updated);
      return { ...prev, [studentId]: updated };
    });
  };

  const handleSave = async () => {
    if (!selectedClassId || !selectedSubjectId) {
      toast.error('Pilih kelas dan mata pelajaran terlebih dahulu');
      return;
    }

    setSaving(true);
    try {
      const gradesArray = Object.values(grades).map(g => ({
        ...g,
        classId: selectedClassId,
        subjectId: selectedSubjectId,
      }));

      const res = await fetch('/api/grades', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grades: gradesArray }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.error || 'Gagal menyimpan nilai');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    if (!selectedClassId) {
      toast.error('Pilih kelas terlebih dahulu');
      return;
    }
    
    window.open(`/api/export?type=grades&classId=${selectedClassId}`, '_blank');
  };

  const getGradeColor = (grade: number | null) => {
    if (grade === null) return 'text-gray-400';
    if (grade >= 90) return 'text-emerald-600';
    if (grade >= 80) return 'text-green-600';
    if (grade >= 70) return 'text-blue-600';
    if (grade >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Input Nilai</h1>
        <p className="text-gray-500 mt-1">Masukkan nilai siswa untuk mata pelajaran</p>
      </div>

      {/* Selection Card */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Pilih Data</CardTitle>
          <CardDescription>Pilih jenjang, kelas, dan mata pelajaran</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Jenjang */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Jenjang</label>
              <Select value={selectedJenjang} onValueChange={(v) => {
                setSelectedJenjang(v);
                setSelectedClassId('');
                setSelectedSubjectId('');
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenjang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SMP">SMP</SelectItem>
                  <SelectItem value="MA">MA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Kelas */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Kelas</label>
              <Select 
                value={selectedClassId} 
                onValueChange={setSelectedClassId}
                disabled={!selectedJenjang}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedJenjang ? "Pilih kelas" : "Pilih jenjang dulu"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredClasses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.jenjang} - Kelas {c.name} ({c.studentCount} siswa)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mata Pelajaran */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Mata Pelajaran</label>
              <Select 
                value={selectedSubjectId} 
                onValueChange={setSelectedSubjectId}
                disabled={!selectedClassId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedClassId ? "Pilih mata pelajaran" : "Pilih kelas dulu"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredSubjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bobot Info */}
      {selectedClassId && selectedSubjectId && (
        <Card className="border-0 shadow-sm bg-teal-50">
          <CardContent className="py-3">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="font-medium text-teal-800">Bobot Nilai:</span>
              <Badge variant="outline" className="bg-white">Tugas 1: 5%</Badge>
              <Badge variant="outline" className="bg-white">Tugas 2: 5%</Badge>
              <Badge variant="outline" className="bg-white">Ulangan 1: 10%</Badge>
              <Badge variant="outline" className="bg-white">Ulangan 2: 10%</Badge>
              <Badge variant="outline" className="bg-white">Mid Test: 30%</Badge>
              <Badge variant="outline" className="bg-white">UAS: 40%</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grade Table */}
      {selectedClassId && selectedSubjectId && students.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <CardTitle className="text-lg">
                  {selectedClass?.jenjang} Kelas {selectedClass?.name} - {selectedSubject?.name}
                </CardTitle>
                <CardDescription>{students.length} siswa</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Simpan
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-12 text-center">No</TableHead>
                    <TableHead className="min-w-[150px]">Nama Siswa</TableHead>
                    <TableHead className="w-20 text-center">Tugas 1</TableHead>
                    <TableHead className="w-20 text-center">Tugas 2</TableHead>
                    <TableHead className="w-20 text-center">Ulangan 1</TableHead>
                    <TableHead className="w-20 text-center">Ulangan 2</TableHead>
                    <TableHead className="w-20 text-center">Mid Test</TableHead>
                    <TableHead className="w-20 text-center">UAS</TableHead>
                    <TableHead className="w-24 text-center bg-teal-50">Nilai Akhir</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student, index) => {
                    const grade = grades[student.id] || {};
                    return (
                      <TableRow key={student.id}>
                        <TableCell className="text-center font-medium">{index + 1}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">{student.name}</p>
                            <p className="text-xs text-gray-500">{student.nis}</p>
                          </div>
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={grade.tugas1 ?? ''}
                            onChange={(e) => handleGradeChange(student.id, 'tugas1', e.target.value)}
                            className="w-full h-9 text-center"
                            placeholder="-"
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={grade.tugas2 ?? ''}
                            onChange={(e) => handleGradeChange(student.id, 'tugas2', e.target.value)}
                            className="w-full h-9 text-center"
                            placeholder="-"
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={grade.ulangan1 ?? ''}
                            onChange={(e) => handleGradeChange(student.id, 'ulangan1', e.target.value)}
                            className="w-full h-9 text-center"
                            placeholder="-"
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={grade.ulangan2 ?? ''}
                            onChange={(e) => handleGradeChange(student.id, 'ulangan2', e.target.value)}
                            className="w-full h-9 text-center"
                            placeholder="-"
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={grade.midTest ?? ''}
                            onChange={(e) => handleGradeChange(student.id, 'midTest', e.target.value)}
                            className="w-full h-9 text-center"
                            placeholder="-"
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={grade.uas ?? ''}
                            onChange={(e) => handleGradeChange(student.id, 'uas', e.target.value)}
                            className="w-full h-9 text-center"
                            placeholder="-"
                          />
                        </TableCell>
                        <TableCell className="text-center bg-teal-50">
                          <span className={`text-lg font-bold ${getGradeColor(grade.finalGrade)}`}>
                            {grade.finalGrade !== null ? grade.finalGrade.toFixed(2) : '-'}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {(!selectedClassId || !selectedSubjectId) && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Pilih Data Terlebih Dahulu</h3>
            <p className="text-gray-500">Pilih jenjang, kelas, dan mata pelajaran untuk mulai input nilai</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
