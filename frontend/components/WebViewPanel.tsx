"use client";

import { X } from "lucide-react";

export function WebViewPanel({
  url,
  onClose,
}: {
  url: string;
  onClose: () => void;
}) {
  return (
    <section className="fixed inset-4 z-[var(--z-webview)] panel-strong overflow-hidden flex flex-col">
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
        <div className="input flex-1 truncate text-ink-dim">{url}</div>
        <button
          type="button"
          className="btn-ghost h-10 w-10 p-0"
          onClick={onClose}
          title="Close WebView"
          aria-label="Close WebView"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <iframe
        src={url}
        sandbox="allow-scripts allow-same-origin"
        className="h-full w-full flex-1 bg-white"
        title="B.O.B WebView"
      />
    </section>
  );
}
