"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getBobMotion, type BobState } from "./use-bob-motion";

interface BobNetworkProps {
  state: BobState;
  size: number;
}

interface Node {
  x: number;
  y: number;
  delay: number;
  layer: 0 | 1;
}

/**
 * Neural-mesh visualisation: outer + inner node clouds connected with lines
 * whose pathLength reveals on mount. Used for the Command Center variant
 * where a network feels more "operational" than the cinematic ring core.
 */
export function BobNetwork({ state, size }: BobNetworkProps) {
  const m = getBobMotion(state);
  const [nodes, setNodes] = useState<Node[]>([]);

  useEffect(() => {
    const out: Node[] = [];
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const radius = size * 0.3 + Math.random() * (size * 0.15);
      out.push({
        x: Math.cos(angle) * radius + size / 2,
        y: Math.sin(angle) * radius + size / 2,
        delay: Math.random() * 1.5,
        layer: 0,
      });
    }
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const radius = size * 0.16 + Math.random() * (size * 0.1);
      out.push({
        x: Math.cos(angle) * radius + size / 2,
        y: Math.sin(angle) * radius + size / 2,
        delay: Math.random() * 1.5,
        layer: 1,
      });
    }
    setNodes(out);
  }, [size]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="absolute inset-0 pointer-events-none"
      aria-hidden
    >
      {nodes.map((node, i) =>
        nodes.slice(i + 1).map((other, j) => {
          const distance = Math.sqrt(
            (node.x - other.x) ** 2 + (node.y - other.y) ** 2
          );
          if (distance >= size * 0.35) return null;
          return (
            <motion.line
              key={`line-${i}-${j}`}
              x1={node.x}
              y1={node.y}
              x2={other.x}
              y2={other.y}
              stroke="rgb(var(--accent))"
              strokeOpacity={0.3}
              strokeWidth={0.5}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: 1,
                opacity:
                  m.active
                    ? [0.18, 0.55, 0.18]
                    : [0.1, 0.3, 0.1],
              }}
              transition={{
                pathLength: { duration: 1, delay: node.delay },
                opacity: {
                  duration: m.active ? 0.6 : 2.2,
                  repeat: Infinity,
                  delay: node.delay,
                },
              }}
            />
          );
        })
      )}

      {nodes.map((node, i) => (
        <motion.circle
          key={`node-${i}`}
          cx={node.x}
          cy={node.y}
          r={node.layer === 0 ? 3 : 2}
          fill="rgb(var(--accent))"
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: 1,
            opacity: m.active ? [0.55, 1, 0.55] : [0.4, 0.85, 0.4],
          }}
          transition={{
            scale: { duration: 0.5, delay: node.delay },
            opacity: {
              duration: m.active ? 0.7 : 1.6,
              repeat: Infinity,
              delay: node.delay,
            },
          }}
        />
      ))}
    </svg>
  );
}
