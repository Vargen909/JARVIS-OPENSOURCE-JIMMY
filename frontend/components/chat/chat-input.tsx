"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Mic } from "lucide-react";

export function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => Promise<boolean> | boolean;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const [listening, setListening] = useState(false);
  const recRef = useRef<unknown>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = Math.min(ref.current.scrollHeight, 220) + "px";
    }
  }, [text]);

  const submit = async () => {
    if (!text.trim() || disabled) return;
    const sentText = text;
    const ok = await onSend(sentText);
    if (ok) setText("");
  };

  const toggleVoice = () => {
    interface SpeechRecognitionLike extends EventTarget {
      lang: string;
      interimResults: boolean;
      continuous: boolean;
      start: () => void;
      stop: () => void;
      onresult: ((e: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
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
    if (listening && recRef.current) {
      (recRef.current as SpeechRecognitionLike).stop();
      return;
    }
    const r = new SR();
    r.lang = navigator.language || "en-US";
    r.interimResults = false;
    r.continuous = false;
    r.onresult = (e) => {
      const t = Array.from(e.results)
        .map((res) => res[0].transcript)
        .join(" ");
      setText((cur) => (cur ? cur + " " + t : t));
    };
    r.onend = () => setListening(false);
    recRef.current = r;
    r.start();
    setListening(true);
  };

  return (
    <div className="px-4 sm:px-6 pb-5 pt-2">
      <div className="mx-auto max-w-3xl">
        <div className="panel flex items-end gap-2 p-2 pr-2.5">
          <button
            onClick={toggleVoice}
            className={`btn-ghost h-10 w-10 p-0 justify-center ${
              listening ? "text-rose-400" : ""
            }`}
            title="Voice input"
          >
            <Mic className="w-4 h-4" />
          </button>
          <textarea
            ref={ref}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            placeholder="Message Jarvis…"
            className="flex-1 resize-none bg-transparent outline-none px-2 py-2 text-[15px] placeholder:text-ink-mute"
          />
          <button
            onClick={submit}
            disabled={disabled || !text.trim()}
            className="btn-primary h-10 w-10 p-0 justify-center"
            title="Send message"
            aria-label="Send message"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
        <div className="text-[11px] text-ink-mute text-center mt-2">
          Enter to send · Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}
