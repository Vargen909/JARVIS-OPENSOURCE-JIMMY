"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Mic, MicOff } from "lucide-react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface CoreInputProps {
  text: string;
  onTextChange: (s: string) => void;
  pending: boolean;
  listening: boolean;
  error: string | null;
  confirmPrompt?: string | null;
  onConfirm?: () => void;
  onCancel?: () => void;
  onSend: () => void;
  onToggleVoice: () => void;
  /** Idle (4s of inactivity) — fade out when no text. */
  idle: boolean;
  /** Hidden in Neural Focus Mode until the user types or moves the mouse. */
  hidden?: boolean;
}

/**
 * Bottom command input for Core Mode. Auto-fades on idle, expands width
 * subtly when the user starts typing, and is fully removed in Neural
 * Focus Mode (until interaction unmounts the focus overlay).
 */
export const CoreInput = forwardRef<HTMLTextAreaElement, CoreInputProps>(
  function CoreInput(
    {
      text,
      onTextChange,
      pending,
      listening,
      error,
      confirmPrompt = null,
      onConfirm,
      onCancel,
      onSend,
      onToggleVoice,
      idle,
      hidden = false,
    },
    ref
  ) {
    const hasText = text.trim().length > 0;
    // Idle = visually faded only. Pointer events stay live so the user
    // can always click the send/mic button — fade is purely cosmetic.
    const fade = idle && !hasText && !listening && !pending;
    return (
      <AnimatePresence>
        {!hidden && (
          <motion.div
            key="core-input"
            initial={{ opacity: 0, y: 24 }}
            animate={{
              opacity: fade ? 0.35 : 1,
              y: fade ? 6 : 0,
              scale: hasText ? 1.015 : 1,
            }}
            whileHover={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative z-10 w-full max-w-3xl px-6 pb-8 shrink-0 mx-auto"
          >
            {error && (
              <div className="mb-3 text-center text-sm text-rose-400">
                {error}
              </div>
            )}
            {confirmPrompt && (
              <div className="mb-3 rounded-2xl border border-white/[0.08] bg-bg-card/60 px-4 py-3 backdrop-blur">
                <p className="text-center text-sm text-ink">{confirmPrompt}</p>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={onConfirm}
                    className="rounded-xl bg-accent px-3 py-1.5 text-xs font-medium text-white transition hover:bg-accent-soft"
                  >
                    Ja
                  </button>
                  <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-ink-mute transition hover:text-ink"
                  >
                    Avbryt
                  </button>
                </div>
              </div>
            )}
            <div className="flex items-end gap-3">
              <button
                type="button"
                onClick={onToggleVoice}
                title="Voice input (F3)"
                className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-full border transition-colors shrink-0",
                  listening
                    ? "bg-accent/20 border-accent text-accent"
                    : "bg-bg-card/50 border-white/[0.08] text-ink-mute hover:text-ink hover:border-accent/40"
                )}
              >
                {listening ? (
                  <MicOff className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </button>

              <div className="flex-1 group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-accent/40 via-accent-glow/40 to-accent/40 rounded-2xl opacity-0 group-focus-within:opacity-50 blur-lg transition-opacity duration-500 pointer-events-none" />
                <div className="relative flex items-end gap-2 p-2.5 rounded-2xl bg-bg-card/80 border border-white/[0.06] backdrop-blur-xl">
                  <textarea
                    ref={ref}
                    rows={1}
                    value={text}
                    onChange={(e) => onTextChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        onSend();
                      }
                    }}
                    placeholder="Skriv ett kommando…"
                    disabled={pending}
                    className="flex-1 resize-none bg-transparent outline-none px-2 py-2 text-[15px] text-ink placeholder:text-ink-mute"
                    style={{ minHeight: 40, maxHeight: 150 }}
                  />
                  <button
                    type="button"
                    onClick={onSend}
                    disabled={pending || !hasText}
                    title="Send"
                    aria-label="Send"
                    className={cn(
                      "h-9 w-9 rounded-xl flex items-center justify-center transition-all shrink-0",
                      hasText && !pending
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
              Enter för att skicka · Shift+Enter ny rad · F1 kommandon · F5 fokus
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);
