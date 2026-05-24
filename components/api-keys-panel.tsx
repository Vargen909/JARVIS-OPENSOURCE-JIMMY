"use client";

import { useEffect, useState } from "react";
import { Check, KeyRound, PlugZap, Save } from "lucide-react";
import { api } from "@/lib/api";
import { useJarvis } from "./providers";

interface ApiKeyStatus {
  env_name: string;
  engine_id: string;
  label: string;
  configured: boolean;
  masked?: string | null;
}

type ToastTone = "ok" | "warn" | "err";

interface TestResult {
  ok: boolean;
  message: string;
}

export function ApiKeysPanel() {
  const { refresh } = useJarvis();
  const [keys, setKeys] = useState<ApiKeyStatus[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [tests, setTests] = useState<Record<string, TestResult>>({});
  const [toast, setToast] = useState<{ tone: ToastTone; text: string } | null>(
    null
  );

  const showToast = (tone: ToastTone, text: string) => {
    setToast({ tone, text });
  };

  const load = async () => {
    try {
      setKeys(await api.apiKeys());
    } catch (e) {
      showToast(
        "err",
        e instanceof Error ? e.message : "Kunde inte läsa API-nycklar."
      );
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (envName: string) => {
    const value = values[envName]?.trim();
    if (!value) {
      showToast("warn", "Klistra in en API-nyckel först.");
      return;
    }
    setBusy(envName);
    setToast(null);
    try {
      const saved = await api.saveApiKey(envName, value);
      setValues((cur) => ({ ...cur, [envName]: "" }));

      let reloadedOk = saved.reloaded ?? false;
      if (!reloadedOk) {
        try {
          await api.reloadSettings();
          reloadedOk = true;
        } catch {
          reloadedOk = false;
        }
      }

      await load();
      await refresh();

      if (reloadedOk) {
        showToast("ok", "Settings saved and backend refreshed.");
      } else {
        showToast(
          "warn",
          "Settings saved, but backend refresh failed. Please restart B.O.B."
        );
      }
    } catch (e) {
      showToast(
        "err",
        e instanceof Error ? e.message : "Kunde inte spara nyckeln."
      );
    } finally {
      setBusy(null);
    }
  };

  const test = async (engineId: string) => {
    setTesting(engineId);
    try {
      const res = await api.testEngine(engineId);
      setTests((cur) => ({
        ...cur,
        [engineId]: { ok: res.ok, message: res.message },
      }));
      showToast(res.ok ? "ok" : "warn", `${engineId}: ${res.message}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Test misslyckades.";
      setTests((cur) => ({ ...cur, [engineId]: { ok: false, message: msg } }));
      showToast("err", `${engineId}: ${msg}`);
    } finally {
      setTesting(null);
    }
  };

  const toastClass =
    toast?.tone === "ok"
      ? "text-emerald-300 bg-emerald-400/10 border-emerald-400/20"
      : toast?.tone === "warn"
        ? "text-amber-300 bg-amber-300/10 border-amber-300/20"
        : "text-rose-300 bg-rose-400/10 border-rose-400/20";

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-xs text-ink-dim">
        <div className="flex items-center gap-2 text-ink font-medium mb-1">
          <KeyRound className="w-4 h-4 text-accent" />
          Lokala API-nycklar
        </div>
        Nycklar sparas i projektets lokala <code>.env</code>-fil och skickas
        aldrig till frontend igen, bara maskerade statusvärden visas.
      </div>

      {keys.map((key) => (
        <div
          key={key.env_name}
          className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 space-y-2"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">{key.label}</div>
              <div className="text-[11px] text-ink-mute font-mono">
                {key.env_name}
              </div>
            </div>
            <span
              className={`chip ${
                key.configured
                  ? "text-emerald-300 bg-emerald-400/10 border-emerald-400/20"
                  : "text-amber-300 bg-amber-300/10 border-amber-300/20"
              }`}
            >
              {key.configured ? (
                <>
                  <Check className="w-3 h-3" /> {key.masked || "sparad"}
                </>
              ) : (
                "saknas"
              )}
            </span>
          </div>

          <div className="flex gap-2">
            <input
              className="input"
              type="password"
              value={values[key.env_name] || ""}
              placeholder={key.configured ? "Ersätt befintlig nyckel" : "Klistra in API-nyckel"}
              onChange={(e) =>
                setValues((cur) => ({
                  ...cur,
                  [key.env_name]: e.target.value,
                }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") save(key.env_name);
              }}
            />
            <button
              className="btn-primary shrink-0"
              disabled={busy === key.env_name}
              onClick={() => save(key.env_name)}
            >
              <Save className="w-4 h-4" />
              {busy === key.env_name ? "Sparar" : "Spara"}
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              className="btn-ghost h-8 px-3 text-xs"
              disabled={!key.configured || testing === key.engine_id}
              onClick={() => test(key.engine_id)}
              title="Testa anslutning"
            >
              <PlugZap className="w-3.5 h-3.5" />
              {testing === key.engine_id ? "Testar…" : "Testa anslutning"}
            </button>
            {tests[key.engine_id] && (
              <span
                className={`text-[11px] truncate ${
                  tests[key.engine_id].ok
                    ? "text-emerald-300"
                    : "text-amber-300"
                }`}
              >
                {tests[key.engine_id].message}
              </span>
            )}
          </div>
        </div>
      ))}

      {toast && (
        <div className={`chip text-xs ${toastClass}`}>{toast.text}</div>
      )}
    </div>
  );
}
