import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch, getAuthToken } from '../lib/apiClient';
import type {
  Asset,
  AssetCategory,
  AssetCondition,
  Attendance,
  LabSchedule,
  Loan,
  LoanStatus,
  Maintenance,
  MaintenanceStatus,
  PersonRole,
  ScheduleStatus,
  UserProfile,
  UserRole,
} from '../types/sipalak';

interface DataSnapshotResponse {
  assets: Asset[];
  loans: Loan[];
  schedules: LabSchedule[];
  maintenances: Maintenance[];
  attendances: Attendance[];
  users: UserProfile[];
}

export function useSipalakData() {
  const { user, profile, isAdmin, authReady, forceClearSession, refreshAuthProfile } = useAuth();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [schedules, setSchedules] = useState<LabSchedule[]>([]);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);

  const fetchAllData = useCallback(async () => {
    if (!getAuthToken()) return;
    try {
      const data = await apiFetch<DataSnapshotResponse>('/api/data');
      setAssets(data.assets || []);
      setLoans(data.loans || []);
      setSchedules(data.schedules || []);
      setMaintenances(data.maintenances || []);
      setAttendances(data.attendances || []);
      setUsersList(data.users || []);
    } catch {
      // Auth expiry handled by forceClearSession or refreshAuthProfile
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authReady || !user || !profile || !getAuthToken()) {
      setAssets([]);
      setLoans([]);
      setSchedules([]);
      setMaintenances([]);
      setAttendances([]);
      setUsersList([]);
      setLoading(false);
      return;
    }

    let disposed = false;
    let attempt = 0;

    setLoading(true);
    void fetchAllData();

    const connectWs = () => {
      if (disposed || !getAuthToken()) return;
      const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProto}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        attempt = 0;
        const token = getAuthToken();
        if (token) {
          ws.send(JSON.stringify({ type: 'auth', token }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(String(event.data)) as { type?: string; scope?: string };
          if (msg.type === 'ready') {
            void fetchAllData();
          } else if (msg.type === 'sync') {
            void fetchAllData();
            if (msg.scope === 'users') {
              void refreshAuthProfile();
            }
          } else if (msg.type === 'force-logout') {
            forceClearSession();
          }
        } catch {
          // Ignore malformed WS message
        }
      };

      ws.onclose = () => {
        if (disposed || !getAuthToken()) return;
        const delay = Math.min(10000, 1000 * Math.pow(1.6, attempt));
        attempt += 1;
        reconnectTimerRef.current = window.setTimeout(connectWs, delay);
      };
    };

    connectWs();

    return () => {
      disposed = true;
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [authReady, fetchAllData, forceClearSession, profile?.uid, refreshAuthProfile, user?.uid]);

  // --- ASSETS ---
  const addAsset = useCallback(
    async (input: {
      code: string;
      name: string;
      category: AssetCategory;
      brand: string;
      condition: AssetCondition;
      location: string;
      fundingSource: string;
      procurementYear: number;
      nextMaintenanceDate: string;
    }) => {
      await apiFetch('/api/assets', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      await fetchAllData();
    },
    [fetchAllData]
  );

  const updateAsset = useCallback(
    async (
      assetId: string,
      input: {
        code: string;
        name: string;
        category: AssetCategory;
        brand: string;
        condition: AssetCondition;
        location: string;
        fundingSource: string;
        procurementYear: number;
        nextMaintenanceDate: string;
      }
    ) => {
      await apiFetch(`/api/assets/${encodeURIComponent(assetId)}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      });
      await fetchAllData();
    },
    [fetchAllData]
  );

  const deleteAsset = useCallback(
    async (assetId: string) => {
      await apiFetch(`/api/assets/${encodeURIComponent(assetId)}`, {
        method: 'DELETE',
      });
      await fetchAllData();
    },
    [fetchAllData]
  );

  const seedSampleAssets = useCallback(async () => {
    if (!isAdmin) return;
    await apiFetch('/api/assets/seed-samples', {
      method: 'POST',
    });
    await fetchAllData();
  }, [fetchAllData, isAdmin]);

  // --- LOANS ---
  const addLoan = useCallback(
    async (input: {
      asset: Asset;
      borrowerName: string;
      borrowerRole: PersonRole;
      unit: string;
      borrowDate: string;
      returnDate: string;
      purpose: string;
      notes: string;
    }) => {
      await apiFetch('/api/loans', {
        method: 'POST',
        body: JSON.stringify({
          assetId: input.asset.id,
          borrowerName: input.borrowerName,
          borrowerRole: input.borrowerRole,
          unit: input.unit,
          borrowDate: input.borrowDate,
          returnDate: input.returnDate,
          purpose: input.purpose,
          notes: input.notes,
        }),
      });
      await fetchAllData();
    },
    [fetchAllData]
  );

  const updateLoanStatus = useCallback(
    async (loanId: string, status: LoanStatus, notes?: string, returnDate?: string) => {
      await apiFetch(`/api/loans/${encodeURIComponent(loanId)}`, {
        method: 'PUT',
        body: JSON.stringify({ status, notes, returnDate }),
      });
      await fetchAllData();
    },
    [fetchAllData]
  );

  const deleteLoan = useCallback(
    async (loanId: string) => {
      await apiFetch(`/api/loans/${encodeURIComponent(loanId)}`, {
        method: 'DELETE',
      });
      await fetchAllData();
    },
    [fetchAllData]
  );

  // --- SCHEDULES ---
  const addSchedule = useCallback(
    async (input: {
      date: string;
      startTime: string;
      endTime: string;
      activity: string;
      requesterName: string;
      requesterRole: PersonRole;
      unit: string;
    }) => {
      await apiFetch('/api/schedules', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      await fetchAllData();
    },
    [fetchAllData]
  );

  const updateScheduleStatus = useCallback(
    async (scheduleId: string, status: ScheduleStatus) => {
      await apiFetch(`/api/schedules/${encodeURIComponent(scheduleId)}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      await fetchAllData();
    },
    [fetchAllData]
  );

  const deleteSchedule = useCallback(
    async (scheduleId: string) => {
      await apiFetch(`/api/schedules/${encodeURIComponent(scheduleId)}`, {
        method: 'DELETE',
      });
      await fetchAllData();
    },
    [fetchAllData]
  );

  // --- MAINTENANCES ---
  const addMaintenance = useCallback(
    async (input: {
      asset: Asset;
      issue: string;
      actionTaken: string;
      technicianName: string;
      maintenanceDate: string;
      status: MaintenanceStatus;
      resultingCondition: AssetCondition;
      syncAssetCondition?: boolean;
    }) => {
      await apiFetch('/api/maintenances', {
        method: 'POST',
        body: JSON.stringify({
          assetId: input.asset.id,
          issue: input.issue,
          actionTaken: input.actionTaken,
          technicianName: input.technicianName,
          maintenanceDate: input.maintenanceDate,
          status: input.status,
          resultingCondition: input.resultingCondition,
          syncAssetCondition: input.syncAssetCondition,
        }),
      });
      await fetchAllData();
    },
    [fetchAllData]
  );

  const updateMaintenance = useCallback(
    async (
      maintenanceId: string,
      _assetId: string,
      input: {
        issue: string;
        actionTaken: string;
        technicianName: string;
        maintenanceDate: string;
        status: MaintenanceStatus;
        resultingCondition: AssetCondition;
        syncAssetCondition?: boolean;
      }
    ) => {
      await apiFetch(`/api/maintenances/${encodeURIComponent(maintenanceId)}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      });
      await fetchAllData();
    },
    [fetchAllData]
  );

  const deleteMaintenance = useCallback(
    async (maintenanceId: string) => {
      await apiFetch(`/api/maintenances/${encodeURIComponent(maintenanceId)}`, {
        method: 'DELETE',
      });
      await fetchAllData();
    },
    [fetchAllData]
  );

  // --- ATTENDANCES ---
  const addAttendance = useCallback(
    async (input: {
      date: string;
      checkInTime: string;
      checkOutTime: string;
      visitorName: string;
      visitorRole: PersonRole;
      unit: string;
      activity: string;
      workstation: string;
      notes: string;
    }) => {
      await apiFetch('/api/attendances', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      await fetchAllData();
    },
    [fetchAllData]
  );

  const checkOutAttendance = useCallback(
    async (attendanceId: string, checkOutTime: string, notes?: string) => {
      await apiFetch(`/api/attendances/${encodeURIComponent(attendanceId)}`, {
        method: 'PUT',
        body: JSON.stringify({ checkOutTime, notes }),
      });
      await fetchAllData();
    },
    [fetchAllData]
  );

  const deleteAttendance = useCallback(
    async (attendanceId: string) => {
      await apiFetch(`/api/attendances/${encodeURIComponent(attendanceId)}`, {
        method: 'DELETE',
      });
      await fetchAllData();
    },
    [fetchAllData]
  );

  // --- ADMIN USER MANAGEMENT ---
  const createUserAccount = useCallback(
    async (input: {
      displayName: string;
      username: string;
      password: string;
      role: UserRole;
      unit: string;
      idNumber: string;
      email: string;
      phone: string;
      bio: string;
      active: boolean;
    }) => {
      await apiFetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      await fetchAllData();
    },
    [fetchAllData]
  );

  const updateUserByAdmin = useCallback(
    async (
      targetUid: string,
      input: {
        displayName: string;
        username?: string;
        newPassword?: string;
        role: UserRole;
        unit: string;
        idNumber: string;
        bio: string;
        active: boolean;
      }
    ) => {
      await apiFetch(`/api/users/${encodeURIComponent(targetUid)}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      });
      await fetchAllData();
    },
    [fetchAllData]
  );

  const deleteUserAccount = useCallback(
    async (targetUid: string) => {
      await apiFetch(`/api/users/${encodeURIComponent(targetUid)}`, {
        method: 'DELETE',
      });
      await fetchAllData();
    },
    [fetchAllData]
  );

  return {
    assets,
    loans,
    schedules,
    maintenances,
    attendances,
    usersList,
    loading,
    addAsset,
    updateAsset,
    deleteAsset,
    seedSampleAssets,
    addLoan,
    updateLoanStatus,
    deleteLoan,
    addSchedule,
    updateScheduleStatus,
    deleteSchedule,
    addMaintenance,
    updateMaintenance,
    deleteMaintenance,
    addAttendance,
    checkOutAttendance,
    deleteAttendance,
    createUserAccount,
    updateUserByAdmin,
    deleteUserAccount,
  };
}
