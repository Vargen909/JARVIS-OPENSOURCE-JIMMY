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
}: {
  messages: MessageOut[];
  pending: boolean;
  empty: boolean;
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
            <NeuralCore
              size={state.brainSize}
              thinking={pending}
            />
          </div>
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center mb-5">
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
          Hej {activeUser?.name}. Byt läge eller motor i headern. Anpassa layout
          i sidopanelen.
        </p>
        {state.panels.quickActions && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
            {SUGGESTIONS.map((s) => (
              <div
                key={s}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] cursor-default px-4 py-3 text-left text-sm text-ink-dim transition-colors"
              >
                {s}
              </div>
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
      {pending && (
        <div className="flex items-center gap-2 text-ink-mute text-sm">
          <span className="dot-pulse text-accent" />
          <span
            className="dot-pulse text-accent"
            style={{ animationDelay: "0.2s" }}
          />
          <span
            className="dot-pulse text-accent"
            style={{ animationDelay: "0.4s" }}
          />
        </div>
      )}
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
        <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center text-accent shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap",
          isUser
            ? "bg-accent text-white shadow-glow"
            : "bg-white/[0.04] border border-white/[0.06] text-ink"
        )}
      >
        {message.content}
        {!isUser && message.engine && (
          <div className="text-[10px] text-ink-mute mt-2 flex items-center gap-1.5">
            <span className="opacity-60">{message.engine}</span>
            {message.model && (
              <span className="opacity-40">· {message.model}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
