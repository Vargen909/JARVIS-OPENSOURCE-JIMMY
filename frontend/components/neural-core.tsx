"use client";

import { cn } from "@/lib/utils";
import type { BrainSize } from "@/lib/layouts";

const SIZE_PX: Record<BrainSize, number> = {
  sm: 200,
  md: 320,
  lg: 480,
};

export function NeuralCore({
  size = "md",
  thinking = false,
  className,
}: {
  size?: BrainSize;
  thinking?: boolean;
  className?: string;
}) {
  const px = SIZE_PX[size];

  return (
    <div
      className={cn("relative flex items-center justify-center text-accent", className)}
      style={{
        width: `calc(${px}px * var(--brain-scale, 1))`,
        height: `calc(${px}px * var(--brain-scale, 1))`,
      }}
    >
      <div
        className={cn(
          "absolute inset-0 rounded-full opacity-40 animate-glow-pulse neural-glow",
          thinking && "opacity-70"
        )}
        style={{
          background:
            "radial-gradient(circle, rgb(var(--accent-glow) / 0.35) 0%, transparent 70%)",
        }}
      />
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full neural-glow"
        aria-hidden
      >
        <defs>
          <radialGradient id="brainCore" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgb(var(--accent-glow))" stopOpacity="0.9" />
            <stop offset="60%" stopColor="rgb(var(--accent))" stopOpacity="0.5" />
            <stop offset="100%" stopColor="rgb(var(--accent-soft))" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g className="animate-spin-slow origin-center" style={{ transformOrigin: "100px 100px" }}>
          <ellipse
            cx="100"
            cy="100"
            rx="72"
            ry="48"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.8"
            opacity="0.35"
          />
          <ellipse
            cx="100"
            cy="100"
            rx="48"
            ry="72"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.8"
            opacity="0.25"
          />
        </g>
        <g
          className="animate-spin-slow-reverse origin-center"
          style={{ transformOrigin: "100px 100px" }}
        >
          {[0, 60, 120, 180, 240, 300].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            const x = 100 + 55 * Math.cos(rad);
            const y = 100 + 55 * Math.sin(rad);
            return (
              <circle
                key={deg}
                cx={x}
                cy={y}
                r="4"
                fill="currentColor"
                opacity="0.6"
              />
            );
          })}
        </g>
        <circle cx="100" cy="100" r="28" fill="url(#brainCore)" />
        <circle
          cx="100"
          cy="100"
          r="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          opacity="0.8"
        />
      </svg>
      {thinking && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-xs text-ink-dim uppercase tracking-widest">
          <span className="dot-pulse text-accent" />
          Jarvis tänker…
        </div>
      )}
    </div>
  );
}
