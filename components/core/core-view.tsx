"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useJarvis } from "@/components/providers";
import { api } from "@/lib/api";
import { mapChatError } from "@/lib/chat-errors";
import { dispatchAction, type ActionContext } from "@/lib/actions";
import type { Action } from "@/lib/types";
import { useIdle } from "@/hooks/use-idle";
import { useBobState } from "@/hooks/use-bob-state";
import { useWakeWord } from "@/hooks/use-wake-word";
import { useSpeechInput } from "@/hooks/use-speech-input";
import { useBobTts } from "@/hooks/use-bob-tts";
import { useLayout } from "@/lib/use-layout-store";
import { BobCore } from "@/components/bob/bob-core";
import { BobSubtitle } from "./bob-subtitle";
import { CoreInput } from "./core-input";
import { CoreStatusBar } from "./core-status-bar";
import { CoreFocusOverlay } from "./core-focus-overlay";

interface CoreViewProps {
  conversationId: number | null;
  onConversationCreated: (id: number) => void;
  confidential: boolean;
  focusMode?: boolean;
  voiceMuted?: boolean;
  /** ActionContext — wired from AppShell so actions can drive the shell. */
  actionCtx?: Omit<ActionContext, "userId" | "currentFocusMode">;
}

const isDev = process.env.NODE_ENV !== "production";
const dlog = (...a: unknown[]) =>
  isDev && typeof console !== "undefined" && console.debug("[bob:core]", ...a);

export function CoreView({
  conversationId,
  onConversationCreated,
  confidential,
  focusMode = false,
  voiceMuted = false,
  actionCtx,
}: CoreViewProps) {
  const {
    activeUser,
    engines,
    refresh,
    backendOnline,
    activeEngineAvailable,
    ready,
  } = useJarvis();
  const layout = useLayout();

  // ── State machine ─────────────────────────────────────────────────────────
  const { data: stateData, state, subtitle, isBusy, canRecord, dispatch } = useBobState();

  const [text, setText] = useState("");
  const [now, setNow] = useState(new Date());
  const [vw, setVw] = useState(0);
  const [vh, setVh] = useState(0);
  const [simAmp, setSimAmp] = useState(0);
  const [focusReveal, setFocusReveal] = useState(false);
  const [pendingConfirmAction, setPendingConfirmAction] = useState<Action | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const conversationIdRef = useRef(conversationId);
  const focusRevealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speakingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  conversationIdRef.current = conversationId;

  // ── Idle detection ────────────────────────────────────────────────────────
  const isActive = text.trim().length > 0 || isBusy || state === "speaking" || state === "recording_command";
  const isIdle = useIdle({ timeoutMs: 4000, forceActive: isActive });

  // ── Tick clock ───────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const update = () => { setVw(window.innerWidth); setVh(window.innerHeight); };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // ── TTS sv-SE ────────────────────────────────────────────────────────────
  const {
    speak: ttsSpeak,
    speaking: ttsSpeaking,
    supported: ttsSupported,
    hasSwedishVoice,
    error: ttsError,
    enabled: ttsEnabled,
    setEnabled: setTtsEnabled,
  } = useBobTts({
    onEnd: () => dispatch({ type: "SPEAK_DONE" }),
  });

  const speakReply = useCallback(
    (message: string) => {
      // #region agent log
      fetch('http://127.0.0.1:7746/ingest/323c32f1-7e73-4bd9-b362-3024f492143c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'645a15'},body:JSON.stringify({sessionId:'645a15',runId:'wake-tts-debug-1',hypothesisId:'H5',location:'frontend/components/core/core-view.tsx:speakReply',message:'core speak reply branch',data:{ttsEnabled,ttsSupported,voiceMuted,messageLength:message.trim().length,state},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      if (ttsEnabled && ttsSupported) {
        ttsSpeak(message);
        return;
      }
      if (speakingTimer.current) clearTimeout(speakingTimer.current);
      speakingTimer.current = setTimeout(() => {
        dispatch({ type: "SPEAK_DONE" });
      }, 3000);
    },
    [dispatch, ttsEnabled, ttsSpeak, ttsSupported]
  );

  const executeConfirmedAction = useCallback(
    async (action: Action, spokenReply?: string) => {
      if (!activeUser || !actionCtx || action.type === "none") return;

      dispatch({ type: "ACTION_START", label: action.label || "Utför åtgärd…" });
      try {
        await dispatchAction(action, {
          ...actionCtx,
          userId: activeUser.id,
          currentFocusMode: layout.state.coreFocusMode,
        });
      } catch (e) {
        dlog("action failed:", e);
      }
      dispatch({ type: "ACTION_DONE" });

      if (spokenReply) {
        dispatch({
          type: "REPLY_RECEIVED",
          replyText: spokenReply,
          actionLabel: action.label || undefined,
        });
        speakReply(spokenReply);
      }
    },
    [activeUser, actionCtx, dispatch, layout.state.coreFocusMode, speakReply]
  );

  const resolvePendingConfirmation = useCallback(
    async (raw: string) => {
      const normalized = raw.trim().toLowerCase();
      const action = pendingConfirmAction;
      if (!action) return false;

      if (/^(ja|yes|ok|okej|kör|gör det|bekräfta)\b/i.test(normalized)) {
        setPendingConfirmAction(null);
        await executeConfirmedAction(
          action,
          `Okej, ${action.label || "jag utför åtgärden"}.`
        );
        return true;
      }

      if (/^(nej|no|avbryt|stop|stopp|inte nu)\b/i.test(normalized)) {
        setPendingConfirmAction(null);
        dispatch({
          type: "REPLY_RECEIVED",
          replyText: "Okej, jag avbryter.",
        });
        speakReply("Okej, jag avbryter.");
        return true;
      }

      dispatch({
        type: "REPLY_RECEIVED",
        replyText: "Svara ja eller nej.",
      });
      speakReply("Svara ja eller nej.");
      return true;
    },
    [dispatch, executeConfirmedAction, pendingConfirmAction, speakReply]
  );

  // ── Core runCommand ───────────────────────────────────────────────────────
  const runCommand = useCallback(
    async (message: string) => {
      if (!activeUser) return;
      const msg = message.trim();
      if (!msg) return;
      if (isBusy) return;

      dlog("runCommand:", msg.slice(0, 80));
      dispatch({ type: "THINK_START" });

      try {
        const res = await api.chat({
          user_id: activeUser.id,
          conversation_id: conversationIdRef.current ?? undefined,
          message: msg,
          confidential,
        });
        dlog("reply:", res.conversation_id, "actions:", res.actions?.length ?? 0);

        if (!conversationIdRef.current) {
          onConversationCreated(res.conversation_id);
          refresh();
        }

        const replyText = res.reply.content;
        const firstAction = res.actions?.[0];
        const actionLabel = firstAction?.label ?? "";

        if (firstAction?.confirm) {
          const confirmPrompt = `Ska jag ${firstAction.label || "utföra åtgärden"}? Säg ja eller nej.`;
          setPendingConfirmAction(firstAction);
          dispatch({
            type: "REPLY_RECEIVED",
            replyText: confirmPrompt,
            actionLabel: actionLabel || undefined,
          });
          speakReply(confirmPrompt);
          return;
        }

        dispatch({
          type: "REPLY_RECEIVED",
          replyText,
          actionLabel: actionLabel || undefined,
        });

        // Execute actions before speaking.
        if (firstAction && firstAction.type !== "none" && actionCtx) {
          await executeConfirmedAction(firstAction);
        }

        // Speak the reply.
        speakReply(replyText);
      } catch (e) {
        const mapped = mapChatError(e);
        dlog("runCommand failed:", mapped);
        dispatch({ type: "ERROR", message: mapped.message });
      }
    },
    [activeUser, isBusy, confidential, dispatch, executeConfirmedAction, onConversationCreated, refresh, speakReply, actionCtx]
  );

  // Cleanup speaking timer.
  useEffect(() => () => { if (speakingTimer.current) clearTimeout(speakingTimer.current); }, []);

  // ── Voice input (recording mode — triggered by wake word or mic button) ───
  const {
    listening: speechListening,
    toggle: speechToggle,
    stop: speechStop,
    error: speechError,
  } = useSpeechInput({
    mode: "recording",
    onFinalTranscript: async (t) => {
      if (!t) return;
      setText("");
      if (pendingConfirmAction) {
        await resolvePendingConfirmation(t);
        return;
      }
      dispatch({ type: "TRANSCRIBE_DONE", text: t });
      void runCommand(t);
    },
  });

  useEffect(() => {
    setTtsEnabled(!voiceMuted);
    if (voiceMuted && state !== "muted") {
      dispatch({ type: "MUTE_TOGGLE" });
    } else if (!voiceMuted && state === "muted") {
      dispatch({ type: "MUTE_TOGGLE" });
    }
    if (voiceMuted && speechListening) {
      speechStop();
    }
  }, [dispatch, setTtsEnabled, speechListening, speechStop, state, voiceMuted]);

  // ── Wake word (passive continuous sv-SE) ─────────────────────────────────
  const wakeEnabled =
    state !== "muted" &&
    !isBusy &&
    state !== "recording_command" &&
    state !== "speaking" &&
    !ttsSpeaking;

  const { supported: wakeSupported, error: wakeError } = useWakeWord({
    enabled: wakeEnabled,
    onWake: () => {
      dlog("wake word detected");
      // #region agent log
      fetch('http://127.0.0.1:7746/ingest/323c32f1-7e73-4bd9-b362-3024f492143c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'645a15'},body:JSON.stringify({sessionId:'645a15',runId:'wake-tts-debug-1',hypothesisId:'H4',location:'frontend/components/core/core-view.tsx:onWake',message:'core wake handler invoked',data:{state,canRecord,wakeEnabled,voiceMuted},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      dispatch({ type: "WAKE_DETECTED" });
      dispatch({ type: "RECORD_START" });
      speechToggle();
      requestAnimationFrame(() => inputRef.current?.focus());
    },
  });

  // Auto-start passive listening on mount.
  useEffect(() => {
    dispatch({ type: "WAKE_LISTEN_START" });
  }, [dispatch]);

  // ── Keyboard shortcuts (global custom events from app-shell) ─────────────
  const toggleVoice = useCallback(() => {
    if (state === "muted") return;
    if (speechListening) {
      speechStop();
      return;
    }
    if (canRecord) {
      dispatch({ type: "RECORD_START" });
      speechToggle();
    }
  }, [state, speechListening, speechStop, speechToggle, canRecord, dispatch]);

  useEffect(() => {
    const onWake = () => {
      if (state === "muted" || speechListening || !canRecord) return;
      setFocusReveal(true);
      if (focusRevealTimer.current) clearTimeout(focusRevealTimer.current);
      focusRevealTimer.current = setTimeout(() => setFocusReveal(false), 6000);
      dispatch({ type: "WAKE_DETECTED" });
      dispatch({ type: "RECORD_START" });
      speechToggle();
      requestAnimationFrame(() => inputRef.current?.focus());
    };
    const onVoice = () => toggleVoice();
    const onEsc = () => {
      if (speechListening) speechStop();
      dispatch({ type: "RESET" });
      dispatch({ type: "WAKE_LISTEN_START" });
    };

    window.addEventListener("bob:wake", onWake);
    window.addEventListener("bob:toggle-voice", onVoice);
    window.addEventListener("bob:esc-recording", onEsc);
    return () => {
      window.removeEventListener("bob:wake", onWake);
      window.removeEventListener("bob:toggle-voice", onVoice);
      window.removeEventListener("bob:esc-recording", onEsc);
      if (focusRevealTimer.current) clearTimeout(focusRevealTimer.current);
    };
  }, [canRecord, dispatch, speechListening, speechStop, speechToggle, state, toggleVoice]);

  // Focus mode: reveal input on mouse/keydown.
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

  // Simulated orb amplitude while speaking (no real audio amp yet).
  useEffect(() => {
    if (state !== "speaking" && state !== "action_executing") {
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
  }, [state]);

  // Speech errors → error state.
  useEffect(() => {
    if (speechError) dispatch({ type: "ERROR", message: speechError.message });
  }, [speechError, dispatch]);

  if (!activeUser) return null;

  // ── Derived display values ────────────────────────────────────────────────
  const currentEngine = engines.find((e) => e.id === activeUser.preferred_engine);
  const currentModelId = activeUser.preferred_model || currentEngine?.default_model || "";
  const currentModel =
    currentEngine?.models.find((m) => m.id === currentModelId) || currentEngine?.models[0];
  const modelLabel =
    currentModel?.label || currentModel?.id || currentEngine?.label || "B.O.B";

  const reservedH = 320;
  const horizCap = vw > 0 ? Math.max(220, vw - 80) : 380;
  const vertCap = vh > 0 ? Math.max(220, vh - reservedH) : 380;
  const orbSize = Math.min(480, horizCap, vertCap);

  const inputHidden = focusMode && !focusReveal && !isActive && !speechListening;
  const statusHidden = focusMode;
  const confirmPrompt = pendingConfirmAction
    ? `Ska jag ${pendingConfirmAction.label || "utföra åtgärden"}?`
    : null;
  const wakeStatusMessage =
    wakeError ||
    (!wakeSupported
      ? "Wake word stöds inte i den här webbläsaren. Använd mikrofonknappen."
      : null);
  const ttsStatusMessage = !ttsSupported
    ? "Talutmatning stöds inte i den här webbläsaren."
    : !hasSwedishVoice && ttsEnabled
      ? "Ingen svensk systemröst hittades. B.O.B använder systemets standardröst."
      : ttsError;
  // Single-source-of-truth: wake/tts-status visas i subtitle (under orben).
  // CoreInput-error reserveras för faktiska state-fel under aktiva operationer.
  const subtitleText =
    (state === "idle" || state === "passive_wake_listening") && wakeStatusMessage
      ? wakeStatusMessage
      : (state === "idle" || state === "passive_wake_listening") && ttsStatusMessage
        ? ttsStatusMessage
        : subtitle;
  const inputError = state === "error" ? stateData.errorMessage : null;

  const isSpeaking = state === "speaking" || state === "action_executing";
  const isListening = state === "recording_command" || state === "wake_detected" || speechListening;
  const isPending = state === "thinking" || state === "transcribing";
  const intensity = (isSpeaking ? 1 + simAmp * 0.6 : 1) * (focusMode ? 1.15 : 1);

  return (
    <div className="relative h-full w-full flex flex-col items-center min-h-0">
      <CoreFocusOverlay active={focusMode} />

      {/* Status bar */}
      <CoreStatusBar
        now={now}
        modelLabel={modelLabel}
        pending={isPending}
        listening={isListening}
        backendOnline={backendOnline}
        activeEngineAvailable={activeEngineAvailable}
        ready={ready}
        idle={isIdle}
        hidden={statusHidden}
      />

      {/* Orb — centered, cinematic, pulsed on mount */}
      <motion.div
        className="relative z-10 flex-1 min-h-0 flex flex-col items-center justify-center w-full px-6"
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      >
        <BobCore
          variant="cinematic"
          size={orbSize}
          isThinking={isPending}
          isSpeaking={isSpeaking}
          isListening={isListening}
          intensity={intensity}
        />
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <BobSubtitle
            state={state}
            subtitle={subtitleText}
            intensity={intensity}
            minimal={focusMode}
          />
        </motion.div>
      </motion.div>

      {/* Command input */}
      <motion.div
        className="w-full"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      >
        <CoreInput
          ref={inputRef}
          text={text}
          onTextChange={setText}
          pending={isPending}
          listening={speechListening}
          error={inputError}
          confirmPrompt={confirmPrompt}
          onConfirm={() => { void resolvePendingConfirmation("ja"); }}
          onCancel={() => { void resolvePendingConfirmation("nej"); }}
          onSend={() => {
            const msg = text.trim();
            if (!msg) return;
            setText("");
            if (pendingConfirmAction) {
              void resolvePendingConfirmation(msg);
              return;
            }
            void runCommand(msg);
          }}
          onToggleVoice={toggleVoice}
          idle={isIdle}
          hidden={inputHidden}
        />
      </motion.div>
    </div>
  );
}
