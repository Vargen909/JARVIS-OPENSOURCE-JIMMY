"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, AlertTriangle, RefreshCw } from "lucide-react";
import { useJarvis } from "@/components/providers";
import { Onboarding } from "@/components/onboarding";
import { AppShell } from "@/components/app-shell";

export default function Home() {
  const { loading, info, users, refresh } = useJarvis();

  useEffect(() => {
    if (!loading && (!info || users.length === 0)) {
      const t = setTimeout(refresh, 1500);
      return () => clearTimeout(t);
    }
  }, [loading, info, users.length, refresh]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        {/* Ambient glow */}
        <div
          aria-hidden
          className="fixed inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 40%, rgb(var(--accent-glow) / 0.18) 0%, transparent 60%)",
          }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex flex-col items-center gap-5"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-accent/15 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-accent" />
            </div>
            {/* Pulsing ring */}
            <motion.div
              className="absolute -inset-2 rounded-3xl border border-accent/30"
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.2, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          <div className="text-center">
            <h1 className="text-xl font-semibold">Jarvis</h1>
            <p className="text-sm text-ink-dim mt-1">Starting up…</p>
          </div>

          {/* Thinking dots */}
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="dot-pulse text-accent"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Backend offline ───────────────────────────────────────────────────────
  if (!info) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel p-8 max-w-md w-full text-center space-y-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-400/10 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Can&apos;t reach Jarvis</h1>
            <p className="text-ink-dim text-sm mt-2 leading-relaxed">
              Make sure the backend is running at{" "}
              <code className="text-accent font-mono text-xs">
                {process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8765"}
              </code>
            </p>
          </div>
          <div className="space-y-2">
            <button
              className="btn-primary w-full justify-center gap-2"
              onClick={() => void refresh()}
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
            <p className="text-[11px] text-ink-mute">
              Run{" "}
              <code className="text-accent font-mono">
                .\scripts\start-backend.ps1
              </code>{" "}
              to start the backend.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Onboarding ───────────────────────────────────────────────────────────
  if (users.length === 0 || info.needs_onboarding) {
    return <Onboarding />;
  }

  // ── Main app ──────────────────────────────────────────────────────────────
  return <AppShell />;
}
