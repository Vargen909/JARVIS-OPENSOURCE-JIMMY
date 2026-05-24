"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LAUNCHER_ITEMS, type LauncherAction } from "@/lib/launcher-items";
import { LauncherCard } from "@/components/launcher/launcher-card";
import { LauncherCoreCard } from "@/components/launcher/launcher-core-card";
import { LauncherToast } from "@/components/launcher/launcher-toast";
import type { ViewType } from "@/components/shell/app-chrome";

interface LauncherViewProps {
  onViewChange: (v: ViewType) => void;
  onOpenSettings: () => void;
  onOpenCustomize: () => void;
  onOpenWebView: (url: string) => void;
}

export function LauncherView({
  onViewChange,
  onOpenSettings,
  onOpenCustomize,
  onOpenWebView,
}: LauncherViewProps) {
  const [toastVisible, setToastVisible] = useState(false);
  const [toastLabel, setToastLabel] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((label: string) => {
    setToastLabel(label);
    setToastVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 2400);
  }, []);

  const handleAction = useCallback(
    (action: LauncherAction, label: string) => {
      switch (action.kind) {
        case "view":
          onViewChange(action.view);
          break;
        case "settings":
          onOpenSettings();
          break;
        case "customize":
          onOpenCustomize();
          break;
        case "webview":
          onOpenWebView(action.url);
          break;
        case "soon":
          showToast(label);
          break;
      }
    },
    [onViewChange, onOpenSettings, onOpenCustomize, onOpenWebView, showToast]
  );

  return (
    <div className="relative flex flex-col h-full w-full min-h-0 overflow-y-auto">
      {/* Ambient radial top glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% -5%, rgb(var(--accent-glow) / 0.07) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 flex-1 max-w-[1160px] mx-auto w-full px-5 sm:px-8 pt-8 pb-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 flex items-end justify-between"
        >
          <div>
            <p className="text-[9px] uppercase tracking-[0.28em] text-ink-mute/60 font-medium mb-1.5">
              B.O.B OS
            </p>
            <h1 className="text-[22px] font-light tracking-[-0.01em] text-ink leading-none">
              Workspace
            </h1>
          </div>
          <p className="text-[11px] text-ink-mute/50 pb-0.5 hidden sm:block tracking-wide">
            Välj ett område att arbeta i
          </p>
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0.6 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 h-px origin-left"
          style={{
            background:
              "linear-gradient(90deg, rgb(var(--accent)/0.18) 0%, rgb(var(--border)) 40%, transparent 80%)",
          }}
          aria-hidden
        />

        {/* Grid */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="grid gap-2.5"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 116px), 1fr))",
          }}
        >
          {LAUNCHER_ITEMS.map((item, i) =>
            item.variant === "core" ? (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                  duration: 0.38,
                  delay: 0.12 + i * 0.016,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <LauncherCoreCard
                  onClick={() => handleAction(item.action, item.label)}
                />
              </motion.div>
            ) : (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                  duration: 0.32,
                  delay: 0.12 + i * 0.016,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <LauncherCard
                  item={item}
                  onClick={() => handleAction(item.action, item.label)}
                />
              </motion.div>
            )
          )}
        </motion.div>
      </div>

      <LauncherToast visible={toastVisible} label={toastLabel} />
    </div>
  );
}
