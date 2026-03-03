"use client";

interface SiteLeaderFieldsProps {
  previousExperience: string;
  onExperienceChange: (value: string) => void;
  error?: string;
}

export function SiteLeaderFields({
  previousExperience,
  onExperienceChange,
  error,
}: SiteLeaderFieldsProps) {
  return (
    <div className="space-y-4 p-4 bg-indy-navy/5 rounded-xl">
      <p className="text-sm font-semibold text-indy-navy">
        Site Leader Details
      </p>

      <div className="space-y-1">
        <label htmlFor="experience" className="block text-sm font-medium text-gray-700">
          Tell us about your experience leading groups or community events
        </label>
        <textarea
          id="experience"
          value={previousExperience}
          onChange={(e) => onExperienceChange(e.target.value)}
          rows={3}
          placeholder="Have you done a Roots Realty Street Sweep before? Led a volunteer team? Tell us a bit..."
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indy-navy/20 focus:border-indy-navy placeholder:text-gray-400 resize-none"
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>

    </div>
  );
}
