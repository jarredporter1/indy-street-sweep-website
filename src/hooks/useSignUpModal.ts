"use client";

import { createContext, useContext } from "react";
import type { ShareLinkContext } from "@/components/signup/SignUpForm";

interface SignUpModalContextValue {
  isOpen: boolean;
  preselectedRallyPointId: string | null;
  shareLink: ShareLinkContext | null;
  open: (rallyPointId?: string) => void;
  close: () => void;
}

export const SignUpModalContext = createContext<SignUpModalContextValue>({
  isOpen: false,
  preselectedRallyPointId: null,
  shareLink: null,
  open: () => {},
  close: () => {},
});

export function useSignUpModal() {
  return useContext(SignUpModalContext);
}
