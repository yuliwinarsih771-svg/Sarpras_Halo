import { useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { formatIndoDate, formatShortDate } from '../lib/validation';
import type {
  Asset,
  Attendance,
  LabSchedule,
  Loan,
  Maintenance,
} from '../types/sipalak';

interface ReportsViewProps {
  assets: Asset[];
  loans: Loan[];
  schedules: LabSchedule[];
  maintenances: Maintenance[];
  attendances: Attendance[];
}

type ReportCategory = 'inventaris' | 'peminjaman' | 'jadwal' | 'maintenance' | 'absensi';

function escapeCsv(val: string | number): string {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function ReportsView({
  assets,
  loans,
  schedules,
  maintenances,
  attendances,
}: ReportsViewProps) {
  const [category, setCategory] = useState<ReportCategory>('inventaris');

  const handleDownloadCsv = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (category === 'inventaris') {
      headers = ['Kode', 'Nama Aset', 'Kategori', 'Merek', 'Kondisi', 'Lokasi', 'Sumber Dana', 'Tahun'];
      rows = assets.map((a) => [
        a.code,
        a.name,
        a.category,
        a.brand,
        a.condition,
        a.location,
        a.fundingSource,
        a.procurementYear,
      ]);
    } else if (category === 'peminjaman') {
      headers = ['Kode Aset', 'Nama Aset', 'Peminjam', 'Peran', 'Unit', 'Tgl Pinjam', 'Tgl Kembali', 'Status'];
      rows = loans.map((l) => [
        l.assetCode,
        l.assetName,
        l.borrowerName,
        l.borrowerRole,
        l.unit,
        l.borrowDate,
        l.returnDate,
        l.status,
      ]);
    } else if (category === 'jadwal') {
      headers = ['Tanggal', 'Jam Mulai', 'Jam Selesai', 'Kegiatan', 'Pemohon', 'Kelas/Unit', 'Status'];
      rows = schedules.map((s) => [
        s.date,
        s.startTime,
        s.endTime,
        s.activity,
        s.requesterName,
        s.unit,
        s.status,
      ]);
    } else if (category === 'maintenance') {
      headers = ['Tanggal', 'Kode Aset', 'Nama Aset', 'Kendala', 'Tindakan', 'Teknisi', 'Status', 'Kondisi Akhir'];
      rows = maintenances.map((m) => [
        m.maintenanceDate,
        m.assetCode,
        m.assetName,
        m.issue,
        m.actionTaken,
        m.technicianName,
        m.status,
        m.resultingCondition,
      ]);
    } else {
      headers = ['Tanggal', 'Jam Masuk', 'Jam Keluar', 'Pengunjung', 'Peran', 'Kelas/Unit', 'Kegiatan', 'Komputer'];
      rows = attendances.map((a) => [
        a.date,
        a.checkInTime,
        a.checkOutTime || 'Aktif',
        a.visitorName,
        a.visitorRole,
        a.unit,
        a.activity,
        a.workstation,
      ]);
    }

    const csvContent = [
      headers.map(escapeCsv).join(','),
      ...rows.map((r) => r.map(escapeCsv).join(',')),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sipalak-laporan-${category}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Laporan</h1>
          <p className="mt-1 text-sm text-slate-600">
            Rekapitulasi data real-time laboratorium komputer untuk cetak maupun ekspor CSV.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1D5CE5] hover:bg-[#164BC2] text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Unduh CSV</span>
          </button>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print-only mb-4 border-b border-slate-300 pb-3">
        <div className="text-lg font-bold">SIPALAK — SMK Negeri 1 Sambeng</div>
        <div className="text-sm text-slate-600">
          Laporan {category.toUpperCase()} · Dicetak pada {formatIndoDate(new Date())}
        </div>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(
          [
            { id: 'inventaris', label: 'Inventaris', count: assets.length },
            { id: 'peminjaman', label: 'Peminjaman', count: loans.length },
            { id: 'jadwal', label: 'Jadwal Lab', count: schedules.length },
            { id: 'maintenance', label: 'Maintenance', count: maintenances.length },
            { id: 'absensi', label: 'Absensi', count: attendances.length },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setCategory(tab.id)}
            className={`text-left rounded-xl border p-4 transition-colors cursor-pointer ${
              category === tab.id
                ? 'bg-[#0D1C36] text-white border-[#0D1C36]'
                : 'bg-white text-slate-900 border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            <div
              className={`text-xs font-medium ${
                category === tab.id ? 'text-slate-300' : 'text-slate-500'
              }`}
            >
              {tab.label}
            </div>
            <div className="mt-1 text-2xl font-bold tabular-nums">{tab.count}</div>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          {category === 'inventaris' && (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase text-slate-500">
                  <th className="py-3 px-4">Kode</th>
                  <th className="py-3 px-4">Nama Aset</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Kondisi</th>
                  <th className="py-3 px-4">Lokasi</th>
                  <th className="py-3 px-4">Tahun</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assets.map((a) => (
                  <tr key={a.id}>
                    <td className="py-3 px-4 font-mono text-xs">{a.code}</td>
                    <td className="py-3 px-4 font-medium">{a.name}</td>
                    <td className="py-3 px-4">{a.category}</td>
                    <td className="py-3 px-4">{a.condition}</td>
                    <td className="py-3 px-4">{a.location}</td>
                    <td className="py-3 px-4 tabular-nums">{a.procurementYear}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {category === 'peminjaman' && (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase text-slate-500">
                  <th className="py-3 px-4">Perangkat</th>
                  <th className="py-3 px-4">Peminjam</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4">Pinjam</th>
                  <th className="py-3 px-4">Kembali</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loans.map((l) => (
                  <tr key={l.id}>
                    <td className="py-3 px-4">{l.assetCode} — {l.assetName}</td>
                    <td className="py-3 px-4">{l.borrowerName}</td>
                    <td className="py-3 px-4">{l.unit}</td>
                    <td className="py-3 px-4 tabular-nums">{formatShortDate(l.borrowDate)}</td>
                    <td className="py-3 px-4 tabular-nums">{formatShortDate(l.returnDate)}</td>
                    <td className="py-3 px-4">{l.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {category === 'jadwal' && (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase text-slate-500">
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Kegiatan</th>
                  <th className="py-3 px-4">Pemohon</th>
                  <th className="py-3 px-4">Kelas</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schedules.map((s) => (
                  <tr key={s.id}>
                    <td className="py-3 px-4 tabular-nums">{formatShortDate(s.date)}</td>
                    <td className="py-3 px-4 font-mono text-xs">{s.startTime} - {s.endTime}</td>
                    <td className="py-3 px-4">{s.activity}</td>
                    <td className="py-3 px-4">{s.requesterName}</td>
                    <td className="py-3 px-4">{s.unit}</td>
                    <td className="py-3 px-4">{s.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {category === 'maintenance' && (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase text-slate-500">
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Perangkat</th>
                  <th className="py-3 px-4">Kendala</th>
                  <th className="py-3 px-4">Teknisi</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Kondisi Akhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {maintenances.map((m) => (
                  <tr key={m.id}>
                    <td className="py-3 px-4 tabular-nums">{formatShortDate(m.maintenanceDate)}</td>
                    <td className="py-3 px-4">{m.assetCode} — {m.assetName}</td>
                    <td className="py-3 px-4">{m.issue}</td>
                    <td className="py-3 px-4">{m.technicianName}</td>
                    <td className="py-3 px-4">{m.status}</td>
                    <td className="py-3 px-4">{m.resultingCondition}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {category === 'absensi' && (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase text-slate-500">
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Masuk - Keluar</th>
                  <th className="py-3 px-4">Pengunjung</th>
                  <th className="py-3 px-4">Kelas/Unit</th>
                  <th className="py-3 px-4">Kegiatan</th>
                  <th className="py-3 px-4">Komputer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendances.map((a) => (
                  <tr key={a.id}>
                    <td className="py-3 px-4 tabular-nums">{formatShortDate(a.date)}</td>
                    <td className="py-3 px-4 font-mono text-xs">{a.checkInTime} - {a.checkOutTime || 'Aktif'}</td>
                    <td className="py-3 px-4">{a.visitorName}</td>
                    <td className="py-3 px-4">{a.unit}</td>
                    <td className="py-3 px-4">{a.activity}</td>
                    <td className="py-3 px-4 font-mono text-xs">{a.workstation || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
