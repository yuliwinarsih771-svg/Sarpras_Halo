import { Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatIndoDate, roleDisplayLabel } from '../lib/validation';
import type { NavSection } from '../types/sipalak';

const SECTION_LABELS: Record<NavSection, string> = {
  dashboard: 'Dashboard',
  inventaris: 'Inventaris',
  peminjaman: 'Peminjaman',
  jadwal: 'Jadwal Lab',
  maintenance: 'Maintenance',
  pengguna: 'Pengguna',
  'tambah-pengguna': 'Tambah Akun Pengguna',
  absensi: 'Absensi',
  laporan: 'Laporan',
};

interface TopHeaderProps {
  activeNav: NavSection;
  onOpenMobileMenu: () => void;
  onNavigateProfile: () => void;
}

export function TopHeader({
  activeNav,
  onOpenMobileMenu,
  onNavigateProfile,
}: TopHeaderProps) {
  const { profile, logout } = useAuth();
  const title = SECTION_LABELS[activeNav];
  const todayLabel = formatIndoDate(new Date());

  return (
    <header className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5 no-print">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Buka menu navigasi"
            className="lg:hidden p-2 -ml-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="text-xs text-slate-500 truncate">
              Sistem Informasi / {title}
            </div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight truncate">
              {title}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-5 shrink-0">
          <div className="hidden md:block text-right">
            <div className="text-xs font-medium text-slate-700">
              Laboratorium Komputer Akuntansi
            </div>
            <div className="text-xs text-slate-500">{todayLabel}</div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onNavigateProfile}
              className="text-right hover:bg-slate-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
              title="Buka profil pengguna"
            >
              <div className="text-xs sm:text-sm font-semibold text-slate-800 max-w-[160px] sm:max-w-[220px] truncate">
                {profile?.displayName || 'Pengguna'}
              </div>
              <div className="text-[11px] text-slate-500">
                {roleDisplayLabel(profile?.role || 'pengguna')}
                {profile?.unit ? ` · ${profile.unit}` : ''}
              </div>
            </button>

            <button
              type="button"
              onClick={() => void logout()}
              className="px-3.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Keluar
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
