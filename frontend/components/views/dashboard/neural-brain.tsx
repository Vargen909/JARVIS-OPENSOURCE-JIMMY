"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface NeuralBrainProps {
  size?: "small" | "medium" | "large";
  isThinking?: boolean;
}

/**
 * Neural brain with randomly-laid-out neural network connections.
 * Ported from v0 design — uses our --accent / --accent-glow tokens.
 */
export function NeuralBrain({ size = "medium", isThinking = false }: NeuralBrainProps) {
  const [nodes, setNodes] = useState<{ x: number; y: number; delay: number }[]>([]);

  const sizeMap = { small: 150, medium: 280, large: 400 };
  const brainSize = sizeMap[size];

  useEffect(() => {
    const newNodes: { x: number; y: number; delay: number }[] = [];
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const radius = brainSize * 0.3 + Math.random() * (brainSize * 0.15);
      newNodes.push({
        x: Math.cos(angle) * radius + brainSize / 2,
        y: Math.sin(angle) * radius + brainSize / 2,
        delay: Math.random() * 2,
      });
    }
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const radius = brainSize * 0.15 + Math.random() * (brainSize * 0.1);
      newNodes.push({
        x: Math.cos(angle) * radius + brainSize / 2,
        y: Math.sin(angle) * radius + brainSize / 2,
        delay: Math.random() * 2,
      });
    }
    setNodes(newNodes);
  }, [brainSize]);

  const accent = "rgb(var(--accent))";
  const accentGlow = "rgb(var(--accent-glow))";

  return (
    <div className="relative" style={{ width: brainSize, height: brainSize }}>
      {/* Outer glow rings */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: `rgb(var(--accent) / 0.05)` }}
        animate={{
          scale: isThinking ? [1, 1.15, 1] : [1, 1.08, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: isThinking ? 1.5 : 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute inset-4 rounded-full"
        style={{ background: `rgb(var(--accent) / 0.10)` }}
        animate={{
          scale: isThinking ? [1, 1.1, 1] : [1, 1.05, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: isThinking ? 1.2 : 2.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.3,
        }}
      />

      {/* Core glow */}
      <motion.div
        className="absolute rounded-full blur-xl"
        style={{
          left: brainSize * 0.25,
          top: brainSize * 0.25,
          width: brainSize * 0.5,
          height: brainSize * 0.5,
          background: `rgb(var(--accent) / 0.30)`,
        }}
        animate={{
          scale: isThinking ? [1, 1.3, 1] : [1, 1.15, 1],
          opacity: isThinking ? [0.5, 0.9, 0.5] : [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: isThinking ? 0.8 : 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Neural connections SVG */}
      <svg
        className="absolute inset-0"
        width={brainSize}
        height={brainSize}
        viewBox={`0 0 ${brainSize} ${brainSize}`}
      >
        {nodes.map((node, i) =>
          nodes.slice(i + 1).map((other, j) => {
            const distance = Math.sqrt(
              Math.pow(node.x - other.x, 2) + Math.pow(node.y - other.y, 2)
            );
            if (distance < brainSize * 0.35) {
              return (
                <motion.line
                  key={`line-${i}-${j}`}
                  x1={node.x}
                  y1={node.y}
                  x2={other.x}
                  y2={other.y}
                  stroke={accent}
                  strokeOpacity={0.3}
                  strokeWidth={0.5}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{
                    pathLength: 1,
                    opacity: isThinking ? [0.2, 0.6, 0.2] : [0.1, 0.3, 0.1],
                  }}
                  transition={{
                    pathLength: { duration: 1, delay: node.delay },
                    opacity: {
                      duration: isThinking ? 0.5 : 2,
                      repeat: Infinity,
                      delay: node.delay,
                    },
                  }}
                />
              );
            }
            return null;
          })
        )}

        {nodes.map((node, i) => (
          <motion.circle
            key={`node-${i}`}
            cx={node.x}
            cy={node.y}
            r={i < 24 ? 3 : 2}
            fill={accent}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: isThinking ? [0.5, 1, 0.5] : [0.4, 0.8, 0.4],
            }}
            transition={{
              scale: { duration: 0.5, delay: node.delay },
              opacity: {
                duration: isThinking ? 0.6 : 1.5,
                repeat: Infinity,
                delay: node.delay,
              },
            }}
          />
        ))}
      </svg>

      {/* Center core */}
      <motion.div
        className="absolute rounded-full shadow-lg"
        style={{
          left: brainSize * 0.4,
          top: brainSize * 0.4,
          width: brainSize * 0.2,
          height: brainSize * 0.2,
          background: accent,
          boxShadow: `0 0 ${brainSize * 0.15}px ${accentGlow}`,
        }}
        animate={{ scale: isThinking ? [1, 1.2, 1] : [1, 1.1, 1] }}
        transition={{ duration: isThinking ? 0.6 : 2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Orbiting particles */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`orbit-${i}`}
          className="absolute rounded-full"
          style={{
            left: brainSize / 2 - 4,
            top: brainSize / 2 - 4,
            width: 8,
            height: 8,
            background: `rgb(var(--accent) / 0.8)`,
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 8 - i * 2,
            repeat: Infinity,
            ease: "linear",
            delay: i * 0.5,
          }}
        >
          <div
            className="rounded-full"
            style={{
              width: 8,
              height: 8,
              background: accent,
              transform: `translateX(${brainSize * 0.35 - i * 15}px)`,
              boxShadow: `0 0 8px ${accentGlow}`,
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}
