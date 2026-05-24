"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useJarvis } from "@/components/providers";
import { api } from "@/lib/api";
import { mapChatError } from "@/lib/chat-errors";
import type { MessageOut } from "@/lib/types";
import { useIdle } from "@/hooks/use-idle";
import { useSpeechInput } from "@/hooks/use-speech-input";
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

const isDev = process.env.NODE_ENV !== "production";
const dlog = (...a: unknown[]) =>
  isDev && typeof console !== "undefined" && console.debug("[bob:core]", ...a);

/**
 * Cinematic full-screen Core view (orchestrator).
 *
 * Owns chat state and orchestrates three immersive sub-components:
 *   - CoreStatusBar  → top, fades on idle / hides in focus mode
 *   - CoreCanvas     → centerpiece (BobCore + state-aware text)
 *   - CoreInput      → bottom command bar, auto-hides on idle
 *
 * Backend behavior is unchanged: api.chat() with a thinking → speaking
 * → idle state arc, persisted via the active conversation. Voice input
 * uses the shared useSpeechInput hook and auto-sends on final transcript.
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
  const [error, setError] = useState<string | null>(null);
  const [lastUserMessage, setLastUserMessage] = useState<string | null>(null);
  const [lastReply, setLastReply] = useState<MessageOut | null>(null);
  const [now, setNow] = useState(new Date());
  const [vw, setVw] = useState(0);
  const [vh, setVh] = useState(0);
  const [simAmp, setSimAmp] = useState(0);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const speakingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendRef = useRef<(t?: string) => Promise<void>>(async () => {});

  const [focusReveal, setFocusReveal] = useState(false);
  const focusRevealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Idle fade: panels disappear after 4s without input. Override whenever
  // the user is actively engaged with the system.
  const isActive = text.trim().length > 0 || pending || speaking;
  const isIdle = useIdle({ timeoutMs: 4000, forceActive: isActive });

  // Tick the wall clock once a second.
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Focus the textarea on mount so the user can start typing immediately.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Track viewport so the orb scales by both width and height.
  useEffect(() => {
    const update = () => {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Send chat — accepts an explicit override (used by voice) so we don't
  // rely on async state propagation between speech recognition and React.
  const doSend = useCallback(
    async (override?: string) => {
      if (!activeUser) return;
      const message = (override ?? text).trim();
      if (!message || pending) return;

      dlog("submit", { len: message.length, override: override !== undefined });
      setError(null);
      setLastUserMessage(message);
      setPending(true);
      setSpeaking(false);

      // Clear any prior speaking timer so quick replies don't end early.
      if (speakingTimerRef.current) {
        clearTimeout(speakingTimerRef.current);
        speakingTimerRef.current = null;
      }

      try {
        const res = await api.chat({
          user_id: activeUser.id,
          conversation_id: conversationId ?? undefined,
          message,
          confidential,
        });
        dlog("reply", { conversation_id: res.conversation_id });
        setText("");
        setLastReply(res.reply);
        setSpeaking(true);
        if (!conversationId) {
          onConversationCreated(res.conversation_id);
          refresh();
        }
        speakingTimerRef.current = setTimeout(() => {
          setSpeaking(false);
          speakingTimerRef.current = null;
        }, 2500);
      } catch (e) {
        const mapped = mapChatError(e);
        dlog("send failed", mapped);
        setError(mapped.message);
      } finally {
        setPending(false);
      }
    },
    [activeUser, text, pending, conversationId, confidential, onConversationCreated, refresh]
  );

  // Keep the latest send fn in a ref so global event listeners and the
  // speech hook always invoke the freshest closure.
  sendRef.current = doSend;

  // Cleanup speaking timer on unmount.
  useEffect(() => {
    return () => {
      if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);
    };
  }, []);

  // Voice input — shared hook. Final transcript triggers an auto-send so
  // the user can talk to B.O.B and get a reply without pressing send.
  const speech = useSpeechInput({
    onFinalTranscript: (t) => {
      if (!t) return;
      setText("");
      void sendRef.current(t);
    },
  });
  const speechErrorMsg = speech.error?.message ?? null;
  const listening = speech.listening;

  // Surface speech errors in the same banner as chat errors.
  useEffect(() => {
    if (speechErrorMsg) setError(speechErrorMsg);
  }, [speechErrorMsg]);

  const toggleVoice = useCallback(() => {
    if (!speech.supported) {
      setError("Voice input is not supported in this browser.");
      return;
    }
    speech.clearError();
    speech.toggle();
  }, [speech]);

  // Listen for global custom events from the shortcut layer.
  useEffect(() => {
    const onWake = () => {
      setFocusReveal(true);
      if (focusRevealTimer.current) clearTimeout(focusRevealTimer.current);
      focusRevealTimer.current = setTimeout(() => setFocusReveal(false), 6000);
      requestAnimationFrame(() => inputRef.current?.focus());
    };
    const onVoice = () => toggleVoice();
    window.addEventListener("bob:wake", onWake);
    window.addEventListener("bob:toggle-voice", onVoice);
    return () => {
      window.removeEventListener("bob:wake", onWake);
      window.removeEventListener("bob:toggle-voice", onVoice);
      if (focusRevealTimer.current) clearTimeout(focusRevealTimer.current);
    };
  }, [toggleVoice]);

  // While in Neural Focus Mode, mousemove/keydown briefly reveals the
  // input so the user can type without leaving focus mode.
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

  // Simulated speaking amplitude — drives the orb intensity while
  // assistant text is "speaking". No real TTS yet; this is purely visual.
  useEffect(() => {
    if (!speaking) {
      setSimAmp(0);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = () => {
      const t = (performance.now() - start) / 1000;
      const a = Math.sin(t * 6.1) * 0.35 + Math.sin(t * 2.3 + 1.4) * 0.25;
      setSimAmp(Math.max(0, 0.6 + a));
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

  // In Neural Focus Mode, the orb dominates fully.
  // Status bar is always hidden; input only revealed on activity (focusReveal).
  const inputHidden = focusMode && !focusReveal && !isActive && !listening;
  const statusHidden = focusMode;

  // Speaking-only intensity (audio analyser detached from STT to avoid
  // racing the SpeechRecognition mic permission).
  const intensity =
    (speaking ? 1 + simAmp * 0.6 : 1) * (focusMode ? 1.15 : 1);

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
        lastUserMessage={lastUserMessage}
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
        onSend={() => void doSend()}
        onToggleVoice={toggleVoice}
        idle={isIdle}
        hidden={inputHidden}
      />
    </div>
  );
}
