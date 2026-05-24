"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Activity, Clock, Mic, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CoreStatusBarProps {
  now: Date;
  modelLabel: string;
  pending: boolean;
  listening: boolean;
  backendOnline?: boolean;
  ready?: boolean;
  activeEngineAvailable?: boolean;
  /** When true, fade out (idle) but keep DOM. */
  idle: boolean;
  /** When true, completely remove (focus mode). */
  hidden?: boolean;
}

/**
 * Top status bar for Core Mode. Shows clock, current model, mic activity
 * and a tiny system pulse. Fades on idle, fully unmounts in Neural Focus
 * Mode. Position is sticky-top so the orb breathes underneath.
 */
export function CoreStatusBar({
  now,
  modelLabel,
  pending,
  listening,
  backendOnline = true,
  ready = true,
  activeEngineAvailable = true,
  idle,
  hidden = false,
}: CoreStatusBarProps) {
  const fmtTime = now.toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const fmtDate = now.toLocaleDateString("sv-SE", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const healthLabel = !backendOnline
    ? "Offline"
    : !activeEngineAvailable
      ? "Motor ej tillgänglig"
      : ready
        ? "Redo"
        : "Startar";
  const healthClass = !backendOnline
    ? "bg-rose-400"
    : !activeEngineAvailable
      ? "bg-amber-400"
      : pending
        ? "bg-amber-400 animate-pulse"
        : "bg-emerald-400";

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          key="core-status-bar"
          initial={{ opacity: 0, y: -12 }}
          animate={{
            opacity: idle ? 0 : 1,
            y: idle ? -8 : 0,
          }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className={cn(
            "relative z-10 w-full flex items-center justify-between px-6 py-4 sm:px-10 shrink-0",
            idle && "pointer-events-none"
          )}
        >
          <div className="flex items-center gap-3 text-ink-dim">
            <Clock className="h-4 w-4" />
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-light text-ink tabular-nums">
                {fmtTime}
              </span>
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
            <div className={cn("w-2 h-2 rounded-full", healthClass)} />
            <span className="text-[11px] text-ink-mute font-mono">{healthLabel}</span>
          </motion.div>

          <div className="hidden md:flex items-center gap-2 text-ink-dim">
            {listening ? (
              <>
                <Mic className="h-4 w-4 text-accent" />
                <span className="text-sm text-accent">Lyssnar</span>
              </>
            ) : (
              <>
                <Activity className="h-4 w-4" />
                <span className="text-sm">Systemet aktivt</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
