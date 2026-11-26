import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function LoginView() {
  const {
    needsSetup,
    signInWithPassword,
    bootstrapAdmin,
    authLoading,
    authError,
  } = useAuth();

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // First-run admin setup state
  const [setupName, setSetupName] = useState('Administrator SIPALAK');
  const [setupUsername, setSetupUsername] = useState('admin');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupUnit, setSetupUnit] = useState('Lab Komputer Akuntansi');
  const [showSetupPassword, setShowSetupPassword] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signInWithPassword(identifier, password);
  };

  const handleBootstrapSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await bootstrapAdmin({
      displayName: setupName,
      username: setupUsername,
      password: setupPassword,
      unit: setupUnit,
    });
  };

  if (needsSetup) {
    return (
      <div className="min-h-screen bg-[#0D1C36] flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-[420px] bg-white rounded-2xl border border-slate-200/80 shadow-2xl p-8">
          <div className="text-xl font-extrabold tracking-tight text-[#0D1C36]">
            SIPALAK
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900 tracking-tight">
            Buat Akun Admin Pertama
          </h1>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            Sistem Pelayanan Laboratorium Komputer
            <br />
            SMK Negeri 1 Sambeng
          </p>

          {authError && (
            <div className="mt-5 rounded-lg bg-amber-50 border border-amber-200 px-3.5 py-2.5 text-xs text-amber-900 leading-relaxed">
              {authError}
            </div>
          )}

          <form onSubmit={(e) => void handleBootstrapSubmit(e)} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="setup-name"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Nama lengkap
              </label>
              <input
                id="setup-name"
                type="text"
                required
                value={setupName}
                onChange={(e) => setSetupName(e.target.value)}
                placeholder="Administrator SIPALAK"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              />
            </div>

            <div>
              <label
                htmlFor="setup-username"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Nama pengguna (Username)
              </label>
              <input
                id="setup-username"
                type="text"
                required
                autoComplete="username"
                value={setupUsername}
                onChange={(e) =>
                  setSetupUsername(e.target.value.replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase())
                }
                placeholder="admin"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              />
            </div>

            <div>
              <label
                htmlFor="setup-password"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Kata sandi baru (minimal 6 karakter)
              </label>
              <div className="relative">
                <input
                  id="setup-password"
                  type={showSetupPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={setupPassword}
                  onChange={(e) => setSetupPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-300 pl-3.5 pr-10 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowSetupPassword((prev) => !prev)}
                  aria-label={showSetupPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  {showSetupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="setup-unit"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Unit kerja
              </label>
              <input
                id="setup-unit"
                type="text"
                value={setupUnit}
                onChange={(e) => setSetupUnit(e.target.value)}
                placeholder="Lab Komputer Akuntansi"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 px-4 rounded-lg bg-[#1D5CE5] hover:bg-[#164BC2] disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              {authLoading ? 'Menyimpan...' : 'Buat Akun & Masuk'}
            </button>
          </form>

          <div className="mt-5 rounded-xl bg-slate-50 border border-slate-200/80 p-4 text-xs text-slate-600 space-y-1 leading-relaxed">
            <div className="font-semibold text-slate-700">Pengaturan Awal Database</div>
            <p>
              Belum ada akun terdaftar di server. Simpan username dan kata sandi Admin pertama
              untuk mulai masuk dan menambahkan pengguna lain.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D1C36] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-[420px] bg-white rounded-2xl border border-slate-200/80 shadow-2xl p-8">
        <div className="text-xl font-extrabold tracking-tight text-[#0D1C36]">
          SIPALAK
        </div>

        <h1 className="mt-5 text-2xl font-bold text-slate-900 tracking-tight">
          Masuk ke Sistem
        </h1>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          Sistem Pelayanan Laboratorium Komputer
          <br />
          SMK Negeri 1 Sambeng
        </p>

        {authError && (
          <div className="mt-5 rounded-lg bg-amber-50 border border-amber-200 px-3.5 py-2.5 text-xs text-amber-900 leading-relaxed">
            {authError}
          </div>
        )}

        <form onSubmit={(e) => void handleLoginSubmit(e)} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="login-identifier"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Nama pengguna
            </label>
            <input
              id="login-identifier"
              type="text"
              required
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Masukkan username"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-shadow"
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Kata sandi
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-300 pl-3.5 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-shadow"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={authLoading}
            className="w-full py-2.5 px-4 rounded-lg bg-[#1D5CE5] hover:bg-[#164BC2] disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            {authLoading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <div className="mt-5 rounded-xl bg-slate-50 border border-slate-200/80 p-4 text-xs text-slate-600 space-y-1.5 leading-relaxed">
          <div className="font-semibold text-slate-700">Informasi Masuk Akun</div>
          <p>
            Masuk langsung menggunakan <span className="font-semibold text-slate-700">username</span>{' '}
            dan <span className="font-semibold text-slate-700">kata sandi</span> yang tersimpan pada
            data pengguna.
          </p>
        </div>
      </div>
    </div>
  );
}
