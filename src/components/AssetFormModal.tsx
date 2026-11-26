import React, { useEffect, useState } from 'react';
import {
  ASSET_CATEGORIES,
  ASSET_CONDITIONS,
  FIELD_LIMITS,
  type Asset,
  type AssetCategory,
  type AssetCondition,
} from '../types/sipalak';

interface AssetFormModalProps {
  open: boolean;
  editingAsset: Asset | null;
  onClose: () => void;
  onSubmit: (data: {
    code: string;
    name: string;
    category: AssetCategory;
    brand: string;
    condition: AssetCondition;
    location: string;
    fundingSource: string;
    procurementYear: number;
    nextMaintenanceDate: string;
  }) => Promise<void>;
}

export function AssetFormModal({
  open,
  editingAsset,
  onClose,
  onSubmit,
}: AssetFormModalProps) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<AssetCategory>('Komputer');
  const [brand, setBrand] = useState('');
  const [condition, setCondition] = useState<AssetCondition>('Baik');
  const [location, setLocation] = useState('');
  const [fundingSource, setFundingSource] = useState('');
  const [procurementYear, setProcurementYear] = useState(2026);
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editingAsset) {
      setCode(editingAsset.code);
      setName(editingAsset.name);
      setCategory(editingAsset.category);
      setBrand(editingAsset.brand);
      setCondition(editingAsset.condition);
      setLocation(editingAsset.location);
      setFundingSource(editingAsset.fundingSource);
      setProcurementYear(editingAsset.procurementYear);
      setNextMaintenanceDate(editingAsset.nextMaintenanceDate || '');
    } else {
      setCode('');
      setName('');
      setCategory('Komputer');
      setBrand('');
      setCondition('Baik');
      setLocation('');
      setFundingSource('');
      setProcurementYear(new Date().getFullYear());
      setNextMaintenanceDate('');
    }
    setFormError(null);
  }, [editingAsset, open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim() || !brand.trim() || !location.trim()) {
      setFormError('Kode aset, nama aset, merek/model, dan lokasi wajib diisi.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      await onSubmit({
        code,
        name,
        category,
        brand,
        condition,
        location,
        fundingSource,
        procurementYear: Number(procurementYear) || 2026,
        nextMaintenanceDate,
      });
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan aset.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
      <div className="w-full max-w-[600px] bg-white rounded-2xl border border-slate-200 shadow-2xl p-6">
        <h3 className="text-lg font-bold text-slate-900">
          {editingAsset ? 'Edit Aset' : 'Tambah Aset'}
        </h3>

        {formError && (
          <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs text-red-700">
            {formError}
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kode aset
              </label>
              <input
                type="text"
                required
                maxLength={FIELD_LIMITS.assetCodeMax}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Misal: LAB-PC-001"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D5CE5]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama aset
              </label>
              <input
                type="text"
                required
                maxLength={FIELD_LIMITS.assetNameMax}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Misal: Komputer Praktik 01"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D5CE5]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kategori
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AssetCategory)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#1D5CE5]"
              >
                {ASSET_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Merek / model
              </label>
              <input
                type="text"
                required
                maxLength={FIELD_LIMITS.brandMax}
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Misal: Lenovo / Epson"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D5CE5]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kondisi
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as AssetCondition)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#1D5CE5]"
              >
                {ASSET_CONDITIONS.map((cond) => (
                  <option key={cond} value={cond}>
                    {cond}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Lokasi
              </label>
              <input
                type="text"
                required
                maxLength={FIELD_LIMITS.locationMax}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Misal: Lab Komputer Akuntansi"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D5CE5]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Sumber dana
              </label>
              <input
                type="text"
                maxLength={FIELD_LIMITS.fundingSourceMax}
                value={fundingSource}
                onChange={(e) => setFundingSource(e.target.value)}
                placeholder="BOS / Komite / APBD"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D5CE5]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tahun pengadaan
              </label>
              <input
                type="number"
                min={1990}
                max={2100}
                required
                value={procurementYear}
                onChange={(e) => setProcurementYear(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#1D5CE5]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Jadwal perawatan berikutnya
              </label>
              <input
                type="date"
                value={nextMaintenanceDate}
                onChange={(e) => setNextMaintenanceDate(e.target.value)}
                className="w-full sm:w-1/2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D5CE5]"
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
