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

interface BobCtx {
  info: AppInfo | null;
  users: UserOut[];
  engines: EngineInfo[];
  activeUser: UserOut | null;
  setActiveUserId: (id: number | null) => void;
  refresh: () => Promise<void>;
  loading: boolean;
}

const Ctx = createContext<BobCtx | null>(null);

const ACTIVE_USER_KEY = "bob.activeUserId";
const LEGACY_ACTIVE_USER_KEY = "jarvis.activeUserId";

/**
 * One-shot localStorage migration: copy "jarvis.activeUserId" to its new key
 * if the new one is missing, then remove the old one. Idempotent.
 */
function migrateActiveUserKey() {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(ACTIVE_USER_KEY) != null) return;
    const legacy = localStorage.getItem(LEGACY_ACTIVE_USER_KEY);
    if (legacy != null) {
      localStorage.setItem(ACTIVE_USER_KEY, legacy);
      localStorage.removeItem(LEGACY_ACTIVE_USER_KEY);
    }
  } catch {
    /* ignore quota/security errors */
  }
}

export function BobProvider({ children }: { children: React.ReactNode }) {
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
      migrateActiveUserKey();
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

export function useBob() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBob must be used within BobProvider");
  return ctx;
}

/* ── Legacy aliases (deprecated, kept for backward compatibility) ── */
/** @deprecated use BobProvider */
export const JarvisProvider = BobProvider;
/** @deprecated use useBob */
export const useJarvis = useBob;
