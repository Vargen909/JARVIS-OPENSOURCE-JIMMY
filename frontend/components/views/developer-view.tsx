"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Code,
  Zap,
  Key,
  CheckCircle,
  XCircle,
  Terminal,
  RefreshCw,
} from "lucide-react";
import { useJarvis } from "@/components/providers";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ApiKeyEntry {
  env_name: string;
  engine_id: string;
  label: string;
  configured: boolean;
  masked?: string | null;
}

const DEMO_TOOLS = [
  "Code Agent",
  "Web Search",
  "File Analyzer",
  "Image Generator",
  "SQL Runner",
  "API Tester",
];

/**
 * Developer view — real engine status and API key health (via backend),
 * plus UI-only tool cards marked clearly.
 */
export function DeveloperView() {
  const { engines, refresh } = useJarvis();
  const [apiKeys, setApiKeys] = useState<ApiKeyEntry[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [reloading, setReloading] = useState(false);

  const loadKeys = async () => {
    setLoadingKeys(true);
    try {
      const keys = await api.apiKeys();
      setApiKeys(keys);
    } catch {
      /* non-fatal */
    } finally {
      setLoadingKeys(false);
    }
  };

  useEffect(() => {
    void loadKeys();
  }, []);

  const handleReload = async () => {
    setReloading(true);
    try {
      await api.reloadSettings();
      await refresh();
      await loadKeys();
    } finally {
      setReloading(false);
    }
  };

  const activeEngines = engines.filter((e) => e.available);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="view-header justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="icon-badge">
              <Code className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Developer</h1>
              <p className="text-sm text-ink-dim mt-0.5">
                Engine status, API health, and system diagnostics
              </p>
            </div>
          </div>
          <button
            className="btn-ghost"
            onClick={() => void handleReload()}
            disabled={reloading}
            title="Reload config"
          >
            <RefreshCw className={cn("w-4 h-4", reloading && "animate-spin")} />
            <span className="hidden sm:inline">Reload</span>
          </button>
        </motion.div>

        <div className="space-y-4">
          {/* AI Engines — real data */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="panel p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-accent" />
              <span className="font-medium">AI Engines</span>
              <span className="chip ml-auto">
                {activeEngines.length}/{engines.length} active
              </span>
            </div>
            <div className="space-y-2">
              {engines.map((engine) => (
                <div
                  key={engine.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors"
                >
                  <div
                    className={
                      engine.available ? "status-active" : "status-offline"
                    }
                  />
                  <span className="flex-1 text-sm font-medium">{engine.label}</span>
                  <span className="text-xs text-ink-mute font-mono">
                    {engine.models.length} model{engine.models.length !== 1 ? "s" : ""}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      engine.available ? "text-emerald-400" : "text-ink-mute"
                    )}
                  >
                    {engine.available ? "Active" : "Offline"}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* API Keys — real data */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="panel p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-4 h-4 text-accent" />
              <span className="font-medium">API Keys</span>
              {!loadingKeys && (
                <span className="chip ml-auto">
                  {apiKeys.filter((k) => k.configured).length}/{apiKeys.length} set
                </span>
              )}
            </div>

            {loadingKeys ? (
              <div className="flex items-center gap-2 text-ink-mute text-sm">
                <span className="dot-pulse text-accent" />
                Loading…
              </div>
            ) : apiKeys.length === 0 ? (
              <p className="text-sm text-ink-mute">No API key slots configured.</p>
            ) : (
              <div className="space-y-2">
                {apiKeys.map((key) => (
                  <div
                    key={key.env_name}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                  >
                    {key.configured ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-ink-mute shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">{key.label}</span>
                      {key.masked && (
                        <span className="text-xs text-ink-mute font-mono ml-2">
                          {key.masked}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-ink-mute">
                      {key.env_name}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-medium",
                        key.configured ? "text-emerald-400" : "text-ink-mute"
                      )}
                    >
                      {key.configured ? "Set" : "Missing"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Dev Tools — UI-only placeholders */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="panel p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Terminal className="w-4 h-4 text-accent" />
              <span className="font-medium">Dev Tools</span>
              <span className="chip text-amber-400 border-amber-400/30 bg-amber-400/10 ml-auto">
                UI only
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DEMO_TOOLS.map((tool) => (
                <div
                  key={tool}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-ink-dim cursor-default hover:bg-white/[0.04] transition-colors select-none"
                >
                  {tool}
                </div>
              ))}
            </div>
            <p className="text-xs text-ink-mute mt-3 leading-relaxed">
              These tools will connect to real agent capabilities in a future update.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
