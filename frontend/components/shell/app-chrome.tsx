"use client";

import { motion } from "framer-motion";
import { Sparkles, Settings2 } from "lucide-react";
import { ViewNavigation, type ViewType } from "@/components/view-navigation";
import { useLayout } from "@/lib/use-layout-store";
import { cn } from "@/lib/utils";

interface AppChromeProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  onOpenCustomize: () => void;
  children: React.ReactNode;
  /** Full-screen mode (Core view) — nav floats, no top bar */
  fullscreen?: boolean;
}

/** Shared cinematic background used across all views */
export function CinematicBackground({ opacity = 1 }: { opacity?: number }) {
  const { state } = useLayout();
  const glowOpacity = (state.glowIntensity ?? 0.7) * opacity;

  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        opacity: glowOpacity,
        background: `
          radial-gradient(ellipse at 50% 0%, rgb(var(--accent-glow) / 0.18) 0%, transparent 55%),
          radial-gradient(ellipse at 0% 50%, rgb(var(--accent) / 0.06) 0%, transparent 45%),
          radial-gradient(ellipse at 100% 50%, rgb(var(--accent) / 0.06) 0%, transparent 45%)
        `,
      }}
    />
  );
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
      <div className="h-screen w-screen overflow-hidden bg-bg relative">
        <CinematicBackground />
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-40">
          <ViewNavigation activeView={activeView} onViewChange={onViewChange} />
        </div>
        <div className="relative z-10 h-full pt-20">{children}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg relative">
      <CinematicBackground />
      <header className="relative z-20 shrink-0 flex items-center justify-between px-4 sm:px-6 py-2.5 border-b border-white/[0.04] bg-bg/50 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2.5"
        >
          <div className="w-8 h-8 rounded-xl bg-accent/15 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-accent" />
          </div>
          <span className="font-semibold text-[15px]">Jarvis</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 font-mono">
            OS
          </span>
        </motion.div>

        <div className="absolute left-1/2 -translate-x-1/2 hidden sm:block">
          <ViewNavigation
            activeView={activeView}
            onViewChange={onViewChange}
            compact
          />
        </div>

        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <button
            type="button"
            className="btn-ghost py-1.5 px-3 text-xs"
            onClick={onOpenCustomize}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Customize</span>
          </button>
        </motion.div>
      </header>

      {/* Mobile nav below header */}
      <div className="sm:hidden relative z-20 flex justify-center py-2 border-b border-white/[0.04] bg-bg/40 backdrop-blur">
        <ViewNavigation activeView={activeView} onViewChange={onViewChange} compact />
      </div>

      <div className={cn("relative z-10 flex flex-1 min-h-0")}>{children}</div>
    </div>
  );
}
