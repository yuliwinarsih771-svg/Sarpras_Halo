import React, { useState } from 'react';
import {
  Check,
  Eye,
  EyeOff,
  Lock,
  RotateCcw,
  ShieldCheck,
  User,
  UserPlus,
  Users,
} from 'lucide-react';
import { roleDisplayLabel } from '../lib/validation';
import { FIELD_LIMITS, USER_ROLES, type UserRole } from '../types/sipalak';

interface AddUserAccountViewProps {
  usersCount: number;
  onCreateUserAccount: (input: {
    displayName: string;
    username: string;
    password: string;
    role: UserRole;
    unit: string;
    idNumber: string;
    email: string;
    phone: string;
    bio: string;
    active: boolean;
  }) => Promise<void>;
  onNavigateUsers: () => void;
}

function roleSystemDescription(role: UserRole): string {
  switch (role) {
    case 'admin':
      return 'Admin (Kelola Seluruh Sistem & Pengguna)';
    case 'teknisi':
      return 'Teknisi (Perawatan & Inventaris)';
    case 'guru':
      return 'Guru (Jadwal Lab, Peminjaman & Absensi)';
    case 'siswa':
      return 'Siswa (Absensi & Peminjaman)';
    default:
      return 'Pengguna / Staf (Mengisi Peminjaman & Absensi)';
  }
}

export function AddUserAccountView({
  usersCount,
  onCreateUserAccount,
  onNavigateUsers,
}: AddUserAccountViewProps) {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('guru');
  const [unit, setUnit] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [active, setActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resetForm = () => {
    setDisplayName('');
    setUsername('');
    setPassword('');
    setShowPassword(false);
    setEmail('');
    setRole('guru');
    setUnit('');
    setIdNumber('');
    setPhone('');
    setBio('');
    setActive(true);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();
    if (!displayName.trim() || cleanUsername.length < 2) {
      setErrorMsg('Nama lengkap dan username (minimal 2 karakter) wajib diisi.');
      return;
    }
    if (!FIELD_LIMITS.usernamePattern.test(cleanUsername)) {
      setErrorMsg(
        'Username hanya boleh berisi huruf kecil, angka, titik (.), garis bawah (_), atau tanda hubung (-).'
      );
      return;
    }
    if (cleanPassword.length < 6) {
      setErrorMsg('Password masuk minimal harus 6 karakter.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await onCreateUserAccount({
        displayName,
        username: cleanUsername,
        password: cleanPassword,
        role,
        unit,
        idNumber,
        email: email.trim().toLowerCase(),
        phone,
        bio,
        active,
      });
      setSuccessMsg(
        `Akun ${displayName.trim()} (@${cleanUsername}) dengan peran ${roleDisplayLabel(role)} berhasil didaftarkan dan langsung aktif untuk login menggunakan username & password.`
      );
      resetForm();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menambahkan akun pengguna.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 font-bold tracking-wide text-[#B91C1C]">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>WEWENANG EKSKLUSIF ADMIN</span>
              </span>
              <span className="text-slate-300" aria-hidden="true">
                ·
              </span>
              <span className="text-slate-500 font-medium tabular-nums">
                Total Saat Ini: {usersCount} Akun
              </span>
            </div>

            <h1 className="mt-2 flex items-center gap-2.5 text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              <UserPlus className="w-6 h-6 text-[#B91C1C] shrink-0" />
              <span>Tambah User Akun Pengguna Baru</span>
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Daftarkan akun pengguna baru Guru, Siswa, Teknisi, atau Staf ke dalam sistem. Akun langsung tersimpan di database server dan siap dipakai login.
            </p>
          </div>

          <button
            type="button"
            onClick={onNavigateUsers}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 tabular-nums self-start"
          >
            <Users className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Lihat Semua Akun ({usersCount})</span>
          </button>
        </div>

        {errorMsg && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs text-emerald-700 flex items-start gap-2.5 leading-relaxed">
            <Check className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-8">
          {/* Section 1: Identitas Lengkap Pengguna */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-[#9F1239] uppercase">
              <User className="w-4 h-4 shrink-0" />
              <span>1. IDENTITAS LENGKAP PENGGUNA</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nama Lengkap & Gelar <span className="text-[#E11D48]">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={FIELD_LIMITS.displayNameMax}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Contoh: Budi Santoso, S.Kom"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E11D48]/30 focus:border-[#E11D48]"
                />
                <p className="mt-1 text-[11px] text-slate-400">Nama resmi beserta gelar</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  NIP / NIS
                </label>
                <input
                  type="text"
                  maxLength={FIELD_LIMITS.idNumberMax}
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="Contoh: 19850720 201001 2 005"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E11D48]/30 focus:border-[#E11D48]"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Nomor Induk Pegawai atau Nomor Induk Siswa
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Jabatan / Keterangan Tugas
                </label>
                <input
                  type="text"
                  maxLength={FIELD_LIMITS.bioMax}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Contoh: Guru Pengampu Lab Akuntansi"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E11D48]/30 focus:border-[#E11D48]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Status Awal Akun
                </label>
                <select
                  value={active ? 'aktif' : 'nonaktif'}
                  onChange={(e) => setActive(e.target.value === 'aktif')}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E11D48]/30 focus:border-[#E11D48]"
                >
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Unit Kerja / Kelas / Jurusan <span className="text-[#E11D48]">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={FIELD_LIMITS.unitMax}
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="Contoh: Lab Komputer Akuntansi / XI AKL 1 — SMK Negeri 1 Sambeng"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E11D48]/30 focus:border-[#E11D48]"
                />
              </div>
            </div>
          </section>

          {/* Section 2: Kredensial Akun & Hak Akses (Login) */}
          <section className="space-y-4 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-[#9F1239] uppercase pt-2">
              <Lock className="w-4 h-4 shrink-0" />
              <span>2. KREDENSIAL AKUN & HAK AKSES (LOGIN)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Username Login <span className="text-[#E11D48]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-mono text-slate-400 pointer-events-none">
                    @
                  </span>
                  <input
                    type="text"
                    required
                    maxLength={FIELD_LIMITS.usernameMax}
                    value={username}
                    onChange={(e) =>
                      setUsername(e.target.value.replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase())
                    }
                    placeholder="budi.santoso"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/80 pl-8 pr-3.5 py-2.5 text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E11D48]/30 focus:border-[#E11D48]"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">Huruf kecil, tanpa spasi</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password Masuk <span className="text-[#E11D48]">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/80 pl-3.5 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E11D48]/30 focus:border-[#E11D48]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Digunakan langsung untuk masuk aplikasi
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Peran / Hak Akses Sistem <span className="text-[#E11D48]">*</span>
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E11D48]/30 focus:border-[#E11D48]"
                >
                  {USER_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {roleSystemDescription(r)}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-400">Menentukan wewenang tab menu</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email (Opsional)
                </label>
                <input
                  type="email"
                  maxLength={FIELD_LIMITS.emailMax}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@sekolah.sch.id"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E11D48]/30 focus:border-[#E11D48]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nomor HP / WhatsApp (Opsional)
                </label>
                <input
                  type="text"
                  maxLength={FIELD_LIMITS.phoneMax}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="081234567890"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E11D48]/30 focus:border-[#E11D48]"
                />
              </div>
            </div>
          </section>

          {/* Bottom Action Bar */}
          <div className="pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Bersihkan Form</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#E11D48] hover:bg-[#BE123C] disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer shadow-sm"
            >
              <UserPlus className="w-4 h-4 shrink-0" />
              <span>{saving ? 'Menyimpan...' : 'Simpan & Daftarkan Akun Baru'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
