"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Modal } from "./ui/modal";
import { useJarvis } from "./providers";
import { api } from "@/lib/api";
import type { MemoryOut } from "@/lib/types";

export function MemoryDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { activeUser } = useJarvis();
  const [items, setItems] = useState<MemoryOut[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!activeUser) return;
    const list = await api.listMemory(activeUser.id);
    setItems(list);
  };

  useEffect(() => {
    if (open) load();
  }, [open, activeUser?.id]);

  if (!activeUser) return null;

  const add = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try {
      await api.addMemory(activeUser.id, text.trim());
      setText("");
      load();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    await api.deleteMemory(activeUser.id, id);
    load();
  };

  return (
    <Modal open={open} onClose={onClose} title="Memory">
      <p className="text-sm text-ink-dim mb-4">
        Anything you teach B.O.B is stored locally and encrypted. Reference
        will be added to every conversation automatically.
      </p>
      <div className="flex gap-2 mb-4">
        <input
          className="input"
          placeholder='e.g. "I prefer concise answers and use metric units."'
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button className="btn-primary" disabled={busy} onClick={add}>
          <Plus className="w-4 h-4" /> Save
        </button>
      </div>

      <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
        {items.length === 0 && (
          <div className="text-ink-mute text-sm">No memory notes yet.</div>
        )}
        {items.map((m) => (
          <div
            key={m.id}
            className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3"
          >
            <div className="flex-1 text-sm whitespace-pre-wrap">{m.content}</div>
            <button
              className="text-ink-mute hover:text-rose-400 transition-colors p-1"
              onClick={() => remove(m.id)}
              aria-label="Delete memory"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </Modal>
  );
}
