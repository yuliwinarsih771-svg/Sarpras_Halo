import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { db, type DbUserRow } from './db.ts';

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export type AuthenticatedRequest = Request & {
  authUser?: DbUserRow;
  authTokenHash?: string;
};

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const expectedBuf = Buffer.from(expectedHex, 'hex');
  if (derived.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(derived, expectedBuf);
}

export function hashSessionToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export function createSession(uid: string): string {
  const now = Date.now();
  db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(now);
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashSessionToken(rawToken);
  db.prepare(
    'INSERT INTO sessions (token_hash, uid, expires_at, created_at) VALUES (?, ?, ?, ?)'
  ).run(tokenHash, uid, now + SESSION_TTL_MS, now);
  return rawToken;
}

export function resolveSessionUser(rawToken: string): DbUserRow | null {
  const clean = rawToken.trim();
  if (!clean) return null;
  const tokenHash = hashSessionToken(clean);
  const now = Date.now();
  const row = db
    .prepare(
      `SELECT u.*
       FROM sessions s
       JOIN users u ON u.uid = s.uid
       WHERE s.token_hash = ? AND s.expires_at > ?`
    )
    .get(tokenHash, now) as DbUserRow | undefined;

  if (!row || row.active !== 1) {
    return null;
  }
  return row;
}

export function revokeSessionByToken(rawToken: string): void {
  const tokenHash = hashSessionToken(rawToken);
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash);
}

export function revokeUserSessions(uid: string): void {
  db.prepare('DELETE FROM sessions WHERE uid = ?').run(uid);
}

export function extractBearerToken(req: Request): string {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return '';
  return header.slice(7).trim();
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const rawToken = extractBearerToken(req);
  if (!rawToken) {
    res.status(401).json({ error: 'Sesi tidak ditemukan. Silakan masuk terlebih dahulu.' });
    return;
  }
  const user = resolveSessionUser(rawToken);
  if (!user) {
    res.status(401).json({ error: 'Sesi tidak valid atau telah kedaluwarsa. Silakan masuk kembali.' });
    return;
  }
  req.authUser = user;
  req.authTokenHash = hashSessionToken(rawToken);
  next();
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.authUser || req.authUser.role !== 'admin') {
    res.status(403).json({ error: 'Akses ditolak. Hanya Admin yang memiliki izin tindakan ini.' });
    return;
  }
  next();
}
