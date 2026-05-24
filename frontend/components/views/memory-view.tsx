"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Sparkles, Lock, Brain } from "lucide-react";
import { BobCore } from "@/components/bob/bob-core";
import { useJarvis } from "@/components/providers";
import { api } from "@/lib/api";
import type { MemoryOut } from "@/lib/types";

/**
 * Full-page AI Memory view — wired to real api.listMemory / addMemory / deleteMemory.
 */
export function MemoryView() {
  const { activeUser } = useJarvis();
  const [items, setItems] = useState<MemoryOut[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!activeUser) return;
    setLoading(true);
    try {
      const list = await api.listMemory(activeUser.id);
      setItems(list);
    } catch {
      /* non-fatal */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [activeUser?.id]);

  if (!activeUser) return null;

  const add = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    try {
      await api.addMemory(activeUser.id, text.trim());
      setText("");
      await load();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    await api.deleteMemory(activeUser.id, id);
    setItems((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="view-header"
        >
          <BobCore variant="compact" size={44} className="shrink-0" />
          <div>
            <h1 className="t-h1">AI Memory</h1>
            <p className="text-sm text-ink-dim mt-0.5">
              What B.O.B knows and remembers about you
            </p>
          </div>
        </motion.div>

        {/* Encryption notice */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent/8 border border-accent/20 mb-6"
        >
          <Lock className="w-4 h-4 text-accent shrink-0" />
          <p className="text-xs text-ink-dim">
            Memory notes are stored locally and encrypted. They are automatically referenced in every conversation.
          </p>
        </motion.div>

        {/* Add form */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="panel p-4 mb-8"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium">Add new memory</span>
          </div>
          <div className="glow-input flex gap-2 rounded-xl">
            <input
              className="input flex-1"
              placeholder='E.g. "Jag föredrar korta, direkta svar på svenska."'
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void add()}
            />
            <button
              className="btn-primary shrink-0"
              disabled={busy || !text.trim()}
              onClick={() => void add()}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Save</span>
            </button>
          </div>
        </motion.div>

        {/* Memory list */}
        <div>
          <div className="section-label mb-3 px-1">
            {loading ? "Loading…" : `${items.length} memory ${items.length === 1 ? "note" : "notes"}`}
          </div>

          {loading && (
            <div className="panel p-8 text-center">
              <div className="flex items-center justify-center gap-2 text-ink-mute text-sm">
                <span className="dot-pulse text-accent" />
                <span className="dot-pulse text-accent" style={{ animationDelay: "0.2s" }} />
                <span className="dot-pulse text-accent" style={{ animationDelay: "0.4s" }} />
              </div>
            </div>
          )}

          {!loading && items.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="panel p-10 text-center"
            >
              <Brain className="w-10 h-10 text-ink-mute mx-auto mb-3 opacity-40" />
              <p className="text-sm text-ink-dim font-medium">No memory notes yet.</p>
              <p className="text-xs text-ink-mute mt-1">
                Add something above to help B.O.B understand you better.
              </p>
            </motion.div>
          )}

          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {items.map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -12, scale: 0.97 }}
                  transition={{ delay: i * 0.03 }}
                  className="group panel p-4 flex items-start gap-3 hover:border-accent/20 transition-colors"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0 animate-pulse-soft" />
                  <p className="flex-1 text-sm leading-relaxed whitespace-pre-wrap text-ink">
                    {m.content}
                  </p>
                  <button
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-ink-mute hover:text-rose-400 p-1 rounded-lg hover:bg-rose-400/10"
                    onClick={() => void remove(m.id)}
                    aria-label="Delete memory"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
