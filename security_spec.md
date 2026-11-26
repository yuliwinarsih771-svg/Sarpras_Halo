# Security Specification: SIPALAK Firestore Rules

## 1. Data Invariants
1. **Identity Integrity**: Every user-owned document (`users/{uid}`, `loans.requesterId`, `schedules.requesterId`, `maintenances.createdBy`, `attendances.userId`, `assets.createdBy`) must bind its owner field strictly to `request.auth.uid` on creation and preserve it as immutable on update.
2. **No Self-Assigned Privileges**: Users registering their own `users/{uid}` profile may only select standard roles (`pengguna`, `guru`, `siswa`). Only verified administrators (`isAdmin()`) may assign `admin` or `teknisi` roles or create entries in `/admins/{uid}`.
3. **Referential Integrity**: A `loan` or `maintenance` record cannot be created without an existing parent document in `/assets/{assetId}` verified via `exists()`.
4. **PII Isolation**: Sensitive PII (`email`, `phone`) is stored exclusively in `/users/{uid}/private/info` and is readable/writable only by the owning user or an administrator.
5. **Temporal Integrity & Terminal State Locking**: All `createdAt` and `updatedAt` fields must equal `request.time`; `createdAt` is immutable. Non-admins cannot mutate records in terminal states (`Dikembalikan`, `Ditolak`, `Selesai`).
6. **Zero-Trust List Queries**: Every `allow list` rule evaluates `resource.data` against `request.auth.uid`, `isAdmin()`, or `labScope == 'smkn1sambeng'`.

## 2. The "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated Read/Write**: Unauthenticated request reading `/assets/asset-1` -> DENIED.
2. **Unverified Email Write**: Authenticated user with `email_verified: false` creating `/schedules/s1` -> DENIED.
3. **Self-Assigned Admin Role**: Standard user creating `/users/{uid}` with `role: "admin"` -> DENIED.
4. **Privilege Escalation Update**: Standard user updating `/users/{uid}` `affectedKeys: ["role"]` to `"admin"` -> DENIED.
5. **Shadow Ghost Field**: User creating `/assets/a1` with extra field `isVerified: true` -> DENIED by `hasOnly(...)`.
6. **Owner Spoofing**: User A creating `/loans/l1` with `requesterId: "user-B"` -> DENIED.
7. **Orphaned Loan Write**: User creating `/loans/l1` referencing non-existent `/assets/missing-asset` -> DENIED by `exists(...)`.
8. **PII Blanket Read**: User A reading `/users/user-B/private/info` -> DENIED.
9. **Client Timestamp Forgery**: User creating `/schedules/s1` with client-supplied `createdAt` != `request.time` -> DENIED.
10. **Terminal State Bypass**: Non-admin updating `/loans/l1` whose existing `status` is `"Dikembalikan"` -> DENIED.
11. **Path ID Poisoning**: Request targeting `/assets/` with invalid/oversized ID containing `/` or >128 chars -> DENIED by `isValidId()`.
12. **Blanket Unscoped List**: Non-admin executing `list` on `/loans` without `where('requesterId', '==', uid)` -> DENIED.
