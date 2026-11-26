import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Eye,
  EyeOff,
  Lock,
  RotateCcw,
  Search,
  ShieldCheck,
  User,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { roleDisplayLabel } from '../lib/validation';
import {
  FIELD_LIMITS,
  USER_ROLES,
  type SelfSelectableRole,
  type UserProfile,
  type UserRole,
} from '../types/sipalak';

interface UsersProfileViewProps {
  activeTab: 'profil' | 'direktori';
  onChangeTab: (tab: 'profil' | 'direktori') => void;
  usersList: UserProfile[];
  onNavigateAddAccount: () => void;
  onUpdateUserByAdmin: (
    targetUid: string,
    input: {
      displayName: string;
      username?: string;
      newPassword?: string;
      role: UserRole;
      unit: string;
      idNumber: string;
      bio: string;
      active: boolean;
    }
  ) => Promise<void>;
  onDeleteUserAccount: (targetUid: string) => Promise<void>;
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

export function UsersProfileView({
  activeTab,
  onChangeTab,
  usersList,
  onNavigateAddAccount,
  onUpdateUserByAdmin,
  onDeleteUserAccount,
}: UsersProfileViewProps) {
  const { user, profile, privateInfo, isAdmin, updateMyProfile } = useAuth();

  // My Profile state
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [myRole, setMyRole] = useState<SelfSelectableRole>('pengguna');
  const [unit, setUnit] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [savingSelf, setSavingSelf] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [passwordUpdatedNotice, setPasswordUpdatedNotice] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null);
  const [selfError, setSelfError] = useState<string | null>(null);

  // Admin directory state
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('pengguna');
  const [editUnit, setEditUnit] = useState('');
  const [editIdNumber, setEditIdNumber] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [savingAdminEdit, setSavingAdminEdit] = useState(false);
  const [adminEditError, setAdminEditError] = useState<string | null>(null);
  const [confirmDeleteUid, setConfirmDeleteUid] = useState<string | null>(null);

  const syncFormFromProfile = () => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setUsername(profile.username || '');
      if (['guru', 'siswa', 'pengguna'].includes(profile.role)) {
        setMyRole(profile.role as SelfSelectableRole);
      }
      setUnit(profile.unit || '');
      setIdNumber(profile.idNumber || '');
      setBio(profile.bio || '');
    }
    if (privateInfo) {
      setEmail(privateInfo.email || user?.email || '');
      setPhone(privateInfo.phone || '');
    } else if (user?.email) {
      setEmail(user.email);
    }
    setNewPassword('');
    setShowPassword(false);
    setSelfError(null);
  };

  useEffect(() => {
    syncFormFromProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [privateInfo, profile, user]);

  const handleSaveMyProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setSelfError('Nama lengkap wajib diisi.');
      return;
    }
    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername || cleanUsername.length < 2 || !FIELD_LIMITS.usernamePattern.test(cleanUsername)) {
      setSelfError(
        'Username minimal 2 karakter dan hanya boleh berisi huruf kecil, angka, titik (.), garis bawah (_), atau tanda hubung (-).'
      );
      return;
    }
    const cleanPassword = newPassword.trim();
    if (cleanPassword && cleanPassword.length < 6) {
      setSelfError('Password masuk baru minimal harus 6 karakter.');
      return;
    }

    setSavingSelf(true);
    setSelfError(null);
    setSavedNotice(false);
    setPasswordUpdatedNotice(false);
    setPasswordNotice(null);
    try {
      const result = await updateMyProfile({
        displayName,
        username: cleanUsername,
        newPassword: cleanPassword || undefined,
        role:
          profile && ['guru', 'siswa', 'pengguna'].includes(profile.role)
            ? myRole
            : undefined,
        unit,
        idNumber,
        bio,
        email,
        phone,
      });
      setNewPassword('');
      setShowPassword(false);
      setPasswordNotice(result.passwordNotice || null);
      setPasswordUpdatedNotice(result.passwordUpdated);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 4000);
    } catch (err) {
      setSelfError(err instanceof Error ? err.message : 'Gagal memperbarui profil.');
    } finally {
      setSavingSelf(false);
    }
  };

  const openEditUser = (u: UserProfile) => {
    setEditingUser(u);
    setEditName(u.displayName);
    setEditUsername(u.username || '');
    setEditPassword('');
    setEditRole(u.role);
    setEditUnit(u.unit);
    setEditIdNumber(u.idNumber);
    setEditBio(u.bio);
    setEditActive(u.active);
    setAdminEditError(null);
  };

  const handleSaveAdminUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editName.trim()) return;
    const cleanEditPw = editPassword.trim();
    if (cleanEditPw && cleanEditPw.length < 6) {
      setAdminEditError('Password baru minimal harus 6 karakter.');
      return;
    }
    setSavingAdminEdit(true);
    setAdminEditError(null);
    try {
      await onUpdateUserByAdmin(editingUser.uid, {
        displayName: editName,
        username: editUsername.trim().toLowerCase(),
        newPassword: cleanEditPw || undefined,
        role: editRole,
        unit: editUnit,
        idNumber: editIdNumber,
        bio: editBio,
        active: editActive,
      });
      setEditingUser(null);
    } catch (err) {
      setAdminEditError(err instanceof Error ? err.message : 'Gagal memperbarui akun pengguna.');
    } finally {
      setSavingAdminEdit(false);
    }
  };

  const totalAccounts = usersList.length;

  const filteredUsers = usersList.filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      u.displayName.toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      u.unit.toLowerCase().includes(q) ||
      u.idNumber.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const canSelfSelectRole =
    profile && ['guru', 'siswa', 'pengguna'].includes(profile.role);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 space-y-6">
      {/* Top Header matching uploaded design */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 font-bold tracking-wide text-[#B91C1C]">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>{isAdmin ? 'WEWENANG EKSKLUSIF ADMIN' : 'PROFIL PENGGUNA SIPALAK'}</span>
            </span>
            <span className="text-slate-300" aria-hidden="true">
              ·
            </span>
            <span className="text-slate-500 font-medium tabular-nums">
              {isAdmin
                ? `Total Saat Ini: ${totalAccounts} Akun`
                : `${roleDisplayLabel(profile?.role || 'pengguna')} · ${profile?.active !== false ? 'Akun Aktif' : 'Nonaktif'}`}
            </span>
          </div>

          <h1 className="mt-2 flex items-center gap-2.5 text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            <Users className="w-6 h-6 text-[#B91C1C] shrink-0" />
            <span>
              {activeTab === 'direktori' && isAdmin
                ? 'Daftar Semua Akun Pengguna'
                : 'Perbarui Profil & Kredensial Pengguna'}
            </span>
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {activeTab === 'direktori' && isAdmin
              ? 'Pantau seluruh akun aktif di database server SIPALAK dan kelola hak akses secara real-time.'
              : 'Kelola identitas pengguna, username login, password masuk, dan informasi kontak. Perubahan langsung tersinkronisasi secara real-time.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={onNavigateAddAccount}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4 shrink-0" />
                <span>Tambah Akun Baru</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeTab(activeTab === 'direktori' ? 'profil' : 'direktori')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap tabular-nums"
              >
                <Users className="w-4 h-4 shrink-0 text-slate-500" />
                <span>
                  {activeTab === 'direktori'
                    ? 'Profil Saya'
                    : `Lihat Semua Akun (${totalAccounts})`}
                </span>
              </button>
            </>
          )}
        </div>
      </div>

      {activeTab === 'profil' && (
        <form onSubmit={(e) => void handleSaveMyProfile(e)} className="space-y-8">
          {selfError && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700">
              {selfError}
            </div>
          )}

          {passwordNotice && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800 flex items-start gap-2.5 leading-relaxed">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{passwordNotice}</span>
            </div>
          )}

          {savedNotice && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs text-emerald-700 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>
                Profil pengguna berhasil diperbarui secara real-time.
                {passwordUpdatedNotice ? ' Password masuk juga telah diperbarui.' : ''}
              </span>
            </div>
          )}

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
                <p className="mt-1 text-[11px] text-slate-400">
                  Nama resmi yang tampil pada jadwal, peminjaman, dan absensi
                </p>
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
                  Nomor Induk Pegawai / Guru atau Nomor Induk Siswa
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
                  placeholder="Contoh: Penanggung Jawab Lab Komputer Akuntansi"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E11D48]/30 focus:border-[#E11D48]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Status Keaktifan Akun
                </label>
                <input
                  type="text"
                  disabled
                  value={profile?.active !== false ? 'Aktif — Terhubung ke Server' : 'Nonaktif'}
                  className="w-full rounded-lg border border-slate-200 bg-slate-100/80 px-3.5 py-2.5 text-sm text-slate-700"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Unit Kerja / Kelas / Jurusan <span className="text-[#E11D48]">*</span>
                </label>
                <input
                  type="text"
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
                  Password Masuk (Baru)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Kosongkan jika tidak mengubah"
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
                  Minimal 6 karakter · Digunakan untuk login username
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Peran / Hak Akses Sistem <span className="text-[#E11D48]">*</span>
                </label>
                {canSelfSelectRole ? (
                  <select
                    value={myRole}
                    onChange={(e) => setMyRole(e.target.value as SelfSelectableRole)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E11D48]/30 focus:border-[#E11D48]"
                  >
                    <option value="pengguna">{roleSystemDescription('pengguna')}</option>
                    <option value="guru">{roleSystemDescription('guru')}</option>
                    <option value="siswa">{roleSystemDescription('siswa')}</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    disabled
                    value={roleSystemDescription(profile?.role || 'pengguna')}
                    className="w-full rounded-lg border border-slate-200 bg-slate-100/80 px-3.5 py-2.5 text-sm text-slate-700"
                  />
                )}
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
              onClick={syncFormFromProfile}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Perubahan</span>
            </button>

            <button
              type="submit"
              disabled={savingSelf}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#E11D48] hover:bg-[#BE123C] disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer shadow-sm"
            >
              <UserCheck className="w-4 h-4 shrink-0" />
              <span>{savingSelf ? 'Menyimpan...' : 'Simpan Perubahan Profil'}</span>
            </button>
          </div>
        </form>
      )}

      {activeTab === 'direktori' && isAdmin && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, @username, unit, atau peran..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50/80 pl-9 pr-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E11D48]/30 focus:border-[#E11D48]"
              />
            </div>

            <div className="text-xs text-slate-500 tabular-nums">
              {usersList.length} akun terdaftar
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                    <th className="py-3 px-4">Nama & Username</th>
                    <th className="py-3 px-4">NIP / NIS</th>
                    <th className="py-3 px-4">Peran</th>
                    <th className="py-3 px-4">Unit Kerja / Kelas</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        <div>
                          {u.displayName}
                          {u.uid === user?.uid && (
                            <span className="ml-2 text-xs text-[#E11D48] font-semibold">
                              (Anda)
                            </span>
                          )}
                        </div>
                        {u.username && (
                          <div className="text-xs font-mono text-slate-500">@{u.username}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                        {u.idNumber || '-'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800">
                          {roleDisplayLabel(u.role)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{u.unit || '-'}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold ${
                            u.active
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {u.active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openEditUser(u)}
                            className="px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold cursor-pointer"
                          >
                            Kelola Akun
                          </button>
                          {u.uid !== user?.uid &&
                            (confirmDeleteUid === u.uid ? (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    void onDeleteUserAccount(u.uid);
                                    setConfirmDeleteUid(null);
                                  }}
                                  className="px-2.5 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer"
                                >
                                  Ya, Hapus
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteUid(null)}
                                  className="px-2 py-1.5 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold cursor-pointer"
                                >
                                  Batal
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteUid(u.uid)}
                                className="px-2.5 py-1.5 rounded-md bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold cursor-pointer"
                              >
                                Hapus
                              </button>
                            ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-[520px] bg-white rounded-2xl border border-slate-200 shadow-2xl p-6">
            <h3 className="text-lg font-bold text-slate-900">Kelola Akun Pengguna</h3>
            {adminEditError && (
              <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs text-red-700">
                {adminEditError}
              </div>
            )}
            <form onSubmit={(e) => void handleSaveAdminUser(e)} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nama lengkap
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={FIELD_LIMITS.displayNameMax}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Username
                  </label>
                  <input
                    type="text"
                    maxLength={FIELD_LIMITS.usernameMax}
                    value={editUsername}
                    onChange={(e) =>
                      setEditUsername(e.target.value.replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase())
                    }
                    placeholder="username.pengguna"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Peran akses
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white"
                  >
                    {USER_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {roleDisplayLabel(r)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Status akun
                  </label>
                  <select
                    value={editActive ? 'aktif' : 'nonaktif'}
                    onChange={(e) => setEditActive(e.target.value === 'aktif')}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Unit kerja / kelas
                  </label>
                  <input
                    type="text"
                    maxLength={FIELD_LIMITS.unitMax}
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    NIP / NIS
                  </label>
                  <input
                    type="text"
                    maxLength={FIELD_LIMITS.idNumberMax}
                    value={editIdNumber}
                    onChange={(e) => setEditIdNumber(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Reset Password Baru (Opsional)
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Kosongkan jika tidak mengubah password"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingAdminEdit}
                  className="px-5 py-2 rounded-lg bg-[#E11D48] hover:bg-[#BE123C] disabled:opacity-60 text-white text-sm font-semibold cursor-pointer"
                >
                  {savingAdminEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
