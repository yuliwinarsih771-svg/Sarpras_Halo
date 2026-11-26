import type { AssetCondition, LoanStatus, MaintenanceStatus, ScheduleStatus } from '../types/sipalak';

export function ConditionBadge({ condition }: { condition: AssetCondition }) {
  const styles =
    condition === 'Baik'
      ? 'bg-emerald-50 text-emerald-700'
      : condition === 'Perlu perawatan'
        ? 'bg-amber-50 text-amber-800'
        : 'bg-red-50 text-red-700';

  return (
    <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap ${styles}`}>
      {condition}
    </span>
  );
}

export function StatusBadge({
  status,
}: {
  status: LoanStatus | ScheduleStatus | MaintenanceStatus;
}) {
  let styles = 'bg-slate-100 text-slate-700';
  if (status === 'Disetujui' || status === 'Selesai' || status === 'Dikembalikan') {
    styles = 'bg-emerald-50 text-emerald-700';
  } else if (status === 'Menunggu' || status === 'Dijadwalkan') {
    styles = 'bg-amber-50 text-amber-800';
  } else if (status === 'Dipinjam' || status === 'Dalam Proses') {
    styles = 'bg-blue-50 text-blue-700';
  } else if (status === 'Ditolak') {
    styles = 'bg-red-50 text-red-700';
  }

  return (
    <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap ${styles}`}>
      {status}
    </span>
  );
}
