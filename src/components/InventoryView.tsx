import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ASSET_CONDITIONS, type Asset } from '../types/sipalak';
import { ConditionBadge } from './ConditionBadge';

interface InventoryViewProps {
  assets: Asset[];
  loading: boolean;
  onOpenAdd: () => void;
  onOpenEdit: (asset: Asset) => void;
  onOpenDetail: (asset: Asset) => void;
  onDelete: (assetId: string) => Promise<void>;
  onSeedSampleAssets: () => Promise<void>;
}

export function InventoryView({
  assets,
  loading,
  onOpenAdd,
  onOpenEdit,
  onOpenDetail,
  onDelete,
  onSeedSampleAssets,
}: InventoryViewProps) {
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [conditionFilter, setConditionFilter] = useState('Semua kondisi');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assets.filter((item) => {
      const matchesCond =
        conditionFilter === 'Semua kondisi' || item.condition === conditionFilter;
      const matchesSearch =
        !q ||
        item.code.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q);
      return matchesCond && matchesSearch;
    });
  }, [assets, conditionFilter, search]);

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
      {/* Header row matching screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inventaris</h1>
          <p className="mt-1 text-sm text-slate-600">
            Kelola aset: tambah perangkat, ubah data, atau hapus aset yang tidak digunakan.
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2.5 shrink-0">
            {assets.length === 0 && !loading && (
              <button
                type="button"
                disabled={seeding}
                onClick={() => void handleSeed()}
                className="px-4 py-2.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                {seeding ? 'Memuat...' : 'Muat Data Contoh'}
              </button>
            )}
            <button
              type="button"
              onClick={onOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1D5CE5] hover:bg-[#164BC2] text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Tambah Aset</span>
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode, nama, merek..."
            className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D5CE5]"
          />
        </div>

        <select
          value={conditionFilter}
          onChange={(e) => setConditionFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1D5CE5]"
        >
          <option value="Semua kondisi">Semua kondisi</option>
          {ASSET_CONDITIONS.map((cond) => (
            <option key={cond} value={cond}>
              {cond}
            </option>
          ))}
        </select>
      </div>

      {/* Table matching screenshot */}
      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                <th className="py-3 px-4">Kode</th>
                <th className="py-3 px-4">Nama Aset</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Merek</th>
                <th className="py-3 px-4">Kondisi</th>
                <th className="py-3 px-4">Lokasi</th>
                <th className="py-3 px-4">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-slate-500">
                    {loading
                      ? 'Memuat data inventaris...'
                      : 'Belum ada aset yang sesuai filter.'}
                  </td>
                </tr>
              ) : (
                filtered.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-800 whitespace-nowrap">
                      {asset.code}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">{asset.name}</td>
                    <td className="py-3.5 px-4 text-slate-700">{asset.category}</td>
                    <td className="py-3.5 px-4 text-slate-700">{asset.brand}</td>
                    <td className="py-3.5 px-4">
                      <ConditionBadge condition={asset.condition} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">{asset.location}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onOpenDetail(asset)}
                          className="px-2.5 py-1.5 rounded-md bg-blue-50 hover:bg-blue-100 text-[#1D5CE5] text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Detail / QR
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              type="button"
                              onClick={() => onOpenEdit(asset)}
                              className="px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                            >
                              Edit
                            </button>
                            {confirmDeleteId === asset.id ? (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    void onDelete(asset.id);
                                    setConfirmDeleteId(null);
                                  }}
                                  className="px-2.5 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer"
                                >
                                  Ya, Hapus
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-2 py-1.5 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold cursor-pointer"
                                >
                                  Batal
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(asset.id)}
                                className="px-2.5 py-1.5 rounded-md bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition-colors cursor-pointer"
                              >
                                Hapus
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
