"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

type CoreState = "idle" | "listening" | "thinking" | "speaking";

interface NeuralCoreV2Props {
  state?: CoreState;
  size?: number;
  isListening?: boolean;
  isThinking?: boolean;
  isSpeaking?: boolean;
}

/**
 * Cinematic neural core port from the v0 design (B.O.B variant).
 * Uses our existing CSS variables (--accent / rgb tuples) via inline RGB
 * so it adapts to whichever palette is active in the layout store.
 */
export function NeuralCoreV2({
  state: propState,
  size = 400,
  isListening = false,
  isThinking = false,
  isSpeaking = false,
}: NeuralCoreV2Props) {
  const state: CoreState =
    propState ||
    (isSpeaking
      ? "speaking"
      : isThinking
        ? "thinking"
        : isListening
          ? "listening"
          : "idle");

  const center = size / 2;
  const coreRadius = size * 0.08;

  const config = useMemo(() => {
    switch (state) {
      case "speaking":
        return { duration: 0.4, glowIntensity: 1.8, ringSpeed: 8 };
      case "thinking":
        return { duration: 0.8, glowIntensity: 1.5, ringSpeed: 12 };
      case "listening":
        return { duration: 1.2, glowIntensity: 1.2, ringSpeed: 20 };
      default:
        return { duration: 2, glowIntensity: 1, ringSpeed: 30 };
    }
  }, [state]);

  const rings = useMemo(
    () => [
      { radius: size * 0.14, segments: 6, dashArray: "8 12", rotation: 0 },
      { radius: size * 0.22, segments: 8, dashArray: "15 10", rotation: 30 },
      { radius: size * 0.32, segments: 12, dashArray: "20 15", rotation: 0 },
      { radius: size * 0.42, segments: 16, dashArray: "12 20", rotation: 15 },
    ],
    [size]
  );

  const particles = useMemo(() => {
    const p: { angle: number; radius: number; size: number; delay: number }[] = [];
    for (let i = 0; i < 24; i++) {
      const layer = Math.floor(i / 8);
      const angle = (i % 8) * 45;
      const radius = size * (0.15 + layer * 0.12);
      p.push({ angle, radius, size: 3 - layer * 0.5, delay: i * 0.1 });
    }
    return p;
  }, [size]);

  const accent = "rgb(var(--accent))";
  const accentGlow = "rgb(var(--accent-glow))";
  const accentSoft = "rgb(var(--accent-glow) / 0.3)";

  return (
    <div className="relative select-none" style={{ width: size, height: size }}>
      <div
        className="absolute inset-0 rounded-full animate-pulse"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${accentGlow} 0%, transparent 60%)`,
          opacity: 0.4 * config.glowIntensity,
          animationDuration: `${config.duration * 2}s`,
        }}
      />
      <div
        className="absolute inset-[-20%] rounded-full"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${accentSoft} 0%, transparent 50%)`,
          opacity: 0.3 * config.glowIntensity,
        }}
      />

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0"
      >
        <defs>
          <radialGradient id="ncv2-coreGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="white" />
            <stop offset="40%" stopColor={accent} />
            <stop offset="100%" stopColor={accentGlow} />
          </radialGradient>
          <filter id="ncv2-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="ncv2-softGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>

        {rings.map((ring, i) => (
          <g key={i}>
            <circle
              cx={center}
              cy={center}
              r={ring.radius}
              fill="none"
              stroke={accent}
              strokeWidth={1.5 - i * 0.3}
              strokeDasharray={ring.dashArray}
              opacity={0.4 - i * 0.08}
              filter="url(#ncv2-softGlow)"
              style={{
                transformOrigin: "center",
                animation: `ncv2-spin ${config.ringSpeed + i * 5}s linear infinite ${
                  i % 2 === 0 ? "" : "reverse"
                }`,
              }}
            />
            {Array.from({ length: ring.segments }).map((_, j) => {
              const angle =
                (j / ring.segments) * Math.PI * 2 + (ring.rotation * Math.PI) / 180;
              const x = center + Math.cos(angle) * ring.radius;
              const y = center + Math.sin(angle) * ring.radius;
              return (
                <circle
                  key={j}
                  cx={x}
                  cy={y}
                  r={2.5 - i * 0.4}
                  fill={accent}
                  opacity={0.6 - i * 0.1}
                  style={{
                    transformOrigin: `${center}px ${center}px`,
                    animation: `ncv2-spin ${config.ringSpeed + i * 5}s linear infinite ${
                      i % 2 === 0 ? "" : "reverse"
                    }`,
                  }}
                />
              );
            })}
          </g>
        ))}

        {[0, 1, 2, 3].map((i) => {
          const startAngle = i * 90;
          const arcRadius = size * 0.25;
          const x1 =
            center + Math.cos(((startAngle - 30) * Math.PI) / 180) * arcRadius;
          const y1 =
            center + Math.sin(((startAngle - 30) * Math.PI) / 180) * arcRadius;
          const x2 =
            center + Math.cos(((startAngle + 30) * Math.PI) / 180) * arcRadius;
          const y2 =
            center + Math.sin(((startAngle + 30) * Math.PI) / 180) * arcRadius;
          return (
            <path
              key={i}
              d={`M ${x1} ${y1} A ${arcRadius} ${arcRadius} 0 0 1 ${x2} ${y2}`}
              fill="none"
              stroke={accentGlow}
              strokeWidth="2"
              strokeLinecap="round"
              opacity={0.5}
              filter="url(#ncv2-softGlow)"
              style={{
                transformOrigin: "center",
                animation: `ncv2-spin ${config.ringSpeed * 0.8}s linear infinite`,
              }}
            />
          );
        })}

        <motion.circle
          cx={center}
          cy={center}
          r={coreRadius * 2.5}
          fill={accent}
          opacity={0.15 * config.glowIntensity}
          filter="url(#ncv2-glow)"
          animate={{ r: [coreRadius * 2.3, coreRadius * 2.8, coreRadius * 2.3] }}
          transition={{ duration: config.duration, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.circle
          cx={center}
          cy={center}
          r={coreRadius * 1.6}
          fill={accent}
          opacity={0.4 * config.glowIntensity}
          filter="url(#ncv2-glow)"
          animate={{ r: [coreRadius * 1.5, coreRadius * 1.8, coreRadius * 1.5] }}
          transition={{
            duration: config.duration * 0.7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.circle
          cx={center}
          cy={center}
          r={coreRadius * 2.2}
          fill="url(#ncv2-coreGrad)"
          filter="url(#ncv2-glow)"
          animate={{ r: [coreRadius * 2.1, coreRadius * 2.4, coreRadius * 2.1] }}
          transition={{
            duration: config.duration * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.circle
          cx={center}
          cy={center}
          r={coreRadius * 1.4}
          fill="none"
          stroke="white"
          strokeWidth="1"
          opacity={0.3}
          animate={{
            r: [coreRadius * 1.3, coreRadius * 1.5, coreRadius * 1.3],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: config.duration * 0.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <motion.text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="central"
          fill="white"
          fontFamily="var(--font-mono), monospace"
          fontWeight="bold"
          letterSpacing="0.15em"
          filter="url(#ncv2-glow)"
          style={{ fontSize: size * 0.065 }}
          animate={{ opacity: [0.9, 1, 0.9] }}
          transition={{ duration: config.duration, repeat: Infinity, ease: "easeInOut" }}
        >
          JARVIS
        </motion.text>

        <motion.rect
          x={center - size * 0.06}
          y={center - size * 0.025}
          width={size * 0.12}
          height={2}
          fill="white"
          opacity={0.6}
          rx={1}
          animate={{
            y: [center - size * 0.03, center + size * 0.02, center - size * 0.03],
            opacity: [0, 0.8, 0],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />

        {[0, 1, 2, 3].map((i) => {
          const dotAngle = ((i * 90 + 45) * Math.PI) / 180;
          const dotRadius = coreRadius * 1.8;
          const dotX = center + Math.cos(dotAngle) * dotRadius;
          const dotY = center + Math.sin(dotAngle) * dotRadius;
          return (
            <motion.circle
              key={`dot-${i}`}
              cx={dotX}
              cy={dotY}
              r={2}
              fill="white"
              opacity={0.7}
              animate={{ opacity: [0.4, 0.9, 0.4], r: [1.5, 2.5, 1.5] }}
              transition={{
                duration: config.duration * 0.6,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut",
              }}
            />
          );
        })}
      </svg>

      <div
        className="absolute inset-0"
        style={{ animation: `ncv2-spin ${config.ringSpeed}s linear infinite` }}
      >
        {particles.slice(0, 8).map((p, i) => {
          const x = center + Math.cos((p.angle * Math.PI) / 180) * p.radius;
          const y = center + Math.sin((p.angle * Math.PI) / 180) * p.radius;
          return (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                left: x - p.size / 2,
                top: y - p.size / 2,
                width: p.size,
                height: p.size,
                background: accent,
                boxShadow: `0 0 ${p.size * 3}px ${accentGlow}`,
                animation: `ncv2-pulse ${config.duration}s ease-in-out infinite`,
                animationDelay: `${p.delay}s`,
              }}
            />
          );
        })}
      </div>

      <div
        className="absolute inset-0"
        style={{ animation: `ncv2-spin ${config.ringSpeed * 1.5}s linear infinite reverse` }}
      >
        {particles.slice(8, 16).map((p, i) => {
          const x = center + Math.cos((p.angle * Math.PI) / 180) * p.radius;
          const y = center + Math.sin((p.angle * Math.PI) / 180) * p.radius;
          return (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                left: x - p.size / 2,
                top: y - p.size / 2,
                width: p.size,
                height: p.size,
                background: accentGlow,
                boxShadow: `0 0 ${p.size * 2}px ${accentSoft}`,
                opacity: 0.7,
              }}
            />
          );
        })}
      </div>

      {state === "listening" && (
        <motion.div
          className="absolute rounded-full border-2 pointer-events-none"
          style={{
            left: center - size * 0.35,
            top: center - size * 0.35,
            width: size * 0.7,
            height: size * 0.7,
            borderColor: accentSoft,
          }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {state === "thinking" && (
        <div
          className="absolute rounded-full border-2 border-transparent pointer-events-none"
          style={{
            left: center - size * 0.38,
            top: center - size * 0.38,
            width: size * 0.76,
            height: size * 0.76,
            borderTopColor: accent,
            borderRightColor: accent,
            animation: "ncv2-spin 1s linear infinite",
            opacity: 0.6,
          }}
        />
      )}

      {state === "speaking" && (
        <>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border pointer-events-none"
              style={{
                left: center - size * 0.12,
                top: center - size * 0.12,
                width: size * 0.24,
                height: size * 0.24,
                borderColor: accentSoft,
              }}
              animate={{ scale: [1, 3.5], opacity: [0.6, 0] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.4,
                ease: "easeOut",
              }}
            />
          ))}
        </>
      )}

      <style jsx>{`
        @keyframes ncv2-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes ncv2-pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
