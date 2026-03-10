'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
  FileSpreadsheet,
  KeyRound,
  Checkbox,
  Users
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Credential {
  name: string;
  email: string;
  password: string;
}

export default function KelolaGuruPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  
  // Form state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'GURU_MAPEL',
    password: '',
  });
  const [saving, setSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const teacherSubjectInputRef = useRef<HTMLInputElement>(null);
  
  // Credentials state
  const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false);
  const [lastCredentials, setLastCredentials] = useState<Credential[]>([]);
  
  // Bulk delete state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'ALL' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingId(user.id);
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        password: '',
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        email: '',
        role: 'GURU_MAPEL',
        password: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email || (!editingId && !formData.password)) {
      toast.error('Lengkapi semua field');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/users', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          ...formData,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Data berhasil disimpan');
        setDialogOpen(false);
        fetchUsers();
      } else {
        toast.error(data.error || 'Gagal menyimpan');
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
      const res = await fetch(`/api/users?id=${deletingId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Guru berhasil dihapus');
        setDeleteDialogOpen(false);
        setDeletingId(null);
        fetchUsers();
      } else {
        toast.error(data.error || 'Gagal menghapus');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    window.open('/api/export?type=teachers', '_blank');
  };

  const handleDownloadTemplate = () => {
    window.open('/api/export?type=template-teachers', '_blank');
  };

  const handleDownloadTeacherSubjectTemplate = () => {
    window.open('/api/export?type=template-teacher-subjects', '_blank');
  };

  const handleImportTeacherSubjects = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const importFormData = new FormData();
    importFormData.append('file', file);
    importFormData.append('type', 'teacher-subjects');
    importFormData.append('replaceMode', 'true');

    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        body: importFormData,
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        // Show errors if any
        if (data.errors && data.errors.length > 0) {
          data.errors.forEach((err: string) => toast.error(err));
        }
      } else {
        toast.error(data.error || 'Gagal mengimpor');
      }
    } catch (error) {
      toast.error('Gagal mengimpor data');
    }
    
    if (teacherSubjectInputRef.current) {
      teacherSubjectInputRef.current.value = '';
    }
  };

  const downloadCredentials = (credentials: Credential[]) => {
    // Create CSV content
    const headers = ['No', 'Nama', 'Email', 'Password'];
    const rows = credentials.map((c, i) => [i + 1, c.name, c.email, c.password]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kredensial_guru_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const importFormData = new FormData();
    importFormData.append('file', file);
    importFormData.append('type', 'teachers');

    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        body: importFormData,
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchUsers();
        
        // Show credentials dialog if there are new credentials
        if (data.credentials && data.credentials.length > 0) {
          setLastCredentials(data.credentials);
          setCredentialsDialogOpen(true);
        }
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Gagal mengimpor data');
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      ADMIN: 'bg-purple-100 text-purple-700 border-purple-200',
      GURU_MAPEL: 'bg-blue-100 text-blue-700 border-blue-200',
    };
    const labels: Record<string, string> = {
      ADMIN: 'Administrator',
      GURU_MAPEL: 'Guru Mapel',
    };
    return (
      <Badge variant="outline" className={styles[role] || ''}>
        {labels[role] || role}
      </Badge>
    );
  };

  // Checkbox handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredUsers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/users?ids=${Array.from(selectedIds).join(',')}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setBulkDeleteDialogOpen(false);
        setSelectedIds(new Set());
        fetchUsers();
      } else {
        toast.error(data.error || 'Gagal menghapus');
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
          <h1 className="text-2xl font-bold text-gray-900">Kelola Guru <span className="text-xs font-normal text-gray-400">v2.0</span></h1>
          <p className="text-gray-500 mt-1">{users.length} guru terdaftar</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept=".xlsx,.xls,.csv"
            onChange={handleImport}
            className="hidden"
          />
          <input
            type="file"
            ref={teacherSubjectInputRef}
            accept=".xlsx,.xls,.csv"
            onChange={handleImportTeacherSubjects}
            className="hidden"
          />
          <Button variant="outline" onClick={handleDownloadTemplate}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Template
          </Button>
          <Button variant="outline" onClick={handleDownloadTeacherSubjectTemplate}>
            <Users className="w-4 h-4 mr-2" />
            Template Guru-Mapel
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" onClick={() => teacherSubjectInputRef.current?.click()}>
            <Users className="w-4 h-4 mr-2" />
            Import Guru-Mapel
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Guru
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
                  placeholder="Cari nama atau email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Semua Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Role</SelectItem>
                <SelectItem value="ADMIN">Administrator</SelectItem>
                <SelectItem value="GURU_MAPEL">Guru Mapel</SelectItem>
              </SelectContent>
            </Select>
            {selectedIds.size > 0 && (
              <Button 
                variant="destructive" 
                onClick={() => setBulkDeleteDialogOpen(true)}
                className="whitespace-nowrap"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Hapus ({selectedIds.size})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-12">
                  <button
                    onClick={toggleSelectAll}
                    className="w-5 h-5 rounded border-2 border-gray-300 flex items-center justify-center hover:border-teal-500 transition-colors"
                  >
                    {selectedIds.size === filteredUsers.length && filteredUsers.length > 0 ? (
                      <div className="w-3 h-3 bg-teal-500 rounded-sm" />
                    ) : selectedIds.size > 0 ? (
                      <div className="w-3 h-3 bg-teal-500 rounded-sm opacity-50" />
                    ) : null}
                  </button>
                </TableHead>
                <TableHead className="w-12">No</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="w-28 text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Tidak ada data guru
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user, index) => (
                  <TableRow 
                    key={user.id}
                    className={selectedIds.has(user.id) ? 'bg-teal-50' : ''}
                  >
                    <TableCell>
                      <button
                        onClick={() => toggleSelect(user.id)}
                        className="w-5 h-5 rounded border-2 border-gray-300 flex items-center justify-center hover:border-teal-500 transition-colors"
                      >
                        {selectedIds.has(user.id) && (
                          <div className="w-3 h-3 bg-teal-500 rounded-sm" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-gray-500">{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(user)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDeletingId(user.id);
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
            <DialogTitle>{editingId ? 'Edit Guru' : 'Tambah Guru Baru'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Perbarui data guru' : 'Masukkan data guru baru'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nama lengkap"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@sekolah.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(v) => setFormData({ ...formData, role: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Administrator</SelectItem>
                  <SelectItem value="GURU_MAPEL">Guru Mapel</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Untuk menunjuk wali kelas, buka menu Kelola Kelas
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                Password {editingId && <span className="text-gray-400">(kosongkan jika tidak diubah)</span>}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Password"
              />
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
            <DialogTitle>Hapus Guru</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus guru ini? Tindakan ini tidak dapat dibatalkan.
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

      {/* Credentials Dialog */}
      <Dialog open={credentialsDialogOpen} onOpenChange={setCredentialsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-teal-600" />
              Kredensial Guru Baru
            </DialogTitle>
            <DialogDescription>
              Berikut adalah kredensial login untuk guru yang baru ditambahkan. 
              Unduh dan simpan dengan aman, lalu distribusikan kepada masing-masing guru.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="max-h-64 overflow-y-auto border rounded-lg">
              <Table>
                <TableHeader className="sticky top-0 bg-white">
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Password</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lastCredentials.map((cred, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{cred.name}</TableCell>
                      <TableCell className="text-gray-500">{cred.email}</TableCell>
                      <TableCell className="font-mono text-sm">{cred.password}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-sm text-amber-600 mt-3 flex items-start gap-2">
              <KeyRound className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Penting:</strong> Password ini hanya ditampilkan sekali. 
                Pastikan untuk mengunduh dan menyimpan kredensial ini sebelum menutup dialog.
              </span>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCredentialsDialogOpen(false)}>
              Tutup
            </Button>
            <Button onClick={() => downloadCredentials(lastCredentials)}>
              <Download className="w-4 h-4 mr-2" />
              Unduh Kredensial
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Guru Terpilih</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus {selectedIds.size} guru yang dipilih?
              <br />
              <span className="text-amber-600">
                Wali kelas dan penugasan mapel dari guru tersebut juga akan direset.
              </span>
              <br />
              <strong>Tindakan ini tidak dapat dibatalkan.</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Hapus {selectedIds.size} Guru
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
