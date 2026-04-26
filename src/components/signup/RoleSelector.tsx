"use client";

import type { SignupRole } from "@/types";

interface RoleSelectorProps {
  value: SignupRole | "";
  onChange: (role: SignupRole) => void;
}

const OPTIONS: { value: SignupRole; icon: string; title: string; description: string }[] = [
  {
    value: "volunteer",
    icon: "🧹",
    title: "Sign Up to Volunteer",
    description: "Join a team at a rally point and help clean up your neighborhood.",
  },
  {
    value: "site_leader",
    icon: "📋",
    title: "Lead a Rally Point",
    description: "Manage ~30 volunteers at one park. We'll train you beforehand.",
  },
  {
    value: "group_lead",
    icon: "👥",
    title: "Bring Your Group",
    description: "Your church, company, or organization takes a whole rally point — bring ~30 of your people.",
  },
];

export function RoleSelector({ value, onChange }: RoleSelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-heading text-lg font-bold text-indy-navy text-center">
        How do you want to serve?
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`p-6 rounded-xl border-2 text-left transition-all cursor-pointer ${
              value === opt.value
                ? "border-indy-red bg-indy-red/5"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="text-2xl mb-2">{opt.icon}</div>
            <h4 className="font-bold text-indy-navy">{opt.title}</h4>
            <p className="text-sm text-gray-500 mt-1">{opt.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
