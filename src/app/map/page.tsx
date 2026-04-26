"use client";

import { useState, useCallback, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { RallyPointWithCount } from "@/types";
import type { ShareLinkContext } from "@/components/signup/SignUpForm";
import { RALLY_POINT_SEED_DATA, VOLUNTEER_GOAL } from "@/lib/constants";
import { SignUpModalContext } from "@/hooks/useSignUpModal";
import { useRallyPoints } from "@/hooks/useRallyPoints";
import { useVolunteerCount } from "@/hooks/useVolunteerCount";
import { HeatMapLoader } from "@/components/map/HeatMapLoader";
import { SignUpModal } from "@/components/signup/SignUpModal";

function getFallbackRallyPoints(): RallyPointWithCount[] {
  return RALLY_POINT_SEED_DATA.map((rp, i) => ({
    id: `rp-${i + 1}`,
    name: rp.name,
    address: rp.address,
    lat: rp.lat,
    lng: rp.lng,
    description: null,
    capacity: rp.capacity,
    zone: rp.zone,
    site_leader_id: null,
    volunteer_count: 0,
    signup_count: 0,
  }));
}

export default function MapPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-background" />}>
      <MapPageInner />
    </Suspense>
  );
}

function MapPageInner() {
  const searchParams = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [preselectedRallyPointId, setPreselectedRallyPointId] = useState<string | null>(null);

  // Single source of truth — one fetch on mount, one poll every 30s
  const rallyPoints = useRallyPoints(getFallbackRallyPoints());
  const count = useVolunteerCount(0);

  // Build share-link context from URL params if present (?group=...&church=...&park=...).
  // When all three are present and the park resolves to a real rally point, we treat
  // this as a group member following their POC's invite link.
  const shareLink = useMemo<ShareLinkContext | null>(() => {
    const group = searchParams?.get("group")?.trim() || "";
    const church = searchParams?.get("church")?.trim() || "";
    const park = searchParams?.get("park")?.trim() || "";
    if (!group || !church || !park) return null;
    const exists = rallyPoints.some((rp) => rp.id === park);
    if (!exists) return null;
    return { groupCode: group, church, rallyPointId: park };
  }, [searchParams, rallyPoints]);

  const open = useCallback((rallyPointId?: string) => {
    setPreselectedRallyPointId(rallyPointId || null);
    setIsModalOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsModalOpen(false);
    setPreselectedRallyPointId(null);
  }, []);

  // Auto-open the modal once when arriving via a valid share-link.
  useEffect(() => {
    if (shareLink && !isModalOpen) {
      setIsModalOpen(true);
    }
    // Run only on shareLink resolution; we don't want to re-open on subsequent closes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareLink]);

  const percentage = Math.min((count / VOLUNTEER_GOAL) * 100, 100);

  return (
    <SignUpModalContext.Provider
      value={{ isOpen: isModalOpen, preselectedRallyPointId, shareLink, open, close }}
    >
      <div className="h-screen flex flex-col bg-background">
        {/* Top bar */}
        <header className="shrink-0 border-b border-gray-200 bg-white px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 group">
                <svg className="w-5 h-5 text-gray-400 group-hover:text-indy-navy transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <Image
                  src="/images/logos/Street Sweep Logo Transparent 1.png"
                  alt="Street Sweep Indy"
                  width={120}
                  height={34}
                  className="h-8 w-auto"
                />
              </Link>
            </div>

            {/* Live counter in header */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black text-indy-navy tabular-nums">{count.toLocaleString()}</span>
                  <span className="text-sm font-bold text-gray-400">/ {VOLUNTEER_GOAL.toLocaleString()}</span>
                </div>
                <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indy-red to-indy-gold rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
              <button
                onClick={() => open()}
                className="px-3 py-2.5 sm:px-4 bg-indy-red text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-indy-red/90 transition-colors cursor-pointer"
              >
                Sign Up
              </button>
            </div>
          </div>
        </header>

        {/* Map fills remaining space */}
        <div className="flex-1 min-h-0">
          <HeatMapLoader rallyPoints={rallyPoints} />
        </div>

        <SignUpModal rallyPoints={rallyPoints} />
      </div>
    </SignUpModalContext.Provider>
  );
}
