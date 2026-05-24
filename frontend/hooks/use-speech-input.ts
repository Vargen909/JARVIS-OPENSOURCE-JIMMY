"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { mapSpeechError, type MappedError } from "@/lib/chat-errors";

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult:
    | ((e: {
        results: ArrayLike<{
          0: { transcript: string };
          isFinal?: boolean;
          length: number;
        }> & { length: number };
        resultIndex: number;
      }) => void)
    | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

interface SpeechWindow {
  SpeechRecognition?: { new (): SpeechRecognitionLike };
  webkitSpeechRecognition?: { new (): SpeechRecognitionLike };
}

const isDev = process.env.NODE_ENV !== "production";
const dlog = (...a: unknown[]) =>
  isDev && typeof console !== "undefined" && console.debug("[bob:voice]", ...a);

export interface UseSpeechInputOptions {
  /** BCP-47 language tag. Defaults to navigator.language. */
  lang?: string;
  /**
   * Called when a final transcript chunk is recognized. Use this to send
   * the message automatically (Core view) or fill an input (Chat view).
   */
  onFinalTranscript?: (text: string) => void;
  /** Called for interim (partial) transcripts. Optional. */
  onInterim?: (text: string) => void;
}

export interface UseSpeechInput {
  /** True if the browser exposes SpeechRecognition. */
  supported: boolean;
  /** True while the recogniser is running. */
  listening: boolean;
  /** Last error, or null. */
  error: MappedError | null;
  /** Begin listening. Toggles off if already listening. */
  toggle: () => void;
  /** Force-stop listening. Safe to call when idle. */
  stop: () => void;
  /** Clear the last error. */
  clearError: () => void;
}

/**
 * Web Speech API wrapper for browser-native speech-to-text.
 *
 * Used by Core view (auto-send on final transcript) and Chat input
 * (fill the textarea). Returns clear error states for permission
 * denial / unsupported / no-speech rather than alert()s.
 */
export function useSpeechInput(opts: UseSpeechInputOptions = {}): UseSpeechInput {
  const { lang, onFinalTranscript, onInterim } = opts;
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<MappedError | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const onFinalRef = useRef<typeof onFinalTranscript>(onFinalTranscript);
  const onInterimRef = useRef<typeof onInterim>(onInterim);

  onFinalRef.current = onFinalTranscript;
  onInterimRef.current = onInterim;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as unknown as SpeechWindow;
    setSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  const stop = useCallback(() => {
    const r = recRef.current;
    if (!r) return;
    try {
      r.stop();
    } catch {}
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const toggle = useCallback(() => {
    if (typeof window === "undefined") return;
    const w = window as unknown as SpeechWindow;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      setError({
        kind: "stt-unsupported",
        message: "Voice input is not supported in this browser.",
      });
      return;
    }

    if (recRef.current) {
      dlog("toggle off");
      try {
        recRef.current.stop();
      } catch {}
      return;
    }

    const r = new SR();
    r.lang = lang || (typeof navigator !== "undefined" ? navigator.language : "en-US");
    r.interimResults = true;
    r.continuous = false;
    r.onresult = (e) => {
      let interim = "";
      let finalText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i] as unknown as {
          0: { transcript: string };
          isFinal?: boolean;
        };
        const txt = res[0].transcript;
        if (res.isFinal) finalText += txt;
        else interim += txt;
      }
      if (interim && onInterimRef.current) {
        onInterimRef.current(interim.trim());
      }
      if (finalText) {
        const trimmed = finalText.trim();
        dlog("final transcript", trimmed);
        onFinalRef.current?.(trimmed);
      }
    };
    r.onerror = (e) => {
      dlog("error", e.error);
      setError(mapSpeechError(e.error));
    };
    r.onend = () => {
      dlog("ended");
      setListening(false);
      recRef.current = null;
    };
    recRef.current = r;
    try {
      r.start();
      dlog("started");
      setError(null);
      setListening(true);
    } catch (e) {
      dlog("start failed", e);
      setError({
        kind: "unknown",
        message: e instanceof Error ? e.message : "Failed to start voice input.",
        cause: e,
      });
      recRef.current = null;
    }
  }, [lang]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const r = recRef.current;
      if (r) {
        try {
          r.abort();
        } catch {}
        recRef.current = null;
      }
    };
  }, []);

  return { supported, listening, error, toggle, stop, clearError };
}
