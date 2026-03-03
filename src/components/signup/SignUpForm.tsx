"use client";

import { useState } from "react";
import type { RallyPointWithCount, SignupConfirmation } from "@/types";
import { TSHIRT_SIZES } from "@/lib/constants";
import { RoleSelector } from "./RoleSelector";
import { LocationPicker } from "./LocationPicker";
import { SiteLeaderFields } from "./SiteLeaderFields";
import { ConfirmationView } from "./ConfirmationView";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

interface SignUpFormProps {
  rallyPoints: RallyPointWithCount[];
  preselectedRallyPointId: string | null;
  onClose: () => void;
}

type Step = "role" | "location" | "details" | "confirmation";

interface FormState {
  role: "volunteer" | "site_leader" | "";
  rallyPointId: string;
  name: string;
  email: string;
  phone: string;
  groupSize: number;
  church: string;
  tshirtSize: string;
  previousExperience: string;
}

export function SignUpForm({ rallyPoints, preselectedRallyPointId, onClose }: SignUpFormProps) {
  const [step, setStep] = useState<Step>("role");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmation, setConfirmation] = useState<SignupConfirmation | null>(null);

  const [form, setForm] = useState<FormState>({
    role: "",
    rallyPointId: preselectedRallyPointId || "",
    name: "",
    email: "",
    phone: "",
    groupSize: 1,
    church: "",
    tshirtSize: "",
    previousExperience: "",
  });

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function handleRoleSelect(role: "volunteer" | "site_leader") {
    updateForm("role", role);
    if (preselectedRallyPointId) {
      setStep("details");
    } else {
      setStep("location");
    }
  }

  function handleLocationSelect(id: string) {
    updateForm("rallyPointId", id);
    setStep("details");
  }

  async function handleSubmit() {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = "Please enter a valid email";
    if (!form.tshirtSize) newErrors.tshirtSize = "Please select a size";
    if (form.groupSize < 1) newErrors.groupSize = "At least 1 person";
    if (form.role === "site_leader" && !form.previousExperience.trim())
      newErrors.previousExperience = "Please tell us about your experience";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          groupSize: form.groupSize,
          church: form.church.trim() || undefined,
          tshirtSize: form.tshirtSize,
          role: form.role,
          rallyPointId: form.rallyPointId,
          previousExperience: form.previousExperience.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          const fieldErrors: Record<string, string> = {};
          for (const [key, messages] of Object.entries(data.errors)) {
            if (Array.isArray(messages) && messages.length > 0) {
              fieldErrors[key] = messages[0] as string;
            }
          }
          setErrors(fieldErrors);
        } else {
          setErrors({ form: data.error || "Something went wrong. Please try again." });
        }
        return;
      }

      setConfirmation(data.confirmation);
      setStep("confirmation");
    } catch {
      setErrors({ form: "Network error. Please check your connection and try again." });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (step === "confirmation" && confirmation) {
    return <ConfirmationView confirmation={confirmation} onClose={onClose} />;
  }

  const selectedRallyPoint = rallyPoints.find((rp) => rp.id === form.rallyPointId);
  const isLocationFull = selectedRallyPoint
    ? selectedRallyPoint.volunteer_count >= selectedRallyPoint.capacity
    : false;

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {/* Scrollable content */}
      <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1 modal-scrollbar">
        {/* Header */}
        <div className="text-center">
          <h2 className="font-heading text-xl font-black text-indy-navy">Sign Up to Serve</h2>
          <p className="text-sm text-gray-500 mt-1">
            {step === "role" && "Choose how you want to help"}
            {step === "location" && "Select where you want to serve"}
            {step === "details" && "Tell us about yourself"}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2">
          {["role", "location", "details"].map((s, i) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s === step ? "w-8 bg-indy-red" : i < ["role", "location", "details"].indexOf(step) ? "w-8 bg-indy-navy" : "w-8 bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        {step === "role" && (
          <RoleSelector value={form.role} onChange={handleRoleSelect} />
        )}

        {step === "location" && (
          <LocationPicker
            rallyPoints={rallyPoints}
            value={form.rallyPointId}
            onChange={handleLocationSelect}
            error={errors.rallyPointId}
          />
        )}

        {step === "details" && (
          <div className="space-y-4">
            {errors.form && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {errors.form}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => updateForm("name", e.target.value)}
                error={errors.name}
                required
              />
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => updateForm("email", e.target.value)}
                error={errors.email}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Phone (optional)"
                type="tel"
                placeholder="(317) 555-1234"
                value={form.phone}
                onChange={(e) => updateForm("phone", e.target.value)}
                error={errors.phone}
              />
              <Input
                label="Group Size"
                type="number"
                min={1}
                max={50}
                value={form.groupSize}
                onChange={(e) => updateForm("groupSize", parseInt(e.target.value) || 1)}
                error={errors.groupSize}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Church / Organization (optional)"
                placeholder="Your church or group name"
                value={form.church}
                onChange={(e) => updateForm("church", e.target.value)}
              />
              <Select
                label="T-Shirt Size"
                value={form.tshirtSize}
                onChange={(e) => updateForm("tshirtSize", e.target.value)}
                placeholder="Select size"
                options={TSHIRT_SIZES.map((s) => ({ value: s, label: s }))}
                error={errors.tshirtSize}
              />
            </div>

            {form.role === "site_leader" && (
              <SiteLeaderFields
                previousExperience={form.previousExperience}
                onExperienceChange={(v) => updateForm("previousExperience", v)}
                error={errors.previousExperience}
              />
            )}
          </div>
        )}
      </div>

      {/* Sticky footer buttons — always visible, never hidden behind scroll */}
      {step === "location" && (
        <div className="px-6 sm:px-8 py-4 border-t border-gray-100 bg-white rounded-b-2xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep("role")}
            className="w-full"
          >
            Back
          </Button>
        </div>
      )}

      {step === "details" && (
        <div className="px-6 sm:px-8 py-4 border-t border-gray-100 bg-white rounded-b-2xl space-y-3">
          {isLocationFull && (
            <p className="text-sm text-center text-red-600 font-medium">
              {selectedRallyPoint?.name} is full — please go back and choose another location.
            </p>
          )}
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={() => setStep(preselectedRallyPointId ? "role" : "location")}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || isLocationFull}
              className="flex-1"
            >
              {isSubmitting ? "Signing Up..." : "Sign Up"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
