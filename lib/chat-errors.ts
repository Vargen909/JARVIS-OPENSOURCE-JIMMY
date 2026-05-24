/**
 * User-facing error mapping for chat / voice / backend failures.
 *
 * Centralizes the four canonical failure modes so every entry point
 * (Core view, Chat panel, status bar) shows the same wording.
 */

import { API_BASE } from "./api";

export type ChatErrorKind =
  | "offline"
  | "mic-denied"
  | "stt-unsupported"
  | "model-failed"
  | "unknown";

export interface MappedError {
  kind: ChatErrorKind;
  message: string;
  /** The raw error preserved for dev-tools / debugging. */
  cause?: unknown;
}

/** Extract the port from API_BASE so the offline message stays accurate. */
export function backendPort(base: string = API_BASE): string {
  try {
    // Handle relative URLs (like /api/bob) - return default port
    if (base.startsWith("/")) {
      return "3000";
    }
    return new URL(base).port || "8765";
  } catch {
    return "8765";
  }
}

const OFFLINE_PATTERNS = [
  /failed to fetch/i,
  /networkerror/i,
  /load failed/i,
  /cannot reach/i,
  /econnrefused/i,
  /err_connection_refused/i,
  /fetch failed/i,
];

const MODEL_PATTERNS = [
  /^503/,
  /engine error/i,
  /engineunavailable/i,
  /no available engine/i,
  /ollama/i,
];

/**
 * Map any thrown value to a stable, user-facing error.
 *
 * Inputs may be: Error from fetch (offline), HTTPException string from
 * the backend, DOMException (mic), or anything else. Falls back to
 * "unknown" with the raw message preserved.
 */
export function mapChatError(err: unknown): MappedError {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : String(err ?? "");
  const port = backendPort();

  if (OFFLINE_PATTERNS.some((re) => re.test(raw))) {
    return {
      kind: "offline",
      message: `B.O.B backend is offline. Start backend on port ${port}.`,
      cause: err,
    };
  }
  if (MODEL_PATTERNS.some((re) => re.test(raw))) {
    return {
      kind: "model-failed",
      message: "Model failed to respond. Check Ollama/Jarvis backend.",
      cause: err,
    };
  }
  if (/permission|notallowed/i.test(raw)) {
    return {
      kind: "mic-denied",
      message: "Microphone permission is blocked. Enable it in browser settings.",
      cause: err,
    };
  }
  if (/not[- ]?supported|no speech|recognition/i.test(raw)) {
    return {
      kind: "stt-unsupported",
      message: "Voice input is not supported in this browser.",
      cause: err,
    };
  }
  return {
    kind: "unknown",
    message: raw || "Something went wrong.",
    cause: err,
  };
}

/** Map a SpeechRecognition error event 'error' string to a MappedError. */
export function mapSpeechError(eventErrorCode: string): MappedError {
  switch (eventErrorCode) {
    case "not-allowed":
    case "service-not-allowed":
      return {
        kind: "mic-denied",
        message:
          "Microphone permission is blocked. Enable it in browser settings.",
      };
    case "audio-capture":
      return {
        kind: "mic-denied",
        message: "No microphone detected. Check your audio device.",
      };
    case "no-speech":
      return {
        kind: "unknown",
        message: "No speech detected. Try again.",
      };
    case "network":
      return {
        kind: "unknown",
        message:
          "Browser speech recognition is unavailable right now. Try Chrome or Edge, allow microphone access, and make sure the browser has internet access.",
      };
    default:
      return {
        kind: "unknown",
        message: `Voice input failed (${eventErrorCode}).`,
      };
  }
}
