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
 * Minimal cinematic status bar for Core view.
 * Shows only time and B.O.B OS branding — clean and uncluttered.
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
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: idle ? 0 : 0.6, y: idle ? -6 : 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "relative z-10 w-full flex items-center justify-between px-6 py-4 sm:px-10 shrink-0",
            idle && "pointer-events-none"
          )}
        >
          {/* Clock */}
          <span className="text-[13px] font-light text-ink-mute tabular-nums tracking-wider">
            {fmtTime}
          </span>

          {/* Branding */}
          <span className="text-[11px] font-medium text-ink-mute/50 tracking-widest uppercase">
            B.O.B OS
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
