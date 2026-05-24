"use client";

import { useLayout } from "@/lib/use-layout-store";

interface BobBackgroundProps {
  /** 0..1 base opacity (multiplied by layout glow intensity). */
  opacity?: number;
}

/**
 * Cinematic page background. Three radial gradients tinted with --accent
 * and --accent-glow. Sits at z-0 behind all content. Reads layout glow
 * intensity so customize-layout slider is reflected on every page.
 */
export function BobBackground({ opacity = 1 }: BobBackgroundProps) {
  const { state } = useLayout();
  const finalOpacity = (state.glowIntensity ?? 0.7) * opacity;

  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        opacity: finalOpacity,
        background: `
          radial-gradient(ellipse 70% 50% at 50% -10%, rgb(var(--accent-glow) / 0.22) 0%, transparent 55%),
          radial-gradient(ellipse 50% 40% at 0% 50%, rgb(var(--accent) / 0.08) 0%, transparent 50%),
          radial-gradient(ellipse 50% 40% at 100% 50%, rgb(var(--accent) / 0.08) 0%, transparent 50%),
          radial-gradient(ellipse 80% 60% at 50% 110%, rgb(var(--accent-glow) / 0.10) 0%, transparent 60%)
        `,
      }}
    />
  );
}
