'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  TrendingUp, 
  ClipboardEdit,
  FileSpreadsheet,
  ArrowRight,
  Loader2
} from 'lucide-react';

interface DashboardData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  stats: {
    totalStudents: number;
    totalClasses: number;
    totalSubjects: number;
    gradedCount: number;
    completionRate: number;
  };
  waliKelasClasses: Array<{
    id: string;
    name: string;
    jenjang: string;
    waliKelas: string | null;
    studentCount: number;
  }>;
  taughtSubjects: Array<{
    id: string;
    name: string;
    jenjang: string;
  }>;
  isWaliKelas: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard');
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!data) {
    return <div>Gagal memuat data</div>;
  }

  const isAdmin = data.user.role === 'ADMIN';
  const isWaliKelas = data.isWaliKelas || data.waliKelasClasses.length > 0;
  const isGuruMapel = data.user.role === 'GURU_MAPEL';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Selamat Datang, {data.user.name.split(',')[0]}!
          </h1>
          <p className="text-gray-500 mt-1">
            {isAdmin ? 'Administrator' : isGuruMapel ? 'Guru Mata Pelajaran' : 'Guru'}
            {isWaliKelas && !isAdmin && ' & Wali Kelas'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push('/input-nilai')} className="gap-2">
            <ClipboardEdit className="w-4 h-4" />
            Input Nilai
          </Button>
          {isWaliKelas && (
            <Button onClick={() => router.push('/wali-kelas')} className="gap-2" variant="outline">
              <FileSpreadsheet className="w-4 h-4" />
              Rekap Nilai
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-blue-600 font-medium">Total Siswa</p>
                <p className="text-2xl font-bold text-gray-900">{data.stats.totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 rounded-lg">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-emerald-600 font-medium">Total Kelas</p>
                <p className="text-2xl font-bold text-gray-900">{data.stats.totalClasses}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500 rounded-lg">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-amber-600 font-medium">Mata Pelajaran</p>
                <p className="text-2xl font-bold text-gray-900">{data.stats.totalSubjects}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-teal-50 to-teal-100/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-500 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-teal-600 font-medium">Progress Nilai</p>
                <p className="text-2xl font-bold text-gray-900">{data.stats.completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {isWaliKelas && data.waliKelasClasses.length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-teal-600" />
                Kelas Wali
              </CardTitle>
              <CardDescription>Kelas yang Anda wali - Lihat rekap nilai siswa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.waliKelasClasses.slice(0, 3).map((kelas) => (
                <div
                  key={kelas.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                      <span className="font-bold text-teal-700">{kelas.name}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {kelas.jenjang} - {kelas.name}
                      </p>
                      <p className="text-xs text-gray-500">{kelas.studentCount} siswa</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/wali-kelas?classId=${kelas.id}`)}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {(isGuruMapel || isAdmin) && data.taughtSubjects.length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-teal-600" />
                Mata Pelajaran Diampu
              </CardTitle>
              <CardDescription>Mata pelajaran yang Anda ajarkan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {data.taughtSubjects.slice(0, 8).map((subject) => (
                  <Badge
                    key={subject.id}
                    variant="secondary"
                    className="px-3 py-1.5 bg-gray-100"
                  >
                    {subject.name}
                    <span className="ml-1.5 text-xs text-gray-500">({subject.jenjang})</span>
                  </Badge>
                ))}
                {data.taughtSubjects.length > 8 && (
                  <Badge variant="outline" className="px-3 py-1.5">
                    +{data.taughtSubjects.length - 8} lainnya
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => router.push('/input-nilai')}
              >
                Mulai Input Nilai
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {isGuruMapel && !isWaliKelas && data.taughtSubjects.length === 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-8 text-center">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Belum ada mata pelajaran yang diampu</p>
              <p className="text-sm text-gray-400 mt-1">Hubungi admin untuk penugasan</p>
            </CardContent>
          </Card>
        )}
      </div>

      {isAdmin && (
        <Card className="border-0 shadow-sm bg-gradient-to-r from-gray-50 to-slate-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Menu Administrasi</CardTitle>
            <CardDescription>Kelola data master sistem</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
                onClick={() => router.push('/kelola-siswa')}
              >
                <Users className="w-5 h-5 text-blue-600" />
                <span>Kelola Siswa</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
                onClick={() => router.push('/kelola-guru')}
              >
                <Users className="w-5 h-5 text-emerald-600" />
                <span>Kelola Guru</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
                onClick={() => router.push('/kelola-kelas')}
              >
                <GraduationCap className="w-5 h-5 text-amber-600" />
                <span>Kelola Kelas</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
                onClick={() => router.push('/input-nilai')}
              >
                <ClipboardEdit className="w-5 h-5 text-teal-600" />
                <span>Input Nilai</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
