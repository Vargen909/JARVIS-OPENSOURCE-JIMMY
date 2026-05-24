import type {
  AppInfo,
  ChatResponse,
  ConversationOut,
  EngineInfo,
  MemoryOut,
  ProfileData,
  SpeechTranscription,
  UserOut,
} from "./types";

const BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:8765";

const isDev = process.env.NODE_ENV !== "production";

function dlog(...args: unknown[]) {
  if (isDev && typeof console !== "undefined") console.debug("[bob:api]", ...args);
}

async function request<T>(
  path: string,
  init?: RequestInit & { json?: unknown }
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  const url = `${BASE}${path}`;
  const method = (init?.method as string | undefined) ?? "GET";
  dlog(method, url);
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers,
      body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
      cache: "no-store",
    });
  } catch (e) {
    dlog("network failure", method, url, e);
    throw new Error(
      `Cannot reach B.O.B backend at ${BASE}. Start it with: .\\scripts\\start-backend.ps1`
    );
  }
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = await res.json();
      detail = data.detail || detail;
    } catch {}
    dlog("error response", res.status, detail);
    throw new Error(`${res.status}: ${detail}`);
  }
  if (res.status === 204) return undefined as T;
  const data = (await res.json()) as T;
  dlog("ok", method, url);
  return data;
}

async function uploadForm<T>(path: string, form: FormData): Promise<T> {
  const url = `${BASE}${path}`;
  dlog("POST", url, "[form-data]");
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      body: form,
      cache: "no-store",
    });
  } catch (e) {
    dlog("network failure", "POST", url, e);
    throw new Error(
      `Cannot reach B.O.B backend at ${BASE}. Start it with: .\\scripts\\start-backend.ps1`
    );
  }
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = await res.json();
      detail = data.detail || detail;
    } catch {}
    dlog("error response", res.status, detail);
    throw new Error(`${res.status}: ${detail}`);
  }
  return (await res.json()) as T;
}

export const api = {
  info: () => request<AppInfo>("/info"),
  engines: () => request<EngineInfo[]>("/engines"),
  apiKeys: () =>
    request<
      Array<{
        env_name: string;
        engine_id: string;
        label: string;
        configured: boolean;
        masked?: string | null;
      }>
    >("/api-keys"),
  saveApiKey: (env_name: string, value: string) =>
    request<{
      ok: boolean;
      env_name: string;
      engine_id: string;
      configured: boolean;
      masked?: string | null;
      reloaded?: boolean;
    }>("/api-keys", {
      method: "POST",
      json: { env_name, value },
    }),

  reloadSettings: () =>
    request<{
      ok: boolean;
      engines: Array<{
        id: string;
        label: string;
        provider: string | null;
        requires_key: boolean;
        configured: boolean;
      }>;
      engine_count: number;
      configured_count: number;
    }>("/settings/reload", { method: "POST" }),

  testEngine: (engineId: string) =>
    request<{
      ok: boolean;
      engine_id: string;
      available: boolean;
      message: string;
    }>(`/engines/${engineId}/test`, { method: "POST" }),

  listUsers: () => request<UserOut[]>("/users"),
  createUser: (payload: {
    name: string;
    role?: "admin" | "standard" | "child";
    language?: string;
    security?: "strict" | "balanced" | "relaxed";
    child_age_band?: string;
    pin?: string;
  }) => request<UserOut>("/users", { method: "POST", json: payload }),
  updateUser: (
    id: number,
    payload: Partial<{
      name: string;
      language: string;
      security: "strict" | "balanced" | "relaxed";
      operating_mode: string;
      performance_mode: string;
      preferred_engine: string;
      preferred_model: string;
      child_age_band: string;
      onboarded: boolean;
      profile: ProfileData;
    }>
  ) => request<UserOut>(`/users/${id}`, { method: "PATCH", json: payload }),
  deleteUser: (id: number) =>
    request<void>(`/users/${id}`, { method: "DELETE" }),

  listConversations: (userId: number) =>
    request<ConversationOut[]>(`/users/${userId}/conversations`),
  getConversation: (id: number) =>
    request<ConversationOut>(`/conversations/${id}`),
  deleteConversation: (id: number) =>
    request<void>(`/conversations/${id}`, { method: "DELETE" }),

  chat: (payload: {
    user_id: number;
    conversation_id?: number;
    message: string;
    engine?: string;
    model?: string;
    confidential?: boolean;
    operating_mode?: string;
  }) => request<ChatResponse>("/chat", { method: "POST", json: payload }),

  transcribeAudio: (blob: Blob, filename = "speech.webm", language = "sv") => {
    const form = new FormData();
    form.append("file", blob, filename);
    form.append("language", language);
    return uploadForm<SpeechTranscription>("/speech/transcribe", form);
  },

  listMemory: (userId: number) =>
    request<MemoryOut[]>(`/users/${userId}/memory`),
  addMemory: (userId: number, content: string, kind = "note") =>
    request<MemoryOut>(`/users/${userId}/memory`, {
      method: "POST",
      json: { content, kind },
    }),
  deleteMemory: (userId: number, id: number) =>
    request<void>(`/users/${userId}/memory/${id}`, { method: "DELETE" }),

  briefing: (userId: number) =>
    request<{ briefing: string; engine: string; model: string; date: string }>(
      `/users/${userId}/briefing`
    ),
};

export const API_BASE = BASE;
