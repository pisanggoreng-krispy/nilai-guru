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
  Users,
  Save
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Class {
  id: string;
  name: string;
  jenjang: string;
  level?: string;
  grade?: number;
  waliKelasId?: string | null;
  waliKelas?: string | null;
  studentCount?: number;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
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
    waliKelasId: 'none',
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
      
      if (classesData.success) {
        // Normalize data - map level to jenjang
        const normalizedClasses = classesData.data.map((c: Class) => ({
          ...c,
          jenjang: c.jenjang || c.level || 'SMP',
        }));
        setClasses(normalizedClasses);
      }
      if (usersData.success) {
        // Tampilkan semua guru (GURU_MAPEL) sebagai calon wali kelas
        setTeachers(usersData.data.filter((u: Teacher) => u.role === 'GURU_MAPEL'));
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const filteredClasses = classes.filter(c => {
    const className = c.name || '';
    const classJenjang = c.jenjang || c.level || '';
    const matchSearch = className.toLowerCase().includes(search.toLowerCase());
    const matchJenjang = filterJenjang === 'ALL' || classJenjang === filterJenjang;
    return matchSearch && matchJenjang;
  });

  const handleOpenDialog = (kelas?: Class) => {
    if (kelas) {
      setEditingId(kelas.id);
      setFormData({
        name: kelas.name || '',
        jenjang: kelas.jenjang || kelas.level || 'SMP',
        waliKelasId: kelas.waliKelasId || 'none',
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        jenjang: 'SMP',
        waliKelasId: 'none',
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Nama kelas harus diisi');
      return;
    }

    setSaving(true);
    try {
      const waliKelasValue = formData.waliKelasId === 'none' ? null : formData.waliKelasId;
      
      if (editingId) {
        // Update kelas
        const res = await fetch('/api/classes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingId,
            name: formData.name,
            level: formData.jenjang,
            waliKelasId: waliKelasValue,
          }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success('Data kelas diperbarui');
          setDialogOpen(false);
          fetchData();
        } else {
          toast.error(data.error || 'Gagal memperbarui data');
        }
      } else {
        // Create new kelas
        const res = await fetch('/api/classes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            level: formData.jenjang,
            academicYear: '2024/2025',
            waliKelasId: waliKelasValue,
          }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success('Kelas baru ditambahkan');
          setDialogOpen(false);
          fetchData();
        } else {
          toast.error(data.error || 'Gagal menambahkan kelas');
        }
      }
    } catch (error) {
      console.error('Save error:', error);
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
                <TableHead>Wali Kelas</TableHead>
                <TableHead>Jumlah Siswa</TableHead>
                <TableHead className="w-24 text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClasses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Tidak ada data kelas
                  </TableCell>
                </TableRow>
              ) : (
                filteredClasses.map((kelas, index) => (
                  <TableRow key={kelas.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-teal-100 rounded flex items-center justify-center flex-shrink-0">
                          <span className="font-bold text-teal-700 text-sm">{kelas.name || '-'}</span>
                        </div>
                        <span className="font-medium whitespace-nowrap">Kelas {kelas.name || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{kelas.jenjang || kelas.level || '-'}</Badge>
                    </TableCell>
                    <TableCell>
                      {kelas.waliKelas ? (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="truncate max-w-[150px]">{kelas.waliKelas}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
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
              {editingId ? 'Perbarui data kelas dan tentukan wali kelas' : 'Masukkan data kelas baru'}
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
                <Label htmlFor="jenjang">Jenjang</Label>
                <Select
                  value={formData.jenjang}
                  onValueChange={(v) => setFormData({ ...formData, jenjang: v })}
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="wali">Wali Kelas</Label>
              <Select
                value={formData.waliKelasId}
                onValueChange={(v) => setFormData({ ...formData, waliKelasId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih wali kelas (opsional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tanpa Wali Kelas</SelectItem>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Guru yang dipilih akan menjadi wali kelas dan bisa melihat rekap nilai kelas ini
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
