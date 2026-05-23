"use client";

import { useState } from "react";
import { Modal } from "./ui/modal";
import { useJarvis } from "./providers";
import { Select } from "./ui/select";
import { api } from "@/lib/api";
import { MODES, PERFORMANCE_MODES, SECURITY_LEVELS } from "@/lib/utils";
import { FileText } from "lucide-react";
import { ApiKeysPanel } from "./api-keys-panel";

export function SettingsDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { activeUser, engines, refresh } = useJarvis();
  const [briefing, setBriefing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!activeUser) return null;

  const update = async (patch: Record<string, unknown>) => {
    await api.updateUser(activeUser.id, patch);
    refresh();
  };

  const generateBriefing = async () => {
    setBusy(true);
    setBriefing(null);
    try {
      const res = await api.briefing(activeUser.id);
      setBriefing(res.briefing);
    } catch (e: unknown) {
      setBriefing(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Settings" wide>
      <div className="grid sm:grid-cols-2 gap-6">
        <Section title="Identity">
          <Field label="Profile name">
            <input
              className="input"
              value={activeUser.name}
              onChange={(e) => update({ name: e.target.value })}
            />
          </Field>
          <Field label="Language">
            <Select
              value={activeUser.language}
              onChange={(v) => update({ language: v })}
              options={[
                { value: "auto", label: "Auto-detect" },
                { value: "sv", label: "Svenska" },
                { value: "en", label: "English" },
                { value: "es", label: "Español" },
                { value: "fr", label: "Français" },
                { value: "de", label: "Deutsch" },
              ]}
            />
          </Field>
          <Field label="Role">
            <div className="chip capitalize">{activeUser.role}</div>
          </Field>
        </Section>

        <Section title="Operating">
          <Field label="Operating mode">
            <Select
              value={activeUser.operating_mode}
              onChange={(v) => update({ operating_mode: v })}
              options={MODES.map((m) => ({
                value: m.id,
                label: `${m.emoji} ${m.label}`,
              }))}
            />
          </Field>
          <Field label="Performance">
            <Select
              value={activeUser.performance_mode}
              onChange={(v) => update({ performance_mode: v })}
              options={PERFORMANCE_MODES.map((m) => ({
                value: m.id,
                label: `${m.emoji} ${m.label}`,
              }))}
            />
          </Field>
          <Field label="Security">
            <Select
              value={activeUser.security}
              onChange={(v) => update({ security: v })}
              options={SECURITY_LEVELS.map((m) => ({
                value: m.id,
                label: `${m.emoji} ${m.label}`,
              }))}
            />
          </Field>
        </Section>

        <Section title="AI Engine">
          <Field label="Preferred engine">
            <Select
              value={activeUser.preferred_engine}
              onChange={(v) => update({ preferred_engine: v })}
              options={engines.map((e) => ({
                value: e.id,
                label: `${e.label}${e.available ? "" : "  (no key)"}`,
              }))}
            />
          </Field>
          <Field label="Model">
            <Select
              value={activeUser.preferred_model || ""}
              onChange={(v) => update({ preferred_model: v })}
              options={[
                { value: "", label: "Engine default" },
                ...(
                  engines.find((e) => e.id === activeUser.preferred_engine)
                    ?.models || []
                ).map((m) => ({
                  value: m.id,
                  label: m.installed === false ? `${m.label} (ej installerad)` : m.label,
                })),
              ]}
            />
          </Field>
          {(() => {
            const cur = engines.find((e) => e.id === activeUser.preferred_engine);
            const curModel = cur?.models.find(
              (m) => m.id === (activeUser.preferred_model || cur?.default_model)
            );
            return curModel?.good_for ? (
              <div className="rounded-xl border border-accent/20 bg-accent/5 p-3 text-xs text-ink-dim">
                <b className="text-ink">Bra för:</b> {curModel.good_for}
              </div>
            ) : null;
          })()}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-xs text-ink-dim space-y-2">
            {engines.map((e) => (
              <div key={e.id}>
                <div className="flex items-center justify-between">
                  <span>
                    <span className="font-medium text-ink">{e.label}</span>{" "}
                    <span className="text-ink-mute">
                      {e.privacy === "local" ? "local" : "cloud"}
                    </span>
                  </span>
                  <span
                    className={`chip ${
                      e.available
                        ? "text-emerald-300 bg-emerald-400/10 border-emerald-400/20"
                        : "text-ink-mute"
                    }`}
                  >
                    {e.available ? "ready" : "needs key"}
                  </span>
                </div>
                {e.good_for && (
                  <p className="text-[11px] text-ink-mute mt-0.5">{e.good_for}</p>
                )}
              </div>
            ))}
          </div>
        </Section>

        <Section title="API Keys">
          <ApiKeysPanel />
        </Section>

        <Section title="Daily Briefing">
          <button
            onClick={generateBriefing}
            disabled={busy}
            className="btn-ghost"
          >
            <FileText className="w-4 h-4" />
            {busy ? "Generating…" : "Generate today's briefing"}
          </button>
          {briefing && (
            <div className="mt-3 rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-sm whitespace-pre-wrap">
              {briefing}
            </div>
          )}
        </Section>
      </div>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-[11px] uppercase tracking-wider text-ink-mute">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-ink-dim">{label}</label>
      {children}
    </div>
  );
}
