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
  Upload,
  Loader2,
  Pencil,
  Trash2,
  BookOpen
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Subject {
  id: string;
  name: string;
  jenjang: 'SMP' | 'MA';
}

export default function KelolaMapelPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterJenjang, setFilterJenjang] = useState<string>('ALL');
  
  // Form state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    jenjang: 'SMP',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await fetch('/api/subjects');
      const data = await res.json();
      if (data.success) {
        setSubjects(data.data);
      }
    } catch (error) {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = subjects.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchJenjang = filterJenjang === 'ALL' || s.jenjang === filterJenjang;
    return matchSearch && matchJenjang;
  });

  // Group by jenjang for summary
  const smpCount = subjects.filter(s => s.jenjang === 'SMP').length;
  const maCount = subjects.filter(s => s.jenjang === 'MA').length;

  const handleOpenDialog = (subject?: Subject) => {
    if (subject) {
      setEditingId(subject.id);
      setFormData({
        name: subject.name,
        jenjang: subject.jenjang,
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', jenjang: 'SMP' });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Nama mata pelajaran harus diisi');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/subjects', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          ...formData,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setDialogOpen(false);
        fetchSubjects();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/subjects?id=${deletingId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Mata pelajaran berhasil dihapus');
        setDeleteDialogOpen(false);
        setDeletingId(null);
        fetchSubjects();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Kelola Mata Pelajaran</h1>
          <p className="text-gray-500 mt-1">{subjects.length} mata pelajaran terdaftar</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Mapel
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-blue-600 font-medium">SMP</p>
                <p className="text-2xl font-bold text-gray-900">{smpCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 rounded-lg">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-emerald-600 font-medium">MA</p>
                <p className="text-2xl font-bold text-gray-900">{maCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cari mata pelajaran..."
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
                <TableHead>Nama Mata Pelajaran</TableHead>
                <TableHead>Jenjang</TableHead>
                <TableHead className="w-28 text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                    Tidak ada data mata pelajaran
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubjects.map((subject, index) => (
                  <TableRow key={subject.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{subject.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        subject.jenjang === 'SMP' 
                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }>
                        {subject.jenjang}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(subject)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDeletingId(subject.id);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Perbarui data mata pelajaran' : 'Masukkan data mata pelajaran baru'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Mata Pelajaran</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Matematika"
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

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Mata Pelajaran</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus mata pelajaran ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
