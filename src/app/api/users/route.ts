import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/jsondb';
import { verify } from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Get all users
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const decoded = verify(token, JWT_SECRET) as { userId: string; role: string };
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Tidak memiliki akses' }, { status: 403 });
    }

    const users = db.getUsers().map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
    }));

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// Create new user
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const decoded = verify(token, JWT_SECRET) as { userId: string; role: string };
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Tidak memiliki akses' }, { status: 403 });
    }

    const { name, email, password, role } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: 'Nama, email, dan password harus diisi' }, { status: 400 });
    }

    // Check if email already exists
    const existing = db.getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ success: false, error: 'Email sudah terdaftar' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = db.createUser({
      name,
      email,
      password: hashedPassword,
      role: role || 'GURU_MAPEL',
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Guru berhasil ditambahkan',
      data: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// Update user
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const decoded = verify(token, JWT_SECRET) as { userId: string; role: string };
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Tidak memiliki akses' }, { status: 403 });
    }

    const { id, name, email, password, role } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID tidak ditemukan' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = db.updateUser(id, updateData);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Data guru berhasil diperbarui',
      data: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// Delete user
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const decoded = verify(token, JWT_SECRET) as { userId: string; role: string };
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Tidak memiliki akses' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID tidak ditemukan' }, { status: 400 });
    }

    // Prevent deleting self
    if (id === decoded.userId) {
      return NextResponse.json({ success: false, error: 'Tidak dapat menghapus akun sendiri' }, { status: 400 });
    }

    const deleted = db.deleteUser(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'User tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Guru berhasil dihapus' });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
