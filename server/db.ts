import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const DB_PATH = path.resolve(process.cwd(), 'sipalak.db');

export const db = new DatabaseSync(DB_PATH);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    uid TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL,
    unit TEXT NOT NULL,
    id_number TEXT NOT NULL,
    bio TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    uid TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (uid) REFERENCES users(uid) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_uid ON sessions(uid);
  CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

  CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    brand TEXT NOT NULL,
    condition TEXT NOT NULL,
    location TEXT NOT NULL,
    funding_source TEXT NOT NULL,
    procurement_year INTEGER NOT NULL,
    next_maintenance_date TEXT NOT NULL,
    lab_scope TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS loans (
    id TEXT PRIMARY KEY,
    asset_id TEXT NOT NULL,
    asset_code TEXT NOT NULL,
    asset_name TEXT NOT NULL,
    requester_id TEXT NOT NULL,
    borrower_name TEXT NOT NULL,
    borrower_role TEXT NOT NULL,
    unit TEXT NOT NULL,
    borrow_date TEXT NOT NULL,
    return_date TEXT NOT NULL,
    purpose TEXT NOT NULL,
    status TEXT NOT NULL,
    notes TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS schedules (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    activity TEXT NOT NULL,
    requester_id TEXT NOT NULL,
    requester_name TEXT NOT NULL,
    requester_role TEXT NOT NULL,
    unit TEXT NOT NULL,
    status TEXT NOT NULL,
    lab_scope TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS maintenances (
    id TEXT PRIMARY KEY,
    asset_id TEXT NOT NULL,
    asset_code TEXT NOT NULL,
    asset_name TEXT NOT NULL,
    issue TEXT NOT NULL,
    action_taken TEXT NOT NULL,
    technician_name TEXT NOT NULL,
    maintenance_date TEXT NOT NULL,
    status TEXT NOT NULL,
    resulting_condition TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS attendances (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    check_in_time TEXT NOT NULL,
    check_out_time TEXT NOT NULL,
    visitor_name TEXT NOT NULL,
    visitor_role TEXT NOT NULL,
    unit TEXT NOT NULL,
    activity TEXT NOT NULL,
    workstation TEXT NOT NULL,
    notes TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
`);

export interface DbUserRow {
  uid: string;
  username: string;
  password_hash: string;
  display_name: string;
  role: string;
  unit: string;
  id_number: string;
  bio: string;
  email: string;
  phone: string;
  active: number;
  created_at: number;
  updated_at: number;
}

export function mapUserProfile(row: DbUserRow) {
  return {
    id: row.uid,
    uid: row.uid,
    displayName: row.display_name,
    username: row.username,
    role: row.role,
    unit: row.unit,
    idNumber: row.id_number,
    bio: row.bio,
    active: row.active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapUserPrivateInfo(row: DbUserRow) {
  return {
    uid: row.uid,
    email: row.email,
    phone: row.phone,
    updatedAt: row.updated_at,
  };
}

export function mapAsset(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    code: String(row.code),
    name: String(row.name),
    category: String(row.category),
    brand: String(row.brand),
    condition: String(row.condition),
    location: String(row.location),
    fundingSource: String(row.funding_source),
    procurementYear: Number(row.procurement_year),
    nextMaintenanceDate: String(row.next_maintenance_date),
    labScope: String(row.lab_scope),
    createdBy: String(row.created_by),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

export function mapLoan(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    assetId: String(row.asset_id),
    assetCode: String(row.asset_code),
    assetName: String(row.asset_name),
    requesterId: String(row.requester_id),
    borrowerName: String(row.borrower_name),
    borrowerRole: String(row.borrower_role),
    unit: String(row.unit),
    borrowDate: String(row.borrow_date),
    returnDate: String(row.return_date),
    purpose: String(row.purpose),
    status: String(row.status),
    notes: String(row.notes),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

export function mapSchedule(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    date: String(row.date),
    startTime: String(row.start_time),
    endTime: String(row.end_time),
    activity: String(row.activity),
    requesterId: String(row.requester_id),
    requesterName: String(row.requester_name),
    requesterRole: String(row.requester_role),
    unit: String(row.unit),
    status: String(row.status),
    labScope: String(row.lab_scope),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

export function mapMaintenance(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    assetId: String(row.asset_id),
    assetCode: String(row.asset_code),
    assetName: String(row.asset_name),
    issue: String(row.issue),
    actionTaken: String(row.action_taken),
    technicianName: String(row.technician_name),
    maintenanceDate: String(row.maintenance_date),
    status: String(row.status),
    resultingCondition: String(row.resulting_condition),
    createdBy: String(row.created_by),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

export function mapAttendance(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    date: String(row.date),
    checkInTime: String(row.check_in_time),
    checkOutTime: String(row.check_out_time),
    visitorName: String(row.visitor_name),
    visitorRole: String(row.visitor_role),
    unit: String(row.unit),
    activity: String(row.activity),
    workstation: String(row.workstation),
    notes: String(row.notes),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}
