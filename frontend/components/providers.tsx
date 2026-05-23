"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "@/lib/api";
import type { AppInfo, EngineInfo, UserOut } from "@/lib/types";

interface JarvisCtx {
  info: AppInfo | null;
  users: UserOut[];
  engines: EngineInfo[];
  activeUser: UserOut | null;
  setActiveUserId: (id: number | null) => void;
  refresh: () => Promise<void>;
  loading: boolean;
}

const Ctx = createContext<JarvisCtx | null>(null);

const ACTIVE_USER_KEY = "jarvis.activeUserId";

export function JarvisProvider({ children }: { children: React.ReactNode }) {
  const [info, setInfo] = useState<AppInfo | null>(null);
  const [users, setUsers] = useState<UserOut[]>([]);
  const [engines, setEngines] = useState<EngineInfo[]>([]);
  const [activeUserId, _setActiveUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const setActiveUserId = useCallback((id: number | null) => {
    _setActiveUserId(id);
    if (typeof window !== "undefined") {
      if (id == null) localStorage.removeItem(ACTIVE_USER_KEY);
      else localStorage.setItem(ACTIVE_USER_KEY, String(id));
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [i, u, e] = await Promise.all([
        api.info(),
        api.listUsers(),
        api.engines(),
      ]);
      setInfo(i);
      setUsers(u);
      setEngines(e);
      if (u.length > 0) {
        const stored =
          typeof window !== "undefined"
            ? Number(localStorage.getItem(ACTIVE_USER_KEY) || "0")
            : 0;
        const found = u.find((x) => x.id === stored);
        _setActiveUserId(found ? found.id : u[0].id);
      } else {
        _setActiveUserId(null);
      }
    } catch (err) {
      console.error("refresh failed", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const activeUser = useMemo(
    () => users.find((u) => u.id === activeUserId) ?? null,
    [users, activeUserId]
  );

  return (
    <Ctx.Provider
      value={{ info, users, engines, activeUser, setActiveUserId, refresh, loading }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useJarvis() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useJarvis must be used within JarvisProvider");
  return ctx;
}
