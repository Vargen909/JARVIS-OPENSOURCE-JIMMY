"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  brainScale,
  DEFAULT_LAYOUT_ID,
  getLayoutPreset,
  type BrainSize,
  type Density,
  type LayoutId,
  type LayoutPanels,
  type SidebarMode,
} from "./layouts";
import { DEFAULT_PALETTE_ID, type PaletteId } from "./palettes";

export interface LayoutState {
  paletteId: PaletteId;
  layoutId: LayoutId;
  panels: LayoutPanels;
  brainSize: BrainSize;
  density: Density;
  sidebar: SidebarMode;
  glowIntensity: number;
  compactMode: boolean;
}

type Action =
  | { type: "HYDRATE"; payload: LayoutState }
  | { type: "SET_PALETTE"; paletteId: PaletteId }
  | { type: "SET_LAYOUT"; layoutId: LayoutId }
  | { type: "SET_PANEL"; key: keyof LayoutPanels; value: boolean }
  | { type: "SET_BRAIN_SIZE"; brainSize: BrainSize }
  | { type: "SET_DENSITY"; density: Density }
  | { type: "SET_GLOW"; glowIntensity: number }
  | { type: "SET_COMPACT"; compactMode: boolean }
  | { type: "RESET_PRESET" }
  | { type: "RESET_ALL" };

function buildFromPreset(layoutId: LayoutId): LayoutState {
  const preset = getLayoutPreset(layoutId);
  return {
    paletteId: DEFAULT_PALETTE_ID,
    layoutId: preset.id,
    panels: { ...preset.panels },
    brainSize: preset.brainSize,
    density: preset.density,
    sidebar: preset.sidebar,
    glowIntensity: 0.7,
    compactMode: preset.density === "compact",
  };
}

const DEFAULT_STATE: LayoutState = {
  ...buildFromPreset(DEFAULT_LAYOUT_ID),
  paletteId: DEFAULT_PALETTE_ID,
};

function reducer(state: LayoutState, action: Action): LayoutState {
  switch (action.type) {
    case "HYDRATE":
      return action.payload;
    case "SET_PALETTE":
      return { ...state, paletteId: action.paletteId };
    case "SET_LAYOUT": {
      const preset = getLayoutPreset(action.layoutId);
      return {
        ...state,
        layoutId: preset.id,
        panels: { ...preset.panels },
        brainSize: preset.brainSize,
        density: preset.density,
        sidebar: preset.sidebar,
        compactMode: preset.density === "compact",
      };
    }
    case "SET_PANEL":
      return {
        ...state,
        panels: { ...state.panels, [action.key]: action.value },
      };
    case "SET_BRAIN_SIZE":
      return { ...state, brainSize: action.brainSize };
    case "SET_DENSITY":
      return {
        ...state,
        density: action.density,
        compactMode: action.density === "compact",
      };
    case "SET_GLOW":
      return { ...state, glowIntensity: action.glowIntensity };
    case "SET_COMPACT":
      return {
        ...state,
        compactMode: action.compactMode,
        density: action.compactMode ? "compact" : "default",
      };
    case "RESET_PRESET": {
      const preset = getLayoutPreset(state.layoutId);
      return {
        ...state,
        panels: { ...preset.panels },
        brainSize: preset.brainSize,
        density: preset.density,
        sidebar: preset.sidebar,
        glowIntensity: 0.7,
        compactMode: preset.density === "compact",
      };
    }
    case "RESET_ALL":
      return { ...DEFAULT_STATE };
    default:
      return state;
  }
}

function storageKey(userId: number | null | undefined): string {
  return userId ? `bob.layout.user:${userId}` : "bob.layout.guest";
}

/** Returns the legacy storage key (pre-rename) so migrations can read it. */
function legacyStorageKey(userId: number | null | undefined): string {
  return userId ? `jarvis.layout.user:${userId}` : "jarvis.layout.guest";
}

function applyDom(state: LayoutState) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-palette", state.paletteId);
  root.setAttribute("data-density", state.density);
  root.style.setProperty("--glow-intensity", String(state.glowIntensity));
  root.style.setProperty("--brain-scale", String(brainScale(state.brainSize)));
}

function loadFromStorage(
  key: string,
  legacyKey?: string
): LayoutState | null {
  try {
    let raw = localStorage.getItem(key);
    if (!raw && legacyKey) {
      // Migrate legacy jarvis.* key → bob.* key
      const legacyRaw = localStorage.getItem(legacyKey);
      if (legacyRaw) {
        localStorage.setItem(key, legacyRaw);
        localStorage.removeItem(legacyKey);
        raw = legacyRaw;
      }
    }
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LayoutState>;
    if (!parsed.layoutId || !parsed.paletteId) return null;
    const preset = getLayoutPreset(parsed.layoutId);
    return {
      paletteId: parsed.paletteId as PaletteId,
      layoutId: parsed.layoutId,
      panels: { ...preset.panels, ...parsed.panels },
      brainSize: parsed.brainSize ?? preset.brainSize,
      density: parsed.density ?? preset.density,
      sidebar: parsed.sidebar ?? preset.sidebar,
      glowIntensity: parsed.glowIntensity ?? 0.7,
      compactMode: parsed.compactMode ?? preset.density === "compact",
    };
  } catch {
    return null;
  }
}

interface LayoutCtx {
  state: LayoutState;
  dispatch: React.Dispatch<Action>;
  commit: () => void;
  revert: () => void;
  snapshot: () => void;
  hydrated: boolean;
}

const LayoutContext = createContext<LayoutCtx | null>(null);

export function LayoutProvider({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId?: number | null;
}) {
  const [state, dispatch] = useReducer(reducer, DEFAULT_STATE);
  const snapshotRef = useRef<LayoutState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const key = storageKey(userId);
    const legacy = legacyStorageKey(userId);
    const saved = loadFromStorage(key, legacy);
    const next = saved ?? DEFAULT_STATE;
    dispatch({ type: "HYDRATE", payload: next });
    snapshotRef.current = next;
    applyDom(next);
    setHydrated(true);
  }, [userId]);

  useEffect(() => {
    if (hydrated) applyDom(state);
  }, [state, hydrated]);

  const commit = useCallback(() => {
    const key = storageKey(userId);
    localStorage.setItem(key, JSON.stringify(state));
    snapshotRef.current = state;
  }, [state, userId]);

  const revert = useCallback(() => {
    dispatch({ type: "HYDRATE", payload: snapshotRef.current });
  }, []);

  const snapshot = useCallback(() => {
    snapshotRef.current = state;
  }, [state]);

  const value = useMemo(
    () => ({ state, dispatch, commit, revert, snapshot, hydrated }),
    [state, commit, revert, snapshot, hydrated]
  );

  return (
    <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>
  );
}

export function useLayout() {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error("useLayout must be used within LayoutProvider");
  return ctx;
}

/** Read layout from localStorage before React hydrates (used in layout.tsx script). */
export function readStoredLayoutKey(userId?: number | null): string {
  return storageKey(userId);
}
