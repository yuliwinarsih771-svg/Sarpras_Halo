import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatShortDate, getTodayIso } from '../lib/validation';
import type { Asset, LabSchedule, Loan, NavSection } from '../types/sipalak';
import { ConditionBadge, StatusBadge } from './ConditionBadge';

interface DashboardViewProps {
  assets: Asset[];
  loans: Loan[];
  schedules: LabSchedule[];
  loading: boolean;
  onNavigate: (nav: NavSection) => void;
  onOpenAddAsset: () => void;
  onOpenAddSchedule: () => void;
  onSeedSampleAssets: () => Promise<void>;
}

export function DashboardView({
  assets,
  loans,
  schedules,
  loading,
  onNavigate,
  onOpenAddAsset,
  onOpenAddSchedule,
  onSeedSampleAssets,
}: DashboardViewProps) {
  const { profile, isAdmin } = useAuth();
  const [seeding, setSeeding] = useState(false);

  const totalAssets = assets.length;
  const goodCount = assets.filter((a) => a.condition === 'Baik').length;
  const attentionCount = assets.filter((a) => a.condition !== 'Baik').length;
  const activeTransactions = loans.filter((l) =>
    ['Menunggu', 'Disetujui', 'Dipinjam'].includes(l.status)
  ).length;

  const recentAssets = assets.slice(0, 5);
  const today = getTodayIso();
  const upcomingSchedules = schedules
    .filter((s) => s.date >= today && s.status !== 'Ditolak' && s.status !== 'Selesai')
    .slice(0, 5);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await onSeedSampleAssets();
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Row matching screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Selamat datang, {profile?.displayName || 'Pengguna SIPALAK'}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {isAdmin
              ? 'Panel administrasi laboratorium.'
              : 'Panel layanan dan informasi laboratorium komputer.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {isAdmin && assets.length === 0 && !loading && (
            <button
              type="button"
              disabled={seeding}
              onClick={() => void handleSeed()}
              className="px-4 py-2.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              {seeding ? 'Memuat...' : 'Muat Data Contoh'}
            </button>
          )}
          {isAdmin ? (
            <button
              type="button"
              onClick={onOpenAddAsset}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1D5CE5] hover:bg-[#164BC2] text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Tambah Aset</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAddSchedule}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1D5CE5] hover:bg-[#164BC2] text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Ajukan Jadwal</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-5">
          <div className="text-xs font-medium text-slate-500">Total Aset</div>
          <div className="mt-2 text-3xl font-bold text-slate-900 tabular-nums">
            {loading ? '—' : totalAssets}
          </div>
          <div className="mt-1.5 text-xs text-slate-500">Seluruh perangkat</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5">
          <div className="text-xs font-medium text-slate-500">Kondisi Baik</div>
          <div className="mt-2 text-3xl font-bold text-slate-900 tabular-nums">
            {loading ? '—' : goodCount}
          </div>
          <div className="mt-1.5 text-xs text-slate-500">Siap digunakan</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5">
          <div className="text-xs font-medium text-slate-500">Perlu Perhatian</div>
          <div className="mt-2 text-3xl font-bold text-slate-900 tabular-nums">
            {loading ? '—' : attentionCount}
          </div>
          <div className="mt-1.5 text-xs text-slate-500">Rusak atau perlu perawatan</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5">
          <div className="text-xs font-medium text-slate-500">Transaksi Aktif</div>
          <div className="mt-2 text-3xl font-bold text-slate-900 tabular-nums">
            {loading ? '—' : activeTransactions}
          </div>
          <div className="mt-1.5 text-xs text-slate-500">Menunggu, disetujui, atau dipinjam</div>
        </div>
      </div>

      {/* 2-Column Split: Inventaris Terbaru & Agenda Jadwal Mendatang */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/80 p-5 flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="text-base font-bold text-slate-900">Inventaris Terbaru</h2>
            <button
              type="button"
              onClick={() => onNavigate('inventaris')}
              className="text-xs font-semibold text-[#1D5CE5] hover:underline cursor-pointer whitespace-nowrap"
            >
              Lihat semua
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                  <th className="py-2.5 pr-3">Kode</th>
                  <th className="py-2.5 px-3">Nama Aset</th>
                  <th className="py-2.5 pl-3">Kondisi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {recentAssets.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-10 text-center text-sm text-slate-500">
                      {loading ? 'Memuat inventaris...' : 'Belum ada data inventaris.'}
                    </td>
                  </tr>
                ) : (
                  recentAssets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-slate-50/70">
                      <td className="py-3 pr-3 font-mono text-xs font-medium text-slate-700 whitespace-nowrap">
                        {asset.code}
                      </td>
                      <td className="py-3 px-3 text-slate-900 font-medium">{asset.name}</td>
                      <td className="py-3 pl-3">
                        <ConditionBadge condition={asset.condition} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/80 p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-4">Agenda Jadwal Mendatang</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                    <th className="py-2.5 pr-3">Tanggal</th>
                    <th className="py-2.5 px-3">Waktu</th>
                    <th className="py-2.5 pl-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {upcomingSchedules.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-10 text-center text-sm text-slate-500">
                        Belum ada data jadwal mendatang.
                      </td>
                    </tr>
                  ) : (
                    upcomingSchedules.map((sch) => (
                      <tr key={sch.id} className="hover:bg-slate-50/70">
                        <td className="py-3 pr-3 text-xs text-slate-700 tabular-nums whitespace-nowrap">
                          {formatShortDate(sch.date)}
                          <div className="text-slate-900 font-medium truncate max-w-[140px]">
                            {sch.activity}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                          {sch.startTime} - {sch.endTime}
                        </td>
                        <td className="py-3 pl-3">
                          <StatusBadge status={sch.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onNavigate('jadwal')}
              className="px-3.5 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1D5CE5] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              Kelola jadwal
            </button>
            <button
              type="button"
              onClick={() => onNavigate('peminjaman')}
              className="px-3.5 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1D5CE5] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              Kelola peminjaman
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
