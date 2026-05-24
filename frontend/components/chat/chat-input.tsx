"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Mic } from "lucide-react";
import { useSpeechInput } from "@/hooks/use-speech-input";

export function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => Promise<boolean> | boolean;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const textRef = useRef("");

  textRef.current = text;

  const speech = useSpeechInput({
    onFinalTranscript: async (t) => {
      if (!t) return;
      const draft = textRef.current.trim();
      // If the user already has a draft, append the transcript so nothing
      // gets lost. Otherwise send immediately through the same pipeline as
      // typed text.
      if (draft || disabled) {
        setText((cur) => (cur ? cur + " " + t : t));
        return;
      }
      const ok = await onSend(t);
      if (!ok) {
        setText((cur) => (cur ? cur + " " + t : t));
      }
    },
  });

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

  const handleVoice = () => {
    if (!speech.supported) return;
    speech.clearError();
    speech.toggle();
  };

  const voiceError = speech.error?.message;
  const voiceUnsupported = !speech.supported;

  return (
    <div className="px-4 sm:px-6 pb-5 pt-2">
      <div className="mx-auto max-w-3xl">
        {(voiceError || voiceUnsupported) && (
          <div className="mb-2 text-center text-xs text-rose-400">
            {voiceError ?? "Voice input is not supported in this browser."}
          </div>
        )}
        <div className="panel glow-input flex items-end gap-2 p-2 pr-2.5 transition-shadow duration-300">
          <button
            onClick={handleVoice}
            disabled={voiceUnsupported}
            className={`btn-ghost h-10 w-10 p-0 justify-center ${
              speech.listening ? "text-rose-400" : ""
            }`}
            title={
              voiceUnsupported
                ? "Voice input is not supported in this browser"
                : speech.listening
                  ? "Stop listening"
                  : "Voice input"
            }
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
            placeholder="Message B.O.B…"
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
