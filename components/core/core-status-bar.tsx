"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface CoreStatusBarProps {
  now: Date;
  modelLabel: string;
  pending: boolean;
  listening: boolean;
  backendOnline?: boolean;
  ready?: boolean;
  activeEngineAvailable?: boolean;
  idle: boolean;
  hidden?: boolean;
}

/**
 * Minimal cinematic status bar for Core view.
 * Shows only essential status — time, model, and system pulse.
 * Design brief: elegant, readable, not cluttered.
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

  const statusDot = !backendOnline
    ? "bg-rose-400"
    : !activeEngineAvailable
      ? "bg-amber-400"
      : pending
        ? "bg-amber-400 animate-pulse"
        : listening
          ? "bg-accent animate-pulse"
          : "bg-emerald-500/70";

  const statusLabel = !backendOnline
    ? "Offline"
    : listening
      ? "Jag lyssnar"
      : pending
        ? "Tänker"
        : "Väntar";

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          key="core-status-bar"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: idle ? 0 : 1, y: idle ? -6 : 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "relative z-10 w-full flex items-center justify-between px-6 py-3 sm:px-10 shrink-0",
            idle && "pointer-events-none"
          )}
        >
          {/* Clock */}
          <span className="text-[13px] font-light text-ink-mute tabular-nums tracking-wider">
            {fmtTime}
          </span>

          {/* Center model + status pill */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-bg-card/40 border border-white/[0.05] backdrop-blur"
          >
            <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusDot)} />
            <span className="text-[12px] text-ink-mute/80 font-medium">{modelLabel}</span>
            <span className="text-[11px] text-ink-mute/50">·</span>
            <span className="text-[11px] text-ink-mute/60 tracking-wide">{statusLabel}</span>
          </motion.div>

          {/* Right placeholder — keeps layout balanced */}
          <span className="text-[13px] font-light text-ink-mute/40 hidden sm:block tracking-wider">
            B.O.B OS
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
