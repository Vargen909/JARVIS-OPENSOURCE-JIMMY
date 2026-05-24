"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Clock,
  Plug,
  FileText,
  ChevronRight,
  Sparkles,
  Zap,
} from "lucide-react";
import { useJarvis } from "@/components/providers";
import { cn } from "@/lib/utils";

const DEMO_TASKS = [
  { id: "1", title: "Research market trends", status: "in-progress" as const, progress: 65 },
  { id: "2", title: "Draft presentation", status: "pending" as const, progress: 0 },
  { id: "3", title: "Review documents", status: "completed" as const, progress: 100 },
];

const DEMO_ACTIVITY = [
  { id: "1", action: "Generated report", time: "2 min ago" },
  { id: "2", action: "Analyzed document", time: "15 min ago" },
  { id: "3", action: "Created summary", time: "1 hour ago" },
];

const DEMO_PLUGINS = [
  { id: "1", name: "Code Assistant", enabled: true },
  { id: "2", name: "Data Analyzer", enabled: true },
  { id: "3", name: "Email Composer", enabled: false },
];

function TaskIcon({ status }: { status: string }) {
  if (status === "completed")
    return <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />;
  if (status === "in-progress")
    return <Clock className="h-4 w-4 text-amber-400 animate-pulse shrink-0" />;
  return <Circle className="h-4 w-4 text-ink-mute shrink-0" />;
}

export function DashboardStatusRail({ isCompact = false }: { isCompact?: boolean }) {
  const { engines, activeUser } = useJarvis();

  const currentEngine = engines.find((e) => e.id === activeUser?.preferred_engine);
  const currentModelId =
    activeUser?.preferred_model || currentEngine?.default_model || "";
  const currentModel =
    currentEngine?.models.find((m) => m.id === currentModelId) ||
    currentEngine?.models[0];

  if (isCompact) {
    return (
      <motion.aside
        initial={{ x: 16, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-14 h-full flex flex-col items-center py-4 gap-3 border-l border-white/[0.06] bg-bg-card/30 backdrop-blur-xl shrink-0"
      >
        <CheckCircle2 className="h-5 w-5 text-ink-mute" />
        <Sparkles className="h-5 w-5 text-accent" />
        <Plug className="h-5 w-5 text-ink-mute" />
      </motion.aside>
    );
  }

  return (
    <motion.aside
      initial={{ x: 16, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-72 h-full flex flex-col border-l border-white/[0.06] bg-bg-card/30 backdrop-blur-xl shrink-0 overflow-y-auto"
    >
      <div className="p-4 space-y-6">
        {/* Active tasks — UI only */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="section-label">Active Tasks</h3>
            <span className="chip text-[10px] py-0.5">UI only</span>
          </div>
          <div className="space-y-2">
            {DEMO_TASKS.map((task) => (
              <div
                key={task.id}
                className={cn(
                  "panel p-3",
                  task.status === "completed" && "opacity-60"
                )}
              >
                <div className="flex items-start gap-2">
                  <TaskIcon status={task.status} />
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm truncate",
                        task.status === "completed" && "line-through text-ink-mute"
                      )}
                    >
                      {task.title}
                    </p>
                    {task.status === "in-progress" && (
                      <div className="mt-2 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full bg-accent/80 rounded-full transition-all"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* AI Engines — real */}
        <section>
          <h3 className="section-label mb-3">AI Engines</h3>
          <div className="space-y-2">
            {engines.map((engine) => {
              const isPreferred = engine.id === activeUser?.preferred_engine;
              return (
                <div
                  key={engine.id}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors",
                    isPreferred
                      ? "bg-accent/10 border-accent/25"
                      : "bg-white/[0.02] border-white/[0.04]"
                  )}
                >
                  <div
                    className={cn(
                      "p-1.5 rounded-lg",
                      engine.available ? "bg-accent/20" : "bg-white/[0.04]"
                    )}
                  >
                    {isPreferred ? (
                      <Sparkles className="h-4 w-4 text-accent" />
                    ) : (
                      <Zap className="h-4 w-4 text-ink-mute" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{engine.label}</p>
                    {isPreferred && currentModel && (
                      <p className="text-[10px] text-ink-mute truncate">
                        {currentModel.label || currentModel.id}
                      </p>
                    )}
                  </div>
                  <div
                    className={engine.available ? "status-active" : "status-offline"}
                  />
                </div>
              );
            })}
          </div>
        </section>

        {/* System status — UI only */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="section-label">System Status</h3>
            <span className="chip text-[10px] py-0.5">UI only</span>
          </div>
          <div className="panel p-4 space-y-3">
            {[
              { label: "Backend", value: "Online", pct: 100 },
              { label: "Memory sync", value: "Ready", pct: 85 },
              { label: "Session", value: "Active", pct: 72 },
            ].map((row) => (
              <div key={row.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-ink-dim">{row.label}</span>
                  <span className="text-ink">{row.value}</span>
                </div>
                <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent-soft to-accent-glow rounded-full"
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Plugins — UI only */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="section-label">Plugins</h3>
            <span className="chip text-[10px] py-0.5">UI only</span>
          </div>
          <div className="space-y-2">
            {DEMO_PLUGINS.map((plugin) => (
              <div
                key={plugin.id}
                className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.02]"
              >
                <Plug
                  className={cn(
                    "h-4 w-4",
                    plugin.enabled ? "text-accent" : "text-ink-mute"
                  )}
                />
                <span className="flex-1 text-sm">{plugin.name}</span>
                <div
                  className={cn(
                    "w-8 h-4 rounded-full p-0.5",
                    plugin.enabled ? "bg-accent" : "bg-white/[0.08]"
                  )}
                >
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full bg-white transition-transform",
                      plugin.enabled && "translate-x-4"
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent activity — UI only */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="section-label">Recent Activity</h3>
            <span className="chip text-[10px] py-0.5">UI only</span>
          </div>
          <div className="space-y-1">
            {DEMO_ACTIVITY.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/[0.03] transition-colors"
              >
                <FileText className="h-4 w-4 text-ink-mute shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{a.action}</p>
                  <p className="text-[10px] text-ink-mute">{a.time}</p>
                </div>
                <ChevronRight className="h-3 w-3 text-ink-mute" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </motion.aside>
  );
}
