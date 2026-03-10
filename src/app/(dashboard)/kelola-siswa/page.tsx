'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  Users,
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Student {
  id: string;
  nis: string;
  name: string;
  classId: string;
  class?: {
    id: string;
    name: string;
    jenjang: string;
  };
}

interface Class {
  id: string;
  name: string;
  jenjang: string;
}

export default function KelolaSiswaPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterJenjang, setFilterJenjang] = useState<string>('ALL');
  const [filterClass, setFilterClass] = useState<string>('ALL');
  
  // Form state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nis: '',
    name: '',
    classId: '',
  });
  const [saving, setSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mergeMode, setMergeMode] = useState(true);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsRes, classesRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/classes'),
      ]);
      
      const studentsData = await studentsRes.json();
      const classesData = await classesRes.json();
      
      if (studentsData.success) setStudents(studentsData.data);
      if (classesData.success) setClasses(classesData.data);
    } catch (error) {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
                        s.nis.toLowerCase().includes(search.toLowerCase());
    const matchJenjang = filterJenjang === 'ALL' || s.class?.jenjang === filterJenjang;
    const matchClass = filterClass === 'ALL' || s.classId === filterClass;
    return matchSearch && matchJenjang && matchClass;
  });

  const filteredClasses = classes.filter(c => filterJenjang === 'ALL' || c.jenjang === filterJenjang);

  const handleOpenDialog = (student?: Student) => {
    if (student) {
      setEditingId(student.id);
      setFormData({
        nis: student.nis,
        name: student.name,
        classId: student.classId,
      });
    } else {
      setEditingId(null);
      setFormData({ nis: '', name: '', classId: '' });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nis || !formData.name || !formData.classId) {
      toast.error('Lengkapi semua field');
      return;
    }

    setSaving(true);
    try {
      toast.success(editingId ? 'Data siswa diperbarui' : 'Siswa baru ditambahkan');
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    window.open('/api/export?type=students', '_blank');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportDialogOpen(true);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setImporting(true);
    try {
      const importFormData = new FormData();
      importFormData.append('file', selectedFile);
      importFormData.append('type', 'students');
      importFormData.append('mergeMode', String(mergeMode));

      const res = await fetch('/api/import', {
        method: 'POST',
        body: importFormData,
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setImportDialogOpen(false);
        setSelectedFile(null);
        fetchData();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Gagal mengimpor data');
    } finally {
      setImporting(false);
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
          <h1 className="text-2xl font-bold text-gray-900">Kelola Siswa</h1>
          <p className="text-gray-500 mt-1">{students.length} siswa terdaftar</p>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Siswa
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
                  placeholder="Cari nama atau NIS..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterJenjang} onValueChange={(v) => { setFilterJenjang(v); setFilterClass('ALL'); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Semua Jenjang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Jenjang</SelectItem>
                <SelectItem value="SMP">SMP</SelectItem>
                <SelectItem value="MA">MA</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Semua Kelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Kelas</SelectItem>
                {filteredClasses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.jenjang} - {c.name}
                  </SelectItem>
                ))}
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
                <TableHead>NIS</TableHead>
                <TableHead>Nama Siswa</TableHead>
                <TableHead>Jenjang</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead className="w-24 text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Tidak ada data siswa
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student, index) => (
                  <TableRow key={student.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-mono">{student.nis}</TableCell>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{student.class?.jenjang}</Badge>
                    </TableCell>
                    <TableCell>{student.class?.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(student)}
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
            <DialogTitle>{editingId ? 'Edit Siswa' : 'Tambah Siswa Baru'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Perbarui data siswa' : 'Masukkan data siswa baru'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nis">NIS</Label>
              <Input
                id="nis"
                value={formData.nis}
                onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                placeholder="Nomor Induk Siswa"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nama siswa"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="class">Kelas</Label>
              <Select
                value={formData.classId}
                onValueChange={(v) => setFormData({ ...formData, classId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.jenjang} - {c.name}
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

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={(open) => {
        if (!importing) {
          setImportDialogOpen(open);
          if (!open) setSelectedFile(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Data Siswa</DialogTitle>
            <DialogDescription>
              Pilih mode import yang sesuai
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
              <FileSpreadsheet className="w-8 h-8 text-gray-400 mr-3" />
              <div>
                <p className="font-medium">{selectedFile?.name}</p>
                <p className="text-sm text-gray-500">
                  {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 border rounded-lg">
              <Checkbox
                id="mergeMode"
                checked={mergeMode}
                onCheckedChange={(checked) => setMergeMode(checked as boolean)}
              />
              <div className="space-y-1">
                <Label htmlFor="mergeMode" className="cursor-pointer font-medium">
                  Smart Merge (Direkomendasikan)
                </Label>
                <p className="text-sm text-gray-500">
                  Update data yang ada, tambah data baru, hapus data yang tidak ada di file
                </p>
              </div>
            </div>

            {!mergeMode && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg text-amber-700">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Mode Tambah Saja</p>
                  <p>Data yang sudah ada akan dilewati, hanya data baru yang ditambahkan.</p>
                </div>
              </div>
            )}

            {mergeMode && (
              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg text-blue-700">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Perhatian</p>
                  <p>Siswa yang tidak ada di file akan dihapus beserta nilai-nilainya.</p>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setImportDialogOpen(false);
                setSelectedFile(null);
              }}
              disabled={importing}
            >
              Batal
            </Button>
            <Button onClick={handleImport} disabled={importing}>
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Mengimpor...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
