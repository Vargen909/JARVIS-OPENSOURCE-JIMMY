"use client";

import { AnimatePresence, motion } from "framer-motion";

interface LauncherToastProps {
  visible: boolean;
  label: string;
}

/**
 * Minimal "Coming soon" toast that appears above the launcher grid when a
 * placeholder card is clicked. Auto-hides after 2.4 s (handled by parent).
 * No external toast library — pure framer-motion.
 */
export function LauncherToast({ visible, label }: LauncherToastProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="launcher-toast"
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border border-white/[0.10] bg-bg-card/90 backdrop-blur-xl shadow-2xl">
            <span className="w-1.5 h-1.5 rounded-full bg-accent/70 animate-pulse" aria-hidden />
            <span className="text-sm text-ink-dim">
              <span className="text-ink font-medium">{label}</span>
              {" "}kommer snart
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
