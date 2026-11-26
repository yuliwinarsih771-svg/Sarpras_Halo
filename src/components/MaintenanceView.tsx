import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatShortDate, getTodayIso } from '../lib/validation';
import {
  ASSET_CONDITIONS,
  FIELD_LIMITS,
  MAINTENANCE_STATUSES,
  type Asset,
  type AssetCondition,
  type Maintenance,
  type MaintenanceStatus,
} from '../types/sipalak';
import { ConditionBadge, StatusBadge } from './ConditionBadge';

interface MaintenanceViewProps {
  assets: Asset[];
  maintenances: Maintenance[];
  loading: boolean;
  onAddMaintenance: (input: {
    asset: Asset;
    issue: string;
    actionTaken: string;
    technicianName: string;
    maintenanceDate: string;
    status: MaintenanceStatus;
    resultingCondition: AssetCondition;
    syncAssetCondition?: boolean;
  }) => Promise<void>;
  onUpdateMaintenance: (
    maintenanceId: string,
    assetId: string,
    input: {
      issue: string;
      actionTaken: string;
      technicianName: string;
      maintenanceDate: string;
      status: MaintenanceStatus;
      resultingCondition: AssetCondition;
      syncAssetCondition?: boolean;
    }
  ) => Promise<void>;
  onDeleteMaintenance: (maintenanceId: string) => Promise<void>;
}

export function MaintenanceView({
  assets,
  maintenances,
  loading,
  onAddMaintenance,
  onUpdateMaintenance,
  onDeleteMaintenance,
}: MaintenanceViewProps) {
  const { profile, isAdmin } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Maintenance | null>(null);

  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [issue, setIssue] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [technicianName, setTechnicianName] = useState('');
  const [maintenanceDate, setMaintenanceDate] = useState(getTodayIso());
  const [status, setStatus] = useState<MaintenanceStatus>('Dijadwalkan');
  const [resultingCondition, setResultingCondition] =
    useState<AssetCondition>('Perlu perawatan');
  const [syncAssetCondition, setSyncAssetCondition] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openAdd = () => {
    setEditing(null);
    setSelectedAssetId(assets[0]?.id || '');
    setIssue('');
    setActionTaken('');
    setTechnicianName(profile?.displayName || '');
    setMaintenanceDate(getTodayIso());
    setStatus('Dijadwalkan');
    setResultingCondition('Perlu perawatan');
    setSyncAssetCondition(true);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (item: Maintenance) => {
    setEditing(item);
    setSelectedAssetId(item.assetId);
    setIssue(item.issue);
    setActionTaken(item.actionTaken);
    setTechnicianName(item.technicianName);
    setMaintenanceDate(item.maintenanceDate);
    setStatus(item.status);
    setResultingCondition(item.resultingCondition);
    setSyncAssetCondition(true);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue.trim() || !technicianName.trim()) {
      setFormError('Keluhan/kerusakan dan nama teknisi wajib diisi.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await onUpdateMaintenance(editing.id, editing.assetId, {
          issue,
          actionTaken,
          technicianName,
          maintenanceDate,
          status,
          resultingCondition,
          syncAssetCondition,
        });
      } else {
        const asset = assets.find((a) => a.id === selectedAssetId);
        if (!asset) {
          setFormError('Pilih aset inventaris terlebih dahulu.');
          setSaving(false);
          return;
        }
        await onAddMaintenance({
          asset,
          issue,
          actionTaken,
          technicianName,
          maintenanceDate,
          status,
          resultingCondition,
          syncAssetCondition,
        });
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan catatan maintenance.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Maintenance</h1>
          <p className="mt-1 text-sm text-slate-600">
            Catatan perawatan, perbaikan perangkat keras, dan pembaruan kondisi aset.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={openAdd}
            disabled={assets.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1D5CE5] hover:bg-[#164BC2] disabled:opacity-50 text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Catat Maintenance</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Perangkat</th>
                <th className="py-3 px-4">Kendala & Tindakan</th>
                <th className="py-3 px-4">Teknisi</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Kondisi Akhir</th>
                {isAdmin && <th className="py-3 px-4">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {maintenances.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="py-12 text-center text-sm text-slate-500">
                    {loading
                      ? 'Memuat catatan maintenance...'
                      : 'Belum ada catatan perawatan perangkat.'}
                  </td>
                </tr>
              ) : (
                maintenances.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 text-slate-700 tabular-nums whitespace-nowrap">
                      {formatShortDate(m.maintenanceDate)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-xs font-semibold text-slate-700">
                        {m.assetCode}
                      </div>
                      <div className="font-medium text-slate-900">{m.assetName}</div>
                    </td>
                    <td className="py-3.5 px-4 max-w-[260px]">
                      <div className="font-medium text-slate-900">{m.issue}</div>
                      {m.actionTaken && (
                        <div className="text-xs text-slate-500 mt-0.5">{m.actionTaken}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">{m.technicianName}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="py-3.5 px-4">
                      <ConditionBadge condition={m.resultingCondition} />
                    </td>
                    {isAdmin && (
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openEdit(m)}
                            className="px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void onDeleteMaintenance(m.id)}
                            className="px-2.5 py-1.5 rounded-md bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold cursor-pointer"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
          <div className="w-full max-w-[600px] bg-white rounded-2xl border border-slate-200 shadow-2xl p-6">
            <h3 className="text-lg font-bold text-slate-900">
              {editing ? 'Edit Catatan Maintenance' : 'Catat Maintenance Perangkat'}
            </h3>

            {formError && (
              <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs text-red-700">
                {formError}
              </div>
            )}

            <form onSubmit={(e) => void handleSubmit(e)} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {!editing && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Pilih aset
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
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Tanggal perawatan
                  </label>
                  <input
                    type="date"
                    required
                    value={maintenanceDate}
                    onChange={(e) => setMaintenanceDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D5CE5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nama teknisi
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={FIELD_LIMITS.displayNameMax}
                    value={technicianName}
                    onChange={(e) => setTechnicianName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D5CE5]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Keluhan / kendala
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={FIELD_LIMITS.issueMax}
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                    placeholder="Misal: Tinta printer tersumbat / perlu pembersihan head"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D5CE5]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Tindakan perbaikan
                  </label>
                  <input
                    type="text"
                    maxLength={FIELD_LIMITS.actionTakenMax}
                    value={actionTaken}
                    onChange={(e) => setActionTaken(e.target.value)}
                    placeholder="Misal: Deep cleaning head dan pengisian tinta"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D5CE5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Status perawatan
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as MaintenanceStatus)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#1D5CE5]"
                  >
                    {MAINTENANCE_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Kondisi hasil aset
                  </label>
                  <select
                    value={resultingCondition}
                    onChange={(e) => setResultingCondition(e.target.value as AssetCondition)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#1D5CE5]"
                  >
                    {ASSET_CONDITIONS.map((cond) => (
                      <option key={cond} value={cond}>
                        {cond}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={syncAssetCondition}
                      onChange={(e) => setSyncAssetCondition(e.target.checked)}
                      className="rounded border-slate-300 text-[#1D5CE5] focus:ring-[#1D5CE5]"
                    />
                    <span>Perbarui kondisi aset di Inventaris secara otomatis</span>
                  </label>
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
