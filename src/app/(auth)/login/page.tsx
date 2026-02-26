'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`Selamat datang, ${data.user.name}!`);
        router.push('/');
        router.refresh();
      } else {
        toast.error(data.error || 'Login gagal');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl shadow-lg mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Sistem Input Nilai</h1>
          <p className="text-gray-500 mt-1">Masuk ke akun Anda</p>
        </div>

        {/* Login Card */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">Login</CardTitle>
            <CardDescription className="text-center">
              Masukkan email dan password Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@sekolah.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Masuk'
                )}
              </Button>
            </form>

            {/* Demo accounts */}
            <div className="mt-6 pt-6 border-t">
              <p className="text-xs text-gray-500 text-center mb-3">Akun Demo:</p>
              <div className="space-y-2 text-xs">
                <button
                  type="button"
                  onClick={() => { setEmail('admin@sekolah.com'); setPassword('password123'); }}
                  className="w-full text-left px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <span className="font-medium text-gray-700">Admin:</span>
                  <span className="text-gray-500 ml-2">admin@sekolah.com</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail('budi@sekolah.com'); setPassword('password123'); }}
                  className="w-full text-left px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <span className="font-medium text-gray-700">Guru Mapel:</span>
                  <span className="text-gray-500 ml-2">budi@sekolah.com</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail('sri@sekolah.com'); setPassword('password123'); }}
                  className="w-full text-left px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <span className="font-medium text-gray-700">Wali Kelas:</span>
                  <span className="text-gray-500 ml-2">sri@sekolah.com</span>
                </button>
              </div>
              <p className="text-xs text-gray-400 text-center mt-3">Password: password123</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
