"use client";

/**
 * Voice recording hook — two modes:
 *
 *  "command"   — browser SpeechRecognition (instant, no backend round-trip).
 *                Falls back to "recording" mode if browser STT fails.
 *
 *  "recording" — MediaRecorder captures audio, sends to /speech/transcribe
 *                with language=sv. Stops on manual toggle or after
 *                SILENCE_MS of silence detected via Web Audio RMS.
 *
 * Used by CoreView (wake-word triggered, recording mode) and ChatInput
 * (manual mic button, command mode with backend fallback).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { mapChatError, mapSpeechError, type MappedError } from "@/lib/chat-errors";

// --- types ----------------------------------------------------------------

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

type RecordingMode = "speech" | "recording" | null;

// --- constants ------------------------------------------------------------

const SILENCE_MS = 2500; // stop recording after this many ms of silence
const SILENCE_THRESHOLD = 0.012; // RMS below this = silence
const STT_LANG = "sv-SE";
const TRANSCRIBE_LANG = "sv";

const isDev = process.env.NODE_ENV !== "production";
const dlog = (...a: unknown[]) =>
  isDev && typeof console !== "undefined" && console.debug("[bob:speech]", ...a);

// --- public interface -----------------------------------------------------

export interface UseSpeechInputOptions {
  /** "command" = browser STT, "recording" = MediaRecorder+backend. Default: "command". */
  mode?: "command" | "recording";
  /** Called when a final transcript is available. */
  onFinalTranscript?: (text: string) => void;
  /** Called for interim transcripts (command mode only). */
  onInterim?: (text: string) => void;
}

export interface UseSpeechInput {
  supported: boolean;
  backendFallbackSupported: boolean;
  listening: boolean;
  error: MappedError | null;
  toggle: () => void;
  stop: () => void;
  clearError: () => void;
}

// --- hook -----------------------------------------------------------------

export function useSpeechInput(opts: UseSpeechInputOptions = {}): UseSpeechInput {
  const { mode = "command", onFinalTranscript, onInterim } = opts;

  const [supported, setSupported] = useState(false);
  const [backendFallbackSupported, setBackendFallbackSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<MappedError | null>(null);

  const modeRef = useRef<RecordingMode>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const onFinalRef = useRef(onFinalTranscript);
  const onInterimRef = useRef(onInterim);

  onFinalRef.current = onFinalTranscript;
  onInterimRef.current = onInterim;

  // Detect capabilities.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as unknown as SpeechWindow;
    const speechOk = !!(w.SpeechRecognition || w.webkitSpeechRecognition);
    const recorderOk =
      typeof MediaRecorder !== "undefined" &&
      !!navigator.mediaDevices?.getUserMedia;
    setBackendFallbackSupported(recorderOk);
    setSupported(speechOk || recorderOk);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  // ── Release helpers ──────────────────────────────────────────────────────

  const releaseStream = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    if (modeRef.current === "recording" && mediaRecorderRef.current) {
      try { mediaRecorderRef.current.stop(); } catch {}
      return;
    }
    if (modeRef.current === "speech" && recRef.current) {
      try { recRef.current.stop(); } catch {}
    }
  }, []);

  // ── Backend recording mode ───────────────────────────────────────────────

  const transcribeAndDeliver = useCallback(async (blob: Blob) => {
    try {
      const ext = blob.type.includes("ogg")
        ? "ogg"
        : blob.type.includes("mp4")
          ? "mp4"
          : "webm";
      const res = await api.transcribeAudio(blob, `speech.${ext}`, TRANSCRIBE_LANG);
      if (res.text.trim()) {
        dlog("transcript:", res.text.trim());
        onFinalRef.current?.(res.text.trim());
      } else {
        setError({ kind: "unknown", message: "Ingen röst uppfattades. Försök igen." });
      }
    } catch (e) {
      setError(mapChatError(e));
    }
  }, []);

  const startBackendRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Set up silence detection via Web Audio.
      const AudioCtorRaw =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtorRaw) {
        const ctx = new AudioCtorRaw();
        audioContextRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        const buf = new Uint8Array(new ArrayBuffer(analyser.fftSize));

        const checkSilence = () => {
          analyser.getByteTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) {
            const v = (buf[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / buf.length);
          if (rms < SILENCE_THRESHOLD) {
            if (!silenceTimerRef.current) {
              silenceTimerRef.current = setTimeout(() => {
                dlog("silence timeout, stopping");
                if (mediaRecorderRef.current?.state === "recording") {
                  mediaRecorderRef.current.stop();
                }
              }, SILENCE_MS);
            }
          } else {
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
              silenceTimerRef.current = null;
            }
          }
          if (mediaRecorderRef.current?.state === "recording") {
            requestAnimationFrame(checkSilence);
          }
        };
        requestAnimationFrame(checkSilence);
      }

      const mimeCandidates = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
      ];
      const mimeType = mimeCandidates.find(
        (c) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)
      ) ?? "";

      audioChunksRef.current = [];
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      modeRef.current = "recording";

      recorder.ondataavailable = (e) => {
        if (e.data?.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onerror = () => {
        setError({ kind: "unknown", message: "Inspelning misslyckades. Försök igen." });
        setListening(false);
        modeRef.current = null;
        releaseStream();
      };
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        audioChunksRef.current = [];
        mediaRecorderRef.current = null;
        modeRef.current = null;
        setListening(false);
        releaseStream();
        await transcribeAndDeliver(blob);
      };

      recorder.start();
      setError(null);
      setListening(true);
      dlog("backend recording started");
    } catch (e) {
      dlog("mic access failed:", e);
      setError({
        kind: "mic-denied",
        message: "Mikrofonåtkomst nekad. Aktivera den i webbläsarens inställningar.",
        cause: e,
      });
      releaseStream();
    }
  }, [releaseStream, transcribeAndDeliver]);

  // ── Browser STT command mode ─────────────────────────────────────────────

  const startSpeechRecognition = useCallback(async () => {
    const w = window as unknown as SpeechWindow;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      await startBackendRecording();
      return;
    }

    // Mic permission preflight.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch (e) {
      setError({
        kind: "mic-denied",
        message: "Mikrofonåtkomst nekad. Aktivera den i webbläsarens inställningar.",
        cause: e,
      });
      return;
    }

    const r = new SR();
    modeRef.current = "speech";
    r.lang = STT_LANG;
    r.interimResults = true;
    r.continuous = false;

    r.onresult = (e) => {
      let interim = "";
      let finalText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i] as unknown as { 0: { transcript: string }; isFinal?: boolean };
        if (res.isFinal) finalText += res[0].transcript;
        else interim += res[0].transcript;
      }
      if (interim) onInterimRef.current?.(interim.trim());
      if (finalText) {
        dlog("final:", finalText.trim());
        onFinalRef.current?.(finalText.trim());
      }
    };
    r.onerror = async (e) => {
      dlog("speech error:", e.error);
      recRef.current = null;
      modeRef.current = null;
      setListening(false);
      if ((e.error === "network" || e.error === "service-not-allowed") && backendFallbackSupported) {
        dlog("falling back to backend recording");
        setError({
          kind: "unknown",
          message: "Webbläsarens tal-tjänst är otillgänglig. Spelar in via mikrofon istället.",
        });
        await startBackendRecording();
        return;
      }
      setError(mapSpeechError(e.error));
    };
    r.onend = () => {
      dlog("speech ended");
      setListening(false);
      recRef.current = null;
      if (modeRef.current === "speech") modeRef.current = null;
    };

    recRef.current = r;
    try {
      r.start();
      setError(null);
      setListening(true);
      dlog("speech started");
    } catch (e) {
      dlog("speech start failed:", e);
      recRef.current = null;
      modeRef.current = null;
      if (backendFallbackSupported) {
        await startBackendRecording();
        return;
      }
      setError({
        kind: "unknown",
        message: e instanceof Error ? e.message : "Röstinmatning misslyckades.",
        cause: e,
      });
    }
  }, [backendFallbackSupported, startBackendRecording]);

  // ── toggle ───────────────────────────────────────────────────────────────

  const toggle = useCallback(() => {
    void (async () => {
      if (typeof window === "undefined") return;

      // Already recording — stop.
      if (modeRef.current === "recording" && mediaRecorderRef.current) {
        dlog("toggle off recording");
        try { mediaRecorderRef.current.stop(); } catch {}
        return;
      }
      if (modeRef.current === "speech" && recRef.current) {
        dlog("toggle off speech");
        try { recRef.current.stop(); } catch {}
        return;
      }

      if (mode === "recording") {
        await startBackendRecording();
      } else {
        await startSpeechRecognition();
      }
    })();
  }, [mode, startBackendRecording, startSpeechRecognition]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      if (recRef.current) { try { recRef.current.abort(); } catch {} recRef.current = null; }
      if (mediaRecorderRef.current) { try { mediaRecorderRef.current.stop(); } catch {} mediaRecorderRef.current = null; }
      releaseStream();
    };
  }, [releaseStream]);

  return { supported, backendFallbackSupported, listening, error, toggle, stop, clearError };
}
