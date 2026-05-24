export type UserRole = "admin" | "standard" | "child";
export type SecurityLevel = "strict" | "balanced" | "relaxed";
export type OperatingMode =
  | "work"
  | "personal"
  | "family"
  | "creative"
  | "study"
  | "custom";
export type PerformanceMode =
  | "optimal"
  | "performance"
  | "balanced"
  | "economy"
  | "multitask";

export interface ProfileData {
  age?: number;
  city?: string;
  partner?: string;
  children?: string[];
  work?: string;
  goals?: string;
  interests?: string[];
  health?: string;
  notes?: string;
}

export interface UserOut {
  id: number;
  name: string;
  role: UserRole;
  language: string;
  security: SecurityLevel;
  operating_mode: OperatingMode;
  performance_mode: PerformanceMode;
  preferred_engine: string;
  preferred_model?: string | null;
  child_age_band?: string | null;
  onboarded: boolean;
  has_pin: boolean;
  profile?: ProfileData | null;
  created_at: string;
}

export interface ModelInfo {
  id: string;
  label: string;
  good_for?: string | null;
  installed?: boolean;
}

export interface EngineInfo {
  id: string;
  label: string;
  provider?: string;
  requires_key: boolean;
  models: ModelInfo[];
  default_model?: string | null;
  privacy: "local" | "cloud";
  available: boolean;
  description?: string | null;
  good_for?: string | null;
}

export interface AppInfo {
  name: string;
  version: string;
  user_count: number;
  needs_onboarding: boolean;
  engines: EngineInfo[];
}

export interface MessageOut {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  engine?: string | null;
  model?: string | null;
  created_at: string;
}

export interface ConversationOut {
  id: number;
  title: string;
  operating_mode: OperatingMode;
  confidential: boolean;
  created_at: string;
  updated_at: string;
  messages: MessageOut[];
}

export type ActionType =
  | "switch_view"
  | "open_settings"
  | "open_memory"
  | "toggle_focus_mode"
  | "create_note"
  | "search_web"
  | "open_url"
  | "new_chat"
  | "none";

export interface Action {
  type: ActionType;
  params: Record<string, unknown>;
  confirm: boolean;
  label: string;
}

export interface ChatResponse {
  conversation_id: number;
  reply: MessageOut;
  engine_used: string;
  model_used: string;
  actions: Action[];
}

export interface SpeechTranscription {
  text: string;
  provider: string;
  model: string;
}

export interface MemoryOut {
  id: number;
  kind: string;
  content: string;
  created_at: string;
}
