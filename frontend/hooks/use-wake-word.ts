"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Passive wake-word detector for "Hej B.O.B" (and variants).
 *
 * Uses continuous SpeechRecognition (sv-SE) with interim results.
 * When a wake phrase is detected, recognition is stopped and onWake() is called.
 * Recognition automatically restarts after onend as long as `enabled` is true.
 *
 * IMPORTANT: This must be paused while TTS is speaking and while MediaRecorder
 * is recording, since browsers only allow one audio capture at a time.
 */

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
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
  SpeechRecognition?: { new(): SpeechRecognitionLike };
  webkitSpeechRecognition?: { new(): SpeechRecognitionLike };
}

type WakePermission = "unknown" | "granted" | "denied";

const WAKE_REGEX = /\b(hej|hey|hall[åa])[\s,.:;!?-]*b(?:[\s.:-]*o){1}(?:[\s.:-]*b)\b/i;
const TRANSCRIPT_WINDOW_MS = 4000;
const MAX_NETWORK_RETRIES = 3;

const isDev = process.env.NODE_ENV !== "production";
const dlog = (...a: unknown[]) =>
  isDev && typeof console !== "undefined" && console.debug("[bob:wake]", ...a);

export interface UseWakeWordOptions {
  /** Called when wake phrase is confirmed. */
  onWake: () => void;
  /** Set to false to suspend listening (muted, recording, TTS speaking). */
  enabled: boolean;
}

export function useWakeWord({ onWake, enabled }: UseWakeWordOptions): {
  supported: boolean;
  active: boolean;
  permission: WakePermission;
  error: string | null;
} {
  const [supported, setSupported] = useState(false);
  const [active, setActive] = useState(false);
  const [permission, setPermission] = useState<WakePermission>("unknown");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const onWakeRef = useRef(onWake);
  const enabledRef = useRef(enabled);
  const startingRef = useRef(false);
  const suspendedRef = useRef(false);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transcriptBufferRef = useRef<Array<{ text: string; ts: number }>>([]);
  const networkFailCountRef = useRef(0);

  onWakeRef.current = onWake;
  enabledRef.current = enabled;

  const clearRestartTimer = useCallback(() => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  const normalizeTranscript = useCallback((text: string) => {
    return text
      .toLowerCase()
      .replace(/[.,:;!?-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }, []);

  const pruneTranscriptBuffer = useCallback((now: number) => {
    transcriptBufferRef.current = transcriptBufferRef.current.filter(
      (entry) => now - entry.ts <= TRANSCRIPT_WINDOW_MS
    );
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as unknown as SpeechWindow;
    setSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  const ensureMicrophoneAccess = useCallback(async (): Promise<boolean> => {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      return true;
    }

    if (permission === "granted") return true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setPermission("granted");
      setError(null);
      // #region agent log
      fetch('http://127.0.0.1:7746/ingest/323c32f1-7e73-4bd9-b362-3024f492143c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'645a15'},body:JSON.stringify({sessionId:'645a15',runId:'wake-tts-debug-1',hypothesisId:'H2',location:'frontend/hooks/use-wake-word.ts:ensureMicrophoneAccess',message:'wake mic preflight granted',data:{enabled:enabledRef.current},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      return true;
    } catch (e) {
      dlog("permission preflight failed", e);
      setPermission("denied");
      setError(
        "Mikrofonåtkomst krävs för att väcka B.O.B med 'Hej B.O.B'. Tillåt mikrofonen i webbläsaren."
      );
      // #region agent log
      fetch('http://127.0.0.1:7746/ingest/323c32f1-7e73-4bd9-b362-3024f492143c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'645a15'},body:JSON.stringify({sessionId:'645a15',runId:'wake-tts-debug-1',hypothesisId:'H2',location:'frontend/hooks/use-wake-word.ts:ensureMicrophoneAccess',message:'wake mic preflight denied',data:{enabled:enabledRef.current,error:e instanceof Error?e.message:String(e)},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      return false;
    }
  }, [permission]);

  const stopRecognition = useCallback((opts?: { suspend?: boolean }) => {
    const r = recRef.current;
    clearRestartTimer();
    if (opts?.suspend) {
      suspendedRef.current = true;
    }
    if (!r) return;
    recRef.current = null;
    try {
      r.abort();
    } catch {}
    setActive(false);
    startingRef.current = false;
    transcriptBufferRef.current = [];
  }, [clearRestartTimer]);

  const startRecognition = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (!enabledRef.current) return;
    if (suspendedRef.current) return;
    if (recRef.current) return;
    if (startingRef.current) return;

    const w = window as unknown as SpeechWindow;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      setError("Wake word stöds inte i den här webbläsaren. Använd mikrofonknappen i stället.");
      return;
    }

    const micOk = await ensureMicrophoneAccess();
    if (!micOk || !enabledRef.current || suspendedRef.current) {
      startingRef.current = false;
      return;
    }

    startingRef.current = true;
    const r = new SR();
    r.lang = "sv-SE";
    r.interimResults = true;
    r.continuous = true;

    r.onresult = (e) => {
      const now = Date.now();
      pruneTranscriptBuffer(now);
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (!transcript) continue;
        transcriptBufferRef.current.push({ text: transcript, ts: now });
        const combined = normalizeTranscript(
          transcriptBufferRef.current.map((entry) => entry.text).join(" ")
        );
        dlog("buffer:", combined);
        // #region agent log
        fetch('http://127.0.0.1:7746/ingest/323c32f1-7e73-4bd9-b362-3024f492143c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'645a15'},body:JSON.stringify({sessionId:'645a15',runId:'wake-tts-debug-1',hypothesisId:'H1',location:'frontend/hooks/use-wake-word.ts:onresult',message:'wake transcript evaluated',data:{segment:transcript,combined,matched:WAKE_REGEX.test(combined)},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        if (WAKE_REGEX.test(combined)) {
          dlog("WAKE DETECTED:", combined);
          // Stop this recognition instance before calling onWake so the
          // recording mode can start its own capture cleanly.
          stopRecognition({ suspend: true });
          onWakeRef.current();
          return;
        }
      }
    };

    r.onerror = (e) => {
      dlog("error:", e.error);
      recRef.current = null;
      setActive(false);
      startingRef.current = false;
      transcriptBufferRef.current = [];
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setPermission("denied");
        setError(
          "Mikrofonåtkomst krävs för wake word. Tillåt mikrofonen och prova igen."
        );
        return;
      }
      if (e.error === "network") {
        networkFailCountRef.current += 1;
        const retriesLeft = MAX_NETWORK_RETRIES - networkFailCountRef.current;
        if (retriesLeft > 0) {
          setError(
            `Wake word-tjänsten kunde inte nås — försöker igen (${retriesLeft} kvar). Använd mikrofonknappen så länge.`
          );
          if (enabledRef.current && !suspendedRef.current) {
            clearRestartTimer();
            restartTimerRef.current = setTimeout(() => {
              void startRecognition();
            }, 3000);
          }
        } else {
          // Stop retrying — the browser's speech service is unreachable
          // (often blocked by network/VPN/adblocker). User can still talk
          // via the mic button which uses our own backend STT.
          setError(
            "Wake word kräver Googles taltjänst som inte kan nås härifrån. Använd mikrofonknappen för att tala till B.O.B."
          );
          suspendedRef.current = true;
        }
        return;
      }
      if (e.error === "aborted" || e.error === "no-speech") {
        // Benign — recognition simply ended; let onend handler restart.
        return;
      }
      setError("Wake word kunde inte startas i webbläsaren.");
    };

    r.onend = () => {
      dlog("ended, enabled=", enabledRef.current, "suspended=", suspendedRef.current);
      recRef.current = null;
      setActive(false);
      startingRef.current = false;
      transcriptBufferRef.current = [];
      // #region agent log
      fetch('http://127.0.0.1:7746/ingest/323c32f1-7e73-4bd9-b362-3024f492143c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'645a15'},body:JSON.stringify({sessionId:'645a15',runId:'wake-tts-debug-1',hypothesisId:'H3',location:'frontend/hooks/use-wake-word.ts:onend',message:'wake recognition ended',data:{enabled:enabledRef.current,suspended:suspendedRef.current,willRestart:enabledRef.current&&!suspendedRef.current},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      // Auto-restart as long as still enabled.
      if (enabledRef.current && !suspendedRef.current) {
        clearRestartTimer();
        restartTimerRef.current = setTimeout(() => {
          void startRecognition();
        }, 300);
      }
    };

    recRef.current = r;
    try {
      r.start();
      setActive(true);
      setError(null);
      // Successful start = transient network glitches forgiven.
      // We only consider consecutive failures as "service unavailable".
      networkFailCountRef.current = 0;
      dlog("started");
    } catch (e) {
      dlog("start failed:", e);
      recRef.current = null;
      startingRef.current = false;
      setError("Wake word kunde inte startas i webbläsaren.");
    }
  }, [clearRestartTimer, ensureMicrophoneAccess, normalizeTranscript, pruneTranscriptBuffer, stopRecognition]);

  // Start/stop based on enabled prop.
  useEffect(() => {
    if (!supported) return;
    if (enabled) {
      suspendedRef.current = false;
      networkFailCountRef.current = 0;
      void startRecognition();
    } else {
      suspendedRef.current = true;
      stopRecognition();
    }
  }, [enabled, supported, startRecognition, stopRecognition]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      suspendedRef.current = true;
      clearRestartTimer();
      stopRecognition();
    };
  }, [clearRestartTimer, stopRecognition]);

  return { supported, active, permission, error };
}
