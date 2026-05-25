"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface CoreStatusBarProps {
  now: Date;
  modelLabel?: string;
  pending?: boolean;
  listening?: boolean;
  backendOnline?: boolean;
  ready?: boolean;
  activeEngineAvailable?: boolean;
  idle: boolean;
  hidden?: boolean;
}

/**
 * Cinematic status bar — time left, B.O.B OS right, symmetrical.
 * Fades gracefully on idle; designed to never distract.
 */
export function CoreStatusBar({
  now,
  idle,
  hidden = false,
}: CoreStatusBarProps) {
  const fmtTime = now.toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          key="core-status-bar"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: idle ? 0 : 0.55, y: idle ? -4 : 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "relative z-10 w-full flex items-center justify-between",
            "px-7 sm:px-10 pt-5 pb-2 shrink-0",
            idle && "pointer-events-none"
          )}
        >
          {/* Clock */}
          <span className="text-[13px] font-light text-ink-mute/80 tabular-nums tracking-[0.1em]">
            {fmtTime}
          </span>

          {/* Center dot — subtle pulse to show system is alive */}
          <motion.div
            className="w-1 h-1 rounded-full"
            style={{ background: "rgb(var(--accent-glow) / 0.45)" }}
            animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Branding */}
          <span className="text-[11px] font-medium text-ink-mute/40 tracking-[0.22em] uppercase">
            B.O.B OS
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
