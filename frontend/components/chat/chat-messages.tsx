"use client";

import { Sparkles } from "lucide-react";
import { useJarvis } from "../providers";
import { useLayout } from "@/lib/use-layout-store";
import { NeuralCore } from "../neural-core";
import type { MessageOut } from "@/lib/types";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Sammanfatta dagens viktigaste uppgifter.",
  "Help me plan my next 3 days.",
  "Brainstorm a name for my side project.",
  "Förklara kvantsammanflätning för en 12-åring.",
];

export function ChatMessages({
  messages,
  pending,
  empty,
  onSuggestion,
}: {
  messages: MessageOut[];
  pending: boolean;
  empty: boolean;
  onSuggestion?: (text: string) => void;
}) {
  const { activeUser } = useJarvis();
  const { state } = useLayout();
  const showNeural = state.panels.neuralCore;

  if (empty) {
    return (
      <div
        className={cn(
          "h-full flex flex-col items-center justify-center px-6 text-center",
          state.density === "compact" ? "py-4" : "py-8"
        )}
      >
        {showNeural ? (
          <div className="mb-6">
            <NeuralCore size={state.brainSize} thinking={pending} />
          </div>
        ) : (
          <div className="icon-badge mx-auto mb-5 w-14 h-14 rounded-2xl">
            <Sparkles className="w-6 h-6 text-accent" />
          </div>
        )}

        <h1
          className={cn(
            "font-semibold tracking-tight",
            state.density === "compact" ? "text-2xl" : "text-3xl"
          )}
        >
          Hur kan jag hjälpa dig idag?
        </h1>
        <p className="text-ink-dim mt-2 max-w-md text-sm">
          Hej {activeUser?.name}. Välj läge och motor i headern ovan.
        </p>

        {state.panels.quickActions && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSuggestion?.(s)}
                className={cn(
                  "group rounded-xl border border-white/[0.06] bg-white/[0.02] text-left",
                  "px-4 py-3 text-sm text-ink-dim transition-all duration-150",
                  "hover:bg-white/[0.05] hover:border-accent/25 hover:text-ink",
                  "active:scale-[0.98]",
                  onSuggestion ? "cursor-pointer" : "cursor-default"
                )}
              >
                <span className="group-hover:text-ink transition-colors">{s}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mx-auto max-w-3xl px-6 pt-8 pb-12 space-y-6",
        state.density === "compact" && "pt-4 pb-8 space-y-4"
      )}
    >
      {messages.map((m) => (
        <Bubble key={m.id} message={m} />
      ))}
      {pending && <ThinkingDots />}
    </div>
  );
}

function ThinkingDots() {
  return (
    <div className="flex items-start gap-3 animate-fade-in">
      <div className="icon-badge-sm">
        <Sparkles className="w-3.5 h-3.5 text-accent" />
      </div>
      <div className="panel px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="dot-pulse text-accent"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}

function Bubble({ message }: { message: MessageOut }) {
  const isUser = message.role === "user";
  return (
    <div
      className={cn(
        "flex gap-3 animate-slide-up",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="icon-badge-sm shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap",
          isUser
            ? "bg-accent text-white shadow-glow"
            : "panel text-ink"
        )}
      >
        {message.content}
        {!isUser && (message.engine || message.model) && (
          <div className="text-[10px] text-ink-mute mt-2 flex items-center gap-1.5 border-t border-white/[0.05] pt-2">
            {message.engine && (
              <span className="opacity-60">{message.engine}</span>
            )}
            {message.model && (
              <span className="opacity-40">· {message.model}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
