"use client";

import { useEffect } from "react";
import { Check, RotateCcw, Save } from "lucide-react";
import { Modal } from "./ui/modal";
import { useLayout } from "@/lib/use-layout-store";
import { LAYOUT_PRESETS, type LayoutId, type LayoutPanels } from "@/lib/layouts";
import { PALETTES, type PaletteId } from "@/lib/palettes";
import { cn } from "@/lib/utils";

const PANEL_LABELS: { key: keyof LayoutPanels; label: string }[] = [
  { key: "neuralCore", label: "Neural Core" },
  { key: "systemStatus", label: "Systemstatus" },
  { key: "activityFeed", label: "Aktivitetsflöde" },
  { key: "tasksStrip", label: "Uppgifter" },
  { key: "quickActions", label: "Snabbåtkomst" },
];

function MiniLayoutPreview({ panels }: { panels: LayoutPanels }) {
  return (
    <div className="grid grid-cols-3 grid-rows-2 gap-0.5 w-10 h-7 rounded border border-white/10 p-0.5 bg-bg-soft/50">
      <div
        className={cn(
          "col-span-1 row-span-2 rounded-sm",
          panels.neuralCore ? "bg-accent/60" : "bg-white/5"
        )}
      />
      <div
        className={cn(
          "rounded-sm",
          panels.systemStatus || panels.activityFeed ? "bg-accent/30" : "bg-white/5"
        )}
      />
      <div
        className={cn(
          "rounded-sm",
          panels.tasksStrip ? "bg-accent/30" : "bg-white/5"
        )}
      />
      <div
        className={cn(
          "rounded-sm",
          panels.quickActions ? "bg-accent/20" : "bg-white/5"
        )}
      />
    </div>
  );
}

export function CustomizeLayout({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { state, dispatch, commit, revert, snapshot } = useLayout();

  useEffect(() => {
    if (open) snapshot();
  }, [open, snapshot]);

  const handleClose = () => {
    revert();
    onClose();
  };

  const handleSave = () => {
    commit();
    onClose();
  };

  const handleResetPreset = () => {
    dispatch({ type: "RESET_PRESET" });
  };

  const handleResetAll = () => {
    dispatch({ type: "RESET_ALL" });
  };

  return (
    <Modal open={open} onClose={handleClose} title="Anpassa layout" wide>
      <div className="space-y-8">
        <section>
          <h3 className="text-xs uppercase tracking-wider text-ink-mute mb-3">
            Layoutmall
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {LAYOUT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() =>
                  dispatch({ type: "SET_LAYOUT", layoutId: preset.id as LayoutId })
                }
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-3 text-left transition-all",
                  state.layoutId === preset.id
                    ? "border-accent bg-accent/10"
                    : "border-white/[0.06] hover:bg-white/[0.04]"
                )}
              >
                <MiniLayoutPreview panels={preset.panels} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium flex items-center gap-1">
                    {preset.label}
                    {state.layoutId === preset.id && (
                      <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-ink-mute mt-0.5 line-clamp-2">
                    {preset.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-xs uppercase tracking-wider text-ink-mute mb-3">
            Färgpalett
          </h3>
          <div className="flex flex-wrap gap-3">
            {PALETTES.map((p) => (
              <button
                key={p.id}
                type="button"
                title={p.label}
                onClick={() =>
                  dispatch({ type: "SET_PALETTE", paletteId: p.id as PaletteId })
                }
                className={cn(
                  "flex flex-col items-center gap-1.5 group",
                )}
              >
                <span
                  className={cn(
                    "w-10 h-10 rounded-full border-2 transition-all",
                    state.paletteId === p.id
                      ? "border-accent scale-110 shadow-glow"
                      : "border-white/20 group-hover:border-white/40"
                  )}
                  style={{ backgroundColor: p.swatch }}
                />
                <span className="text-[10px] text-ink-mute">{p.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-xs uppercase tracking-wider text-ink-mute mb-3">
            Paneler
          </h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {PANEL_LABELS.map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center justify-between rounded-xl border border-white/[0.06] px-4 py-3 cursor-pointer hover:bg-white/[0.03]"
              >
                <span className="text-sm">{label}</span>
                <input
                  type="checkbox"
                  checked={state.panels[key]}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_PANEL",
                      key,
                      value: e.target.checked,
                    })
                  }
                  className="accent-accent w-4 h-4"
                />
              </label>
            ))}
          </div>
        </section>

        <section className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center justify-between text-sm mb-2">
              <span>Kompakt läge</span>
              <input
                type="checkbox"
                checked={state.compactMode}
                onChange={(e) =>
                  dispatch({ type: "SET_COMPACT", compactMode: e.target.checked })
                }
                className="accent-accent w-4 h-4"
              />
            </label>
          </div>
          <div>
            <label className="text-sm text-ink-dim block mb-2">
              Glödintensitet ({Math.round(state.glowIntensity * 100)}%)
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={state.glowIntensity * 100}
              onChange={(e) =>
                dispatch({
                  type: "SET_GLOW",
                  glowIntensity: Number(e.target.value) / 100,
                })
              }
              className="w-full accent-accent"
            />
          </div>
          <div className="sm:col-span-2">
            <span className="text-sm text-ink-dim block mb-2">Neural core storlek</span>
            <div className="flex gap-2">
              {(["sm", "md", "lg"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => dispatch({ type: "SET_BRAIN_SIZE", brainSize: s })}
                  className={cn(
                    "btn-ghost flex-1 capitalize",
                    state.brainSize === s && "border-accent bg-accent/10 text-accent"
                  )}
                >
                  {s === "sm" ? "Liten" : s === "md" ? "Medium" : "Stor"}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/[0.06]">
          <button type="button" className="btn-ghost text-sm" onClick={handleResetPreset}>
            <RotateCcw className="w-4 h-4" />
            Återställ mall
          </button>
          <div className="flex gap-2">
            <button type="button" className="btn-ghost text-sm" onClick={handleResetAll}>
              Standard
            </button>
            <button type="button" className="btn-primary text-sm" onClick={handleSave}>
              <Save className="w-4 h-4" />
              Spara layout
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
