import { FIELD_LIMITS } from '../types/sipalak';

export function clampStr(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}

export function isNonEmpty(value: string, maxLength: number): boolean {
  const trimmed = value.trim();
  return trimmed.length >= 1 && trimmed.length <= maxLength;
}

export function isValidFirestoreId(id: string): boolean {
  return id.length > 0 && id.length <= 128 && FIELD_LIMITS.idPattern.test(id);
}

export function formatIndoDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatShortDate(isoDate: string): string {
  if (!isoDate) return '-';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function getTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getCurrentTimeHHMM(): string {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function hasTimeOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  if (!startA || !endA || !startB || !endB) return false;
  return startA < endB && endA > startB;
}

export function roleDisplayLabel(role: string): string {
  switch (role) {
    case 'admin':
      return 'Admin';
    case 'teknisi':
      return 'Teknisi';
    case 'guru':
      return 'Guru';
    case 'siswa':
      return 'Siswa';
    default:
      return 'Pengguna';
  }
}
