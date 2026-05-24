/**
 * B.O.B action dispatcher.
 *
 * Receives a structured Action from the backend and executes it
 * against the current UI context. All actions are synchronous except
 * create_note which hits the backend memory API.
 */

import type { Action } from "./types";
import type { ViewType } from "@/components/view-navigation";
import { api } from "./api";

export interface ActionContext {
  setActiveView: (v: ViewType) => void;
  setSettingsOpen: (b: boolean) => void;
  setFocusMode: (b: boolean) => void;
  openWebView: (url: string) => void;
  addMemory: (content: string) => Promise<void>;
  newConversation: () => void;
  userId: number;
  currentFocusMode: boolean;
}

const VIEW_MAP: Record<string, ViewType> = {
  core: "core",
  launcher: "launcher",
  workspace: "launcher",
  chat: "chat",
  memory: "memory",
  developer: "developer",
  "command-center": "command-center",
};

export async function dispatchAction(
  action: Action,
  ctx: ActionContext
): Promise<void> {
  switch (action.type) {
    case "switch_view": {
      const view = VIEW_MAP[action.params?.view as string];
      if (view) ctx.setActiveView(view);
      break;
    }
    case "open_settings":
      ctx.setSettingsOpen(true);
      break;
    case "open_memory":
      ctx.setActiveView("memory");
      break;
    case "toggle_focus_mode":
      ctx.setFocusMode(!ctx.currentFocusMode);
      break;
    case "create_note": {
      const content = (action.params?.content as string) || "";
      if (content.trim()) {
        await ctx.addMemory(content.trim());
      }
      break;
    }
    case "search_web": {
      const query = encodeURIComponent((action.params?.query as string) || "");
      ctx.openWebView(`https://duckduckgo.com/?q=${query}`);
      break;
    }
    case "open_url": {
      const url = (action.params?.url as string) || "";
      if (url) ctx.openWebView(url);
      break;
    }
    case "new_chat":
      ctx.newConversation();
      break;
    case "none":
    default:
      break;
  }
}
