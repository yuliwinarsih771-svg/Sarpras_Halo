import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiFetch, getAuthToken, setAuthToken } from '../lib/apiClient';
import type {
  AuthUser,
  SelfSelectableRole,
  UserPrivateInfo,
  UserProfile,
} from '../types/sipalak';

interface AuthResponsePayload {
  token: string;
  profile: UserProfile;
  privateInfo: UserPrivateInfo;
}

interface AuthContextValue {
  user: AuthUser | null;
  profile: UserProfile | null;
  privateInfo: UserPrivateInfo | null;
  isAdmin: boolean;
  needsSetup: boolean;
  authReady: boolean;
  authLoading: boolean;
  authError: string | null;
  signInWithPassword: (identifier: string, password: string) => Promise<void>;
  bootstrapAdmin: (input: {
    displayName: string;
    username: string;
    password: string;
    email?: string;
    unit?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  forceClearSession: () => void;
  refreshAuthProfile: () => Promise<void>;
  updateMyProfile: (input: {
    displayName: string;
    username: string;
    newPassword?: string;
    role?: SelfSelectableRole;
    unit: string;
    idNumber: string;
    bio: string;
    email: string;
    phone: string;
  }) => Promise<{ passwordUpdated: boolean; passwordNotice?: string }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [privateInfo, setPrivateInfo] = useState<UserPrivateInfo | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const checkBootstrapStatus = useCallback(async () => {
    try {
      const status = await apiFetch<{ needsSetup: boolean }>('/api/auth/bootstrap-status');
      setNeedsSetup(Boolean(status.needsSetup));
    } catch {
      setNeedsSetup(false);
    } finally {
      setAuthReady(true);
    }
  }, []);

  useEffect(() => {
    void checkBootstrapStatus();
  }, [checkBootstrapStatus]);

  const applySession = useCallback(
    (payload: { token?: string; profile: UserProfile; privateInfo: UserPrivateInfo }) => {
      if (payload.token) {
        setAuthToken(payload.token);
      }
      setUser({
        uid: payload.profile.uid,
        email: payload.privateInfo.email || '',
      });
      setProfile(payload.profile);
      setPrivateInfo(payload.privateInfo);
      setNeedsSetup(false);
      setAuthError(null);
      setAuthReady(true);
    },
    []
  );

  const forceClearSession = useCallback(() => {
    setAuthToken(null);
    setUser(null);
    setProfile(null);
    setPrivateInfo(null);
  }, []);

  const refreshAuthProfile = useCallback(async () => {
    if (!getAuthToken()) return;
    try {
      const res = await apiFetch<{ profile: UserProfile; privateInfo: UserPrivateInfo }>(
        '/api/auth/me'
      );
      applySession(res);
    } catch {
      forceClearSession();
    }
  }, [applySession, forceClearSession]);

  const bootstrapAdmin = useCallback(
    async (input: {
      displayName: string;
      username: string;
      password: string;
      email?: string;
      unit?: string;
    }) => {
      setAuthLoading(true);
      setAuthError(null);
      try {
        const res = await apiFetch<AuthResponsePayload>('/api/auth/bootstrap', {
          method: 'POST',
          body: JSON.stringify(input),
        });
        applySession(res);
      } catch (err) {
        setAuthError(err instanceof Error ? err.message : 'Gagal membuat akun admin awal.');
      } finally {
        setAuthLoading(false);
      }
    },
    [applySession]
  );

  const signInWithPassword = useCallback(
    async (identifier: string, password: string) => {
      const cleanIdentifier = identifier.trim();
      if (!cleanIdentifier || !password) {
        setAuthError('Nama pengguna dan kata sandi wajib diisi.');
        return;
      }

      setAuthLoading(true);
      setAuthError(null);
      try {
        const res = await apiFetch<AuthResponsePayload>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ identifier: cleanIdentifier, password }),
        });
        applySession(res);
      } catch (err) {
        setAuthError(
          err instanceof Error ? err.message : 'Nama pengguna atau kata sandi tidak sesuai.'
        );
      } finally {
        setAuthLoading(false);
      }
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    setAuthLoading(true);
    try {
      if (getAuthToken()) {
        await apiFetch('/api/auth/logout', { method: 'POST' });
      }
    } catch {
      // Ignore logout network error when clearing client session
    } finally {
      forceClearSession();
      void checkBootstrapStatus();
      setAuthLoading(false);
    }
  }, [checkBootstrapStatus, forceClearSession]);

  const updateMyProfile = useCallback(
    async (input: {
      displayName: string;
      username: string;
      newPassword?: string;
      role?: SelfSelectableRole;
      unit: string;
      idNumber: string;
      bio: string;
      email: string;
      phone: string;
    }): Promise<{ passwordUpdated: boolean; passwordNotice?: string }> => {
      const res = await apiFetch<{
        passwordUpdated: boolean;
        profile: UserProfile;
        privateInfo: UserPrivateInfo;
      }>('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(input),
      });
      applySession(res);
      return { passwordUpdated: Boolean(res.passwordUpdated) };
    },
    [applySession]
  );

  const isAdmin = Boolean(profile?.role === 'admin');

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        privateInfo,
        isAdmin,
        needsSetup,
        authReady,
        authLoading,
        authError,
        signInWithPassword,
        bootstrapAdmin,
        logout,
        forceClearSession,
        refreshAuthProfile,
        updateMyProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
