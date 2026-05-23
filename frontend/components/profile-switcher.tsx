"use client";

import { useState } from "react";
import { ChevronDown, Plus, Shield, User } from "lucide-react";
import { useJarvis } from "./providers";
import { Modal } from "./ui/modal";
import { Select } from "./ui/select";
import { api } from "@/lib/api";

const ROLE_ICON = {
  admin: <Shield className="w-3.5 h-3.5" />,
  standard: <User className="w-3.5 h-3.5" />,
  child: <span>🧒</span>,
};

export function ProfileSwitcher({ compact = false }: { compact?: boolean }) {
  const { users, activeUser, setActiveUserId, refresh } = useJarvis();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState<"standard" | "child">("standard");
  const [ageBand, setAgeBand] = useState("8-12");
  const [busy, setBusy] = useState(false);

  if (!activeUser) return null;

  const create = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const u = await api.createUser({
        name: name.trim(),
        role,
        child_age_band: role === "child" ? ageBand : undefined,
      });
      await api.updateUser(u.id, { onboarded: true });
      await refresh();
      setActiveUserId(u.id);
      setCreating(false);
      setOpen(false);
      setName("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07] transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center text-accent text-sm font-semibold">
          {activeUser.name.charAt(0).toUpperCase()}
        </div>
        <div className="text-left flex-1 min-w-0">
          <div className="text-sm font-medium truncate flex items-center gap-1.5">
            {activeUser.name}
            <span className="text-ink-mute">{ROLE_ICON[activeUser.role]}</span>
          </div>
          {!compact && (
            <div className="text-[11px] text-ink-mute capitalize">
              {activeUser.operating_mode} · {activeUser.preferred_engine}
            </div>
          )}
        </div>
        <ChevronDown className="w-4 h-4 text-ink-mute" />
      </button>

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setCreating(false);
        }}
        title="Switch profile"
      >
        {!creating ? (
          <>
            <div className="grid gap-2">
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    setActiveUserId(u.id);
                    setOpen(false);
                  }}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 border text-left transition-colors ${
                    u.id === activeUser.id
                      ? "border-accent bg-accent/10"
                      : "border-white/[0.06] hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-accent/15 flex items-center justify-center font-semibold text-accent">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      {u.name}
                      <span className="chip">{u.role}</span>
                    </div>
                    <div className="text-xs text-ink-dim capitalize">
                      {u.operating_mode} mode · {u.preferred_engine}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <button
              className="btn-ghost w-full mt-4 justify-center"
              onClick={() => setCreating(true)}
            >
              <Plus className="w-4 h-4" /> Add profile
            </button>
          </>
        ) : (
          <div className="space-y-3">
            <input
              className="input"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Select
              value={role}
              onChange={(v) => setRole(v as "standard" | "child")}
              options={[
                { value: "standard", label: "Standard" },
                { value: "child", label: "Child (filtered)" },
              ]}
            />
            {role === "child" && (
              <Select
                value={ageBand}
                onChange={setAgeBand}
                options={[
                  { value: "5-7", label: "Age 5–7" },
                  { value: "8-12", label: "Age 8–12" },
                  { value: "13-16", label: "Age 13–16" },
                ]}
              />
            )}
            <div className="flex gap-2 justify-end pt-2">
              <button
                className="btn-ghost"
                onClick={() => setCreating(false)}
                disabled={busy}
              >
                Cancel
              </button>
              <button className="btn-primary" onClick={create} disabled={busy}>
                {busy ? "Creating…" : "Create profile"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
