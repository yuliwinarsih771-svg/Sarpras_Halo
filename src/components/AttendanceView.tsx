import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  formatShortDate,
  getCurrentTimeHHMM,
  getTodayIso,
} from '../lib/validation';
import {
  FIELD_LIMITS,
  PERSON_ROLES,
  type Attendance,
  type PersonRole,
} from '../types/sipalak';

interface AttendanceViewProps {
  attendances: Attendance[];
  loading: boolean;
  onAddAttendance: (input: {
    date: string;
    checkInTime: string;
    checkOutTime: string;
    visitorName: string;
    visitorRole: PersonRole;
    unit: string;
    activity: string;
    workstation: string;
    notes: string;
  }) => Promise<void>;
  onCheckOut: (attendanceId: string, checkOutTime: string) => Promise<void>;
  onDelete: (attendanceId: string) => Promise<void>;
}

export function AttendanceView({
  attendances,
  loading,
  onAddAttendance,
  onCheckOut,
  onDelete,
}: AttendanceViewProps) {
  const { user, profile, isAdmin } = useAuth();
  const [dateFilter, setDateFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const [date, setDate] = useState(getTodayIso());
  const [checkInTime, setCheckInTime] = useState(getCurrentTimeHHMM());
  const [visitorName, setVisitorName] = useState('');
  const [visitorRole, setVisitorRole] = useState<PersonRole>('Siswa');
  const [unit, setUnit] = useState('');
  const [activity, setActivity] = useState('');
  const [workstation, setWorkstation] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const openModal = () => {
    setDate(getTodayIso());
    setCheckInTime(getCurrentTimeHHMM());
    setVisitorName(profile?.displayName || '');
    setVisitorRole(
      profile?.role === 'guru'
        ? 'Guru'
        : profile?.role === 'teknisi'
          ? 'Teknisi'
          : 'Siswa'
    );
    setUnit(profile?.unit || '');
    setActivity('');
    setWorkstation('');
    setNotes('');
    setModalOpen(true);
  };

  const filtered = useMemo(() => {
    return attendances.filter((a) => !dateFilter || a.date === dateFilter);
  }, [attendances, dateFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim() || !unit.trim() || !activity.trim()) return;
    setSaving(true);
    try {
      await onAddAttendance({
        date,
        checkInTime,
        checkOutTime: '',
        visitorName,
        visitorRole,
        unit,
        activity,
        workstation,
        notes,
      });
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Absensi</h1>
          <p className="mt-1 text-sm text-slate-600">
            Catatan kehadiran penggunaan komputer dan kunjungan laboratorium.
          </p>
        </div>

        <button
          type="button"
          onClick={openModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1D5CE5] hover:bg-[#164BC2] text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>Catat Absensi</span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1D5CE5]"
        />
        {dateFilter && (
          <button
            type="button"
            onClick={() => setDateFilter('')}
            className="text-xs font-semibold text-[#1D5CE5] hover:underline cursor-pointer"
          >
            Reset tanggal
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                <th className="py-3 px-4">Tanggal & Jam</th>
                <th className="py-3 px-4">Pengunjung</th>
                <th className="py-3 px-4">Kelas / Unit</th>
                <th className="py-3 px-4">Kegiatan</th>
                <th className="py-3 px-4">Komputer / Meja</th>
                <th className="py-3 px-4">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-slate-500">
                    {loading ? 'Memuat absensi...' : 'Belum ada data absensi.'}
                  </td>
                </tr>
              ) : (
                filtered.map((att) => {
                  const canCheckout =
                    !att.checkOutTime && (isAdmin || att.userId === user?.uid);
                  return (
                    <tr key={att.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4 tabular-nums whitespace-nowrap">
                        <div className="text-slate-900 font-medium">
                          {formatShortDate(att.date)}
                        </div>
                        <div className="font-mono text-xs text-slate-500">
                          {att.checkInTime} – {att.checkOutTime || 'Aktif'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">{att.visitorName}</div>
                        <div className="text-xs text-slate-500">{att.visitorRole}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{att.unit}</td>
                      <td className="py-3.5 px-4 text-slate-700">{att.activity}</td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-700">
                        {att.workstation || '-'}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          {canCheckout && (
                            <button
                              type="button"
                              onClick={() =>
                                void onCheckOut(att.id, getCurrentTimeHHMM())
                              }
                              className="px-2.5 py-1.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold cursor-pointer"
                            >
                              Catat Keluar
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => void onDelete(att.id)}
                              className="px-2.5 py-1.5 rounded-md bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold cursor-pointer"
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

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
          <div className="w-full max-w-[580px] bg-white rounded-2xl border border-slate-200 shadow-2xl p-6">
            <h3 className="text-lg font-bold text-slate-900">Catat Absensi Laboratorium</h3>
            <form onSubmit={(e) => void handleSubmit(e)} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Jam masuk
                  </label>
                  <input
                    type="time"
                    required
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nama pengunjung
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={FIELD_LIMITS.displayNameMax}
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Peran
                  </label>
                  <select
                    value={visitorRole}
                    onChange={(e) => setVisitorRole(e.target.value as PersonRole)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white"
                  >
                    {PERSON_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Kelas / unit
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={FIELD_LIMITS.unitMax}
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    No. Komputer / Meja
                  </label>
                  <input
                    type="text"
                    maxLength={FIELD_LIMITS.workstationMax}
                    value={workstation}
                    onChange={(e) => setWorkstation(e.target.value)}
                    placeholder="Misal: PC-04"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Kegiatan / Mata Pelajaran
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={FIELD_LIMITS.activityMax}
                    value={activity}
                    onChange={(e) => setActivity(e.target.value)}
                    placeholder="Misal: Praktik Spreadsheet Akuntansi"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-[#1D5CE5] hover:bg-[#164BC2] disabled:opacity-60 text-white text-sm font-semibold cursor-pointer"
                >
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
