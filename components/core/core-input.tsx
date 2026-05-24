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
 * Premium command bar for Core Mode.
 * Expands smoothly on focus, soft glow sweep on the send button,
 * and fades elegantly on idle.
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
    const fade = idle && !hasText && !listening && !pending;

    return (
      <AnimatePresence>
        {!hidden && (
          <motion.div
            key="core-input"
            initial={{ opacity: 0, y: 28 }}
            animate={{
              opacity: fade ? 0.28 : 1,
              y: fade ? 8 : 0,
            }}
            whileHover={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 28 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-2xl px-5 pb-7 shrink-0 mx-auto"
          >
            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="mb-3 text-center text-sm text-rose-400/90"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Confirm prompt */}
            <AnimatePresence>
              {confirmPrompt && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: 6 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="mb-3 rounded-2xl border border-white/[0.07] bg-bg-card/70 px-5 py-4 backdrop-blur-xl"
                >
                  <p className="text-center text-[14px] text-ink leading-relaxed">
                    {confirmPrompt}
                  </p>
                  <div className="mt-3 flex items-center justify-center gap-2.5">
                    <button
                      type="button"
                      onClick={onConfirm}
                      className={cn(
                        "rounded-xl px-4 py-1.5 text-[12px] font-semibold tracking-wide",
                        "bg-accent text-white transition-all duration-150",
                        "hover:bg-accent-soft hover:shadow-glow active:scale-[0.97]"
                      )}
                    >
                      Ja
                    </button>
                    <button
                      type="button"
                      onClick={onCancel}
                      className={cn(
                        "rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-1.5",
                        "text-[12px] font-medium text-ink-mute",
                        "transition-all duration-150 hover:text-ink hover:bg-white/[0.07] active:scale-[0.97]"
                      )}
                    >
                      Avbryt
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main input row */}
            <div className="flex items-end gap-3">
              {/* Mic button */}
              <motion.button
                type="button"
                onClick={onToggleVoice}
                title="Röstinmatning (F3)"
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                className={cn(
                  "flex items-center justify-center w-11 h-11 rounded-full border",
                  "transition-all duration-200 shrink-0",
                  listening
                    ? "bg-accent/15 border-accent/60 text-accent shadow-[0_0_16px_-4px_rgb(var(--accent-glow)/0.5)]"
                    : "bg-bg-card/40 border-white/[0.07] text-ink-mute hover:text-ink-dim hover:border-white/[0.14] hover:bg-bg-card/70"
                )}
              >
                {listening ? (
                  <MicOff className="h-[18px] w-[18px]" strokeWidth={1.8} />
                ) : (
                  <Mic className="h-[18px] w-[18px]" strokeWidth={1.8} />
                )}
              </motion.button>

              {/* Text area wrapper */}
              <div className="flex-1 group relative">
                {/* Outer glow — only on focus */}
                <motion.div
                  className="absolute -inset-px rounded-2xl pointer-events-none"
                  initial={false}
                  style={{
                    background:
                      "linear-gradient(135deg, rgb(var(--accent)/0.35) 0%, rgb(var(--accent-glow)/0.25) 100%)",
                    opacity: 0,
                  }}
                  animate={{ opacity: hasText || listening ? 0.6 : 0 }}
                  transition={{ duration: 0.4 }}
                />

                <div
                  className={cn(
                    "relative flex items-end gap-2",
                    "p-2.5 rounded-[18px]",
                    "bg-bg-card/70 backdrop-blur-2xl",
                    "border border-white/[0.065]",
                    "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
                    "transition-[border-color,box-shadow] duration-300",
                    "group-focus-within:border-accent/30",
                    "group-focus-within:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_32px_-8px_rgb(var(--accent-glow)/0.25)]"
                  )}
                >
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
                    className={cn(
                      "flex-1 resize-none bg-transparent outline-none",
                      "px-2 py-2 text-[14px] leading-relaxed",
                      "text-ink placeholder:text-ink-mute/60",
                      "disabled:opacity-50"
                    )}
                    style={{ minHeight: 40, maxHeight: 160 }}
                  />

                  {/* Send button */}
                  <motion.button
                    type="button"
                    onClick={onSend}
                    disabled={pending || !hasText}
                    title="Skicka"
                    aria-label="Skicka"
                    whileHover={hasText && !pending ? { scale: 1.08 } : {}}
                    whileTap={hasText && !pending ? { scale: 0.92 } : {}}
                    className={cn(
                      "h-9 w-9 rounded-[13px] flex items-center justify-center",
                      "transition-all duration-200 shrink-0 overflow-hidden relative",
                      hasText && !pending
                        ? [
                            "bg-accent text-white",
                            "shadow-[0_2px_12px_-2px_rgb(var(--accent-glow)/0.6)]",
                            "hover:bg-accent-soft hover:shadow-[0_2px_20px_-2px_rgb(var(--accent-glow)/0.75)]",
                          ]
                        : "bg-white/[0.04] text-ink-mute/50"
                    )}
                  >
                    {/* Sweep glow effect */}
                    {hasText && !pending && (
                      <motion.div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 60%)",
                        }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: [0, 0.8, 0], x: [-20, 20] }}
                        transition={{
                          duration: 1.8,
                          repeat: Infinity,
                          repeatDelay: 2,
                          ease: "easeInOut",
                        }}
                      />
                    )}
                    <ArrowUp className="h-4 w-4 relative z-10" strokeWidth={2.2} />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Keyboard hints */}
            <p className="text-[10px] text-ink-mute/40 text-center mt-2.5 tracking-wide">
              Enter skicka &middot; Shift+Enter ny rad &middot; F1 kommandon &middot; F5 fokus
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);
