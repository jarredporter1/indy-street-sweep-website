"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { RallyPointWithCount } from "@/types";
import { RallyPointMarker } from "./RallyPointMarker";
import { MapLegend } from "./MapLegend";
import { MobileBottomSheet, type SheetState } from "./MobileBottomSheet";
import { useSignUpModal } from "@/hooks/useSignUpModal";
import { getDensityLevel, DENSITY_COLORS, DENSITY_TEXT_COLORS, DENSITY_LABELS } from "@/lib/utils";

interface HeatMapProps {
  rallyPoints: RallyPointWithCount[];
}

const INDY_CENTER = { lat: 39.7684, lng: -86.1581 };
const DEFAULT_ZOOM = 11;

function FlyToPoint({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 14, { duration: 0.8 });
  }, [map, lat, lng]);
  return null;
}

export default function HeatMap({ rallyPoints }: HeatMapProps) {
  const { open, isOpen: signupModalOpen } = useSignUpModal();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(null);
  const [sheetState, setSheetState] = useState<SheetState>("peek");
  const listRef = useRef<HTMLDivElement>(null);

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

  const totalFiltered = filtered.reduce((sum, [, pts]) => sum + pts.length, 0);

  /* ─── Desktop list item click ─── */
  function handleListItemClick(rp: RallyPointWithCount) {
    setSelectedId(rp.id);
    setFlyTarget({ lat: rp.lat, lng: rp.lng });
  }

  /* ─── Mobile bottom sheet item click ─── */
  function handleMobileSelectPoint(rp: RallyPointWithCount) {
    setSelectedId(rp.id);
    setFlyTarget({ lat: rp.lat, lng: rp.lng });
  }

  /* ─── Map marker click ─── */
  function handleMarkerClick(rp: RallyPointWithCount) {
    setSelectedId(rp.id);
    setSheetState("detail"); // triggers mobile bottom sheet detail view
    // Scroll desktop list item into view
    const el = document.getElementById(`rally-point-${rp.id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const selectedPoint = rallyPoints.find((rp) => rp.id === selectedId);

  return (
    <div className="flex flex-col lg:flex-row w-full h-full overflow-hidden bg-white">
      {/* ═══ Left panel — desktop only ═══ */}
      <div className="hidden lg:flex w-[380px] shrink-0 flex-col border-r border-gray-200">
        {/* Search header */}
        <div className="p-4 border-b border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-indy-navy">Rally Points</h3>
            <span className="text-xs text-gray-400">{totalFiltered} locations</span>
          </div>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search parks or zones..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indy-navy/20 focus:border-indy-navy placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Scrollable list */}
        <div ref={listRef} className="flex-1 overflow-y-auto modal-scrollbar">
          {filtered.map(([zone, points]) => (
            <div key={zone}>
              <div className="sticky top-0 bg-gray-50 px-4 py-2 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{zone}</span>
              </div>
              {points.map((rp) => {
                const density = getDensityLevel(rp.volunteer_count);
                const color = DENSITY_COLORS[density];
                const isSelected = selectedId === rp.id;
                return (
                  <button
                    key={rp.id}
                    id={`rally-point-${rp.id}`}
                    onClick={() => handleListItemClick(rp)}
                    onMouseEnter={() => setHoveredId(rp.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 text-left transition-all cursor-pointer hover:bg-gray-50 ${
                      isSelected ? "bg-indy-red/5 border-l-[3px] border-l-indy-red" : ""
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                      style={{ backgroundColor: color, color: DENSITY_TEXT_COLORS[density] }}
                    >
                      {rp.volunteer_count}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-indy-navy truncate">{rp.name}</p>
                      <p className="text-xs text-gray-500 truncate">{rp.address}</p>
                      {rp.adopted_by && (
                        <p className="text-[10px] text-indy-gold font-bold uppercase tracking-wider mt-0.5 truncate">
                          ⚑ Adopted by {rp.adopted_by}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-medium" style={{ color }}>
                        {rp.adopted_by ? "Group" : DENSITY_LABELS[density]}
                      </p>
                      <p className="text-xs text-gray-400">{rp.volunteer_count}/{rp.capacity}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-8 text-center text-sm text-gray-400">
              No locations found
            </div>
          )}
        </div>
      </div>

      {/* ═══ Map panel ═══ */}
      <div className="relative flex-1 h-full">
        <MapContainer
          center={[INDY_CENTER.lat, INDY_CENTER.lng]}
          zoom={DEFAULT_ZOOM}
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          {rallyPoints.map((point) => (
            <RallyPointMarker
              key={point.id}
              point={point}
              isSelected={selectedId === point.id}
              isHovered={hoveredId === point.id}
              onSignUp={(id) => open(id)}
              onMarkerClick={() => handleMarkerClick(point)}
            />
          ))}
          {flyTarget && <FlyToPoint lat={flyTarget.lat} lng={flyTarget.lng} />}
        </MapContainer>

        {/* ─── Desktop detail card (hidden on mobile) ─── */}
        {selectedPoint && (
          <div className="hidden lg:block absolute bottom-4 right-4 w-[320px] z-[1000] bg-white rounded-xl shadow-xl border border-gray-200 p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-indy-navy">{selectedPoint.name}</h4>
                <p className="text-xs text-gray-500 mt-0.5">{selectedPoint.address}</p>
              </div>
              <button
                onClick={() => { setSelectedId(null); setFlyTarget(null); }}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 cursor-pointer shrink-0"
              >
                <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M1 1l12 12M13 1L1 13" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-full">
                <span className="text-sm font-bold text-indy-navy">{selectedPoint.volunteer_count}</span>
                <span className="text-xs text-gray-400">/ {selectedPoint.capacity}</span>
              </div>
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor: `${DENSITY_COLORS[getDensityLevel(selectedPoint.volunteer_count)]}15`,
                  color: DENSITY_COLORS[getDensityLevel(selectedPoint.volunteer_count)],
                }}
              >
                {DENSITY_LABELS[getDensityLevel(selectedPoint.volunteer_count)]}
              </span>
              {selectedPoint.zone && (
                <span className="text-xs text-gray-400">{selectedPoint.zone}</span>
              )}
            </div>

            {selectedPoint.volunteer_count >= selectedPoint.capacity ? (
              <div className="w-full py-2.5 bg-gray-300 text-white text-sm font-semibold rounded-lg text-center">
                This location is full
              </div>
            ) : (
              <button
                onClick={() => open(selectedPoint.id)}
                className="w-full py-2.5 bg-indy-red text-white text-sm font-semibold rounded-lg hover:bg-indy-red/90 transition-colors cursor-pointer"
              >
                Sign Up at {selectedPoint.name}
              </button>
            )}
          </div>
        )}

        {/* ─── Mobile bottom sheet (hidden on desktop, hidden when signup modal open) ─── */}
        {!signupModalOpen && (
          <div className="lg:hidden">
            <MobileBottomSheet
              state={sheetState}
              onStateChange={setSheetState}
              filteredZones={filtered}
              selectedPoint={selectedPoint ?? null}
              search={search}
              onSearchChange={setSearch}
              onSelectPoint={handleMobileSelectPoint}
              onSignUp={(id) => { setSheetState("peek"); open(id); }}
              totalCount={totalFiltered}
            />
          </div>
        )}

        {!signupModalOpen && <MapLegend />}
      </div>
    </div>
  );
}
