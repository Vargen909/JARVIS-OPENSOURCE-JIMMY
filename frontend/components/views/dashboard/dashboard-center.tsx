"use client";

import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import { NeuralBrain } from "./neural-brain";
import { useJarvis } from "@/components/providers";
import { useLayout } from "@/lib/use-layout-store";
import { cn } from "@/lib/utils";
import type { BrainSize } from "@/lib/layouts";

function mapBrainSize(size: BrainSize): "small" | "medium" | "large" {
  if (size === "sm") return "small";
  if (size === "lg") return "large";
  return "medium";
}

interface DashboardCenterProps {
  isThinking: boolean;
  statusMessage?: string;
}

export function DashboardCenter({ isThinking, statusMessage }: DashboardCenterProps) {
  const { activeUser, engines } = useJarvis();
  const { state } = useLayout();

  const brainSize = mapBrainSize(state.brainSize);

  const currentEngine = engines.find((e) => e.id === activeUser?.preferred_engine);
  const currentModelId =
    activeUser?.preferred_model || currentEngine?.default_model || "";
  const currentModel =
    currentEngine?.models.find((m) => m.id === currentModelId) ||
    currentEngine?.models[0];
  const modelLabel =
    currentModel?.label || currentModel?.id || currentEngine?.label || "Jarvis";

  return (
    <div className="flex flex-col items-center justify-center flex-1 min-h-0 p-6 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative"
      >
        <div
          aria-hidden
          className={cn(
            "absolute inset-0 rounded-full blur-3xl transition-all duration-1000",
            isThinking ? "scale-125 opacity-60" : "scale-100 opacity-30"
          )}
          style={{ background: "rgb(var(--accent) / 0.12)" }}
        />
        <NeuralBrain size={brainSize} isThinking={isThinking} />
      </motion.div>

      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="mt-8 text-center space-y-4 max-w-lg"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-bg-card/60 border border-white/[0.08] backdrop-blur">
          <Sparkles className="h-4 w-4 text-accent" />
          <span className="text-sm font-medium">{modelLabel}</span>
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              isThinking ? "bg-amber-400 animate-pulse" : "bg-emerald-400"
            )}
          />
        </div>

        {(isThinking || statusMessage) && (
          <div className="flex items-center justify-center gap-2 text-ink-dim">
            {isThinking && <Loader2 className="h-4 w-4 animate-spin text-accent" />}
            <span className="text-sm">{statusMessage || "Bearbetar…"}</span>
          </div>
        )}

        {!isThinking && !statusMessage && activeUser && (
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              Hej {activeUser.name}, jag är Jarvis
            </h2>
            <p className="text-sm text-ink-dim leading-relaxed">
              Din personliga AI-assistent. Skriv ett kommando nedan eller byt vy till Chat för
              full konversationshistorik.
            </p>
          </div>
        )}

        <div className="flex items-center justify-center gap-6 pt-2">
          <div className="text-center">
            <p className="text-xl font-bold tabular-nums">
              {engines.filter((e) => e.available).length}
            </p>
            <p className="text-[10px] text-ink-mute uppercase tracking-wide">Engines online</p>
          </div>
          <div className="w-px h-8 bg-white/[0.08]" />
          <div className="text-center">
            <p className="text-xl font-bold capitalize">{activeUser?.operating_mode}</p>
            <p className="text-[10px] text-ink-mute uppercase tracking-wide">Mode</p>
          </div>
          <div className="w-px h-8 bg-white/[0.08]" />
          <div className="text-center">
            <p className="text-xl font-bold">{currentEngine?.label?.split(" ")[0] ?? "—"}</p>
            <p className="text-[10px] text-ink-mute uppercase tracking-wide">Provider</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
