export type NavSection =
  | 'dashboard'
  | 'inventaris'
  | 'peminjaman'
  | 'jadwal'
  | 'maintenance'
  | 'pengguna'
  | 'tambah-pengguna'
  | 'absensi'
  | 'laporan';

export type UserRole = 'admin' | 'teknisi' | 'guru' | 'siswa' | 'pengguna';
export type SelfSelectableRole = 'guru' | 'siswa' | 'pengguna';
export type PersonRole = 'Guru' | 'Siswa' | 'Teknisi' | 'Staf';

export type AssetCategory =
  | 'Komputer'
  | 'Monitor'
  | 'Printer'
  | 'Jaringan'
  | 'Proyektor'
  | 'Periferal'
  | 'Lainnya';

export type AssetCondition = 'Baik' | 'Perlu perawatan' | 'Rusak';

export type LoanStatus = 'Menunggu' | 'Disetujui' | 'Dipinjam' | 'Dikembalikan' | 'Ditolak';
export type ScheduleStatus = 'Menunggu' | 'Disetujui' | 'Ditolak' | 'Selesai';
export type MaintenanceStatus = 'Dijadwalkan' | 'Dalam Proses' | 'Selesai';

export const LAB_SCOPE = 'smkn1sambeng' as const;

export const ASSET_CATEGORIES: AssetCategory[] = [
  'Komputer',
  'Monitor',
  'Printer',
  'Jaringan',
  'Proyektor',
  'Periferal',
  'Lainnya',
];

export const ASSET_CONDITIONS: AssetCondition[] = ['Baik', 'Perlu perawatan', 'Rusak'];
export const LOAN_STATUSES: LoanStatus[] = ['Menunggu', 'Disetujui', 'Dipinjam', 'Dikembalikan', 'Ditolak'];
export const SCHEDULE_STATUSES: ScheduleStatus[] = ['Menunggu', 'Disetujui', 'Ditolak', 'Selesai'];
export const MAINTENANCE_STATUSES: MaintenanceStatus[] = ['Dijadwalkan', 'Dalam Proses', 'Selesai'];
export const USER_ROLES: UserRole[] = ['admin', 'teknisi', 'guru', 'siswa', 'pengguna'];
export const PERSON_ROLES: PersonRole[] = ['Guru', 'Siswa', 'Teknisi', 'Staf'];

export const FIELD_LIMITS = {
  idPattern: /^[a-zA-Z0-9_-]+$/,
  usernamePattern: /^[a-zA-Z0-9._-]*$/,
  usernameMax: 40,
  displayNameMax: 80,
  unitMax: 60,
  idNumberMax: 40,
  bioMax: 240,
  emailMax: 120,
  phoneMax: 30,
  assetCodeMax: 50,
  assetNameMax: 100,
  brandMax: 80,
  locationMax: 100,
  fundingSourceMax: 80,
  dateMax: 20,
  timeMax: 10,
  activityMax: 120,
  purposeMax: 240,
  notesMax: 240,
  attendanceNotesMax: 200,
  workstationMax: 40,
  issueMax: 240,
  actionTakenMax: 240,
} as const;

export interface AuthUser {
  uid: string;
  email: string;
}

export interface UserProfile {
  id: string;
  uid: string;
  displayName: string;
  username?: string;
  role: UserRole;
  unit: string;
  idNumber: string;
  bio: string;
  active: boolean;
  createdAt?: number | null;
  updatedAt?: number | null;
}

export interface UserPrivateInfo {
  uid: string;
  email: string;
  phone: string;
  updatedAt?: number | null;
}

export interface Asset {
  id: string;
  code: string;
  name: string;
  category: AssetCategory;
  brand: string;
  condition: AssetCondition;
  location: string;
  fundingSource: string;
  procurementYear: number;
  nextMaintenanceDate: string;
  labScope: typeof LAB_SCOPE;
  createdBy: string;
  createdAt?: number | null;
  updatedAt?: number | null;
}

export interface Loan {
  id: string;
  assetId: string;
  assetCode: string;
  assetName: string;
  requesterId: string;
  borrowerName: string;
  borrowerRole: PersonRole;
  unit: string;
  borrowDate: string;
  returnDate: string;
  purpose: string;
  status: LoanStatus;
  notes: string;
  createdAt?: number | null;
  updatedAt?: number | null;
}

export interface LabSchedule {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  activity: string;
  requesterId: string;
  requesterName: string;
  requesterRole: PersonRole;
  unit: string;
  status: ScheduleStatus;
  labScope: typeof LAB_SCOPE;
  createdAt?: number | null;
  updatedAt?: number | null;
}

export interface Maintenance {
  id: string;
  assetId: string;
  assetCode: string;
  assetName: string;
  issue: string;
  actionTaken: string;
  technicianName: string;
  maintenanceDate: string;
  status: MaintenanceStatus;
  resultingCondition: AssetCondition;
  createdBy: string;
  createdAt?: number | null;
  updatedAt?: number | null;
}

export interface Attendance {
  id: string;
  userId: string;
  date: string;
  checkInTime: string;
  checkOutTime: string;
  visitorName: string;
  visitorRole: PersonRole;
  unit: string;
  activity: string;
  workstation: string;
  notes: string;
  createdAt?: number | null;
  updatedAt?: number | null;
}
