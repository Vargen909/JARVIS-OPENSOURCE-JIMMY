"use client";

import { useGlobalShortcuts, type ShortcutMap } from "@/hooks/use-global-shortcuts";

export interface CoreShortcutActions {
  /** F1: toggle the command overlay. */
  toggleCommandOverlay: () => void;
  /** F2: cycle to the next view in VIEW_CYCLE_ORDER. */
  cycleView: () => void;
  /** F3: toggle voice listening (mic). */
  toggleVoice: () => void;
  /** F4: mute/unmute B.O.B's TTS voice. */
  toggleVoiceMute: () => void;
  /** F5: toggle Neural Focus Mode (persisted). */
  toggleFocusMode: () => void;
  /** TAB: open the command overlay (only when not focused on a text field). */
  openCommandOverlay: () => void;
  /** ESC: close overlays / exit focus mode (priority handled by caller). */
  escape: () => void;
  /** CTRL+SPACE: focus the input + briefly flash the orb to "active". */
  wakeBob: () => void;
}

/**
 * Wires all immersive Core Mode shortcuts to a window-level listener.
 *
 * Keys captured:
 *   F1, F2, F3, F4, F5, Tab, Escape, Ctrl+Space
 *
 * The hook only takes effect when `enabled` is true (typically when the
 * Core view is the active route). Inside text fields most shortcuts are
 * ignored so users can type "F1" or whatever in their messages, except
 * Escape which always works.
 */
export function useCoreShortcuts(
  actions: CoreShortcutActions,
  enabled: boolean
): void {
  const map: ShortcutMap = {
    F1: () => actions.toggleCommandOverlay(),
    F2: () => actions.cycleView(),
    F3: () => actions.toggleVoice(),
    F4: () => actions.toggleVoiceMute(),
    F5: () => actions.toggleFocusMode(),
    Tab: () => actions.openCommandOverlay(),
    Escape: () => actions.escape(),
    "Ctrl+Space": () => actions.wakeBob(),
  };
  useGlobalShortcuts(map, { enabled });
}

/** localStorage key for the global TTS-mute preference. */
export const VOICE_MUTED_KEY = "bob.voiceMuted";

export function readVoiceMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(VOICE_MUTED_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeVoiceMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(VOICE_MUTED_KEY, muted ? "1" : "0");
  } catch {}
}
