/**
 * Firestore Security Rules Test Specification (Dirty Dozen Verification)
 * Run with @firebase/rules-unit-testing against local Firebase Emulator if available.
 */
export const DIRTY_DOZEN_TESTS = [
  { name: '1. Unauthenticated read on /assets/a1', expected: 'PERMISSION_DENIED' },
  { name: '2. Unverified email write on /schedules/s1', expected: 'PERMISSION_DENIED' },
  { name: '3. Self-assigned admin role on /users/u1 create', expected: 'PERMISSION_DENIED' },
  { name: '4. Privilege escalation role update on /users/u1', expected: 'PERMISSION_DENIED' },
  { name: '5. Shadow ghost field isVerified on /assets/a1', expected: 'PERMISSION_DENIED' },
  { name: '6. Owner spoofing requesterId on /loans/l1', expected: 'PERMISSION_DENIED' },
  { name: '7. Orphaned loan referencing missing asset', expected: 'PERMISSION_DENIED' },
  { name: '8. PII blanket read on /users/other/private/info', expected: 'PERMISSION_DENIED' },
  { name: '9. Client timestamp forgery createdAt != request.time', expected: 'PERMISSION_DENIED' },
  { name: '10. Terminal state update on Dikembalikan loan by non-admin', expected: 'PERMISSION_DENIED' },
  { name: '11. Path ID poisoning with oversized or invalid chars', expected: 'PERMISSION_DENIED' },
  { name: '12. Unscoped blanket list on /loans by non-admin', expected: 'PERMISSION_DENIED' },
] as const;
