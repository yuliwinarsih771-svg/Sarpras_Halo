import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTodayIso, hasTimeOverlap } from '../lib/validation';
import {
  FIELD_LIMITS,
  PERSON_ROLES,
  type LabSchedule,
  type PersonRole,
} from '../types/sipalak';

interface ScheduleFormModalProps {
  open: boolean;
  existingSchedules: LabSchedule[];
  onClose: () => void;
  onSubmit: (data: {
    date: string;
    startTime: string;
    endTime: string;
    activity: string;
    requesterName: string;
    requesterRole: PersonRole;
    unit: string;
  }) => Promise<void>;
}

export function ScheduleFormModal({
  open,
  existingSchedules,
  onClose,
  onSubmit,
}: ScheduleFormModalProps) {
  const { profile } = useAuth();
  const [date, setDate] = useState(getTodayIso());
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [activity, setActivity] = useState('');
  const [requesterName, setRequesterName] = useState('');
  const [requesterRole, setRequesterRole] = useState<PersonRole>('Guru');
  const [unit, setUnit] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDate(getTodayIso());
    setStartTime('');
    setEndTime('');
    setActivity('');
    setRequesterName(profile?.displayName || '');
    const defaultRole: PersonRole =
      profile?.role === 'siswa'
        ? 'Siswa'
        : profile?.role === 'teknisi'
          ? 'Teknisi'
          : 'Guru';
    setRequesterRole(defaultRole);
    setUnit(profile?.unit || '');
    setFormError(null);
  }, [open, profile]);

  if (!open) return null;

  const conflictWithApproved = existingSchedules.find(
    (s) =>
      s.date === date &&
      s.status === 'Disetujui' &&
      hasTimeOverlap(startTime, endTime, s.startTime, s.endTime)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !startTime || !endTime || !activity.trim() || !requesterName.trim() || !unit.trim()) {
      setFormError('Semua kolom wajib diisi lengkap.');
      return;
    }
    if (startTime >= endTime) {
      setFormError('Jam selesai harus lebih akhir daripada jam mulai.');
      return;
    }
    if (conflictWithApproved) {
      setFormError(
        `Tabrakan jadwal terdeteksi dengan kegiatan "${conflictWithApproved.activity}" (${conflictWithApproved.startTime} - ${conflictWithApproved.endTime}) yang sudah disetujui.`
      );
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      await onSubmit({
        date,
        startTime,
        endTime,
        activity,
        requesterName,
        requesterRole,
        unit,
      });
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal mengajukan jadwal.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
      <div className="w-full max-w-[600px] bg-white rounded-2xl border border-slate-200 shadow-2xl p-6">
        <h3 className="text-lg font-bold text-slate-900">Ajukan Jadwal Laboratorium</h3>

        {formError && (
          <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs text-red-700 leading-relaxed">
            {formError}
          </div>
        )}

        {!formError && conflictWithApproved && (
          <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-3.5 py-2.5 text-xs text-amber-800 leading-relaxed">
            Perhatian: Jam tersebut bertabrakan dengan jadwal disetujui "{conflictWithApproved.activity}" ({conflictWithApproved.startTime} - {conflictWithApproved.endTime}).
          </div>
        )}

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
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D5CE5]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Jam mulai
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D5CE5]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Jam selesai
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D5CE5]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kegiatan
              </label>
              <input
                type="text"
                required
                maxLength={FIELD_LIMITS.activityMax}
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                placeholder="Misal: Praktik Akuntansi Komputer"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D5CE5]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama pemohon
              </label>
              <input
                type="text"
                required
                maxLength={FIELD_LIMITS.displayNameMax}
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D5CE5]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Peran
              </label>
              <select
                value={requesterRole}
                onChange={(e) => setRequesterRole(e.target.value as PersonRole)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#1D5CE5]"
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
                placeholder="Misal: XI AKL 2"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D5CE5]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-[#1D5CE5] hover:bg-[#164BC2] disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
