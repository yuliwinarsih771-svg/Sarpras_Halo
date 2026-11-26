import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatShortDate } from '../lib/validation';
import type { LabSchedule, ScheduleStatus } from '../types/sipalak';
import { StatusBadge } from './ConditionBadge';

interface ScheduleViewProps {
  schedules: LabSchedule[];
  loading: boolean;
  onOpenAdd: () => void;
  onUpdateStatus: (scheduleId: string, status: ScheduleStatus) => Promise<void>;
  onDelete: (scheduleId: string) => Promise<void>;
}

export function ScheduleView({
  schedules,
  loading,
  onOpenAdd,
  onUpdateStatus,
  onDelete,
}: ScheduleViewProps) {
  const { user, isAdmin } = useAuth();
  const [statusFilter, setStatusFilter] = useState('Semua');

  const filtered = schedules.filter(
    (item) => statusFilter === 'Semua' || item.status === statusFilter
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Jadwal Laboratorium
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Ajukan dan periksa jadwal penggunaan satu laboratorium.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1D5CE5] hover:bg-[#164BC2] text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>Ajukan Jadwal</span>
        </button>
      </div>

      {/* Info notice matching screenshot */}
      <div className="rounded-xl bg-blue-50/70 border border-blue-200/70 px-4 py-3 text-xs sm:text-sm text-slate-700">
        Sistem memeriksa tabrakan waktu pada tanggal yang sama. Jadwal berstatus Menunggu belum dianggap sebagai jadwal yang disetujui.
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {['Semua', 'Menunggu', 'Disetujui', 'Selesai', 'Ditolak'].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              statusFilter === st
                ? 'bg-[#0D1C36] text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Kegiatan</th>
                <th className="py-3 px-4">Pemohon</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-slate-500">
                    {loading ? 'Memuat jadwal...' : 'Belum ada data.'}
                  </td>
                </tr>
              ) : (
                filtered.map((sch) => {
                  const canDelete =
                    isAdmin || (sch.requesterId === user?.uid && sch.status === 'Menunggu');
                  return (
                    <tr key={sch.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4 text-slate-800 tabular-nums whitespace-nowrap">
                        {formatShortDate(sch.date)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                        {sch.startTime} - {sch.endTime}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900">{sch.activity}</td>
                      <td className="py-3.5 px-4 text-slate-700">
                        <div>{sch.requesterName}</div>
                        <div className="text-xs text-slate-500">{sch.requesterRole}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{sch.unit}</td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={sch.status} />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          {isAdmin && sch.status === 'Menunggu' && (
                            <>
                              <button
                                type="button"
                                onClick={() => void onUpdateStatus(sch.id, 'Disetujui')}
                                className="px-2.5 py-1.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold cursor-pointer"
                              >
                                Setujui
                              </button>
                              <button
                                type="button"
                                onClick={() => void onUpdateStatus(sch.id, 'Ditolak')}
                                className="px-2.5 py-1.5 rounded-md bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold cursor-pointer"
                              >
                                Tolak
                              </button>
                            </>
                          )}
                          {isAdmin && sch.status === 'Disetujui' && (
                            <button
                              type="button"
                              onClick={() => void onUpdateStatus(sch.id, 'Selesai')}
                              className="px-2.5 py-1.5 rounded-md bg-blue-50 hover:bg-blue-100 text-[#1D5CE5] text-xs font-semibold cursor-pointer"
                            >
                              Tandai Selesai
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => void onDelete(sch.id)}
                              className="px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                            >
                              Hapus
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
