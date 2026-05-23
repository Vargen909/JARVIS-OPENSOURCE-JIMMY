"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, ChevronRight, Sparkles } from "lucide-react";
import { useJarvis } from "./providers";
import { api } from "@/lib/api";
import { Select } from "./ui/select";
import { SECURITY_LEVELS } from "@/lib/utils";

const STEPS = [
  "language",
  "name",
  "profile",
  "security",
  "engine",
  "finish",
] as const;
type StepId = (typeof STEPS)[number];

const LANGS = [
  { value: "auto", label: "Auto-detect" },
  { value: "sv", label: "Svenska" },
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
];

export function Onboarding() {
  const { engines, refresh, setActiveUserId } = useJarvis();
  const [step, setStep] = useState<StepId>("language");

  const [language, setLanguage] = useState("auto");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [city, setCity] = useState("");
  const [work, setWork] = useState("");
  const [interests, setInterests] = useState("");
  const [goals, setGoals] = useState("");
  const [security, setSecurity] = useState<"strict" | "balanced" | "relaxed">(
    "balanced"
  );
  const [engineId, setEngineId] = useState<string>(
    engines.find((e) => e.available)?.id || engines[0]?.id || "ollama"
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const idx = STEPS.indexOf(step);
  const next = () => setStep(STEPS[Math.min(idx + 1, STEPS.length - 1)]);
  const back = () => setStep(STEPS[Math.max(idx - 1, 0)]);

  const engineOpts = useMemo(
    () =>
      engines.map((e) => ({
        value: e.id,
        label: `${e.label}${e.available ? "" : "  (no key)"}${
          e.privacy === "local" ? "  · local" : ""
        }`,
      })),
    [engines]
  );

  const finish = async () => {
    setBusy(true);
    setErr(null);
    try {
      const user = await api.createUser({
        name: name.trim() || "Admin",
        role: "admin",
        language,
        security,
      });
      await api.updateUser(user.id, {
        preferred_engine: engineId,
        operating_mode: "personal",
        onboarded: true,
        profile: {
          age: age ? Number(age) : undefined,
          city: city || undefined,
          work: work || undefined,
          goals: goals || undefined,
          interests: interests
            ? interests.split(",").map((s) => s.trim()).filter(Boolean)
            : undefined,
        },
      });
      setActiveUserId(user.id);
      await refresh();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        className="panel w-full max-w-2xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="px-8 pt-8 pb-2 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Welcome to Jarvis</h1>
            <p className="text-ink-dim text-sm">
              Let's set up your personal AI assistant.
            </p>
          </div>
        </div>

        <div className="px-8 pt-4">
          <div className="flex gap-1.5">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= idx ? "bg-accent" : "bg-white/[0.06]"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="px-8 py-8 min-h-[320px]">
          {step === "language" && (
            <Step
              title="Pick your language"
              hint="Jarvis auto-detects, but you can lock a default."
            >
              <Select value={language} onChange={setLanguage} options={LANGS} />
            </Step>
          )}

          {step === "name" && (
            <Step
              title="What's your name?"
              hint="This profile is the admin and can manage everyone else later."
            >
              <input
                className="input"
                placeholder="e.g. Jimmy"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </Step>
          )}

          {step === "profile" && (
            <Step
              title="Tell Jarvis about you"
              hint="Optional. Used only to make answers personal. Stored locally and encrypted."
            >
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="input"
                  placeholder="Age"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
                <input
                  className="input"
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
                <input
                  className="input col-span-2"
                  placeholder="Work / Role"
                  value={work}
                  onChange={(e) => setWork(e.target.value)}
                />
                <input
                  className="input col-span-2"
                  placeholder="Interests (comma separated)"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                />
                <textarea
                  className="input col-span-2 min-h-[80px]"
                  placeholder="Goals you're working on"
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                />
              </div>
            </Step>
          )}

          {step === "security" && (
            <Step
              title="Security strictness"
              hint="How often Jarvis should ask before doing things on your machine."
            >
              <div className="grid gap-2">
                {SECURITY_LEVELS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSecurity(s.id)}
                    className={`text-left rounded-xl border p-4 transition-all ${
                      security === s.id
                        ? "border-accent bg-accent/10"
                        : "border-white/[0.06] hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-medium">
                        <span className="text-lg">{s.emoji}</span> {s.label}
                      </div>
                      {security === s.id && (
                        <Check className="w-4 h-4 text-accent" />
                      )}
                    </div>
                    <div className="text-ink-dim text-sm mt-1">{s.note}</div>
                  </button>
                ))}
              </div>
            </Step>
          )}

          {step === "engine" && (
            <Step
              title="Pick your AI engine"
              hint="Local engines run privately on your machine. Cloud engines need an API key in .env."
            >
              <Select
                value={engineId}
                onChange={setEngineId}
                options={engineOpts}
              />
              <div className="mt-3 grid gap-2">
                {engines.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between text-sm rounded-lg px-3 py-2 bg-white/[0.03]"
                  >
                    <div>
                      <span className="font-medium">{e.label}</span>{" "}
                      <span className="text-ink-mute text-xs">
                        {e.privacy === "local" ? "local" : "cloud"}
                      </span>
                    </div>
                    <span
                      className={`chip ${
                        e.available
                          ? "text-emerald-300 border-emerald-400/20 bg-emerald-400/10"
                          : "text-ink-mute"
                      }`}
                    >
                      {e.available ? "ready" : e.requires_key ? "needs key" : "offline"}
                    </span>
                  </div>
                ))}
              </div>
            </Step>
          )}

          {step === "finish" && (
            <Step
              title="All set"
              hint="Jarvis is ready. You can change anything later in settings."
            >
              <div className="rounded-xl bg-white/[0.03] p-4 text-sm space-y-1">
                <div>
                  Hello <b>{name || "Admin"}</b>. Language:{" "}
                  <b>{language}</b>. Engine: <b>{engineId}</b>. Security:{" "}
                  <b>{security}</b>.
                </div>
              </div>
              {err && <div className="mt-3 text-rose-400 text-sm">{err}</div>}
            </Step>
          )}
        </div>

        <div className="px-8 pb-6 flex items-center justify-between">
          <button
            className="btn-ghost"
            onClick={back}
            disabled={idx === 0 || busy}
          >
            Back
          </button>
          {step !== "finish" ? (
            <button
              className="btn-primary"
              onClick={next}
              disabled={step === "name" && !name.trim()}
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button className="btn-primary" onClick={finish} disabled={busy}>
              {busy ? "Setting up…" : "Enter Jarvis"}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function Step({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="animate-slide-up">
      <h2 className="text-xl font-semibold mb-1">{title}</h2>
      {hint && <p className="text-ink-dim text-sm mb-5">{hint}</p>}
      {children}
    </div>
  );
}
