"use client";

import type { OrgType } from "@/types";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

const ORG_TYPE_OPTIONS: { value: OrgType; label: string }[] = [
  { value: "church", label: "Church" },
  { value: "company", label: "Company" },
  { value: "nonprofit", label: "Nonprofit" },
  { value: "school", label: "School" },
  { value: "scout_youth", label: "Scout / Youth group" },
  { value: "neighborhood", label: "Neighborhood group" },
  { value: "other", label: "Other" },
];

interface GroupLeadFieldsProps {
  orgName: string;
  orgType: OrgType | "";
  expectedSize: number;
  notes: string;
  onChange: (field: "orgName" | "orgType" | "expectedSize" | "notes", value: string | number) => void;
  errors: Record<string, string>;
}

export function GroupLeadFields({
  orgName,
  orgType,
  expectedSize,
  notes,
  onChange,
  errors,
}: GroupLeadFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="bg-indy-cream border-l-4 border-indy-gold p-3 text-sm text-indy-navy">
        Tell us about your group. We&apos;ll follow up to confirm a park and send a sign-up link you can share with everyone.
      </div>

      <Input
        label="Organization name"
        placeholder="First Baptist Church, Acme Co., Troop 47..."
        value={orgName}
        onChange={(e) => onChange("orgName", e.target.value)}
        error={errors.orgName}
        required
      />

      <Select
        label="Organization type"
        value={orgType}
        onChange={(e) => onChange("orgType", e.target.value)}
        placeholder="Select a type"
        options={ORG_TYPE_OPTIONS}
        error={errors.orgType}
        required
      />

      <Input
        label="Estimated group size"
        type="number"
        min={5}
        max={50}
        value={expectedSize || ""}
        onChange={(e) => onChange("expectedSize", parseInt(e.target.value || "0", 10))}
        error={errors.expectedSize}
        required
      />

      <div className="space-y-1">
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Anything else we should know? (optional)
        </label>
        <textarea
          id="notes"
          rows={3}
          value={notes}
          onChange={(e) => onChange("notes", e.target.value)}
          placeholder="Preferred park, pastor wants to lead, dietary needs, etc."
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indy-navy/20 focus:border-indy-navy placeholder:text-gray-400"
        />
      </div>
    </div>
  );
}
