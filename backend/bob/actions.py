"""B.O.B action schema — structured commands the LLM can return."""

from __future__ import annotations

import json
import re
from typing import Any, Dict, Literal

from pydantic import BaseModel

ActionType = Literal[
    "switch_view",
    "open_settings",
    "open_memory",
    "toggle_focus_mode",
    "create_note",
    "search_web",
    "open_url",
    "new_chat",
    "none",
]

_FENCED_JSON_RE = re.compile(r"```(?:json)?\s*([\s\S]*?)\s*```", re.IGNORECASE)


class Action(BaseModel):
    type: ActionType = "none"
    params: Dict[str, Any] = {}
    confirm: bool = False
    label: str = ""


def parse_action_from_reply(text: str) -> tuple[str, Action]:
    """
    Extract an action block from LLM reply text.

    Returns (clean_reply_text, action). The JSON block is removed from the
    reply so users only see natural language.
    """
    for match in reversed(list(_FENCED_JSON_RE.finditer(text))):
        raw_json = match.group(1).strip()
        if '"action"' not in raw_json:
            continue
        try:
            data = json.loads(raw_json)
            action_data = data.get("action", {})
            action = Action.model_validate(action_data)
            clean_text = (text[: match.start()] + text[match.end() :]).strip()
            return clean_text, action
        except Exception:
            continue

    raw_json, span = _extract_last_action_object(text)
    if raw_json is None or span is None:
        return text.strip(), Action()

    try:
        data = json.loads(raw_json)
        action_data = data.get("action", {})
        action = Action.model_validate(action_data)
        clean_text = (text[: span[0]] + text[span[1] :]).strip()
        return clean_text, action
    except Exception:
        return text.strip(), Action()


def _extract_last_action_object(text: str) -> tuple[str | None, tuple[int, int] | None]:
    anchor = text.rfind('"action"')
    if anchor == -1:
        return None, None

    start = text.rfind("{", 0, anchor + 1)
    if start == -1:
        return None, None

    depth = 0
    in_string = False
    escape = False
    for idx in range(start, len(text)):
        ch = text[idx]
        if in_string:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == '"':
                in_string = False
            continue

        if ch == '"':
            in_string = True
        elif ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return text[start : idx + 1], (start, idx + 1)

    return None, None


# Swedish imperative phrases that signal action intent.
_ACTION_PHRASES = re.compile(
    r"\b(öppna|stäng|visa|byt till|skapa|lägg till|spara|sök|hitta|starta|"
    r"aktivera|inaktivera|fokusläge|minnesvyn|inställningar|ny chatt|"
    r"ny konversation|öppna webbläsaren|sök efter|navigera till|"
    r"launcher|workspace|meny|menyn|startsida|hem|"
    r"open|close|show|switch|create|save|search|find|start|activate|"
    r"new chat|focus mode)\b",
    re.IGNORECASE,
)


def classify_intent(message: str) -> Literal["chat", "action"]:
    """
    Classify message as 'chat' or 'action' using heuristics.
    Fast — no LLM call needed.
    """
    if _ACTION_PHRASES.search(message):
        return "action"
    return "chat"


ACTION_SYSTEM_ADDON = """
Du kan UTFÖRA åtgärder. Om användaren ber dig göra något, svara naturligt på svenska OCH avsluta med ett JSON-block:

```json
{"action": {"type": "<type>", "params": {}, "label": "<kort svensk beskrivning>"}}
```

Tillåtna types: switch_view (params: {"view": "core"|"chat"|"memory"|"developer"|"command-center"|"launcher"}), open_settings, open_memory, toggle_focus_mode, create_note (params: {"content": "..."}), search_web (params: {"query": "..."}), open_url (params: {"url": "..."}), new_chat, none.

Välj "none" om ingen åtgärd behövs. Inkludera ALLTID JSON-blocket sist i svaret.
"""
