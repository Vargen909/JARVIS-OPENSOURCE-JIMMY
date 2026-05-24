"use client";

import { useReducer, useCallback } from "react";
import {
  bobReducer,
  INITIAL_STATE,
  subtitleForState,
  isBusy,
  canRecord,
  type BobEvent,
  type BobState,
  type BobStateData,
} from "@/lib/bob-state";

export type { BobState, BobEvent, BobStateData };

export interface UseBobState {
  data: BobStateData;
  state: BobState;
  subtitle: string;
  isBusy: boolean;
  canRecord: boolean;
  dispatch: (event: BobEvent) => void;
  reset: () => void;
}

export function useBobState(): UseBobState {
  const [data, dispatch] = useReducer(bobReducer, INITIAL_STATE);

  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return {
    data,
    state: data.state,
    subtitle: subtitleForState(data),
    isBusy: isBusy(data.state),
    canRecord: canRecord(data.state),
    dispatch,
    reset,
  };
}
