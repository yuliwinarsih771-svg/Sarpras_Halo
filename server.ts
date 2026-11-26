import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import express from 'express';
import { WebSocket, WebSocketServer } from 'ws';
import {
  createSession,
  extractBearerToken,
  hashPassword,
  requireAdmin,
  requireAuth,
  resolveSessionUser,
  revokeSessionByToken,
  revokeUserSessions,
  verifyPassword,
  type AuthenticatedRequest,
} from './server/auth.ts';
import {
  db,
  mapAsset,
  mapAttendance,
  mapLoan,
  mapMaintenance,
  mapSchedule,
  mapUserPrivateInfo,
  mapUserProfile,
  type DbUserRow,
} from './server/db.ts';

const PORT = Number(process.env.PORT || 3000);
const LAB_SCOPE = 'smkn1sambeng';

const ALLOWED_ROLES = new Set(['admin', 'teknisi', 'guru', 'siswa', 'pengguna']);
const ALLOWED_SELF_ROLES = new Set(['guru', 'siswa', 'pengguna']);
const ALLOWED_PERSON_ROLES = new Set(['Guru', 'Siswa', 'Teknisi', 'Staf']);
const ALLOWED_ASSET_CATEGORIES = new Set([
  'Komputer',
  'Monitor',
  'Printer',
  'Jaringan',
  'Proyektor',
  'Periferal',
  'Lainnya',
]);
const ALLOWED_ASSET_CONDITIONS = new Set(['Baik', 'Perlu perawatan', 'Rusak']);
const ALLOWED_LOAN_STATUSES = new Set([
  'Menunggu',
  'Disetujui',
  'Dipinjam',
  'Dikembalikan',
  'Ditolak',
]);
const ALLOWED_SCHEDULE_STATUSES = new Set(['Menunggu', 'Disetujui', 'Ditolak', 'Selesai']);
const ALLOWED_MAINTENANCE_STATUSES = new Set(['Dijadwalkan', 'Dalam Proses', 'Selesai']);

function clampStr(val: unknown, max: number): string {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, max);
}

function sanitizeUsername(val: unknown): string {
  if (typeof val !== 'string') return '';
  return val
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, 40);
}

const app = express();
app.use(express.json({ limit: '256kb' }));

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

type AuthedSocket = WebSocket & {
  uid?: string;
  isAuthed?: boolean;
};

wss.on('connection', (ws: AuthedSocket) => {
  ws.isAuthed = false;

  const authTimer = setTimeout(() => {
    if (!ws.isAuthed) {
      ws.close(4001, 'Unauthorized');
    }
  }, 5000);

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(String(raw)) as { type?: string; token?: string };
      if (msg.type === 'auth' && typeof msg.token === 'string') {
        const user = resolveSessionUser(msg.token);
        if (!user) {
          ws.close(4001, 'Invalid session');
          return;
        }
        ws.uid = user.uid;
        ws.isAuthed = true;
        clearTimeout(authTimer);
        ws.send(JSON.stringify({ type: 'ready' }));
      }
    } catch {
      // Ignore malformed frames
    }
  });

  ws.on('close', () => {
    clearTimeout(authTimer);
  });
});

function broadcastSync(scope: string): void {
  const payload = JSON.stringify({ type: 'sync', scope });
  for (const client of wss.clients) {
    const authed = client as AuthedSocket;
    if (authed.readyState === WebSocket.OPEN && authed.isAuthed) {
      authed.send(payload);
    }
  }
}

function forceLogoutSocket(uid: string): void {
  const payload = JSON.stringify({ type: 'force-logout' });
  for (const client of wss.clients) {
    const authed = client as AuthedSocket;
    if (authed.readyState === WebSocket.OPEN && authed.uid === uid) {
      authed.send(payload);
      authed.close(4003, 'Session revoked');
    }
  }
}

// --- AUTH ROUTES ---

app.get('/api/auth/bootstrap-status', (_req, res) => {
  const row = db.prepare('SELECT COUNT(*) as cnt FROM users').get() as { cnt: number };
  res.json({ needsSetup: row.cnt === 0 });
});

app.post('/api/auth/bootstrap', (req, res) => {
  const displayName = clampStr(req.body?.displayName, 80);
  const username = sanitizeUsername(req.body?.username);
  const password = typeof req.body?.password === 'string' ? req.body.password.trim() : '';
  const email = clampStr(req.body?.email, 120).toLowerCase();
  const unit = clampStr(req.body?.unit, 60) || 'Lab Komputer Akuntansi';

  if (!displayName || !username || username.length < 2) {
    res.status(400).json({ error: 'Nama lengkap dan username minimal 2 karakter wajib diisi.' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Kata sandi minimal harus 6 karakter.' });
    return;
  }

  try {
    db.exec('BEGIN IMMEDIATE');
    const existingCount = (db.prepare('SELECT COUNT(*) as cnt FROM users').get() as { cnt: number }).cnt;
    if (existingCount > 0) {
      db.exec('ROLLBACK');
      res.status(409).json({ error: 'Akun admin awal sudah dibuat. Silakan masuk menggunakan username dan kata sandi.' });
      return;
    }

    const uid = crypto.randomUUID();
    const now = Date.now();
    const pwHash = hashPassword(password);

    db.prepare(
      `INSERT INTO users (uid, username, password_hash, display_name, role, unit, id_number, bio, email, phone, active, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'admin', ?, '', 'Administrator SIPALAK', ?, '', 1, ?, ?)`
    ).run(uid, username, pwHash, displayName, unit, email, now, now);

    db.exec('COMMIT');

    const createdUser = db
      .prepare('SELECT * FROM users WHERE uid = ?')
      .get(uid) as unknown as DbUserRow;
    const token = createSession(uid);

    res.status(201).json({
      token,
      profile: mapUserProfile(createdUser),
      privateInfo: mapUserPrivateInfo(createdUser),
    });
  } catch (err) {
    try {
      db.exec('ROLLBACK');
    } catch {
      // Ignore rollback error
    }
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Gagal membuat akun admin awal.',
    });
  }
});

app.post('/api/auth/login', (req, res) => {
  const identifier = clampStr(req.body?.identifier, 120).toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!identifier || !password) {
    res.status(400).json({ error: 'Nama pengguna dan kata sandi wajib diisi.' });
    return;
  }

  let userRow: DbUserRow | undefined;
  if (identifier.includes('@')) {
    userRow = db.prepare('SELECT * FROM users WHERE lower(email) = ? LIMIT 1').get(identifier) as
      | DbUserRow
      | undefined;
  } else {
    const usernameKey = sanitizeUsername(identifier);
    if (!usernameKey) {
      res.status(400).json({ error: 'Format nama pengguna tidak valid.' });
      return;
    }
    userRow = db.prepare('SELECT * FROM users WHERE username = ? LIMIT 1').get(usernameKey) as
      | DbUserRow
      | undefined;
  }

  if (!userRow || !verifyPassword(password, userRow.password_hash)) {
    res.status(401).json({ error: 'Nama pengguna atau kata sandi tidak sesuai.' });
    return;
  }

  if (userRow.active !== 1) {
    res.status(403).json({
      error: 'Akun Anda sedang dinonaktifkan oleh Administrator. Hubungi Admin Lab.',
    });
    return;
  }

  const token = createSession(userRow.uid);
  res.json({
    token,
    profile: mapUserProfile(userRow),
    privateInfo: mapUserPrivateInfo(userRow),
  });
});

app.post('/api/auth/logout', (req, res) => {
  const rawToken = extractBearerToken(req);
  if (rawToken) {
    revokeSessionByToken(rawToken);
  }
  res.json({ ok: true });
});

app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
  const userRow = req.authUser!;
  res.json({
    profile: mapUserProfile(userRow),
    privateInfo: mapUserPrivateInfo(userRow),
  });
});

app.put('/api/auth/profile', requireAuth, (req: AuthenticatedRequest, res) => {
  const current = req.authUser!;
  const displayName = clampStr(req.body?.displayName, 80) || current.display_name;
  const requestedUsername = sanitizeUsername(req.body?.username);
  const nextUsername = requestedUsername || current.username;
  const newPassword =
    typeof req.body?.newPassword === 'string' ? req.body.newPassword.trim() : '';
  const requestedRole = typeof req.body?.role === 'string' ? req.body.role : '';
  const unit = clampStr(req.body?.unit, 60);
  const idNumber = clampStr(req.body?.idNumber, 40);
  const bio = clampStr(req.body?.bio, 240);
  const email = clampStr(req.body?.email, 120).toLowerCase();
  const phone = clampStr(req.body?.phone, 30);

  if (nextUsername !== current.username) {
    const taken = db
      .prepare('SELECT uid FROM users WHERE username = ? AND uid != ?')
      .get(nextUsername, current.uid);
    if (taken) {
      res.status(409).json({ error: 'Username tersebut sudah digunakan oleh akun lain.' });
      return;
    }
  }

  let nextPasswordHash = current.password_hash;
  let passwordUpdated = false;
  if (newPassword) {
    if (newPassword.length < 6) {
      res.status(400).json({ error: 'Kata sandi baru minimal harus 6 karakter.' });
      return;
    }
    nextPasswordHash = hashPassword(newPassword);
    passwordUpdated = true;
  }

  let nextRole = current.role;
  if (
    requestedRole &&
    ALLOWED_SELF_ROLES.has(current.role) &&
    ALLOWED_SELF_ROLES.has(requestedRole)
  ) {
    nextRole = requestedRole;
  }

  const now = Date.now();
  db.prepare(
    `UPDATE users
     SET display_name = ?, username = ?, password_hash = ?, role = ?, unit = ?, id_number = ?, bio = ?, email = ?, phone = ?, updated_at = ?
     WHERE uid = ?`
  ).run(
    displayName,
    nextUsername,
    nextPasswordHash,
    nextRole,
    unit,
    idNumber,
    bio,
    email,
    phone,
    now,
    current.uid
  );

  const updated = db
    .prepare('SELECT * FROM users WHERE uid = ?')
    .get(current.uid) as unknown as DbUserRow;
  broadcastSync('users');
  res.json({
    passwordUpdated,
    profile: mapUserProfile(updated),
    privateInfo: mapUserPrivateInfo(updated),
  });
});

// --- FULL REAL-TIME SYNC DATA SNAPSHOT ---

app.get('/api/data', requireAuth, (req: AuthenticatedRequest, res) => {
  const current = req.authUser!;
  const isAdmin = current.role === 'admin';

  const assets = (
    db
      .prepare('SELECT * FROM assets WHERE lab_scope = ? ORDER BY created_at DESC')
      .all(LAB_SCOPE) as Record<string, unknown>[]
  ).map(mapAsset);

  const loans = (
    isAdmin
      ? (db.prepare('SELECT * FROM loans ORDER BY created_at DESC').all() as Record<
          string,
          unknown
        >[])
      : (db
          .prepare('SELECT * FROM loans WHERE requester_id = ? ORDER BY created_at DESC')
          .all(current.uid) as Record<string, unknown>[])
  ).map(mapLoan);

  const schedules = (
    db
      .prepare('SELECT * FROM schedules WHERE lab_scope = ? ORDER BY date ASC, start_time ASC')
      .all(LAB_SCOPE) as Record<string, unknown>[]
  ).map(mapSchedule);

  const maintenances = (
    isAdmin
      ? (db.prepare('SELECT * FROM maintenances ORDER BY created_at DESC').all() as Record<
          string,
          unknown
        >[])
      : (db
          .prepare('SELECT * FROM maintenances WHERE created_by = ? ORDER BY created_at DESC')
          .all(current.uid) as Record<string, unknown>[])
  ).map(mapMaintenance);

  const attendances = (
    isAdmin
      ? (db.prepare('SELECT * FROM attendances ORDER BY created_at DESC').all() as Record<
          string,
          unknown
        >[])
      : (db
          .prepare('SELECT * FROM attendances WHERE user_id = ? ORDER BY created_at DESC')
          .all(current.uid) as Record<string, unknown>[])
  ).map(mapAttendance);

  const users = isAdmin
    ? (
        db.prepare('SELECT * FROM users ORDER BY display_name ASC').all() as unknown as DbUserRow[]
      ).map(mapUserProfile)
    : [mapUserProfile(current)];

  res.json({
    assets,
    loans,
    schedules,
    maintenances,
    attendances,
    users,
  });
});

// --- ASSETS ---

app.post('/api/assets', requireAuth, requireAdmin, (req: AuthenticatedRequest, res) => {
  const code = clampStr(req.body?.code, 50);
  const name = clampStr(req.body?.name, 100);
  const category = String(req.body?.category || 'Komputer');
  const brand = clampStr(req.body?.brand, 80);
  const condition = String(req.body?.condition || 'Baik');
  const location = clampStr(req.body?.location, 100);
  const fundingSource = clampStr(req.body?.fundingSource, 80);
  const procurementYear = Math.min(
    2100,
    Math.max(1990, Math.round(Number(req.body?.procurementYear) || 2026))
  );
  const nextMaintenanceDate = clampStr(req.body?.nextMaintenanceDate, 20);

  if (
    !code ||
    !name ||
    !brand ||
    !location ||
    !ALLOWED_ASSET_CATEGORIES.has(category) ||
    !ALLOWED_ASSET_CONDITIONS.has(condition)
  ) {
    res.status(400).json({ error: 'Data aset tidak valid atau kolom wajib belum lengkap.' });
    return;
  }

  const id = crypto.randomUUID();
  const now = Date.now();
  db.prepare(
    `INSERT INTO assets (id, code, name, category, brand, condition, location, funding_source, procurement_year, next_maintenance_date, lab_scope, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    code,
    name,
    category,
    brand,
    condition,
    location,
    fundingSource,
    procurementYear,
    nextMaintenanceDate,
    LAB_SCOPE,
    req.authUser!.uid,
    now,
    now
  );

  broadcastSync('assets');
  res.status(201).json({ id });
});

app.post(
  '/api/assets/seed-samples',
  requireAuth,
  requireAdmin,
  (req: AuthenticatedRequest, res) => {
    const samples = [
      {
        code: 'LAB-PC-001',
        name: 'Komputer Praktik 01',
        category: 'Komputer',
        brand: 'Lenovo',
        condition: 'Baik',
        location: 'Lab Komputer Akuntansi',
        fundingSource: 'BOS',
        procurementYear: 2024,
        nextMaintenanceDate: '',
      },
      {
        code: 'LAB-MON-001',
        name: 'Monitor 01',
        category: 'Monitor',
        brand: 'AOC',
        condition: 'Baik',
        location: 'Lab Komputer Akuntansi',
        fundingSource: 'BOS',
        procurementYear: 2024,
        nextMaintenanceDate: '',
      },
      {
        code: 'LAB-PRN-001',
        name: 'Printer Laboratorium',
        category: 'Printer',
        brand: 'Epson',
        condition: 'Perlu perawatan',
        location: 'Ruang Teknisi',
        fundingSource: 'Komite',
        procurementYear: 2023,
        nextMaintenanceDate: '',
      },
      {
        code: '01.03.010102',
        name: 'Laptop',
        category: 'Komputer',
        brand: 'Acer',
        condition: 'Baik',
        location: 'Lab Akuntansi',
        fundingSource: 'APBD',
        procurementYear: 2026,
        nextMaintenanceDate: '',
      },
    ];

    const now = Date.now();
    const insertStmt = db.prepare(
      `INSERT INTO assets (id, code, name, category, brand, condition, location, funding_source, procurement_year, next_maintenance_date, lab_scope, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    db.exec('BEGIN');
    try {
      for (const item of samples) {
        insertStmt.run(
          crypto.randomUUID(),
          item.code,
          item.name,
          item.category,
          item.brand,
          item.condition,
          item.location,
          item.fundingSource,
          item.procurementYear,
          item.nextMaintenanceDate,
          LAB_SCOPE,
          req.authUser!.uid,
          now,
          now
        );
      }
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      res.status(500).json({ error: err instanceof Error ? err.message : 'Gagal memuat contoh aset.' });
      return;
    }

    broadcastSync('assets');
    res.status(201).json({ ok: true });
  }
);

app.put('/api/assets/:id', requireAuth, requireAdmin, (req, res) => {
  const assetId = String(req.params.id || '');
  const code = clampStr(req.body?.code, 50);
  const name = clampStr(req.body?.name, 100);
  const category = String(req.body?.category || 'Komputer');
  const brand = clampStr(req.body?.brand, 80);
  const condition = String(req.body?.condition || 'Baik');
  const location = clampStr(req.body?.location, 100);
  const fundingSource = clampStr(req.body?.fundingSource, 80);
  const procurementYear = Math.min(
    2100,
    Math.max(1990, Math.round(Number(req.body?.procurementYear) || 2026))
  );
  const nextMaintenanceDate = clampStr(req.body?.nextMaintenanceDate, 20);

  if (
    !code ||
    !name ||
    !brand ||
    !location ||
    !ALLOWED_ASSET_CATEGORIES.has(category) ||
    !ALLOWED_ASSET_CONDITIONS.has(condition)
  ) {
    res.status(400).json({ error: 'Data aset tidak valid.' });
    return;
  }

  const result = db
    .prepare(
      `UPDATE assets
       SET code = ?, name = ?, category = ?, brand = ?, condition = ?, location = ?, funding_source = ?, procurement_year = ?, next_maintenance_date = ?, updated_at = ?
       WHERE id = ?`
    )
    .run(
      code,
      name,
      category,
      brand,
      condition,
      location,
      fundingSource,
      procurementYear,
      nextMaintenanceDate,
      Date.now(),
      assetId
    );

  if (result.changes === 0) {
    res.status(404).json({ error: 'Aset tidak ditemukan.' });
    return;
  }

  broadcastSync('assets');
  res.json({ ok: true });
});

app.delete('/api/assets/:id', requireAuth, requireAdmin, (req, res) => {
  const assetId = String(req.params.id || '');
  db.prepare('DELETE FROM assets WHERE id = ?').run(assetId);
  broadcastSync('assets');
  res.json({ ok: true });
});

// --- LOANS ---

app.post('/api/loans', requireAuth, (req: AuthenticatedRequest, res) => {
  const assetId = clampStr(req.body?.assetId, 128);
  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(assetId) as
    | Record<string, unknown>
    | undefined;
  if (!asset) {
    res.status(404).json({ error: 'Aset yang dipilih tidak ditemukan.' });
    return;
  }

  const borrowerName = clampStr(req.body?.borrowerName, 80);
  const borrowerRole = String(req.body?.borrowerRole || 'Guru');
  const unit = clampStr(req.body?.unit, 60);
  const borrowDate = clampStr(req.body?.borrowDate, 20);
  const returnDate = clampStr(req.body?.returnDate, 20);
  const purpose = clampStr(req.body?.purpose, 240);
  const notes = clampStr(req.body?.notes, 240);

  if (
    !borrowerName ||
    !unit ||
    !borrowDate ||
    !returnDate ||
    !purpose ||
    !ALLOWED_PERSON_ROLES.has(borrowerRole)
  ) {
    res.status(400).json({ error: 'Data peminjaman belum lengkap.' });
    return;
  }

  const id = crypto.randomUUID();
  const now = Date.now();
  db.prepare(
    `INSERT INTO loans (id, asset_id, asset_code, asset_name, requester_id, borrower_name, borrower_role, unit, borrow_date, return_date, purpose, status, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Menunggu', ?, ?, ?)`
  ).run(
    id,
    assetId,
    String(asset.code),
    String(asset.name),
    req.authUser!.uid,
    borrowerName,
    borrowerRole,
    unit,
    borrowDate,
    returnDate,
    purpose,
    notes,
    now,
    now
  );

  broadcastSync('loans');
  res.status(201).json({ id });
});

app.put('/api/loans/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const loanId = String(req.params.id || '');
  const existing = db.prepare('SELECT * FROM loans WHERE id = ?').get(loanId) as
    | Record<string, unknown>
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Data peminjaman tidak ditemukan.' });
    return;
  }

  const isAdmin = req.authUser!.role === 'admin';
  const isOwner = String(existing.requester_id) === req.authUser!.uid;
  if (!isAdmin && !isOwner) {
    res.status(403).json({ error: 'Anda tidak memiliki izin mengubah peminjaman ini.' });
    return;
  }

  const now = Date.now();
  if (isAdmin) {
    const status = String(req.body?.status || existing.status);
    if (!ALLOWED_LOAN_STATUSES.has(status)) {
      res.status(400).json({ error: 'Status peminjaman tidak valid.' });
      return;
    }
    const notes =
      req.body?.notes !== undefined ? clampStr(req.body.notes, 240) : String(existing.notes);
    const returnDate =
      req.body?.returnDate !== undefined
        ? clampStr(req.body.returnDate, 20)
        : String(existing.return_date);

    db.prepare('UPDATE loans SET status = ?, notes = ?, return_date = ?, updated_at = ? WHERE id = ?').run(
      status,
      notes,
      returnDate,
      now,
      loanId
    );
  } else {
    if (String(existing.status) !== 'Menunggu') {
      res.status(403).json({ error: 'Peminjaman yang sudah diproses tidak dapat diubah.' });
      return;
    }
    const borrowDate = clampStr(req.body?.borrowDate, 20) || String(existing.borrow_date);
    const returnDate = clampStr(req.body?.returnDate, 20) || String(existing.return_date);
    const purpose = clampStr(req.body?.purpose, 240) || String(existing.purpose);
    const notes =
      req.body?.notes !== undefined ? clampStr(req.body.notes, 240) : String(existing.notes);

    db.prepare(
      'UPDATE loans SET borrow_date = ?, return_date = ?, purpose = ?, notes = ?, updated_at = ? WHERE id = ?'
    ).run(borrowDate, returnDate, purpose, notes, now, loanId);
  }

  broadcastSync('loans');
  res.json({ ok: true });
});

app.delete('/api/loans/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const loanId = String(req.params.id || '');
  const existing = db.prepare('SELECT * FROM loans WHERE id = ?').get(loanId) as
    | Record<string, unknown>
    | undefined;
  if (!existing) {
    res.json({ ok: true });
    return;
  }

  const isAdmin = req.authUser!.role === 'admin';
  const canOwnerDelete =
    String(existing.requester_id) === req.authUser!.uid && String(existing.status) === 'Menunggu';

  if (!isAdmin && !canOwnerDelete) {
    res.status(403).json({ error: 'Anda tidak memiliki izin menghapus peminjaman ini.' });
    return;
  }

  db.prepare('DELETE FROM loans WHERE id = ?').run(loanId);
  broadcastSync('loans');
  res.json({ ok: true });
});

// --- SCHEDULES ---

app.post('/api/schedules', requireAuth, (req: AuthenticatedRequest, res) => {
  const date = clampStr(req.body?.date, 20);
  const startTime = clampStr(req.body?.startTime, 10);
  const endTime = clampStr(req.body?.endTime, 10);
  const activity = clampStr(req.body?.activity, 120);
  const requesterName = clampStr(req.body?.requesterName, 80);
  const requesterRole = String(req.body?.requesterRole || 'Guru');
  const unit = clampStr(req.body?.unit, 60);

  if (
    !date ||
    !startTime ||
    !endTime ||
    !activity ||
    !requesterName ||
    !unit ||
    !ALLOWED_PERSON_ROLES.has(requesterRole)
  ) {
    res.status(400).json({ error: 'Data jadwal laboratorium belum lengkap.' });
    return;
  }

  const id = crypto.randomUUID();
  const now = Date.now();
  db.prepare(
    `INSERT INTO schedules (id, date, start_time, end_time, activity, requester_id, requester_name, requester_role, unit, status, lab_scope, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Menunggu', ?, ?, ?)`
  ).run(
    id,
    date,
    startTime,
    endTime,
    activity,
    req.authUser!.uid,
    requesterName,
    requesterRole,
    unit,
    LAB_SCOPE,
    now,
    now
  );

  broadcastSync('schedules');
  res.status(201).json({ id });
});

app.put('/api/schedules/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const scheduleId = String(req.params.id || '');
  const existing = db.prepare('SELECT * FROM schedules WHERE id = ?').get(scheduleId) as
    | Record<string, unknown>
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Jadwal tidak ditemukan.' });
    return;
  }

  const isAdmin = req.authUser!.role === 'admin';
  const isOwner = String(existing.requester_id) === req.authUser!.uid;
  if (!isAdmin && !isOwner) {
    res.status(403).json({ error: 'Anda tidak memiliki izin mengubah jadwal ini.' });
    return;
  }

  const now = Date.now();
  if (isAdmin) {
    const status = String(req.body?.status || existing.status);
    if (!ALLOWED_SCHEDULE_STATUSES.has(status)) {
      res.status(400).json({ error: 'Status jadwal tidak valid.' });
      return;
    }
    const date = req.body?.date !== undefined ? clampStr(req.body.date, 20) : String(existing.date);
    const startTime =
      req.body?.startTime !== undefined
        ? clampStr(req.body.startTime, 10)
        : String(existing.start_time);
    const endTime =
      req.body?.endTime !== undefined ? clampStr(req.body.endTime, 10) : String(existing.end_time);
    const activity =
      req.body?.activity !== undefined
        ? clampStr(req.body.activity, 120)
        : String(existing.activity);
    const unit = req.body?.unit !== undefined ? clampStr(req.body.unit, 60) : String(existing.unit);

    db.prepare(
      'UPDATE schedules SET status = ?, date = ?, start_time = ?, end_time = ?, activity = ?, unit = ?, updated_at = ? WHERE id = ?'
    ).run(status, date, startTime, endTime, activity, unit, now, scheduleId);
  } else {
    if (String(existing.status) !== 'Menunggu') {
      res.status(403).json({ error: 'Jadwal yang sudah diproses tidak dapat diubah.' });
      return;
    }
    const date = clampStr(req.body?.date, 20) || String(existing.date);
    const startTime = clampStr(req.body?.startTime, 10) || String(existing.start_time);
    const endTime = clampStr(req.body?.endTime, 10) || String(existing.end_time);
    const activity = clampStr(req.body?.activity, 120) || String(existing.activity);
    const unit = clampStr(req.body?.unit, 60) || String(existing.unit);

    db.prepare(
      'UPDATE schedules SET date = ?, start_time = ?, end_time = ?, activity = ?, unit = ?, updated_at = ? WHERE id = ?'
    ).run(date, startTime, endTime, activity, unit, now, scheduleId);
  }

  broadcastSync('schedules');
  res.json({ ok: true });
});

app.delete('/api/schedules/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const scheduleId = String(req.params.id || '');
  const existing = db.prepare('SELECT * FROM schedules WHERE id = ?').get(scheduleId) as
    | Record<string, unknown>
    | undefined;
  if (!existing) {
    res.json({ ok: true });
    return;
  }

  const isAdmin = req.authUser!.role === 'admin';
  const canOwnerDelete =
    String(existing.requester_id) === req.authUser!.uid && String(existing.status) === 'Menunggu';

  if (!isAdmin && !canOwnerDelete) {
    res.status(403).json({ error: 'Anda tidak memiliki izin menghapus jadwal ini.' });
    return;
  }

  db.prepare('DELETE FROM schedules WHERE id = ?').run(scheduleId);
  broadcastSync('schedules');
  res.json({ ok: true });
});

// --- MAINTENANCES ---

app.post('/api/maintenances', requireAuth, requireAdmin, (req: AuthenticatedRequest, res) => {
  const assetId = clampStr(req.body?.assetId, 128);
  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(assetId) as
    | Record<string, unknown>
    | undefined;
  if (!asset) {
    res.status(404).json({ error: 'Aset tidak ditemukan.' });
    return;
  }

  const issue = clampStr(req.body?.issue, 240);
  const actionTaken = clampStr(req.body?.actionTaken, 240);
  const technicianName = clampStr(req.body?.technicianName, 80);
  const maintenanceDate = clampStr(req.body?.maintenanceDate, 20);
  const status = String(req.body?.status || 'Dijadwalkan');
  const resultingCondition = String(req.body?.resultingCondition || 'Baik');
  const syncAssetCondition = Boolean(req.body?.syncAssetCondition);

  if (
    !issue ||
    !technicianName ||
    !maintenanceDate ||
    !ALLOWED_MAINTENANCE_STATUSES.has(status) ||
    !ALLOWED_ASSET_CONDITIONS.has(resultingCondition)
  ) {
    res.status(400).json({ error: 'Data perawatan belum lengkap atau tidak valid.' });
    return;
  }

  const id = crypto.randomUUID();
  const now = Date.now();
  db.prepare(
    `INSERT INTO maintenances (id, asset_id, asset_code, asset_name, issue, action_taken, technician_name, maintenance_date, status, resulting_condition, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    assetId,
    String(asset.code),
    String(asset.name),
    issue,
    actionTaken,
    technicianName,
    maintenanceDate,
    status,
    resultingCondition,
    req.authUser!.uid,
    now,
    now
  );

  if (syncAssetCondition) {
    db.prepare('UPDATE assets SET condition = ?, updated_at = ? WHERE id = ?').run(
      resultingCondition,
      now,
      assetId
    );
    broadcastSync('assets');
  }

  broadcastSync('maintenances');
  res.status(201).json({ id });
});

app.put('/api/maintenances/:id', requireAuth, requireAdmin, (req, res) => {
  const maintenanceId = String(req.params.id || '');
  const existing = db.prepare('SELECT * FROM maintenances WHERE id = ?').get(maintenanceId) as
    | Record<string, unknown>
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Data perawatan tidak ditemukan.' });
    return;
  }

  const issue = clampStr(req.body?.issue, 240);
  const actionTaken = clampStr(req.body?.actionTaken, 240);
  const technicianName = clampStr(req.body?.technicianName, 80);
  const maintenanceDate = clampStr(req.body?.maintenanceDate, 20);
  const status = String(req.body?.status || existing.status);
  const resultingCondition = String(
    req.body?.resultingCondition || existing.resulting_condition
  );
  const syncAssetCondition = Boolean(req.body?.syncAssetCondition);

  if (
    !issue ||
    !technicianName ||
    !maintenanceDate ||
    !ALLOWED_MAINTENANCE_STATUSES.has(status) ||
    !ALLOWED_ASSET_CONDITIONS.has(resultingCondition)
  ) {
    res.status(400).json({ error: 'Data perawatan tidak valid.' });
    return;
  }

  const now = Date.now();
  db.prepare(
    `UPDATE maintenances
     SET issue = ?, action_taken = ?, technician_name = ?, maintenance_date = ?, status = ?, resulting_condition = ?, updated_at = ?
     WHERE id = ?`
  ).run(
    issue,
    actionTaken,
    technicianName,
    maintenanceDate,
    status,
    resultingCondition,
    now,
    maintenanceId
  );

  if (syncAssetCondition) {
    db.prepare('UPDATE assets SET condition = ?, updated_at = ? WHERE id = ?').run(
      resultingCondition,
      now,
      String(existing.asset_id)
    );
    broadcastSync('assets');
  }

  broadcastSync('maintenances');
  res.json({ ok: true });
});

app.delete('/api/maintenances/:id', requireAuth, requireAdmin, (req, res) => {
  const maintenanceId = String(req.params.id || '');
  db.prepare('DELETE FROM maintenances WHERE id = ?').run(maintenanceId);
  broadcastSync('maintenances');
  res.json({ ok: true });
});

// --- ATTENDANCES ---

app.post('/api/attendances', requireAuth, (req: AuthenticatedRequest, res) => {
  const date = clampStr(req.body?.date, 20);
  const checkInTime = clampStr(req.body?.checkInTime, 10);
  const checkOutTime = clampStr(req.body?.checkOutTime, 10);
  const visitorName = clampStr(req.body?.visitorName, 80);
  const visitorRole = String(req.body?.visitorRole || 'Guru');
  const unit = clampStr(req.body?.unit, 60);
  const activity = clampStr(req.body?.activity, 120);
  const workstation = clampStr(req.body?.workstation, 40);
  const notes = clampStr(req.body?.notes, 200);

  if (
    !date ||
    !checkInTime ||
    !visitorName ||
    !unit ||
    !activity ||
    !ALLOWED_PERSON_ROLES.has(visitorRole)
  ) {
    res.status(400).json({ error: 'Data absensi belum lengkap.' });
    return;
  }

  const id = crypto.randomUUID();
  const now = Date.now();
  db.prepare(
    `INSERT INTO attendances (id, user_id, date, check_in_time, check_out_time, visitor_name, visitor_role, unit, activity, workstation, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    req.authUser!.uid,
    date,
    checkInTime,
    checkOutTime,
    visitorName,
    visitorRole,
    unit,
    activity,
    workstation,
    notes,
    now,
    now
  );

  broadcastSync('attendances');
  res.status(201).json({ id });
});

app.put('/api/attendances/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const attendanceId = String(req.params.id || '');
  const existing = db.prepare('SELECT * FROM attendances WHERE id = ?').get(attendanceId) as
    | Record<string, unknown>
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Data absensi tidak ditemukan.' });
    return;
  }

  const isAdmin = req.authUser!.role === 'admin';
  const isOwner = String(existing.user_id) === req.authUser!.uid;
  if (!isAdmin && !isOwner) {
    res.status(403).json({ error: 'Anda tidak memiliki izin mengubah absensi ini.' });
    return;
  }

  const now = Date.now();
  if (isAdmin) {
    const checkOutTime =
      req.body?.checkOutTime !== undefined
        ? clampStr(req.body.checkOutTime, 10)
        : String(existing.check_out_time);
    const workstation =
      req.body?.workstation !== undefined
        ? clampStr(req.body.workstation, 40)
        : String(existing.workstation);
    const notes =
      req.body?.notes !== undefined ? clampStr(req.body.notes, 200) : String(existing.notes);
    const activity =
      req.body?.activity !== undefined
        ? clampStr(req.body.activity, 120)
        : String(existing.activity);

    db.prepare(
      'UPDATE attendances SET check_out_time = ?, workstation = ?, notes = ?, activity = ?, updated_at = ? WHERE id = ?'
    ).run(checkOutTime, workstation, notes, activity, now, attendanceId);
  } else {
    if (String(existing.check_out_time) !== '') {
      res.status(403).json({ error: 'Absensi keluar sudah tercatat.' });
      return;
    }
    const checkOutTime = clampStr(req.body?.checkOutTime, 10);
    const notes =
      req.body?.notes !== undefined ? clampStr(req.body.notes, 200) : String(existing.notes);
    db.prepare(
      'UPDATE attendances SET check_out_time = ?, notes = ?, updated_at = ? WHERE id = ?'
    ).run(checkOutTime, notes, now, attendanceId);
  }

  broadcastSync('attendances');
  res.json({ ok: true });
});

app.delete('/api/attendances/:id', requireAuth, requireAdmin, (req, res) => {
  const attendanceId = String(req.params.id || '');
  db.prepare('DELETE FROM attendances WHERE id = ?').run(attendanceId);
  broadcastSync('attendances');
  res.json({ ok: true });
});

// --- ADMIN USER MANAGEMENT ---

app.post('/api/users', requireAuth, requireAdmin, (req, res) => {
  const displayName = clampStr(req.body?.displayName, 80);
  const username = sanitizeUsername(req.body?.username);
  const password = typeof req.body?.password === 'string' ? req.body.password.trim() : '';
  const role = String(req.body?.role || 'pengguna');
  const unit = clampStr(req.body?.unit, 60);
  const idNumber = clampStr(req.body?.idNumber, 40);
  const bio = clampStr(req.body?.bio, 240);
  const email = clampStr(req.body?.email, 120).toLowerCase();
  const phone = clampStr(req.body?.phone, 30);
  const active = req.body?.active !== false;

  if (!displayName || !username || username.length < 2) {
    res.status(400).json({ error: 'Nama lengkap dan username minimal 2 karakter wajib diisi.' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password masuk minimal harus 6 karakter.' });
    return;
  }
  if (!ALLOWED_ROLES.has(role)) {
    res.status(400).json({ error: 'Peran akses sistem tidak valid.' });
    return;
  }

  const existingUsername = db.prepare('SELECT uid FROM users WHERE username = ?').get(username);
  if (existingUsername) {
    res.status(409).json({ error: `Username @${username} sudah digunakan oleh akun lain.` });
    return;
  }

  const uid = crypto.randomUUID();
  const now = Date.now();
  const pwHash = hashPassword(password);

  db.prepare(
    `INSERT INTO users (uid, username, password_hash, display_name, role, unit, id_number, bio, email, phone, active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    uid,
    username,
    pwHash,
    displayName,
    role,
    unit,
    idNumber,
    bio,
    email,
    phone,
    active ? 1 : 0,
    now,
    now
  );

  const created = db
    .prepare('SELECT * FROM users WHERE uid = ?')
    .get(uid) as unknown as DbUserRow;
  broadcastSync('users');
  res.status(201).json({ user: mapUserProfile(created) });
});

app.put('/api/users/:uid', requireAuth, requireAdmin, (req: AuthenticatedRequest, res) => {
  const targetUid = String(req.params.uid || '');
  const existing = db.prepare('SELECT * FROM users WHERE uid = ?').get(targetUid) as
    | DbUserRow
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Akun pengguna tidak ditemukan.' });
    return;
  }

  const displayName = clampStr(req.body?.displayName, 80) || existing.display_name;
  const requestedUsername = sanitizeUsername(req.body?.username);
  const nextUsername = requestedUsername || existing.username;
  const role = String(req.body?.role || existing.role);
  const unit = clampStr(req.body?.unit, 60);
  const idNumber = clampStr(req.body?.idNumber, 40);
  const bio = clampStr(req.body?.bio, 240);
  const active = req.body?.active !== undefined ? Boolean(req.body.active) : existing.active === 1;
  const newPassword =
    typeof req.body?.newPassword === 'string' ? req.body.newPassword.trim() : '';

  if (!ALLOWED_ROLES.has(role)) {
    res.status(400).json({ error: 'Peran akses sistem tidak valid.' });
    return;
  }

  if (targetUid === req.authUser!.uid && (!active || role !== 'admin')) {
    res.status(400).json({
      error: 'Anda tidak dapat menonaktifkan atau menurunkan peran Admin akun yang sedang Anda gunakan.',
    });
    return;
  }

  if (nextUsername !== existing.username) {
    const taken = db
      .prepare('SELECT uid FROM users WHERE username = ? AND uid != ?')
      .get(nextUsername, targetUid);
    if (taken) {
      res.status(409).json({ error: 'Username tersebut sudah digunakan oleh akun lain.' });
      return;
    }
  }

  let nextPasswordHash = existing.password_hash;
  if (newPassword) {
    if (newPassword.length < 6) {
      res.status(400).json({ error: 'Password baru minimal harus 6 karakter.' });
      return;
    }
    nextPasswordHash = hashPassword(newPassword);
  }

  const now = Date.now();
  db.prepare(
    `UPDATE users
     SET display_name = ?, username = ?, password_hash = ?, role = ?, unit = ?, id_number = ?, bio = ?, active = ?, updated_at = ?
     WHERE uid = ?`
  ).run(
    displayName,
    nextUsername,
    nextPasswordHash,
    role,
    unit,
    idNumber,
    bio,
    active ? 1 : 0,
    now,
    targetUid
  );

  if (!active) {
    revokeUserSessions(targetUid);
    forceLogoutSocket(targetUid);
  }

  broadcastSync('users');
  res.json({ ok: true });
});

app.delete('/api/users/:uid', requireAuth, requireAdmin, (req: AuthenticatedRequest, res) => {
  const targetUid = String(req.params.uid || '');
  if (targetUid === req.authUser!.uid) {
    res.status(400).json({ error: 'Anda tidak dapat menghapus akun yang sedang aktif digunakan.' });
    return;
  }

  revokeUserSessions(targetUid);
  forceLogoutSocket(targetUid);
  db.prepare('DELETE FROM users WHERE uid = ?').run(targetUid);
  broadcastSync('users');
  res.json({ ok: true });
});

// --- FRONTEND (VITE DEV MIDDLEWARE OR PRODUCTION DIST) ---

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        next();
        return;
      }
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Not Found');
      }
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`SIPALAK server listening on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
