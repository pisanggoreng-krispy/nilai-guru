'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Users, 
  Download,
  Loader2,
  Trophy,
  Award,
  FileSpreadsheet,
  FileText,
  ChevronDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface RecapStudent {
  student: {
    id: string;
    nis: string;
    name: string;
  };
  subjectGrades: Record<string, {
    tugas1: number | null;
    tugas2: number | null;
    ulangan1: number | null;
    ulangan2: number | null;
    midTest: number | null;
    uas: number | null;
    finalGrade: number | null;
  }>;
  average: number | null;
  rank: number | null;
}

interface RecapData {
  class: {
    id: string;
    name: string;
    jenjang: string;
    waliKelas: string | null;
  };
  subjects: Array<{
    id: string;
    name: string;
  }>;
  recap: RecapStudent[];
  statistics: {
    highest: number | null;
    lowest: number | null;
    average: number | null;
    totalStudents: number;
    gradedStudents: number;
  };
  distribution: {
    excellent: number;
    veryGood: number;
    good: number;
    fair: number;
    poor: number;
  };
}

interface Class {
  id: string;
  name: string;
  jenjang: string;
  waliKelas: string | null;
}

export default function WaliKelasPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [recapData, setRecapData] = useState<RecapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingRecap, setLoadingRecap] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchRecap();
    }
  }, [selectedClassId]);

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/classes');
      const data = await res.json();
      if (data.success) {
        setClasses(data.data);
        // Auto-select first class if only one
        if (data.data.length === 1) {
          setSelectedClassId(data.data[0].id);
        }
      }
    } catch (error) {
      toast.error('Gagal memuat data kelas');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecap = async () => {
    setLoadingRecap(true);
    try {
      const res = await fetch(`/api/recap?classId=${selectedClassId}`);
      const data = await res.json();
      if (data.success) {
        setRecapData(data.data);
      } else {
        toast.error(data.error || 'Gagal memuat rekap');
      }
    } catch (error) {
      toast.error('Gagal memuat rekap nilai');
    } finally {
      setLoadingRecap(false);
    }
  };

  const handleExport = (type: 'grades' | 'leger') => {
    window.open(`/api/export?type=${type}&classId=${selectedClassId}`, '_blank');
  };

  const handleExportLeger = () => {
    handleExport('leger');
  };

  const handleExportGrades = () => {
    handleExport('grades');
  };

  const getGradeColor = (grade: number | null) => {
    if (grade === null) return 'text-gray-400';
    if (grade >= 90) return 'text-emerald-600';
    if (grade >= 80) return 'text-green-600';
    if (grade >= 70) return 'text-blue-600';
    if (grade >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getRankBadge = (rank: number | null) => {
    if (rank === null) return null;
    if (rank === 1) return <Trophy className="w-4 h-4 text-yellow-500" />;
    if (rank === 2) return <Award className="w-4 h-4 text-gray-400" />;
    if (rank === 3) return <Award className="w-4 h-4 text-amber-600" />;
    return <span className="text-xs font-medium">{rank}</span>;
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rekap Wali Kelas</h1>
          <p className="text-gray-500 mt-1">Lihat rekap nilai seluruh mata pelajaran</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Pilih kelas" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.jenjang} - Kelas {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedClassId && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleExportLeger}>
                  <FileText className="w-4 h-4 mr-2" />
                  Export Leger Nilai
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportGrades}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Export Detail Nilai
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {loadingRecap && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      )}

      {!loadingRecap && recapData && (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-emerald-600 font-medium">Nilai Tertinggi</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {recapData.statistics.highest?.toFixed(2) || '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-br from-red-50 to-red-100/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500 rounded-lg">
                    <TrendingDown className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-red-600 font-medium">Nilai Terendah</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {recapData.statistics.lowest?.toFixed(2) || '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 font-medium">Rata-rata</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {recapData.statistics.average?.toFixed(2) || '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-br from-teal-50 to-teal-100/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-500 rounded-lg">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-teal-600 font-medium">Siswa</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {recapData.statistics.gradedStudents}/{recapData.statistics.totalStudents}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Distribution */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Distribusi Nilai Rata-rata</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: 'Sangat Baik (90-100)', count: recapData.distribution.excellent, color: 'bg-emerald-500' },
                  { label: 'Baik (80-89)', count: recapData.distribution.veryGood, color: 'bg-green-500' },
                  { label: 'Cukup Baik (70-79)', count: recapData.distribution.good, color: 'bg-blue-500' },
                  { label: 'Cukup (60-69)', count: recapData.distribution.fair, color: 'bg-amber-500' },
                  { label: 'Kurang (<60)', count: recapData.distribution.poor, color: 'bg-red-500' },
                ].map((item) => {
                  const total = recapData.statistics.gradedStudents || 1;
                  const percentage = Math.round((item.count / total) * 100);
                  return (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${item.color}`} />
                      <span className="text-sm flex-1">{item.label}</span>
                      <div className="flex items-center gap-2 w-40">
                        <Progress value={percentage} className="h-2 flex-1" />
                        <span className="text-xs text-gray-500 w-8 text-right">{item.count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recap Table */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                Rekap Nilai - {recapData.class.jenjang} Kelas {recapData.class.name}
              </CardTitle>
              <CardDescription>
                Wali Kelas: {recapData.class.waliKelas || '-'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-12 text-center">Rank</TableHead>
                      <TableHead className="min-w-[150px]">Nama Siswa</TableHead>
                      {recapData.subjects.map((subject) => (
                        <TableHead key={subject.id} className="text-center min-w-[80px]">
                          {subject.name}
                        </TableHead>
                      ))}
                      <TableHead className="text-center bg-teal-50 min-w-[80px]">Rata-rata</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recapData.recap.map((item) => (
                      <TableRow key={item.student.id}>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center">
                            {getRankBadge(item.rank)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">{item.student.name}</p>
                            <p className="text-xs text-gray-500">{item.student.nis}</p>
                          </div>
                        </TableCell>
                        {recapData.subjects.map((subject) => {
                          const grade = item.subjectGrades[subject.id];
                          return (
                            <TableCell key={subject.id} className="text-center">
                              <span className={`font-medium ${getGradeColor(grade?.finalGrade)}`}>
                                {grade?.finalGrade?.toFixed(2) || '-'}
                              </span>
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center bg-teal-50">
                          <span className={`text-lg font-bold ${getGradeColor(item.average)}`}>
                            {item.average?.toFixed(2) || '-'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!loadingRecap && !recapData && !selectedClassId && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Pilih Kelas</h3>
            <p className="text-gray-500">Pilih kelas untuk melihat rekap nilai</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
