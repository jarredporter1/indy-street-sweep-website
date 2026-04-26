"use client";

import { useSignUpModal } from "@/hooks/useSignUpModal";
import type { RallyPointWithCount } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { SignUpForm } from "./SignUpForm";

interface SignUpModalProps {
  rallyPoints: RallyPointWithCount[];
}

export function SignUpModal({ rallyPoints }: SignUpModalProps) {
  const { isOpen, preselectedRallyPointId, shareLink, close } = useSignUpModal();

  return (
    <Modal isOpen={isOpen} onClose={close}>
      <SignUpForm
        key={isOpen ? "open" : "closed"}
        rallyPoints={rallyPoints}
        preselectedRallyPointId={preselectedRallyPointId}
        shareLink={shareLink}
        onClose={close}
      />
    </Modal>
  );
}
