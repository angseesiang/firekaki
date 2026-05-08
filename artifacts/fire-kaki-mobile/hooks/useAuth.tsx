import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getMe,
  login as apiLogin,
  logout as apiLogout,
  signup as apiSignup,
  type LoginRequest,
  type SessionUser,
  type SignupRequest,
} from "@/lib/api";
import { tokenStore } from "@/lib/storage";

type Status = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: Status;
  user: SessionUser | null;
  login: (body: LoginRequest) => Promise<SessionUser>;
  signup: (body: SignupRequest) => Promise<SessionUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const tokenRef = { current: null as string | null };

export function getAuthToken(): string | null {
  return tokenRef.current;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [user, setUser] = useState<SessionUser | null>(null);
  const qc = useQueryClient();
  const initRef = useRef(false);

  const applyUser = useCallback(
    async (u: SessionUser | null) => {
      if (u) {
        if (u.sessionToken) {
          tokenRef.current = u.sessionToken;
          await tokenStore.set(u.sessionToken);
        }
        setUser(u);
        setStatus("authenticated");
      } else {
        tokenRef.current = null;
        await tokenStore.clear();
        setUser(null);
        setStatus("unauthenticated");
        qc.clear();
      }
    },
    [qc],
  );

  const refresh = useCallback(async () => {
    if (!tokenRef.current) {
      setStatus("unauthenticated");
      return;
    }
    try {
      const me = await getMe();
      await applyUser(me);
    } catch {
      await applyUser(null);
    }
  }, [applyUser]);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    (async () => {
      const stored = await tokenStore.get();
      tokenRef.current = stored;
      if (!stored) {
        setStatus("unauthenticated");
        return;
      }
      try {
        const me = await getMe();
        await applyUser(me);
      } catch {
        await applyUser(null);
      }
    })();
  }, [applyUser]);

  const login = useCallback(
    async (body: LoginRequest) => {
      const u = await apiLogin(body);
      await applyUser(u);
      return u;
    },
    [applyUser],
  );

  const signup = useCallback(
    async (body: SignupRequest) => {
      const u = await apiSignup(body);
      await applyUser(u);
      return u;
    },
    [applyUser],
  );

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // ignore
    }
    await applyUser(null);
  }, [applyUser]);

  const value = useMemo(
    () => ({ status, user, login, signup, logout, refresh }),
    [status, user, login, signup, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
