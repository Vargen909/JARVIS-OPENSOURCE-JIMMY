"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useJarvis } from "@/components/providers";
import { Onboarding } from "@/components/onboarding";
import { AppShell } from "@/components/app-shell";
import { BobCore } from "@/components/bob/bob-core";
import { API_BASE } from "@/lib/api";
import { backendPort } from "@/lib/chat-errors";

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
      <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-background">
        <div
          aria-hidden
          className="fixed inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 40%, rgb(var(--accent-glow) / 0.18) 0%, transparent 60%)",
          }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 flex flex-col items-center gap-6"
        >
          <BobCore variant="cinematic" size={200} state="processing" label="B.O.B" />
          <div className="text-center">
            <h1 className="t-h2">B.O.B</h1>
            <p className="text-sm text-ink-dim mt-1">Starting up…</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Backend offline - Show demo ───────────────────────────────────────────
  if (!info) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel p-8 max-w-2xl w-full space-y-6"
        >
          <div className="text-center space-y-2">
            <h1 className="t-h1">Welcome to B.O.B</h1>
            <p className="text-ink-dim">Backend Orchestration Bot</p>
          </div>

          <div className="bg-amber-400/10 border border-amber-400/20 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-600">Backend is not running</p>
                <p className="text-xs text-ink-mute mt-1">
                  To see the full application, start the Python backend.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="font-semibold text-sm">How to start the backend:</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex gap-3">
                <span className="text-accent font-mono">1.</span>
                <span>Navigate to the project root</span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-mono">2.</span>
                <span>Run: <code className="bg-ink-mute/10 px-2 py-1 rounded text-xs font-mono">cd backend && python -m bob.main</code></span>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-mono">3.</span>
                <span>Return here and click Retry</span>
              </li>
            </ul>
          </div>

          <button
            className="btn-primary w-full justify-center gap-2"
            onClick={() => refresh()}
          >
            <RefreshCw className="w-4 h-4" />
            Retry Connection
          </button>

          <div className="text-xs text-ink-mute text-center pt-4 border-t border-ink-mute/20">
            <p>Frontend is running on port 3000 | Backend expected on port {backendPort()}</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Onboarding ───────────────────────────────────────────────────────────
  if (users.length === 0 || info.needs_onboarding) {
    return <Onboarding />;
  }

  return <AppShell />;
}
