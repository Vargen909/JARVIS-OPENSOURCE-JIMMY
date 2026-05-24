"use client";

import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { ChevronDown, Cloud, Cpu, Check, Info } from "lucide-react";
import { useJarvis } from "../providers";
import type { EngineInfo, ModelInfo } from "@/lib/types";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export function EnginePicker() {
  const { activeUser, engines, refresh } = useJarvis();
  const [open, setOpen] = useState(false);
  const [selectedEngineId, setSelectedEngineId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: globalThis.MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  useEffect(() => {
    if (open) setSelectedEngineId(activeUser?.preferred_engine ?? null);
  }, [open, activeUser?.preferred_engine]);

  if (!activeUser) return null;

  const currentEngine = engines.find((e) => e.id === activeUser.preferred_engine);
  const currentModelId = activeUser.preferred_model || currentEngine?.default_model || "";
  const currentModel =
    currentEngine?.models.find((m) => m.id === currentModelId) ||
    currentEngine?.models[0];

  const selectedEngine = selectedEngineId
    ? engines.find((e) => e.id === selectedEngineId)
    : currentEngine;

  const selectEngine = async (engine: EngineInfo) => {
    const firstInstalled = engine.models.find((m) => m.installed !== false);
    const nextModel = firstInstalled?.id || engine.default_model || "";
    setSelectedEngineId(engine.id);
    setSaving(true);
    try {
      await api.updateUser(activeUser.id, {
        preferred_engine: engine.id,
        preferred_model: nextModel,
      });
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleEngineMouseDown = (
    event: ReactMouseEvent<HTMLButtonElement>,
    engine: EngineInfo
  ) => {
    event.preventDefault();
    event.stopPropagation();
    void selectEngine(engine);
  };

  const selectModel = async (engine: EngineInfo, model: ModelInfo) => {
    if (engine.id === "ollama" && model.installed === false) return;
    setSaving(true);
    try {
      await api.updateUser(activeUser.id, {
        preferred_engine: engine.id,
        preferred_model: model.id,
      });
      await refresh();
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleModelMouseDown = (
    event: ReactMouseEvent<HTMLButtonElement>,
    engine: EngineInfo,
    model: ModelInfo
  ) => {
    event.preventDefault();
    event.stopPropagation();
    void selectModel(engine, model);
  };

  const ollamaEngine = engines.find((e) => e.id === "ollama");

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl bg-bg-soft/80 border border-white/[0.06] px-3 py-2 text-sm hover:bg-white/[0.05] transition-colors min-w-0"
      >
        {currentEngine?.privacy === "local" ? (
          <Cpu className="w-4 h-4 text-emerald-400 shrink-0" />
        ) : (
          <Cloud className="w-4 h-4 text-accent shrink-0" />
        )}
        <div className="flex flex-col items-start min-w-0">
          <span className="text-xs text-ink-mute leading-tight truncate max-w-[120px]">
            {currentEngine?.label || "Välj motor"}
          </span>
          <span className="font-medium leading-tight truncate max-w-[120px]">
            {currentModel?.label || currentModelId || "—"}
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-ink-mute shrink-0" />
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-0 z-30 panel-strong overflow-hidden animate-fade-in w-[min(560px,calc(100vw-2rem))]">
          {ollamaEngine && (
            <div className="border-b border-white/[0.06] bg-emerald-400/[0.04] px-3 py-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-medium text-emerald-300 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" />
                  Snabbval: Ollama lokal
                </div>
                <div className="text-[11px] text-ink-mute truncate">
                  {ollamaEngine.available
                    ? "Klicka här för att byta till installerad Ollama-modell."
                    : "Ollama är inte aktivt. Starta Ollama först."}
                </div>
              </div>
              <button
                type="button"
                disabled={saving || !ollamaEngine.available}
                onMouseDown={(event) => handleEngineMouseDown(event, ollamaEngine)}
                className="btn-ghost shrink-0 text-xs border-emerald-400/20 text-emerald-300 hover:bg-emerald-400/10"
              >
                Använd Ollama
              </button>
            </div>
          )}
          <div className="grid grid-cols-[180px_1fr]">
            <div className="border-r border-white/[0.06] bg-bg-soft/40 max-h-[440px] overflow-y-auto">
              <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-ink-mute">
                Klicka för att välja motor
              </div>
              {engines.map((e) => {
                const isActive = e.id === activeUser.preferred_engine;
                const isSelected = e.id === selectedEngine?.id;
                return (
                  <button
                    key={e.id}
                    type="button"
                    disabled={saving}
                    onMouseDown={(event) => handleEngineMouseDown(event, e)}
                    className={cn(
                      "w-full text-left flex items-center gap-2 px-3 py-2.5 text-sm transition-colors",
                      isSelected
                        ? "bg-accent/10 text-ink"
                        : "text-ink-dim hover:bg-white/[0.04]"
                    )}
                  >
                    {e.privacy === "local" ? (
                      <Cpu className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <Cloud className="w-3.5 h-3.5 text-accent shrink-0" />
                    )}
                    <span className="flex-1 truncate">{e.label}</span>
                    {!e.available && (
                      <span
                        className="text-[10px] text-ink-mute"
                        title={e.requires_key ? "Saknar API-nyckel" : "Inte tillgänglig"}
                      >
                        {e.requires_key ? "väljbar" : "off"}
                      </span>
                    )}
                    {isActive && (
                      <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="max-h-[440px] overflow-y-auto">
              {selectedEngine ? (
                <>
                  <div className="px-4 pt-3 pb-2 border-b border-white/[0.06] sticky top-0 bg-bg-card/95 backdrop-blur z-10">
                    <div className="flex items-center gap-2">
                      {selectedEngine.privacy === "local" ? (
                        <span className="chip text-emerald-300 border-emerald-400/30 bg-emerald-400/10">
                          <Cpu className="w-3 h-3" /> Lokal
                        </span>
                      ) : (
                        <span className="chip text-accent border-accent/30 bg-accent/10">
                          <Cloud className="w-3 h-3" /> Moln
                        </span>
                      )}
                      <h3 className="font-semibold">{selectedEngine.label}</h3>
                      {selectedEngine.id === activeUser.preferred_engine && (
                        <span className="chip text-[10px] text-accent border-accent/30 bg-accent/10">
                          vald
                        </span>
                      )}
                    </div>
                    {selectedEngine.description && (
                      <p className="text-xs text-ink-dim mt-1.5">{selectedEngine.description}</p>
                    )}
                    {selectedEngine.good_for && (
                      <p className="text-[11px] text-ink-mute mt-1 flex items-start gap-1">
                        <Info className="w-3 h-3 mt-0.5 shrink-0" />
                        <span>
                          <b className="text-ink-dim">Bra för:</b> {selectedEngine.good_for}
                        </span>
                      </p>
                    )}
                    {!selectedEngine.available && selectedEngine.requires_key && (
                      <p className="text-[11px] text-amber-300 mt-2">
                        Du kan välja modell nu. Lägg till API-nyckel i Settings
                        för att kunna chatta med den.
                      </p>
                    )}
                    {!selectedEngine.available && !selectedEngine.requires_key && selectedEngine.id === "ollama" && (
                      <p className="text-[11px] text-amber-300 mt-2">
                        Starta Ollama med <code>ollama serve</code> och kör{" "}
                        <code>ollama pull llama3.2</code>.
                      </p>
                    )}
                  </div>

                  <div className="p-2">
                    <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-ink-mute">
                      Modeller
                    </div>
                    {selectedEngine.models.length === 0 && (
                      <div className="px-3 py-2 text-xs text-ink-mute">
                        Inga modeller tillgängliga.
                      </div>
                    )}
                    {selectedEngine.models.map((m) => {
                      const isSelectedActiveEngine = selectedEngine.id === activeUser.preferred_engine;
                      const isSelected =
                        isSelectedActiveEngine && m.id === currentModelId;
                      const dim = selectedEngine.id === "ollama" && m.installed === false;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          disabled={saving || dim}
                          onMouseDown={(event) =>
                            handleModelMouseDown(event, selectedEngine, m)
                          }
                          className={cn(
                            "w-full text-left rounded-lg px-3 py-2.5 text-sm transition-colors flex items-start gap-2",
                            isSelected
                              ? "bg-accent/15 text-ink"
                              : "hover:bg-white/[0.04] text-ink-dim",
                            dim && "opacity-50"
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-ink truncate">
                                {m.label}
                              </span>
                              {selectedEngine.id === "ollama" && dim && (
                                <span className="chip text-[9px] text-ink-mute">
                                  ej installerad
                                </span>
                              )}
                              {selectedEngine.default_model === m.id && (
                                <span className="chip text-[9px] text-ink-mute">
                                  standard
                                </span>
                              )}
                            </div>
                            {m.good_for && (
                              <p className="text-[11px] text-ink-mute mt-0.5 line-clamp-2">
                                {m.good_for}
                              </p>
                            )}
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                          )}
                        </button>
                      );
                    })}
                    {selectedEngine.id === "ollama" && (
                      <div className="mt-2 px-3 py-2 text-[11px] text-ink-mute border-t border-white/[0.04]">
                        Saknar du en modell? Kör{" "}
                        <code className="text-ink-dim">ollama pull &lt;namn&gt;</code>{" "}
                        i terminalen.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="p-6 text-sm text-ink-mute">Välj en motor.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
