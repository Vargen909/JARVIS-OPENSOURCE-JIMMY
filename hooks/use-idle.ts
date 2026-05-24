"use client";

import { useEffect, useRef, useState } from "react";

interface UseIdleOptions {
  /** Inactivity duration in ms before isIdle flips to true. */
  timeoutMs?: number;
  /** When true, the hook never reports idle (always returns false). */
  disabled?: boolean;
  /** When true, force isIdle = false regardless of activity. */
  forceActive?: boolean;
}

/**
 * Tracks UI inactivity. isIdle becomes true after `timeoutMs` of no
 * mousemove / keydown / pointerdown / wheel / touchstart events.
 *
 * Designed for Core Mode: when the user is reading or listening, panels
 * fade out; the moment they twitch the mouse or press a key, panels return.
 */
export function useIdle({
  timeoutMs = 4000,
  disabled = false,
  forceActive = false,
}: UseIdleOptions = {}): boolean {
  const [isIdle, setIsIdle] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (disabled || forceActive) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setIsIdle(false);
      return;
    }

    const reset = () => {
      setIsIdle(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setIsIdle(true), timeoutMs);
    };

    const events: (keyof WindowEventMap)[] = [
      "mousemove",
      "keydown",
      "pointerdown",
      "wheel",
      "touchstart",
    ];
    events.forEach((ev) => window.addEventListener(ev, reset, { passive: true }));
    reset();

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, reset));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeoutMs, disabled, forceActive]);

  return isIdle;
}
