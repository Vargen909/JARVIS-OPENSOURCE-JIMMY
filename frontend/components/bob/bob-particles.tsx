"use client";

import { useMemo } from "react";
import { getBobMotion, type BobState } from "./use-bob-motion";

interface BobParticlesProps {
  state: BobState;
  size: number;
  /** Layer count multiplier (1 = full, 0.5 = lighter for compact variants). */
  density?: number;
}

/**
 * Three-layer orbital particle system. Each layer rotates at a different
 * speed (and direction) so the particles never "lock" visually. Pure DOM,
 * uses --accent / --accent-glow so palette switches recolor everything.
 */
export function BobParticles({ state, size, density = 1 }: BobParticlesProps) {
  const m = getBobMotion(state);
  const center = size / 2;

  const particles = useMemo(() => {
    const total = Math.round(24 * density);
    const out: { angle: number; radius: number; size: number; delay: number; layer: number }[] = [];
    for (let i = 0; i < total; i++) {
      const layer = Math.floor(i / 8);
      const angle = (i % 8) * 45;
      const radius = size * (0.16 + layer * 0.12);
      out.push({
        angle,
        radius,
        size: 3 - layer * 0.5,
        delay: i * 0.1,
        layer,
      });
    }
    return out;
  }, [size, density]);

  const layerSpeeds = [m.ringSpeed * 1.0, m.ringSpeed * 1.5, m.ringSpeed * 2.0];
  const layerDirs = ["bob-spin", "bob-spin-reverse", "bob-spin"];

  return (
    <>
      {[0, 1, 2].map((layer) => {
        const layerParticles = particles.filter((p) => p.layer === layer);
        if (layerParticles.length === 0) return null;
        return (
          <div
            key={`bob-particles-layer-${layer}`}
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              animation: `${layerDirs[layer]} ${layerSpeeds[layer]}s linear infinite`,
            }}
          >
            {layerParticles.map((p, i) => {
              const x = center + Math.cos((p.angle * Math.PI) / 180) * p.radius;
              const y = center + Math.sin((p.angle * Math.PI) / 180) * p.radius;
              const isOuter = layer >= 1;
              return (
                <div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    left: x - p.size / 2,
                    top: y - p.size / 2,
                    width: p.size,
                    height: p.size,
                    background: isOuter
                      ? "rgb(var(--accent-glow))"
                      : "rgb(var(--accent))",
                    boxShadow: `0 0 ${p.size * (isOuter ? 2 : 3)}px rgb(var(--accent-glow) / 0.6)`,
                    opacity: layer === 0 ? 1 : 0.7 - layer * 0.1,
                    animation: layer === 0
                      ? `bob-soft-pulse ${m.duration}s ease-in-out infinite`
                      : undefined,
                    animationDelay: layer === 0 ? `${p.delay}s` : undefined,
                  }}
                />
              );
            })}
          </div>
        );
      })}
    </>
  );
}
