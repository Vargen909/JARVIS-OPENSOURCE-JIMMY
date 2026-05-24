"use client";

import { motion } from "framer-motion";
import { Settings2 } from "lucide-react";
import { ViewNavigation, type ViewType } from "@/components/view-navigation";
import { BobCore } from "@/components/bob/bob-core";
import { BobBackground } from "@/components/bob/bob-background";
import { cn } from "@/lib/utils";

interface AppChromeProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  onOpenCustomize: () => void;
  children: React.ReactNode;
  /** Full-screen mode (Core view) — nav floats, no top bar. */
  fullscreen?: boolean;
}

export function AppChrome({
  activeView,
  onViewChange,
  onOpenCustomize,
  children,
  fullscreen = false,
}: AppChromeProps) {
  if (fullscreen) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-bg relative flex flex-col">
        <BobBackground />
        <div
          className="fixed left-1/2 -translate-x-1/2 z-[var(--z-floating-nav)]"
          style={{ top: "calc(env(safe-area-inset-top, 0px) + 1.25rem)" }}
        >
          <ViewNavigation activeView={activeView} onViewChange={onViewChange} compact />
        </div>
        <div
          className="relative z-[var(--z-content)] flex-1 min-h-0 flex flex-col"
          style={{ paddingTop: "var(--bob-floating-nav-h)" }}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-bg relative overflow-hidden">
      <BobBackground />

      {/* ── Top header ── */}
      <header
        className="relative z-[var(--z-chrome)] shrink-0 flex items-center justify-between gap-3 px-4 sm:px-6 border-b border-white/[0.04] bg-bg/55 backdrop-blur-xl"
        style={{ height: "var(--bob-nav-h)" }}
      >
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2.5 shrink-0"
        >
          <BobCore variant="compact" size={28} className="shrink-0" />
          <span className="font-semibold text-[15px] tracking-tight">B.O.B</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 font-mono">
            OS
          </span>
        </motion.div>

        <div className="hidden md:flex flex-1 justify-center min-w-0">
          <ViewNavigation
            activeView={activeView}
            onViewChange={onViewChange}
            compact
          />
        </div>

        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 shrink-0"
        >
          <button
            type="button"
            className="btn-ghost py-1.5 px-3 text-xs"
            onClick={onOpenCustomize}
            title="Customize"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Customize</span>
          </button>
        </motion.div>
      </header>

      {/* ── Mobile nav strip ── */}
      <div
        className="md:hidden relative z-[var(--z-chrome)] shrink-0 flex justify-center items-center border-b border-white/[0.04] bg-bg/40 backdrop-blur"
        style={{ height: "var(--bob-mobile-nav-h)" }}
      >
        <ViewNavigation activeView={activeView} onViewChange={onViewChange} compact />
      </div>

      {/* ── Body ── */}
      <div className={cn("relative z-[var(--z-content)] flex flex-1 min-h-0")}>
        {children}
      </div>
    </div>
  );
}
