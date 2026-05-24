"use client";

import { useMemo } from "react";
import { getBobMotion, type BobState } from "./use-bob-motion";

interface BobOrbitalRingsProps {
  state: BobState;
  size: number;
}

/**
 * Four dashed rings + four energy arcs. Vector-only, animated with pure CSS
 * keyframes (declared in globals.css as bob-spin / bob-spin-reverse) so they
 * are GPU-cheap and run at 60fps even with multiple instances.
 */
export function BobOrbitalRings({ state, size }: BobOrbitalRingsProps) {
  const m = getBobMotion(state);
  const center = size / 2;

  const rings = useMemo(
    () => [
      { radius: size * 0.16, segments: 6, dash: "8 12", rot: 0 },
      { radius: size * 0.24, segments: 8, dash: "15 10", rot: 30 },
      { radius: size * 0.34, segments: 12, dash: "20 15", rot: 0 },
      { radius: size * 0.44, segments: 16, dash: "12 20", rot: 15 },
    ],
    [size]
  );

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="absolute inset-0 pointer-events-none"
      aria-hidden
    >
      <defs>
        <filter id="bob-soft-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>

      {rings.map((ring, i) => {
        const speed = m.ringSpeed + i * 4;
        const reverse = i % 2 === 1;
        return (
          <g key={`ring-${i}`}>
            <circle
              cx={center}
              cy={center}
              r={ring.radius}
              fill="none"
              stroke="rgb(var(--accent))"
              strokeWidth={1.5 - i * 0.25}
              strokeDasharray={ring.dash}
              opacity={0.42 - i * 0.07}
              filter="url(#bob-soft-glow)"
              style={{
                transformOrigin: "center",
                animation: `${reverse ? "bob-spin-reverse" : "bob-spin"} ${speed}s linear infinite`,
              }}
            />
            {Array.from({ length: ring.segments }).map((_, j) => {
              const angle =
                (j / ring.segments) * Math.PI * 2 +
                (ring.rot * Math.PI) / 180;
              const x = center + Math.cos(angle) * ring.radius;
              const y = center + Math.sin(angle) * ring.radius;
              return (
                <circle
                  key={`ring-${i}-node-${j}`}
                  cx={x}
                  cy={y}
                  r={2.5 - i * 0.35}
                  fill="rgb(var(--accent))"
                  opacity={0.6 - i * 0.1}
                  style={{
                    transformOrigin: `${center}px ${center}px`,
                    animation: `${reverse ? "bob-spin-reverse" : "bob-spin"} ${speed}s linear infinite`,
                  }}
                />
              );
            })}
          </g>
        );
      })}

      {/* Four energy arcs */}
      {[0, 1, 2, 3].map((i) => {
        const start = i * 90;
        const arcR = size * 0.27;
        const x1 =
          center + Math.cos(((start - 30) * Math.PI) / 180) * arcR;
        const y1 =
          center + Math.sin(((start - 30) * Math.PI) / 180) * arcR;
        const x2 =
          center + Math.cos(((start + 30) * Math.PI) / 180) * arcR;
        const y2 =
          center + Math.sin(((start + 30) * Math.PI) / 180) * arcR;
        return (
          <path
            key={`arc-${i}`}
            d={`M ${x1} ${y1} A ${arcR} ${arcR} 0 0 1 ${x2} ${y2}`}
            fill="none"
            stroke="rgb(var(--accent-glow))"
            strokeWidth="2"
            strokeLinecap="round"
            opacity={0.55}
            filter="url(#bob-soft-glow)"
            style={{
              transformOrigin: "center",
              animation: `bob-spin ${m.ringSpeed * 0.8}s linear infinite`,
            }}
          />
        );
      })}
    </svg>
  );
}
