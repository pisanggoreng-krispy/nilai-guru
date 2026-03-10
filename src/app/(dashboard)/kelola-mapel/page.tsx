'use client';

import { useEffect, useState, useRef } from 'react';
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
  Search, 
  Download,
  Upload,
  Loader2,
  Pencil,
  Trash2,
  BookOpen,
  FileSpreadsheet,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Subject {
  id: string;
  name: string;
  jenjang: string;
  level: string;
  grade: number;
}

interface GradeConfig {
  level: string;
  grades: number[];
  label: string;
}

const GRADE_CONFIGS: GradeConfig[] = [
  { level: 'SMP', grades: [7, 8, 9], label: 'SMP' },
  { level: 'MA', grades: [10, 11, 12], label: 'MA' },
];

export default function KelolaMapelPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Selected grade for viewing
  const [selectedLevel, setSelectedLevel] = useState<string>('SMP');
  const [selectedGrade, setSelectedGrade] = useState<number>(7);
  
  // Form state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    jenjang: 'SMP',
    grade: 7,
  });
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, status: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importGrade, setImportGrade] = useState<{ level: string; grade: number }>({ level: 'SMP', grade: 7 });

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
    const matchLevel = s.level === selectedLevel || s.jenjang === selectedLevel;
    const matchGrade = s.grade === selectedGrade;
    return matchSearch && matchLevel && matchGrade;
  });

  const getGradeCount = (level: string, grade: number) => {
    return subjects.filter(s => (s.level === level || s.jenjang === level) && s.grade === grade).length;
  };

  const handleOpenDialog = (subject?: Subject) => {
    if (subject) {
      setEditingId(subject.id);
      setFormData({
        name: subject.name,
        jenjang: subject.level || subject.jenjang,
        grade: subject.grade,
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        jenjang: selectedLevel,
        grade: selectedGrade,
      });
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
          name: formData.name,
          jenjang: formData.jenjang,
          grade: formData.grade,
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

  const handleExportTemplate = (level: string, grade: number) => {
    window.open(`/api/export?type=template-subjects&level=${level}&grade=${grade}`, '_blank');
  };

  const handleExport = (level: string, grade: number) => {
    window.open(`/api/export?type=subjects&level=${level}&grade=${grade}`, '_blank');
  };

  const handleOpenImport = (level: string, grade: number) => {
    setImportGrade({ level, grade });
    setImportDialogOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setImporting(true);
    setImportProgress({ current: 0, total: 0, status: 'Mempersiapkan import...' });

    try {
      const buffer = await selectedFile.arrayBuffer();
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);
      const total = data.length;

      setImportProgress({ current: 0, total, status: 'Mengimport data...' });

      // Simulate progress
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          const increment = Math.floor(Math.random() * 5) + 1;
          const newCurrent = Math.min(prev.current + increment, prev.total - 1);
          return { ...prev, current: newCurrent };
        });
      }, 300);

      const importFormData = new FormData();
      importFormData.append('file', selectedFile);
      importFormData.append('type', 'subjects');
      importFormData.append('level', importGrade.level);
      importFormData.append('grade', String(importGrade.grade));
      importFormData.append('replaceMode', 'true');

      const res = await fetch('/api/import', {
        method: 'POST',
        body: importFormData,
      });

      clearInterval(progressInterval);

      const result = await res.json();

      if (result.success) {
        setImportProgress({ current: total, total, status: result.message });
        toast.success(result.message);

        // Show skipped items if any
        if (result.skipped && result.skipped.length > 0) {
          console.log('Skipped items:', result.skipped);
          const skippedMsg = result.skipped.map((s: { name: string; reason: string }) => 
            `• ${s.name}: ${s.reason}`
          ).join('\n');
          setTimeout(() => {
            toast.error(`Beberapa mapel dilewati:\n${skippedMsg}`, { duration: 5000 });
          }, 500);
        }

        setTimeout(() => {
          setImportDialogOpen(false);
          setSelectedFile(null);
          fetchSubjects();
        }, 2000);
      } else {
        toast.error(result.error);
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kelola Mata Pelajaran</h1>
        <p className="text-gray-500 mt-1">{subjects.length} mata pelajaran terdaftar</p>
      </div>

      {/* Grade Cards */}
      {GRADE_CONFIGS.map((config) => (
        <div key={config.level} className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Badge variant="outline" className={config.level === 'SMP' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}>
              {config.label}
            </Badge>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {config.grades.map((grade) => {
              const count = getGradeCount(config.level, grade);
              const isSelected = selectedLevel === config.level && selectedGrade === grade;
              return (
                <Card 
                  key={grade}
                  className={`border-0 shadow-sm cursor-pointer transition-all ${
                    isSelected 
                      ? 'ring-2 ring-teal-500 bg-teal-50' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => {
                    setSelectedLevel(config.level);
                    setSelectedGrade(grade);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${config.level === 'SMP' ? 'bg-blue-500' : 'bg-emerald-500'}`}>
                          <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Kelas</p>
                          <p className="text-xl font-bold">{grade}</p>
                        </div>
                      </div>
                      <Badge variant="secondary">{count} mapel</Badge>
                    </div>
                    <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex-1 h-8 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700"
                        onClick={() => handleExportTemplate(config.level, grade)}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Template
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1 h-8 text-xs bg-teal-600 hover:bg-teal-700 text-white"
                        onClick={() => handleOpenImport(config.level, grade)}
                      >
                        <Upload className="w-3 h-3 mr-1" />
                        Import
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 p-0 bg-gray-100 hover:bg-gray-200 text-gray-700"
                        onClick={() => handleExport(config.level, grade)}
                        title="Export Data"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {/* Selected Grade Detail */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <CardTitle className="text-lg">
                Mata Pelajaran {selectedLevel} - Kelas {selectedGrade}
              </CardTitle>
              <CardDescription>{filteredSubjects.length} mata pelajaran</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cari mata pelajaran..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-[200px]"
                />
              </div>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Mapel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-12">No</TableHead>
                <TableHead>Nama Mata Pelajaran</TableHead>
                <TableHead className="w-20">Kelas</TableHead>
                <TableHead className="w-28 text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <BookOpen className="w-8 h-8 text-gray-300" />
                      <p>Belum ada mata pelajaran</p>
                      <p className="text-xs">Import dari template atau tambah manual</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubjects.map((subject, index) => (
                  <TableRow key={subject.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{subject.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{subject.grade}</Badge>
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
            <div className="grid grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Label htmlFor="grade">Kelas</Label>
                <Select
                  value={String(formData.grade)}
                  onValueChange={(v) => setFormData({ ...formData, grade: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kelas" />
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

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={(open) => {
        if (!importing) {
          setImportDialogOpen(open);
          if (!open) setSelectedFile(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Mata Pelajaran</DialogTitle>
            <DialogDescription>
              Import untuk {importGrade.level} - Kelas {importGrade.grade}
            </DialogDescription>
          </DialogHeader>
          
          {importing ? (
            <div className="py-6 space-y-4">
              <div className="flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-teal-600" />
              </div>
              
              {importProgress.total > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Progress</span>
                    <span>{importProgress.current} / {importProgress.total} mapel</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-teal-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((importProgress.current / importProgress.total) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
              
              <p className="text-center text-gray-600">{importProgress.status}</p>
            </div>
          ) : (
            <div className="py-4 space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6">
                <div className="text-center">
                  <FileSpreadsheet className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  {selectedFile ? (
                    <p className="text-sm text-gray-600 mb-2">
                      File: <strong>{selectedFile.name}</strong>
                    </p>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600 mb-2">
                        Klik untuk memilih file atau drag & drop
                      </p>
                      <p className="text-xs text-gray-400 mb-4">
                        Format: XLSX, XLS, CSV
                      </p>
                    </>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Pilih File
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-700">
                  <strong>Format kolom:</strong><br />
                  Nama, Jenjang<br /><br />
                  <strong>Contoh:</strong><br />
                  Matematika, SMP<br />
                  Bahasa Indonesia, SMP<br />
                  Fiqh, MA
                </p>
              </div>

              <div className="bg-amber-50 p-3 rounded-lg">
                <p className="text-xs text-amber-700">
                  <strong>Catatan:</strong> Semua mapel akan diimport ke <strong>{importGrade.level} Kelas {importGrade.grade}</strong>. Data lama akan diganti.
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            {!importing && (
              <>
                <Button variant="outline" onClick={() => {
                  setImportDialogOpen(false);
                  setSelectedFile(null);
                }}>
                  Batal
                </Button>
                <Button onClick={handleImport} disabled={!selectedFile}>
                  <Upload className="w-4 h-4 mr-2" />
                  Import & Ganti Data
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
