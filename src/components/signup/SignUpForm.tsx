"use client";

import { useState } from "react";
import type { RallyPointWithCount, SignupConfirmation, GroupMember, SignupRole, OrgType } from "@/types";
import { TSHIRT_SIZES } from "@/lib/constants";
import { RoleSelector } from "./RoleSelector";
import { LocationPicker } from "./LocationPicker";
import { SiteLeaderFields } from "./SiteLeaderFields";
import { GroupMemberFields } from "./GroupMemberFields";
import { GroupLeadFields } from "./GroupLeadFields";
import { ConfirmationView } from "./ConfirmationView";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

interface SignUpFormProps {
  rallyPoints: RallyPointWithCount[];
  preselectedRallyPointId: string | null;
  shareLink?: ShareLinkContext | null;
  onClose: () => void;
}

export interface ShareLinkContext {
  groupCode: string;
  church: string;
  rallyPointId: string;
}

type Step = "role" | "groupDetails" | "location" | "details" | "confirmation";

interface FormState {
  role: SignupRole | "";
  rallyPointId: string;
  name: string;
  email: string;
  phone: string;
  groupSize: number;
  church: string;
  tshirtSize: string;
  bringingOthers: boolean;
  groupMembers: GroupMember[];
  // Site leader fields
  previousSweep: string;
  meetingPreference: string;
  // Group lead fields
  orgName: string;
  orgType: OrgType | "";
  expectedSize: number;
  notes: string;
}

export function SignUpForm({ rallyPoints, preselectedRallyPointId, shareLink, onClose }: SignUpFormProps) {
  const isShareLinkMode = Boolean(shareLink);

  const [step, setStep] = useState<Step>(isShareLinkMode ? "details" : "role");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmation, setConfirmation] = useState<SignupConfirmation | null>(null);

  const [form, setForm] = useState<FormState>({
    role: isShareLinkMode ? "volunteer" : "",
    rallyPointId: shareLink?.rallyPointId || preselectedRallyPointId || "",
    name: "",
    email: "",
    phone: "",
    groupSize: 1,
    church: shareLink?.church || "",
    tshirtSize: "",
    bringingOthers: false,
    groupMembers: [],
    previousSweep: "",
    meetingPreference: "",
    orgName: "",
    orgType: "",
    expectedSize: 30,
    notes: "",
  });

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function handleBringingOthersToggle(bringing: boolean) {
    updateForm("bringingOthers", bringing);
    if (bringing) {
      updateForm("groupSize", 2);
      updateForm("groupMembers", [{ name: "", email: "", tshirtSize: "" }]);
    } else {
      updateForm("groupSize", 1);
      updateForm("groupMembers", []);
    }
  }

  function handleGroupSizeChange(total: number) {
    const additionalCount = total - 1;
    const currentMembers = form.groupMembers;
    let newMembers: GroupMember[];

    if (additionalCount > currentMembers.length) {
      newMembers = [
        ...currentMembers,
        ...Array.from({ length: additionalCount - currentMembers.length }, () => ({
          name: "",
          email: "",
          tshirtSize: "",
        })),
      ];
    } else {
      newMembers = currentMembers.slice(0, additionalCount);
    }

    updateForm("groupSize", total);
    updateForm("groupMembers", newMembers);
  }

  function handleSiteLeaderFieldChange(field: string, value: string) {
    updateForm(field as keyof FormState, value as never);
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function handleGroupLeadFieldChange(
    field: "orgName" | "orgType" | "expectedSize" | "notes",
    value: string | number,
  ) {
    updateForm(field as keyof FormState, value as never);
  }

  function handleRoleSelect(role: SignupRole) {
    updateForm("role", role);
    if (role === "group_lead") {
      setStep("groupDetails");
      return;
    }
    if (preselectedRallyPointId) {
      setStep("details");
    } else {
      setStep("location");
    }
  }

  function handleGroupDetailsContinue() {
    const newErrors: Record<string, string> = {};
    if (!form.orgName.trim()) newErrors.orgName = "Organization name is required";
    if (!form.orgType) newErrors.orgType = "Please select an organization type";
    if (!form.expectedSize || form.expectedSize < 5) {
      newErrors.expectedSize = "At least 5 people";
    } else if (form.expectedSize > 50) {
      newErrors.expectedSize = "Maximum 50 per rally point";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setStep("location");
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
    if (!form.phone.trim()) newErrors.phone = "Phone number is required";
    else if (!/^\+?[\d\s()\-]{7,15}$/.test(form.phone))
      newErrors.phone = "Please enter a valid phone number";
    if (form.groupSize < 1) newErrors.groupSize = "At least 1 person";

    if (form.bringingOthers && form.groupMembers.length > 0) {
      const first = form.groupMembers[0];
      if (!first.name.trim()) newErrors["groupMembers.0.name"] = "Name is required";
      if (!first.email.trim()) newErrors["groupMembers.0.email"] = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(first.email))
        newErrors["groupMembers.0.email"] = "Please enter a valid email";
    }

    if (form.role === "site_leader") {
      if (!form.previousSweep) newErrors.previousSweep = "Please select an option";
      if (!form.meetingPreference) newErrors.meetingPreference = "Please select an option";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    const filledMembers = form.groupMembers.filter(
      (m) => m.name.trim() && m.email.trim()
    );

    const isGroupLead = form.role === "group_lead";

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          groupSize: isGroupLead
            ? 1
            : form.bringingOthers
              ? 1 + filledMembers.length
              : 1,
          church: isGroupLead
            ? form.orgName.trim() || undefined
            : form.church.trim() || undefined,
          tshirtSize: isGroupLead ? undefined : form.tshirtSize || undefined,
          role: form.role,
          rallyPointId: form.rallyPointId,
          groupMembers: isGroupLead
            ? []
            : filledMembers.map((m) => ({
                name: m.name.trim(),
                email: m.email.trim(),
                tshirtSize: m.tshirtSize || undefined,
              })),
          ...(form.role === "site_leader" && {
            previousSweep: form.previousSweep,
            meetingPreference: form.meetingPreference,
          }),
          ...(isGroupLead && {
            orgName: form.orgName.trim(),
            orgType: form.orgType || undefined,
            expectedSize: form.expectedSize,
            notes: form.notes.trim() || undefined,
          }),
          ...(shareLink && { groupCode: shareLink.groupCode }),
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

      // Strip share-link query params so a refresh doesn't auto-reopen
      // the modal and tempt this person into double-submitting.
      if (shareLink && typeof window !== "undefined") {
        window.history.replaceState({}, "", window.location.pathname);
      }
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
  const isGroupLead = form.role === "group_lead";
  // Capacity check is informational for group_lead (intake doesn't reserve seats)
  const isLocationFull = !isGroupLead && selectedRallyPoint
    ? selectedRallyPoint.volunteer_count >= selectedRallyPoint.capacity
    : false;

  // Step indicator: omit "groupDetails" pip unless we're on the group_lead path
  const stepKeys: Step[] = isGroupLead
    ? ["role", "groupDetails", "location", "details"]
    : ["role", "location", "details"];

  function backFromDetails() {
    if (isShareLinkMode) {
      // Share-link landed straight on details; nothing to go back to here
      return;
    }
    if (preselectedRallyPointId && !isGroupLead) {
      setStep("role");
      return;
    }
    setStep("location");
  }

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1 modal-scrollbar">
        <div className="text-center">
          <h2 className="font-heading text-xl font-black text-indy-navy">
            {isShareLinkMode ? "Join Your Group" : "Sign Up to Serve"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {step === "role" && "Choose how you want to help"}
            {step === "groupDetails" && "Tell us about your group"}
            {step === "location" && (isGroupLead ? "Pick your preferred park" : "Select where you want to serve")}
            {step === "details" && (isGroupLead ? "Your contact info" : "Tell us about yourself")}
          </p>
        </div>

        {/* Step indicator */}
        {!isShareLinkMode && (
          <div className="flex items-center justify-center gap-2">
            {stepKeys.map((s, i) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  s === step
                    ? "w-8 bg-indy-red"
                    : i < stepKeys.indexOf(step)
                      ? "w-8 bg-indy-navy"
                      : "w-8 bg-gray-200"
                }`}
              />
            ))}
          </div>
        )}

        {/* Step content */}
        {step === "role" && (
          <RoleSelector value={form.role} onChange={handleRoleSelect} />
        )}

        {step === "groupDetails" && (
          <GroupLeadFields
            orgName={form.orgName}
            orgType={form.orgType}
            expectedSize={form.expectedSize}
            notes={form.notes}
            onChange={handleGroupLeadFieldChange}
            errors={errors}
          />
        )}

        {step === "location" && (
          <LocationPicker
            rallyPoints={rallyPoints}
            value={form.rallyPointId}
            onChange={handleLocationSelect}
            error={errors.rallyPointId}
            role={form.role}
          />
        )}

        {step === "details" && (
          <div className="space-y-4">
            {errors.form && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {errors.form}
              </div>
            )}

            {shareLink && selectedRallyPoint && (
              <div className="bg-indy-cream border-l-4 border-indy-gold p-3 text-sm text-indy-navy">
                <p className="font-semibold">Signing up with {shareLink.church}</p>
                <p className="text-indy-navy/80">Rally point: {selectedRallyPoint.name}</p>
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
                label="Phone"
                type="tel"
                placeholder="(317) 555-1234"
                value={form.phone}
                onChange={(e) => updateForm("phone", e.target.value)}
                error={errors.phone}
                required
              />
              {!isGroupLead && (
                <Input
                  label="Church / Organization (optional)"
                  placeholder="Your church or group name"
                  value={form.church}
                  onChange={(e) => updateForm("church", e.target.value)}
                  readOnly={isShareLinkMode}
                  className={isShareLinkMode ? "bg-gray-50 text-gray-600 cursor-not-allowed" : ""}
                />
              )}
            </div>

            {!isGroupLead && (
              <div className="max-w-[200px]">
                <Select
                  label="T-Shirt Size (optional)"
                  value={form.tshirtSize}
                  onChange={(e) => updateForm("tshirtSize", e.target.value)}
                  placeholder="Select size"
                  options={TSHIRT_SIZES.map((s) => ({ value: s, label: s }))}
                  error={errors.tshirtSize}
                />
              </div>
            )}

            {!isGroupLead && (
              <div className="space-y-3">
                <p className="block text-sm font-medium text-gray-700">
                  Are you bringing other people?
                </p>
                <div className="flex gap-3">
                  {([
                    { value: true, label: "Yes" },
                    { value: false, label: "No, just me" },
                  ] as const).map(({ value, label }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => handleBringingOthersToggle(value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        form.bringingOthers === value
                          ? "bg-indy-navy text-white border-indy-navy"
                          : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!isGroupLead && form.bringingOthers && (
              <div className="space-y-4">
                <div className="max-w-[200px]">
                  <Select
                    label="How many people total (including you)?"
                    value={String(form.groupSize)}
                    onChange={(e) => handleGroupSizeChange(parseInt(e.target.value))}
                    options={Array.from({ length: 9 }, (_, i) => ({
                      value: String(i + 2),
                      label: String(i + 2),
                    }))}
                  />
                </div>
                <GroupMemberFields
                  members={form.groupMembers}
                  onChange={(members) => updateForm("groupMembers", members)}
                  errors={errors}
                />
              </div>
            )}

            {form.role === "site_leader" && (
              <SiteLeaderFields
                previousSweep={form.previousSweep}
                meetingPreference={form.meetingPreference}
                onFieldChange={handleSiteLeaderFieldChange}
                errors={errors}
              />
            )}

            {isGroupLead && (
              <p className="text-sm text-gray-500">
                After you submit, we&apos;ll email you within 1&ndash;2 business days to confirm your park and send a sign-up link you can share with your group.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Sticky footer buttons */}
      {step === "groupDetails" && (
        <div className="px-6 sm:px-8 py-4 border-t border-gray-100 bg-white rounded-b-2xl">
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={() => setStep("role")}
              className="flex-1"
            >
              Back
            </Button>
            <Button onClick={handleGroupDetailsContinue} className="flex-1">
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === "location" && (
        <div className="px-6 sm:px-8 py-4 border-t border-gray-100 bg-white rounded-b-2xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep(isGroupLead ? "groupDetails" : "role")}
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
            {!isShareLinkMode && (
              <Button
                variant="ghost"
                onClick={backFromDetails}
                className="flex-1"
              >
                Back
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || isLocationFull}
              className="flex-1"
            >
              {isSubmitting
                ? "Submitting..."
                : isGroupLead
                  ? "Submit Request"
                  : "Sign Up"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
