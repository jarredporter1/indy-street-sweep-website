"use client";

import { useRef } from "react";
import type { RallyPointWithCount } from "@/types";
import { getDensityLevel, DENSITY_COLORS, DENSITY_TEXT_COLORS, DENSITY_LABELS } from "@/lib/utils";

export type SheetState = "peek" | "list" | "detail";

interface MobileBottomSheetProps {
  state: SheetState;
  onStateChange: (state: SheetState) => void;
  filteredZones: [string, RallyPointWithCount[]][];
  selectedPoint: RallyPointWithCount | null;
  search: string;
  onSearchChange: (value: string) => void;
  onSelectPoint: (rp: RallyPointWithCount) => void;
  onSignUp: (id: string) => void;
  totalCount: number;
}

export function MobileBottomSheet({
  state,
  onStateChange,
  filteredZones,
  selectedPoint,
  search,
  onSearchChange,
  onSelectPoint,
  onSignUp,
  totalCount,
}: MobileBottomSheetProps) {
  const touchStartY = useRef(0);
  const isDragging = useRef(false);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = true;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!isDragging.current) return;
    isDragging.current = false;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (deltaY > 60) {
      // Swiped down
      if (state === "detail") onStateChange("peek");
      else if (state === "list") onStateChange("peek");
    } else if (deltaY < -60 && state === "peek") {
      // Swiped up from peek
      onStateChange("list");
    }
  }

  const getTransform = () => {
    switch (state) {
      case "peek":
        return "translateY(calc(100% - 84px))";
      case "list":
        return "translateY(0)";
      case "detail":
        return "translateY(45%)";
    }
  };

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-[1000] bg-white rounded-t-2xl flex flex-col"
      style={{
        height: "70vh",
        transform: getTransform(),
        transition: "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
        boxShadow: "0 -4px 30px rgba(0,0,0,0.12)",
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Drag handle */}
      <div
        className="flex flex-col items-center pt-2.5 pb-1 cursor-pointer shrink-0"
        onClick={() => onStateChange(state === "peek" ? "list" : "peek")}
      >
        <div className="w-9 h-[5px] rounded-full bg-gray-300" />
      </div>

      {/* Content */}
      {state === "detail" && selectedPoint ? (
        <DetailContent
          point={selectedPoint}
          onBack={() => onStateChange("list")}
          onSignUp={onSignUp}
        />
      ) : (
        <ListContent
          zones={filteredZones}
          search={search}
          onSearchChange={onSearchChange}
          onSelectPoint={(rp) => {
            onSelectPoint(rp);
            onStateChange("detail");
          }}
          totalCount={totalCount}
          isPeek={state === "peek"}
          onFocusSearch={() => {
            if (state === "peek") onStateChange("list");
          }}
        />
      )}
    </div>
  );
}

/* ─── Detail view ─── */
function DetailContent({
  point,
  onBack,
  onSignUp,
}: {
  point: RallyPointWithCount;
  onBack: () => void;
  onSignUp: (id: string) => void;
}) {
  const density = getDensityLevel(point.volunteer_count);
  const color = DENSITY_COLORS[density];
  const isFull = point.volunteer_count >= point.capacity;

  return (
    <div className="px-5 pb-6 space-y-4">
      {/* Back + title */}
      <div className="flex items-start gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBack();
          }}
          className="mt-0.5 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 shrink-0 active:bg-gray-200 transition-colors"
        >
          <svg
            className="w-4 h-4 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-lg text-indy-navy leading-tight">
            {point.name}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">{point.address}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full">
          <span className="text-sm font-bold text-indy-navy">
            {point.volunteer_count}
          </span>
          <span className="text-xs text-gray-400">/ {point.capacity}</span>
        </div>
        <span
          className="text-xs font-semibold px-3 py-1.5 rounded-full"
          style={{
            backgroundColor: `${color}15`,
            color,
          }}
        >
          {DENSITY_LABELS[density]}
        </span>
        {point.zone && (
          <span className="text-xs text-gray-400">{point.zone}</span>
        )}
      </div>

      {point.adopted_by && (
        <div className="bg-indy-cream border-l-4 border-indy-gold rounded p-3 text-xs text-indy-navy">
          <p className="font-bold uppercase tracking-wider text-indy-gold mb-0.5">
            ⚑ Adopted by a group
          </p>
          <p className="text-indy-navy">
            {point.adopted_by}
            {point.expected_size ? (
              <span className="text-gray-500">
                {" "}· {point.volunteer_count} of {point.expected_size} signed up
              </span>
            ) : null}
          </p>
        </div>
      )}

      {/* CTA */}
      {isFull ? (
        <div className="w-full py-3.5 bg-gray-200 text-gray-500 text-sm font-semibold rounded-xl text-center">
          This location is full
        </div>
      ) : (
        <button
          onClick={() => onSignUp(point.id)}
          className="w-full py-3.5 bg-indy-navy text-white text-sm font-bold rounded-xl active:scale-[0.98] transition-transform cursor-pointer"
        >
          Sign Up at {point.name}
        </button>
      )}
    </div>
  );
}

/* ─── List view (also renders in peek, mostly hidden) ─── */
function ListContent({
  zones,
  search,
  onSearchChange,
  onSelectPoint,
  totalCount,
  isPeek,
  onFocusSearch,
}: {
  zones: [string, RallyPointWithCount[]][];
  search: string;
  onSearchChange: (v: string) => void;
  onSelectPoint: (rp: RallyPointWithCount) => void;
  totalCount: number;
  isPeek: boolean;
  onFocusSearch: () => void;
}) {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Search bar */}
      <div className="px-4 pb-3 shrink-0">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder={`Search ${totalCount} rally points...`}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={onFocusSearch}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indy-navy/20 placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Scrollable list (hidden in peek) */}
      {!isPeek && (
        <div className="flex-1 overflow-y-auto modal-scrollbar">
          {zones.map(([zone, points]) => (
            <div key={zone}>
              <div className="sticky top-0 bg-gray-50/95 backdrop-blur-sm px-4 py-2 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {zone}
                </span>
              </div>
              {points.map((rp) => {
                const density = getDensityLevel(rp.volunteer_count);
                const color = DENSITY_COLORS[density];
                const isFull = rp.volunteer_count >= rp.capacity;
                return (
                  <button
                    key={rp.id}
                    onClick={() => onSelectPoint(rp)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-100/60 text-left active:bg-gray-50 transition-colors"
                  >
                    {/* Density circle */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                      style={{
                        backgroundColor: isFull ? "#9ca3af" : color,
                        color: isFull ? "white" : DENSITY_TEXT_COLORS[density],
                      }}
                    >
                      {rp.volunteer_count}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-indy-navy truncate">
                        {rp.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {rp.address}
                      </p>
                      {rp.adopted_by && (
                        <p className="text-[10px] text-indy-gold font-bold uppercase tracking-wider mt-0.5 truncate">
                          ⚑ Adopted by {rp.adopted_by}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      {isFull ? (
                        <p className="text-xs font-semibold text-gray-400">Full</p>
                      ) : (
                        <p className="text-xs font-medium" style={{ color }}>
                          {rp.adopted_by ? "Group" : DENSITY_LABELS[density]}
                        </p>
                      )}
                      <p className="text-xs text-gray-400">
                        {rp.volunteer_count}/{rp.capacity}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
          {zones.length === 0 && (
            <div className="p-8 text-center text-sm text-gray-400">
              No locations found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
