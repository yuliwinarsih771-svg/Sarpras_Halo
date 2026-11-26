import {
  ArrowLeftRight,
  CalendarDays,
  CheckSquare,
  FileText,
  LayoutGrid,
  Monitor,
  UserPlus,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import type { NavSection } from '../types/sipalak';

interface SidebarProps {
  activeNav: NavSection;
  onSelectNav: (nav: NavSection) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  isAdmin: boolean;
}

interface NavGroup {
  heading: string;
  items: { id: NavSection; label: string; icon: typeof LayoutGrid }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    heading: 'RINGKASAN',
    items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutGrid }],
  },
  {
    heading: 'MANAJEMEN LAB',
    items: [
      { id: 'inventaris', label: 'Inventaris', icon: Monitor },
      { id: 'peminjaman', label: 'Peminjaman', icon: ArrowLeftRight },
      { id: 'jadwal', label: 'Jadwal Lab', icon: CalendarDays },
      { id: 'maintenance', label: 'Maintenance', icon: Wrench },
      { id: 'pengguna', label: 'Pengguna', icon: Users },
    ],
  },
  {
    heading: 'ADMINISTRASI',
    items: [
      { id: 'absensi', label: 'Absensi', icon: CheckSquare },
      { id: 'laporan', label: 'Laporan', icon: FileText },
    ],
  },
];

export function Sidebar({
  activeNav,
  onSelectNav,
  mobileOpen,
  onCloseMobile,
  isAdmin,
}: SidebarProps) {
  const handleSelect = (id: NavSection) => {
    onSelectNav(id);
    onCloseMobile();
  };

  const navGroups = NAV_GROUPS.map((group) => {
    if (group.heading !== 'MANAJEMEN LAB' || !isAdmin) return group;
    return {
      ...group,
      items: [
        ...group.items,
        { id: 'tambah-pengguna' as NavSection, label: 'Tambah Akun', icon: UserPlus },
      ],
    };
  });

  const navContent = (
    <div className="flex flex-col h-full bg-[#0D1C36] text-slate-200 select-none">
      {/* Brand header matching screenshot */}
      <div className="px-5 pt-5 pb-4 border-b border-white/10">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-white shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="4" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M8 20h8M12 16v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <div className="text-lg font-extrabold tracking-wide text-white leading-tight">
                SIPALAK
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Tutup menu"
            className="lg:hidden p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-2.5 text-[11px] leading-snug text-slate-300/90">
          Sistem Pelayanan Laboratorium Komputer
          <div className="text-slate-400">SMK Negeri 1 Sambeng</div>
        </div>
      </div>

      {/* Navigation groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5" aria-label="Menu utama">
        {navGroups.map((group) => (
          <div key={group.heading}>
            <div className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-slate-400">
              {group.heading}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-[#20355B] text-white border border-white/15'
                        : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0 opacity-90" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden lg:block w-[252px] shrink-0 min-h-screen no-print">
        <div className="sticky top-0 h-screen">{navContent}</div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex no-print">
          <div
            className="fixed inset-0 bg-slate-900/60"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative w-[264px] max-w-[82vw] h-full z-10 shadow-2xl">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
