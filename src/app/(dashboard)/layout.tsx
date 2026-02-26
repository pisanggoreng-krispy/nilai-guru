'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  GraduationCap, 
  LayoutDashboard, 
  ClipboardEdit, 
  Users, 
  UserCog, 
  School, 
  LogOut,
  Menu,
  X,
  ChevronDown,
  Loader2,
  FileSpreadsheet,
  UserCircle,
  BookOpen
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
      } else {
        router.push('/login');
      }
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isAdmin = user.role === 'ADMIN';
  const isWaliKelas = user.role === 'WALI_KELAS';
  const isGuruMapel = user.role === 'GURU_MAPEL';

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      href: '/',
      roles: ['ADMIN', 'GURU_MAPEL', 'WALI_KELAS'],
    },
    {
      icon: ClipboardEdit,
      label: 'Input Nilai',
      href: '/input-nilai',
      roles: ['ADMIN', 'GURU_MAPEL'],
    },
    {
      icon: FileSpreadsheet,
      label: 'Rekap Wali Kelas',
      href: '/wali-kelas',
      roles: ['ADMIN', 'WALI_KELAS'],
    },
    {
      icon: Users,
      label: 'Kelola Siswa',
      href: '/kelola-siswa',
      roles: ['ADMIN'],
    },
    {
      icon: UserCog,
      label: 'Kelola Guru',
      href: '/kelola-guru',
      roles: ['ADMIN'],
    },
    {
      icon: School,
      label: 'Kelola Kelas',
      href: '/kelola-kelas',
      roles: ['ADMIN'],
    },
    {
      icon: BookOpen,
      label: 'Kelola Mata Pelajaran',
      href: '/kelola-mapel',
      roles: ['ADMIN'],
    },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white border-r shadow-sm transform transition-transform duration-200
        lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">SINILAI</span>
          </Link>
          <button 
            className="lg:hidden text-gray-400 hover:text-gray-600"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {filteredMenu.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-teal-50 text-teal-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-100'}
                `}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="h-16 bg-white border-b sticky top-0 z-30">
          <div className="h-full px-4 flex items-center justify-between">
            {/* Mobile menu button */}
            <button
              className="lg:hidden text-gray-400 hover:text-gray-600"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Page title for mobile */}
            <div className="lg:hidden font-medium text-gray-900">
              {filteredMenu.find(item => item.href === pathname)?.label || 'Dashboard'}
            </div>

            {/* User menu */}
            <div className="ml-auto flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-3">
                    <UserCircle className="w-5 h-5 text-gray-400" />
                    <span className="hidden sm:inline text-gray-700">{user.name}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user.name}</span>
                      <span className="text-xs text-gray-500 font-normal">{user.email}</span>
                      <span className="text-xs text-teal-600 font-medium mt-1">
                        {user.role === 'ADMIN' ? 'Administrator' : 
                         user.role === 'WALI_KELAS' ? 'Wali Kelas' : 'Guru Mapel'}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>

      <Toaster position="top-right" />
    </div>
  );
}
