/**
 * B.O.B Voice OS — pure state machine.
 *
 * States and events are typed, the reducer is pure and testable.
 * CoreView wraps this via use-bob-state.ts.
 */

export type BobState =
  | "idle"
  | "passive_wake_listening"
  | "wake_detected"
  | "recording_command"
  | "transcribing"
  | "thinking"
  | "speaking"
  | "action_executing"
  | "muted"
  | "error";

export type BobEvent =
  | { type: "WAKE_LISTEN_START" }
  | { type: "WAKE_DETECTED" }
  | { type: "RECORD_START" }
  | { type: "RECORD_STOP" }
  | { type: "TRANSCRIBE_DONE"; text: string }
  | { type: "THINK_START" }
  | { type: "REPLY_RECEIVED"; replyText: string; actionLabel?: string }
  | { type: "SPEAK_DONE" }
  | { type: "ACTION_START"; label: string }
  | { type: "ACTION_DONE" }
  | { type: "MUTE_TOGGLE" }
  | { type: "ERROR"; message: string }
  | { type: "RESET" };

export interface BobStateData {
  state: BobState;
  /** Last transcript from STT. */
  lastTranscript: string;
  /** Last assistant reply text. */
  lastReply: string;
  /** Label for current action, e.g. "Öppnar minnesvyn". */
  actionLabel: string;
  /** Human-readable error. */
  errorMessage: string;
  /** Whether the previous state was muted (used to restore on unmute). */
  preMuteState: BobState | null;
}

export const INITIAL_STATE: BobStateData = {
  state: "idle",
  lastTranscript: "",
  lastReply: "",
  actionLabel: "",
  errorMessage: "",
  preMuteState: null,
};

export function bobReducer(data: BobStateData, event: BobEvent): BobStateData {
  const { state } = data;

  switch (event.type) {
    case "WAKE_LISTEN_START":
      if (state === "muted") return data;
      return { ...data, state: "passive_wake_listening", errorMessage: "" };

    case "WAKE_DETECTED":
      if (state === "muted" || state === "thinking" || state === "speaking" || state === "action_executing") return data;
      return { ...data, state: "wake_detected", errorMessage: "" };

    case "RECORD_START":
      if (state !== "wake_detected" && state !== "passive_wake_listening" && state !== "idle") return data;
      return { ...data, state: "recording_command", errorMessage: "" };

    case "RECORD_STOP":
      if (state !== "recording_command") return data;
      return { ...data, state: "transcribing" };

    case "TRANSCRIBE_DONE":
      if (state !== "transcribing" && state !== "recording_command") return data;
      return { ...data, state: "thinking", lastTranscript: event.text };

    case "THINK_START":
      return { ...data, state: "thinking" };

    case "REPLY_RECEIVED":
      return {
        ...data,
        state: "speaking",
        lastReply: event.replyText,
        actionLabel: event.actionLabel ?? "",
      };

    case "SPEAK_DONE":
      if (state !== "speaking") return data;
      return { ...data, state: data.preMuteState ? "passive_wake_listening" : "passive_wake_listening" };

    case "ACTION_START":
      return { ...data, state: "action_executing", actionLabel: event.label };

    case "ACTION_DONE":
      return { ...data, state: "speaking" };

    case "MUTE_TOGGLE": {
      if (state === "muted") {
        return { ...data, state: data.preMuteState ?? "passive_wake_listening", preMuteState: null };
      }
      const isBusy = state === "thinking" || state === "speaking" || state === "action_executing";
      return {
        ...data,
        state: "muted",
        preMuteState: isBusy ? state : state,
      };
    }

    case "ERROR":
      return { ...data, state: "error", errorMessage: event.message };

    case "RESET":
      return { ...INITIAL_STATE };

    default:
      return data;
  }
}

/** Subtitle text for each state — shown under the B.O.B orb. */
export function subtitleForState(data: BobStateData): string {
  switch (data.state) {
    case "idle":
      return "Hej! Säg 'Hej B.O.B' eller skriv något.";
    case "passive_wake_listening":
      return "Lyssnar efter Hej B.O.B…";
    case "wake_detected":
      return "Jag lyssnar";
    case "recording_command":
      return "Jag lyssnar";
    case "transcribing":
      return "Skriver ner…";
    case "thinking":
      return "Tänker…";
    case "speaking":
      return data.lastReply;
    case "action_executing":
      return data.actionLabel || "Utför åtgärd…";
    case "muted":
      return "Mikrofon av";
    case "error":
      return data.errorMessage || "Något gick fel.";
    default:
      return "";
  }
}

/** True when B.O.B is busy and should not accept new commands. */
export function isBusy(state: BobState): boolean {
  return (
    state === "thinking" ||
    state === "transcribing" ||
    state === "action_executing" ||
    state === "speaking" ||
    state === "recording_command"
  );
}

/** True when the user can start recording a voice command. */
export function canRecord(state: BobState): boolean {
  return (
    state === "idle" ||
    state === "passive_wake_listening" ||
    state === "wake_detected"
  );
}
