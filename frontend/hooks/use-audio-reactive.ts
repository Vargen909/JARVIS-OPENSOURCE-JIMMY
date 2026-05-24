"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface AudioReactive {
  /** Current normalized RMS amplitude (0..1). Updates ~60fps when started. */
  level: number;
  /** True if the browser supports the Web Audio API + getUserMedia. */
  supported: boolean;
  /** True if the analyser is currently running. */
  active: boolean;
  /** Permission has been explicitly denied by the user. */
  denied: boolean;
  /** Begin reading microphone amplitude. Resolves when the stream is live, rejects on permission denial. */
  start: () => Promise<void>;
  /** Stop reading and release the microphone. */
  stop: () => void;
}

interface AudioRefs {
  ctx: AudioContext | null;
  stream: MediaStream | null;
  source: MediaStreamAudioSourceNode | null;
  analyser: AnalyserNode | null;
  raf: number | null;
  buffer: Uint8Array | null;
}

/**
 * Microphone amplitude analyser for the listening state.
 *
 * Uses Web Audio API + getUserMedia to derive a normalized RMS level
 * (0..1) from live microphone input. Gracefully reports `supported=false`
 * or `denied=true` when the browser can't or won't grant access.
 *
 * The hook is allocation-light: a single AnalyserNode and a reusable
 * Uint8Array, polled inside requestAnimationFrame.
 */
export function useAudioReactive(): AudioReactive {
  const [level, setLevel] = useState(0);
  const [active, setActive] = useState(false);
  const [denied, setDenied] = useState(false);
  const [supported, setSupported] = useState(true);

  const refs = useRef<AudioRefs>({
    ctx: null,
    stream: null,
    source: null,
    analyser: null,
    raf: null,
    buffer: null,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasAudio =
      typeof window.AudioContext !== "undefined" ||
      typeof (window as unknown as { webkitAudioContext?: unknown })
        .webkitAudioContext !== "undefined";
    const hasMedia =
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices &&
      !!navigator.mediaDevices.getUserMedia;
    setSupported(hasAudio && hasMedia);
  }, []);

  const stop = useCallback(() => {
    const r = refs.current;
    if (r.raf !== null) {
      cancelAnimationFrame(r.raf);
      r.raf = null;
    }
    if (r.source) {
      try {
        r.source.disconnect();
      } catch {}
      r.source = null;
    }
    if (r.analyser) {
      try {
        r.analyser.disconnect();
      } catch {}
      r.analyser = null;
    }
    if (r.stream) {
      r.stream.getTracks().forEach((t) => t.stop());
      r.stream = null;
    }
    if (r.ctx) {
      r.ctx.close().catch(() => {});
      r.ctx = null;
    }
    r.buffer = null;
    setActive(false);
    setLevel(0);
  }, []);

  const start = useCallback(async () => {
    if (!supported) return;
    if (refs.current.ctx) return;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setDenied(true);
      return;
    }

    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctor();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.85;
    source.connect(analyser);

    const buffer = new Uint8Array(analyser.fftSize);
    refs.current = {
      ctx,
      stream,
      source,
      analyser,
      buffer,
      raf: null,
    };
    setActive(true);
    setDenied(false);

    const tick = () => {
      const r = refs.current;
      if (!r.analyser || !r.buffer) return;
      r.analyser.getByteTimeDomainData(r.buffer);
      let sum = 0;
      for (let i = 0; i < r.buffer.length; i++) {
        const v = (r.buffer[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / r.buffer.length);
      const normalized = Math.min(1, rms * 2.4);
      setLevel(normalized);
      r.raf = requestAnimationFrame(tick);
    };
    refs.current.raf = requestAnimationFrame(tick);
  }, [supported]);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { level, supported, active, denied, start, stop };
}
