import { QRCodeSVG } from 'qrcode.react';
import { ExternalLink, Printer } from 'lucide-react';
import type { Asset } from '../types/sipalak';

interface AssetDetailModalProps {
  asset: Asset | null;
  onClose: () => void;
  onEdit?: (asset: Asset) => void;
}

export function AssetDetailModal({ asset, onClose, onEdit }: AssetDetailModalProps) {
  if (!asset) return null;

  const qrUrl = `${window.location.origin}${window.location.pathname}?aset=${encodeURIComponent(asset.code)}`;

  const handleOpenQrLink = () => {
    window.history.replaceState(null, '', `?aset=${encodeURIComponent(asset.code)}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
      <div className="w-full max-w-[600px] bg-white rounded-2xl border border-slate-200 shadow-2xl p-6">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-slate-900">Detail Inventaris</h3>
          <button
            type="button"
            onClick={() => window.print()}
            className="no-print inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak QR</span>
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg bg-slate-50 border border-slate-200/70 px-3.5 py-2.5">
            <div className="text-[11px] font-medium text-slate-500">Kode aset</div>
            <div className="mt-0.5 text-sm font-bold text-slate-900 font-mono">{asset.code}</div>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200/70 px-3.5 py-2.5">
            <div className="text-[11px] font-medium text-slate-500">Nama aset</div>
            <div className="mt-0.5 text-sm font-bold text-slate-900">{asset.name}</div>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200/70 px-3.5 py-2.5">
            <div className="text-[11px] font-medium text-slate-500">Kategori</div>
            <div className="mt-0.5 text-sm font-medium text-slate-800">{asset.category}</div>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200/70 px-3.5 py-2.5">
            <div className="text-[11px] font-medium text-slate-500">Merek / model</div>
            <div className="mt-0.5 text-sm font-medium text-slate-800">{asset.brand}</div>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200/70 px-3.5 py-2.5">
            <div className="text-[11px] font-medium text-slate-500">Kondisi</div>
            <div className="mt-0.5 text-sm font-medium text-slate-800">{asset.condition}</div>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200/70 px-3.5 py-2.5">
            <div className="text-[11px] font-medium text-slate-500">Lokasi</div>
            <div className="mt-0.5 text-sm font-medium text-slate-800">{asset.location}</div>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200/70 px-3.5 py-2.5">
            <div className="text-[11px] font-medium text-slate-500">Sumber dana</div>
            <div className="mt-0.5 text-sm font-medium text-slate-800">
              {asset.fundingSource || '-'}
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200/70 px-3.5 py-2.5">
            <div className="text-[11px] font-medium text-slate-500">Tahun pengadaan</div>
            <div className="mt-0.5 text-sm font-medium text-slate-800 tabular-nums">
              {asset.procurementYear}
            </div>
          </div>
        </div>

        {/* Real Scannable QR Code section matching screenshot */}
        <div className="mt-6 flex flex-col items-center text-center">
          <div className="p-3 bg-white border border-slate-200 rounded-xl">
            <QRCodeSVG value={qrUrl} size={172} level="M" includeMargin={false} />
          </div>
          <p className="mt-3 text-xs text-slate-500">
            QR Code mengarah ke identitas aset:{' '}
            <span className="font-mono font-semibold text-slate-700">{asset.code}</span>
          </p>
          <a
            href={qrUrl}
            onClick={(e) => {
              e.preventDefault();
              handleOpenQrLink();
            }}
            className="no-print mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1D5CE5] text-xs font-semibold transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Buka tautan QR</span>
          </a>
        </div>

        <div className="no-print mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors cursor-pointer"
          >
            Tutup
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(asset);
              }}
              className="px-5 py-2 rounded-lg bg-[#1D5CE5] hover:bg-[#164BC2] text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              Edit Aset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
