"use client";

import { useState, useMemo } from "react";
import type { RallyPointWithCount } from "@/types";
import { getDensityLevel, DENSITY_LABELS } from "@/lib/utils";

interface LocationPickerProps {
  rallyPoints: RallyPointWithCount[];
  value: string;
  onChange: (id: string) => void;
  error?: string;
  role?: string;
}

export function LocationPicker({ rallyPoints, value, onChange, error, role }: LocationPickerProps) {
  const [search, setSearch] = useState("");

  const zones = useMemo(() => {
    const grouped: Record<string, RallyPointWithCount[]> = {};
    for (const rp of rallyPoints) {
      const zone = rp.zone || "Other";
      if (!grouped[zone]) grouped[zone] = [];
      grouped[zone].push(rp);
    }
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, [rallyPoints]);

  const filtered = useMemo(() => {
    if (!search.trim()) return zones;
    const q = search.toLowerCase();
    return zones
      .map(([zone, points]) => [
        zone,
        points.filter(
          (rp) =>
            rp.name.toLowerCase().includes(q) ||
            rp.zone?.toLowerCase().includes(q) ||
            rp.address.toLowerCase().includes(q)
        ),
      ] as [string, RallyPointWithCount[]])
      .filter(([, points]) => points.length > 0);
  }, [zones, search]);

  return (
    <div className="space-y-4">
      <h3 className="font-heading text-lg font-bold text-indy-navy text-center">
        Pick your rally point
      </h3>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by park name or zone..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indy-navy/20 focus:border-indy-navy placeholder:text-gray-400"
      />

      {/* Location list */}
      <div className="max-h-64 overflow-y-auto space-y-4 modal-scrollbar">
        {filtered.map(([zone, points]) => (
          <div key={zone}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 sticky top-0 bg-white py-1">
              {zone}
            </p>
            <div className="space-y-2">
              {points.map((rp) => {
                const density = getDensityLevel(rp.volunteer_count);
                const isSelected = value === rp.id;
                const isFull = rp.volunteer_count >= rp.capacity;
                const hasLeader = role === "site_leader" && !!rp.site_leader_id;
                const isAdopted = !!rp.adopted_by;
                // Group leads can't claim a park another group already adopted —
                // surface it here so they self-select instead of getting bounced
                // into the conflict path after submit.
                const adoptionBlocks = isAdopted && role === "group_lead";
                const isDisabled = isFull || hasLeader || adoptionBlocks;
                return (
                  <button
                    key={rp.id}
                    type="button"
                    onClick={() => !isDisabled && onChange(rp.id)}
                    disabled={isDisabled}
                    className={`w-full p-3 rounded-lg border text-left transition-all ${
                      isDisabled
                        ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                        : isSelected
                        ? "border-indy-red bg-indy-red/5 cursor-pointer"
                        : "border-gray-200 hover:border-gray-300 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <span className="font-semibold text-sm text-indy-navy">
                          {rp.name}
                        </span>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {rp.address}
                        </p>
                        {isAdopted && (
                          <p className="text-[10px] text-indy-gold font-bold uppercase tracking-wider mt-1 truncate">
                            ⚑ Adopted by {rp.adopted_by}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <span className="text-xs font-semibold text-gray-700">
                          {rp.volunteer_count}/{rp.capacity}
                        </span>
                        {hasLeader ? (
                          <p className="text-xs text-gray-400 font-semibold">Has leader</p>
                        ) : isFull ? (
                          <p className="text-xs text-gray-400 font-semibold">Full</p>
                        ) : adoptionBlocks ? (
                          <p className="text-xs text-gray-400 font-semibold">Already adopted</p>
                        ) : isAdopted ? (
                          <p className="text-xs font-semibold text-indy-gold">Group</p>
                        ) : (
                          <p className="text-xs" style={{
                            color: density === "low" ? "#8fcea0" :
                            density === "medium" ? "#2ea043" : "#013d0e"
                          }}>
                            {DENSITY_LABELS[density]}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            No locations found matching &ldquo;{search}&rdquo;
          </p>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
