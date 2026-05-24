"use client";

import { useEffect, useRef } from "react";

export interface ShortcutContext {
  event: KeyboardEvent;
  /** True when the keypress originated inside an input/textarea/contenteditable. */
  inTextField: boolean;
}

export type ShortcutHandler = (ctx: ShortcutContext) => void | "skip";

export interface ShortcutSpec {
  /** Handler invoked when the shortcut fires. Return "skip" to let the browser handle it. */
  handler: ShortcutHandler;
  /** When true, the shortcut still fires inside text fields. Default: false (except for Escape, which is always allowed). */
  allowInTextField?: boolean;
  /** When false, do not call event.preventDefault. Default: true. */
  preventDefault?: boolean;
}

export type ShortcutMap = Record<string, ShortcutSpec | ShortcutHandler>;

function isTextFieldTarget(t: EventTarget | null): boolean {
  if (!t || !(t instanceof HTMLElement)) return false;
  const tag = t.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (t.isContentEditable) return true;
  return false;
}

/** Build a normalized key id like "F5" or "Ctrl+Space" or "Escape". */
function keyId(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push("Ctrl");
  if (e.altKey) parts.push("Alt");
  if (e.shiftKey) parts.push("Shift");
  let key = e.key;
  if (key === " ") key = "Space";
  // Normalize letters to uppercase for a stable id
  if (key.length === 1) key = key.toUpperCase();
  parts.push(key);
  return parts.join("+");
}

/**
 * Registers a window-level keydown handler with a map of shortcut specs.
 *
 * Keys are matched by id strings like "F1", "F2", "Tab", "Escape",
 * "Ctrl+Space", "Ctrl+K". The map is captured by ref so handlers can
 * be updated without re-binding the global listener.
 */
export function useGlobalShortcuts(
  map: ShortcutMap,
  options: { enabled?: boolean } = {},
): void {
  const enabled = options.enabled ?? true;
  const mapRef = useRef(map);
  mapRef.current = map;

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const id = keyId(e);
      const raw = mapRef.current[id];
      if (!raw) return;
      const spec: ShortcutSpec =
        typeof raw === "function" ? { handler: raw } : raw;
      const inText = isTextFieldTarget(e.target);
      const allowText =
        spec.allowInTextField ?? (id === "Escape");
      if (inText && !allowText) return;
      const result = spec.handler({ event: e, inTextField: inText });
      if (result === "skip") return;
      if (spec.preventDefault !== false) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);
}
