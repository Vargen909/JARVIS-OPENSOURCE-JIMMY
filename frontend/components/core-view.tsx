"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Clock, Activity, Sparkles, Mic, MicOff } from "lucide-react";
import { BobCore } from "./bob/bob-core";
import { useJarvis } from "./providers";
import { api } from "@/lib/api";
import type { MessageOut } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Cinematic full-screen Core view.
 *
 * Real backend chat (api.chat() with persistence) drives the BobCore state
 * machine: idle → thinking → speaking → idle. Layout is height-aware so the
 * orb never gets cropped on short viewports; the page itself never scrolls.
 */
interface CoreViewProps {
  conversationId: number | null;
  onConversationCreated: (id: number) => void;
  confidential: boolean;
}

export function CoreView({
  conversationId,
  onConversationCreated,
  confidential,
}: CoreViewProps) {
  const { activeUser, engines, refresh } = useJarvis();
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastReply, setLastReply] = useState<MessageOut | null>(null);
  const [now, setNow] = useState(new Date());
  const [listening, setListening] = useState(false);
  const [vw, setVw] = useState(0);
  const [vh, setVh] = useState(0);
  const recRef = useRef<unknown>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Track viewport so the orb can scale by both width AND height (avoids vertical clipping).
  useEffect(() => {
    const update = () => {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (!activeUser) return null;

  const currentEngine = engines.find((e) => e.id === activeUser.preferred_engine);
  const currentModelId =
    activeUser.preferred_model || currentEngine?.default_model || "";
  const currentModel =
    currentEngine?.models.find((m) => m.id === currentModelId) ||
    currentEngine?.models[0];
  const modelLabel =
    currentModel?.label || currentModel?.id || currentEngine?.label || "B.O.B";

  // Reserve ~360px for header(60) + state text(80) + input(160) + safety paddings.
  // Orb takes the smaller of (viewport width - margin) and (viewport height - reserved).
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

  const fmtTime = now.toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const fmtDate = now.toLocaleDateString("sv-SE", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="relative h-full w-full flex flex-col items-center min-h-0">
      {/* Top status bar */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative z-10 w-full flex items-center justify-between px-6 py-4 sm:px-10 shrink-0"
      >
        <div className="flex items-center gap-3 text-ink-dim">
          <Clock className="h-4 w-4" />
          <div className="flex flex-col leading-tight">
            <span className="text-lg font-light text-ink tabular-nums">{fmtTime}</span>
            <span className="text-xs">{fmtDate}</span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-bg-card/50 border border-white/[0.06] backdrop-blur"
        >
          <Sparkles className="h-4 w-4 text-accent" />
          <span className="text-sm font-medium">{modelLabel}</span>
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              pending ? "bg-amber-400 animate-pulse" : "bg-emerald-400"
            )}
          />
        </motion.div>

        <div className="hidden md:flex items-center gap-2 text-ink-dim">
          <Activity className="h-4 w-4" />
          <span className="text-sm">System Active</span>
        </div>
      </motion.div>

      {/* Centerpiece: B.O.B core + state text */}
      <div className="relative z-10 flex-1 min-h-0 flex flex-col items-center justify-center w-full px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <BobCore
            variant="cinematic"
            size={orbSize}
            isThinking={pending}
            isSpeaking={speaking}
            isListening={listening}
          />
        </motion.div>

        <AnimatePresence mode="wait">
          {pending ? (
            <motion.div
              key="thinking"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-6 flex flex-col items-center gap-2"
            >
              <div className="flex items-center gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-accent"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
              <span className="text-sm text-ink-mute">Processing…</span>
            </motion.div>
          ) : speaking && lastReply ? (
            <motion.div
              key="speaking"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-6 flex flex-col items-center gap-3 max-w-2xl px-6 text-center"
            >
              <div className="flex items-center gap-1.5">
                {[...Array(7)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-accent rounded-full"
                    animate={{ height: [4, 16, 4], opacity: [0.5, 1, 0.5] }}
                    transition={{
                      duration: 0.4,
                      repeat: Infinity,
                      delay: i * 0.05,
                    }}
                  />
                ))}
              </div>
              <p className="text-sm text-ink-dim line-clamp-3">{lastReply.content}</p>
            </motion.div>
          ) : listening ? (
            <motion.div
              key="listening"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-6 flex items-center gap-1.5"
            >
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-accent rounded-full"
                  animate={{ height: [8, 20, 8] }}
                  transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.1 }}
                />
              ))}
              <span className="ml-2 text-sm text-accent">Lyssnar…</span>
            </motion.div>
          ) : (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-6 text-center"
            >
              <h2 className="text-2xl font-light text-ink">
                Hej {activeUser.name}, hur kan jag hjälpa dig?
              </h2>
              <p className="text-sm text-ink-mute mt-1.5">
                Skriv ett kommando eller tryck på mikrofonen.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom command bar */}
      <div className="relative z-10 w-full max-w-3xl px-6 pb-8 shrink-0">
        {error && (
          <div className="mb-3 text-center text-sm text-rose-400">{error}</div>
        )}
        <div className="flex items-end gap-3">
          <button
            type="button"
            onClick={toggleVoice}
            title="Voice input"
            className={cn(
              "flex items-center justify-center w-12 h-12 rounded-full border transition-colors shrink-0",
              listening
                ? "bg-accent/20 border-accent text-accent"
                : "bg-bg-card/50 border-white/[0.08] text-ink-mute hover:text-ink hover:border-accent/40"
            )}
          >
            {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          <div className="flex-1 group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-accent/40 via-accent-glow/40 to-accent/40 rounded-2xl opacity-0 group-focus-within:opacity-50 blur-lg transition-opacity duration-500 pointer-events-none" />
            <div className="relative flex items-end gap-2 p-2.5 rounded-2xl bg-bg-card/80 border border-white/[0.06] backdrop-blur-xl">
              <textarea
                ref={inputRef}
                rows={1}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                placeholder="Fråga B.O.B något…"
                disabled={pending}
                className="flex-1 resize-none bg-transparent outline-none px-2 py-2 text-[15px] text-ink placeholder:text-ink-mute"
                style={{ minHeight: 40, maxHeight: 150 }}
              />
              <button
                type="button"
                onClick={() => void send()}
                disabled={pending || !text.trim()}
                title="Send"
                aria-label="Send"
                className={cn(
                  "h-9 w-9 rounded-xl flex items-center justify-center transition-all shrink-0",
                  text.trim() && !pending
                    ? "bg-accent text-white hover:bg-accent-soft shadow-glow"
                    : "bg-white/[0.05] text-ink-mute"
                )}
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-ink-mute text-center mt-2">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
