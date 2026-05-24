"use client";

import { useEffect, useRef, useState } from "react";
import { useJarvis } from "@/components/providers";
import { api } from "@/lib/api";
import type { MessageOut } from "@/lib/types";
import { useIdle } from "@/hooks/use-idle";
import { useAudioReactive } from "@/hooks/use-audio-reactive";
import { CoreCanvas } from "./core-canvas";
import { CoreInput } from "./core-input";
import { CoreStatusBar } from "./core-status-bar";
import { CoreFocusOverlay } from "./core-focus-overlay";

interface CoreViewProps {
  conversationId: number | null;
  onConversationCreated: (id: number) => void;
  confidential: boolean;
  /** Neural Focus Mode — hide status/input until interaction. */
  focusMode?: boolean;
}

/**
 * Cinematic full-screen Core view (orchestrator).
 *
 * Owns chat state and orchestrates three immersive sub-components:
 *   - CoreStatusBar  → top, fades on idle / hides in focus mode
 *   - CoreCanvas     → centerpiece (BobCore + state-aware text)
 *   - CoreInput      → bottom command bar, auto-hides on idle
 *
 * Backend behavior is unchanged: api.chat() with a thinking → speaking
 * → idle state arc, persisted via the active conversation.
 */
export function CoreView({
  conversationId,
  onConversationCreated,
  confidential,
  focusMode = false,
}: CoreViewProps) {
  const { activeUser, engines, refresh } = useJarvis();

  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastReply, setLastReply] = useState<MessageOut | null>(null);
  const [now, setNow] = useState(new Date());
  const [vw, setVw] = useState(0);
  const [vh, setVh] = useState(0);

  const recRef = useRef<unknown>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const toggleVoiceRef = useRef<() => void>(() => {});
  const [focusReveal, setFocusReveal] = useState(false);
  const focusRevealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [simAmp, setSimAmp] = useState(0);

  const audio = useAudioReactive();

  // Idle fade: panels disappear after 4s without input. Override whenever
  // the user is actively engaged with the system.
  const isActive =
    text.trim().length > 0 || pending || listening || speaking;
  const isIdle = useIdle({ timeoutMs: 4000, forceActive: isActive });

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const update = () => {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Listen for global custom events from the shortcut layer.
  useEffect(() => {
    const onWake = () => {
      // Briefly reveal the input and focus it (CTRL+SPACE).
      setFocusReveal(true);
      if (focusRevealTimer.current) clearTimeout(focusRevealTimer.current);
      focusRevealTimer.current = setTimeout(() => setFocusReveal(false), 6000);
      requestAnimationFrame(() => inputRef.current?.focus());
    };
    const onVoice = () => {
      toggleVoiceRef.current();
    };
    window.addEventListener("bob:wake", onWake);
    window.addEventListener("bob:toggle-voice", onVoice);
    return () => {
      window.removeEventListener("bob:wake", onWake);
      window.removeEventListener("bob:toggle-voice", onVoice);
      if (focusRevealTimer.current) clearTimeout(focusRevealTimer.current);
    };
  }, []);

  // While in Neural Focus Mode, any mousemove/keydown briefly reveals
  // the input so the user can type without leaving focus mode.
  useEffect(() => {
    if (!focusMode) return;
    const reveal = () => {
      setFocusReveal(true);
      if (focusRevealTimer.current) clearTimeout(focusRevealTimer.current);
      focusRevealTimer.current = setTimeout(() => setFocusReveal(false), 5000);
    };
    window.addEventListener("mousemove", reveal, { passive: true });
    window.addEventListener("keydown", reveal);
    return () => {
      window.removeEventListener("mousemove", reveal);
      window.removeEventListener("keydown", reveal);
    };
  }, [focusMode]);

  // Audio-reactive listening: start the analyser when listening begins,
  // stop when it ends. If the browser denies permission, we fall back to
  // the simulated motion baked into BobCore's listening state — graceful.
  useEffect(() => {
    if (listening) {
      void audio.start();
    } else {
      audio.stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listening]);

  // Simulated speaking amplitude. We don't have real TTS audio yet, so we
  // animate a noise-summed waveform whose duration is proportional to the
  // reply length. The orb feels like it's "speaking" in cadence.
  useEffect(() => {
    if (!speaking) {
      setSimAmp(0);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = () => {
      const t = (performance.now() - start) / 1000;
      // Two-frequency noise approximation, smoothed.
      const a = Math.sin(t * 6.1) * 0.35 + Math.sin(t * 2.3 + 1.4) * 0.25;
      const env = Math.max(0, 0.6 + a);
      setSimAmp(env);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [speaking]);

  if (!activeUser) return null;

  const currentEngine = engines.find((e) => e.id === activeUser.preferred_engine);
  const currentModelId =
    activeUser.preferred_model || currentEngine?.default_model || "";
  const currentModel =
    currentEngine?.models.find((m) => m.id === currentModelId) ||
    currentEngine?.models[0];
  const modelLabel =
    currentModel?.label || currentModel?.id || currentEngine?.label || "B.O.B";

  // Reserve ~360px for header + state text + input + safety paddings.
  const reservedH = 360;
  const horizCap = vw > 0 ? Math.max(220, vw - 80) : 380;
  const vertCap = vh > 0 ? Math.max(220, vh - reservedH) : 380;
  const orbSize = Math.min(480, horizCap, vertCap);

  const send = async () => {
    if (!text.trim() || pending || !activeUser) return;
    setError(null);
    setPending(true);
    setSpeaking(false);
    const sentText = text;
    try {
      const res = await api.chat({
        user_id: activeUser.id,
        conversation_id: conversationId ?? undefined,
        message: sentText,
        confidential,
      });
      setText("");
      setLastReply(res.reply);
      setSpeaking(true);
      if (!conversationId) {
        onConversationCreated(res.conversation_id);
        refresh();
      }
      const t = setTimeout(() => setSpeaking(false), 2500);
      return () => clearTimeout(t);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setPending(false);
    }
  };

  const toggleVoice = () => {
    interface SpeechRecognitionLike extends EventTarget {
      lang: string;
      interimResults: boolean;
      continuous: boolean;
      start: () => void;
      stop: () => void;
      onresult:
        | ((e: { results: ArrayLike<{ 0: { transcript: string } }> }) => void)
        | null;
      onend: (() => void) | null;
    }
    const win = window as unknown as {
      SpeechRecognition?: { new (): SpeechRecognitionLike };
      webkitSpeechRecognition?: { new (): SpeechRecognitionLike };
    };
    const SR = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SR) {
      alert("Voice input not supported in this browser.");
      return;
    }
    if (listening && recRef.current) {
      (recRef.current as SpeechRecognitionLike).stop();
      return;
    }
    const r = new SR();
    r.lang = navigator.language || "en-US";
    r.interimResults = false;
    r.continuous = false;
    r.onresult = (e) => {
      const t = Array.from(e.results)
        .map((res) => res[0].transcript)
        .join(" ");
      setText((cur) => (cur ? cur + " " + t : t));
    };
    r.onend = () => setListening(false);
    recRef.current = r;
    r.start();
    setListening(true);
  };

  // Keep latest toggleVoice in a ref so the global F3 listener uses fresh state.
  toggleVoiceRef.current = toggleVoice;

  // In Neural Focus Mode, the orb dominates fully.
  // Status bar is always hidden; input only revealed on activity (focusReveal).
  const inputHidden = focusMode && !focusReveal && !isActive;
  const statusHidden = focusMode;

  // Compose the orb's intensity multiplier from listening/speaking signals.
  // Listening uses real microphone amplitude when permission is granted,
  // otherwise it stays at 1 (simulated motion handled by BobCore itself).
  // Speaking uses a simulated waveform amplitude.
  let intensity = 1;
  if (listening && audio.active) intensity = 1 + audio.level * 1.2;
  else if (speaking) intensity = 1 + simAmp * 0.6;
  if (focusMode) intensity *= 1.15;

  return (
    <div className="relative h-full w-full flex flex-col items-center min-h-0">
      <CoreFocusOverlay active={focusMode} />
      <CoreStatusBar
        now={now}
        modelLabel={modelLabel}
        pending={pending}
        listening={listening}
        idle={isIdle}
        hidden={statusHidden}
      />

      <CoreCanvas
        size={orbSize}
        pending={pending}
        speaking={speaking}
        listening={listening}
        lastReplyContent={lastReply?.content}
        userName={activeUser.name}
        minimal={focusMode}
        intensity={intensity}
      />

      <CoreInput
        ref={inputRef}
        text={text}
        onTextChange={setText}
        pending={pending}
        listening={listening}
        error={error}
        onSend={() => void send()}
        onToggleVoice={toggleVoice}
        idle={isIdle}
        hidden={inputHidden}
      />
    </div>
  );
}
