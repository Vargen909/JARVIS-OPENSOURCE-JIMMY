"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Mic,
  MicOff,
  Paperclip,
  Command,
  Sparkles,
  Search,
  Code,
  Image,
  FileText,
  Calculator,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandBarProps {
  onSend: (message: string) => void | Promise<void>;
  isThinking: boolean;
}

const QUICK_ACTIONS = [
  { id: "generate", label: "Generate", icon: Sparkles },
  { id: "search", label: "Search", icon: Search },
  { id: "code", label: "Code", icon: Code },
  { id: "image", label: "Image", icon: Image },
  { id: "document", label: "Document", icon: FileText },
  { id: "calculate", label: "Calculate", icon: Calculator },
];

export function CommandBar({ onSend, isThinking }: CommandBarProps) {
  const [message, setMessage] = useState("");
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!message.trim() || isThinking) return;
    const text = message;
    setMessage("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    void onSend(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 150)}px`;
    }
  };

  const toggleVoice = () => {
    interface SpeechRecognitionLike extends EventTarget {
      lang: string;
      interimResults: boolean;
      continuous: boolean;
      start: () => void;
      stop: () => void;
      onresult:
        | ((e: { results: ArrayLike<{ 0: { transcript: string } }> }) => void)
        | null;
      onend: (() => void) | null;
    }
    const win = window as unknown as {
      SpeechRecognition?: { new (): SpeechRecognitionLike };
      webkitSpeechRecognition?: { new (): SpeechRecognitionLike };
    };
    const SR = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SR) {
      alert("Voice input not supported in this browser.");
      return;
    }
    if (isVoiceActive) {
      setIsVoiceActive(false);
      return;
    }
    const r = new SR();
    r.lang = navigator.language || "sv-SE";
    r.interimResults = false;
    r.continuous = false;
    r.onresult = (e) => {
      const t = Array.from(e.results)
        .map((res) => res[0].transcript)
        .join(" ");
      setMessage((cur) => (cur ? `${cur} ${t}` : t));
    };
    r.onend = () => setIsVoiceActive(false);
    r.start();
    setIsVoiceActive(true);
  };

  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="w-full max-w-3xl mx-auto"
    >
      <AnimatePresence>
        {showQuickActions && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="flex flex-wrap gap-2 mb-3 justify-center"
          >
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => setMessage(`/${action.id} `)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] hover:border-accent/30 text-sm text-ink-dim hover:text-ink transition-all"
                >
                  <Icon className="h-3.5 w-3.5 text-accent" />
                  {action.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative group">
        <div
          aria-hidden
          className="absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-30 group-focus-within:opacity-50 blur-lg transition-opacity duration-500 pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, rgb(var(--accent) / 0.5), rgb(var(--accent-glow) / 0.5), rgb(var(--accent) / 0.5))",
          }}
        />
        <div className="relative panel glow-input flex items-end gap-2 p-3">
          <div className="flex items-center gap-1 pb-0.5">
            <button
              type="button"
              className="btn-ghost h-8 w-8 p-0"
              title="Attach (coming soon)"
              disabled
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowQuickActions(!showQuickActions)}
              className={cn(
                "btn-ghost h-8 w-8 p-0",
                showQuickActions && "text-accent bg-accent/10"
              )}
              title="Quick actions"
            >
              <Command className="h-4 w-4" />
            </button>
          </div>

          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask Jarvis anything…"
            disabled={isThinking}
            rows={1}
            className="flex-1 resize-none bg-transparent outline-none px-1 py-2 text-[15px] text-ink placeholder:text-ink-mute min-h-[40px] max-h-[150px]"
          />

          <div className="flex items-center gap-1 pb-0.5">
            <button
              type="button"
              onClick={toggleVoice}
              className={cn(
                "btn-ghost h-8 w-8 p-0",
                isVoiceActive && "text-rose-400 bg-rose-400/10"
              )}
              title="Voice"
            >
              {isVoiceActive ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={!message.trim() || isThinking}
              className={cn(
                "h-8 w-8 rounded-xl flex items-center justify-center transition-all",
                message.trim() && !isThinking
                  ? "btn-primary p-0"
                  : "bg-white/[0.05] text-ink-mute"
              )}
              title="Send"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <p className="text-center text-[11px] text-ink-mute mt-2">
        <kbd className="px-1.5 py-0.5 rounded bg-white/[0.05] font-mono">Enter</kbd> send ·{" "}
        <kbd className="px-1.5 py-0.5 rounded bg-white/[0.05] font-mono">Shift+Enter</kbd> new line
      </p>
    </motion.div>
  );
}
