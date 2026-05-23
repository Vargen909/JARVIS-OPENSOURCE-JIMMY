"use client";

import { useState } from "react";

export function useWebView() {
  const [state, setState] = useState({ isOpen: false, url: "" });

  const openUrl = (url: string) => setState({ isOpen: true, url });
  const close = () => setState((current) => ({ ...current, isOpen: false }));

  return { ...state, openUrl, close };
}
