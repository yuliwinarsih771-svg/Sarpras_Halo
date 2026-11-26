import React, { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatShortDate, getTodayIso } from '../lib/validation';
import {
  FIELD_LIMITS,
  LOAN_STATUSES,
  PERSON_ROLES,
  type Asset,
  type Loan,
  type LoanStatus,
  type PersonRole,
} from '../types/sipalak';
import { StatusBadge } from './ConditionBadge';

interface LoansViewProps {
  assets: Asset[];
  loans: Loan[];
  loading: boolean;
  onAddLoan: (input: {
    asset: Asset;
    borrowerName: string;
    borrowerRole: PersonRole;
    unit: string;
    borrowDate: string;
    returnDate: string;
    purpose: string;
    notes: string;
  }) => Promise<void>;
  onUpdateLoanStatus: (loanId: string, status: LoanStatus) => Promise<void>;
  onDeleteLoan: (loanId: string) => Promise<void>;
}

export function LoansView({
  assets,
  loans,
  loading,
  onAddLoan,
  onUpdateLoanStatus,
  onDeleteLoan,
}: LoansViewProps) {
  const { user, profile, isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [modalOpen, setModalOpen] = useState(false);

  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerRole, setBorrowerRole] = useState<PersonRole>('Guru');
  const [unit, setUnit] = useState('');
  const [borrowDate, setBorrowDate] = useState(getTodayIso());
  const [returnDate, setReturnDate] = useState(getTodayIso());
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openModal = () => {
    setSelectedAssetId(assets[0]?.id || '');
    setBorrowerName(profile?.displayName || '');
    setBorrowerRole(
      profile?.role === 'siswa' ? 'Siswa' : profile?.role === 'teknisi' ? 'Teknisi' : 'Guru'
    );
    setUnit(profile?.unit || '');
    const today = getTodayIso();
    setBorrowDate(today);
    setReturnDate(today);
    setPurpose('');
    setNotes('');
    setFormError(null);
    setModalOpen(true);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return loans.filter((l) => {
      const matchStatus = statusFilter === 'Semua' || l.status === statusFilter;
      const matchSearch =
        !q ||
        l.assetCode.toLowerCase().includes(q) ||
        l.assetName.toLowerCase().includes(q) ||
        l.borrowerName.toLowerCase().includes(q) ||
        l.unit.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [loans, search, statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const asset = assets.find((a) => a.id === selectedAssetId);
    if (!asset) {
      setFormError('Pilih perangkat inventaris terlebih dahulu.');
      return;
    }
    if (!borrowerName.trim() || !unit.trim() || !purpose.trim()) {
      setFormError('Nama peminjam, kelas/unit, dan keperluan wajib diisi.');
      return;
    }
    if (returnDate < borrowDate) {
      setFormError('Tanggal kembali tidak boleh lebih awal dari tanggal pinjam.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      await onAddLoan({
        asset,
        borrowerName,
        borrowerRole,
        unit,
        borrowDate,
        returnDate,
        purpose,
        notes,
      });
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal mengajukan peminjaman.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Peminjaman</h1>
          <p className="mt-1 text-sm text-slate-600">
            Pengajuan peminjaman perangkat laboratorium dan pemantauan pengembalian secara real-time.
          </p>
        </div>

        <button
          type="button"
          onClick={openModal}
          disabled={assets.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1D5CE5] hover:bg-[#164BC2] disabled:opacity-50 text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>Ajukan Peminjaman</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari perangkat, peminjam..."
            className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D5CE5]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1D5CE5]"
        >
          <option value="Semua">Semua status</option>
          {LOAN_STATUSES.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                <th className="py-3 px-4">Perangkat</th>
                <th className="py-3 px-4">Peminjam</th>
                <th className="py-3 px-4">Periode</th>
                <th className="py-3 px-4">Keperluan</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-slate-500">
                    {loading
                      ? 'Memuat data peminjaman...'
                      : 'Belum ada transaksi peminjaman.'}
                  </td>
                </tr>
              ) : (
                filtered.map((loan) => {
                  const canDelete =
                    isAdmin || (loan.requesterId === user?.uid && loan.status === 'Menunggu');
                  return (
                    <tr key={loan.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-xs font-semibold text-slate-700">
                          {loan.assetCode}
                        </div>
                        <div className="font-medium text-slate-900">{loan.assetName}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">{loan.borrowerName}</div>
                        <div className="text-xs text-slate-500">
                          {loan.borrowerRole} · {loan.unit}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-700 tabular-nums whitespace-nowrap">
                        <div>Pinjam: {formatShortDate(loan.borrowDate)}</div>
                        <div>Kembali: {formatShortDate(loan.returnDate)}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 max-w-[220px]">
                        <div className="truncate">{loan.purpose}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={loan.status} />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          {isAdmin && loan.status === 'Menunggu' && (
                            <>
                              <button
                                type="button"
                                onClick={() => void onUpdateLoanStatus(loan.id, 'Disetujui')}
                                className="px-2.5 py-1.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold cursor-pointer"
                              >
                                Setujui
                              </button>
                              <button
                                type="button"
                                onClick={() => void onUpdateLoanStatus(loan.id, 'Ditolak')}
                                className="px-2.5 py-1.5 rounded-md bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold cursor-pointer"
                              >
                                Tolak
                              </button>
                            </>
                          )}
                          {isAdmin && loan.status === 'Disetujui' && (
                            <button
                              type="button"
                              onClick={() => void onUpdateLoanStatus(loan.id, 'Dipinjam')}
                              className="px-2.5 py-1.5 rounded-md bg-blue-50 hover:bg-blue-100 text-[#1D5CE5] text-xs font-semibold cursor-pointer"
                            >
                              Serahkan
                            </button>
                          )}
                          {isAdmin && (loan.status === 'Dipinjam' || loan.status === 'Disetujui') && (
                            <button
                              type="button"
                              onClick={() => void onUpdateLoanStatus(loan.id, 'Dikembalikan')}
                              className="px-2.5 py-1.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold cursor-pointer"
                            >
                              Dikembalikan
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => void onDeleteLoan(loan.id)}
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

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
          <div className="w-full max-w-[600px] bg-white rounded-2xl border border-slate-200 shadow-2xl p-6">
            <h3 className="text-lg font-bold text-slate-900">Ajukan Peminjaman Perangkat</h3>
            {formError && (
              <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs text-red-700">
                {formError}
              </div>
            )}

            <form onSubmit={(e) => void handleSubmit(e)} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Pilih aset inventaris
                  </label>
                  <select
                    value={selectedAssetId}
                    onChange={(e) => setSelectedAssetId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#1D5CE5]"
                  >
                    {assets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.code} — {a.name} ({a.condition})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nama peminjam
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={FIELD_LIMITS.displayNameMax}
                    value={borrowerName}
                    onChange={(e) => setBorrowerName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D5CE5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Peran
                  </label>
                  <select
                    value={borrowerRole}
                    onChange={(e) => setBorrowerRole(e.target.value as PersonRole)}
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
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D5CE5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Tanggal pinjam
                  </label>
                  <input
                    type="date"
                    required
                    value={borrowDate}
                    onChange={(e) => setBorrowDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D5CE5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Rencana tanggal kembali
                  </label>
                  <input
                    type="date"
                    required
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D5CE5]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Keperluan peminjaman
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={FIELD_LIMITS.purposeMax}
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Misal: Ujian Praktik Kejuruan"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D5CE5]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Catatan tambahan (opsional)
                  </label>
                  <input
                    type="text"
                    maxLength={FIELD_LIMITS.notesMax}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D5CE5]"
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
