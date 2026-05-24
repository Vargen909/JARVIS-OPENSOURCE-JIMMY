"use client";

/**
 * Swedish TTS via Web Speech Synthesis API.
 *
 * - Auto-selects the best available sv-SE voice.
 * - Respects a global tts.enabled flag from localStorage.
 * - Exposes onStart/onEnd callbacks so CoreView can pause wake-word
 *   while B.O.B is speaking (prevents self-triggering).
 */

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "bob:tts:enabled";
const LANG = "sv-SE";

const isDev = process.env.NODE_ENV !== "production";
const dlog = (...a: unknown[]) =>
  isDev && typeof console !== "undefined" && console.debug("[bob:tts]", ...a);

export interface UseBobTtsOptions {
  onStart?: () => void;
  onEnd?: () => void;
}

export interface UseBobTts {
  speak: (text: string) => void;
  cancel: () => void;
  speaking: boolean;
  supported: boolean;
  hasSwedishVoice: boolean;
  error: string | null;
  enabled: boolean;
  setEnabled: (v: boolean) => void;
}

function pickPreferredVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  // Prefer sv-SE, then sv, then any Swedish-sounding voice.
  return (
    voices.find((v) => v.lang === "sv-SE") ??
    voices.find((v) => v.lang.startsWith("sv")) ??
    voices[0] ??
    null
  );
}

export function useBobTts(opts: UseBobTtsOptions = {}): UseBobTts {
  const { onStart, onEnd } = opts;
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [enabled, setEnabledState] = useState(true);
  const [hasSwedishVoice, setHasSwedishVoice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onStartRef = useRef(onStart);
  const onEndRef = useRef(onEnd);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const utteranceTokenRef = useRef(0);

  onStartRef.current = onStart;
  onEndRef.current = onEnd;

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setError("Talutmatning stöds inte i den här webbläsaren.");
      return;
    }
    setSupported(true);

    // Restore enabled preference.
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) setEnabledState(stored !== "false");
    } catch {}

    // Voices may not be available immediately.
    const loadVoices = () => {
      voiceRef.current = pickPreferredVoice();
      const swedish = !!voiceRef.current?.lang?.startsWith("sv");
      setHasSwedishVoice(swedish);
      setError(
        swedish
          ? null
          : voiceRef.current
            ? "Ingen svensk systemröst hittades. B.O.B använder webbläsarens standardröst."
            : "Ingen talsyntesröst hittades i webbläsaren."
      );
      dlog("voices loaded, selected voice:", voiceRef.current?.name ?? "none");
    };
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, []);

  const setEnabled = useCallback((v: boolean) => {
    setEnabledState(v);
    try { localStorage.setItem(STORAGE_KEY, String(v)); } catch {}
    if (!v) {
      utteranceTokenRef.current += 1;
      window.speechSynthesis?.cancel();
      setSpeaking(false);
    }
  }, []);

  const cancel = useCallback(() => {
    if (typeof window === "undefined") return;
    utteranceTokenRef.current += 1;
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    onEndRef.current?.();
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !window.speechSynthesis) {
        setError("Talutmatning stöds inte i den här webbläsaren.");
        onEndRef.current?.();
        return;
      }
      if (!enabled) return;
      if (!text.trim()) {
        onEndRef.current?.();
        return;
      }

      // Cancel any previous utterance first.
      utteranceTokenRef.current += 1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();

      const currentToken = utteranceTokenRef.current;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = LANG;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      if (!voiceRef.current) {
        voiceRef.current = pickPreferredVoice();
        const swedish = !!voiceRef.current?.lang?.startsWith("sv");
        setHasSwedishVoice(swedish);
        if (!swedish) {
          setError(
            voiceRef.current
              ? "Ingen svensk systemröst hittades. B.O.B använder webbläsarens standardröst."
              : "Ingen talsyntesröst hittades i webbläsaren."
          );
        }
      }
      if (voiceRef.current) {
        utterance.voice = voiceRef.current;
      }

      // #region agent log
      fetch('http://127.0.0.1:7746/ingest/323c32f1-7e73-4bd9-b362-3024f492143c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'645a15'},body:JSON.stringify({sessionId:'645a15',runId:'wake-tts-debug-1',hypothesisId:'H5',location:'frontend/hooks/use-bob-tts.ts:speak',message:'tts speak attempted',data:{enabled,supported:typeof window!=='undefined'&&!!window.speechSynthesis,hasSwedishVoice:!!voiceRef.current?.lang?.startsWith('sv'),voiceName:voiceRef.current?.name??null,voiceLang:voiceRef.current?.lang??null,textLength:text.trim().length},timestamp:Date.now()})}).catch(()=>{});
      // #endregion

      utterance.onstart = () => {
        if (currentToken !== utteranceTokenRef.current) return;
        dlog("speaking:", text.slice(0, 60));
        setSpeaking(true);
        setError((prev) =>
          prev && prev.startsWith("Ingen svensk systemröst") ? prev : null
        );
        // #region agent log
        fetch('http://127.0.0.1:7746/ingest/323c32f1-7e73-4bd9-b362-3024f492143c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'645a15'},body:JSON.stringify({sessionId:'645a15',runId:'wake-tts-debug-1',hypothesisId:'H6',location:'frontend/hooks/use-bob-tts.ts:onstart',message:'tts started',data:{voiceName:voiceRef.current?.name??null,voiceLang:voiceRef.current?.lang??null},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        onStartRef.current?.();
      };
      utterance.onend = () => {
        if (currentToken !== utteranceTokenRef.current) return;
        dlog("done speaking");
        setSpeaking(false);
        onEndRef.current?.();
      };
      utterance.onerror = (e) => {
        if (currentToken !== utteranceTokenRef.current) return;
        dlog("tts error:", e.error);
        setSpeaking(false);
        setError(
          e.error === "not-allowed"
            ? "Webbläsaren blockerade talutmatning. Interagera med sidan och försök igen."
            : "Talutmatning misslyckades i webbläsaren."
        );
        // #region agent log
        fetch('http://127.0.0.1:7746/ingest/323c32f1-7e73-4bd9-b362-3024f492143c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'645a15'},body:JSON.stringify({sessionId:'645a15',runId:'wake-tts-debug-1',hypothesisId:'H6',location:'frontend/hooks/use-bob-tts.ts:onerror',message:'tts error event',data:{error:e.error,voiceName:voiceRef.current?.name??null,voiceLang:voiceRef.current?.lang??null},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        onEndRef.current?.();
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        dlog("tts speak threw:", e);
        setSpeaking(false);
        setError("Talutmatning kunde inte startas i webbläsaren.");
        onEndRef.current?.();
      }
    },
    [enabled]
  );

  // Cancel on unmount.
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, []);

  return {
    speak,
    cancel,
    speaking,
    supported,
    hasSwedishVoice,
    error,
    enabled,
    setEnabled,
  };
}
