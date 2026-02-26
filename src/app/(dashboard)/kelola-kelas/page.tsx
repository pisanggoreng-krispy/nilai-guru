'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Plus, 
  Search, 
  Download,
  Loader2,
  Pencil,
  GraduationCap,
  Users
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Class {
  id: string;
  name: string;
  jenjang: string;
  grade: number;
  waliKelasId: string | null;
  waliKelas?: string | null;
  studentCount?: number;
}

interface Teacher {
  id: string;
  name: string;
  role: string;
}

export default function KelolaKelasPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterJenjang, setFilterJenjang] = useState<string>('ALL');
  
  // Form state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    jenjang: 'SMP',
    grade: 7,
    waliKelasId: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [classesRes, usersRes] = await Promise.all([
        fetch('/api/classes'),
        fetch('/api/users'),
      ]);
      
      const classesData = await classesRes.json();
      const usersData = await usersRes.json();
      
      if (classesData.success) setClasses(classesData.data);
      if (usersData.success) {
        setTeachers(usersData.data.filter((u: Teacher) => u.role === 'WALI_KELAS'));
      }
    } catch (error) {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const filteredClasses = classes.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchJenjang = filterJenjang === 'ALL' || c.jenjang === filterJenjang;
    return matchSearch && matchJenjang;
  });

  const handleOpenDialog = (kelas?: Class) => {
    if (kelas) {
      setEditingId(kelas.id);
      setFormData({
        name: kelas.name,
        jenjang: kelas.jenjang,
        grade: kelas.grade,
        waliKelasId: kelas.waliKelasId || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        jenjang: 'SMP',
        grade: 7,
        waliKelasId: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Lengkapi semua field');
      return;
    }

    setSaving(true);
    try {
      toast.success(editingId ? 'Data kelas diperbarui' : 'Kelas baru ditambahkan');
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    window.open('/api/export?type=classes', '_blank');
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
          <h1 className="text-2xl font-bold text-gray-900">Kelola Kelas</h1>
          <p className="text-gray-500 mt-1">{classes.length} kelas terdaftar</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Kelas
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cari nama kelas..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterJenjang} onValueChange={setFilterJenjang}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Semua Jenjang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Jenjang</SelectItem>
                <SelectItem value="SMP">SMP</SelectItem>
                <SelectItem value="MA">MA</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-12">No</TableHead>
                <TableHead>Nama Kelas</TableHead>
                <TableHead>Jenjang</TableHead>
                <TableHead>Tingkat</TableHead>
                <TableHead>Wali Kelas</TableHead>
                <TableHead>Jumlah Siswa</TableHead>
                <TableHead className="w-24 text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClasses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    Tidak ada data kelas
                  </TableCell>
                </TableRow>
              ) : (
                filteredClasses.map((kelas, index) => (
                  <TableRow key={kelas.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-teal-100 rounded flex items-center justify-center">
                          <span className="font-bold text-teal-700 text-sm">{kelas.name}</span>
                        </div>
                        <span className="font-medium">Kelas {kelas.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{kelas.jenjang}</Badge>
                    </TableCell>
                    <TableCell>Tingkat {kelas.grade}</TableCell>
                    <TableCell>{kelas.waliKelas || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>{kelas.studentCount || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(kelas)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Kelas' : 'Tambah Kelas Baru'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Perbarui data kelas' : 'Masukkan data kelas baru'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Kelas</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: 7A, 10B"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade">Tingkat</Label>
                <Select
                  value={String(formData.grade)}
                  onValueChange={(v) => setFormData({ ...formData, grade: Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tingkat" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.jenjang === 'SMP' ? (
                      <>
                        <SelectItem value="7">Kelas 7</SelectItem>
                        <SelectItem value="8">Kelas 8</SelectItem>
                        <SelectItem value="9">Kelas 9</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="10">Kelas 10</SelectItem>
                        <SelectItem value="11">Kelas 11</SelectItem>
                        <SelectItem value="12">Kelas 12</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="jenjang">Jenjang</Label>
              <Select
                value={formData.jenjang}
                onValueChange={(v) => setFormData({ ...formData, jenjang: v, grade: v === 'SMP' ? 7 : 10 })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenjang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SMP">SMP</SelectItem>
                  <SelectItem value="MA">MA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="wali">Wali Kelas</Label>
              <Select
                value={formData.waliKelasId}
                onValueChange={(v) => setFormData({ ...formData, waliKelasId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih wali kelas" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
