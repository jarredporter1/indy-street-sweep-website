"use client";

import Link from "next/link";
import { VOLUNTEER_GOAL, EVENT_DATE_DISPLAY, EVENT_TIME_DISPLAY } from "@/lib/constants";
import { LiveCounter } from "./LiveCounter";

export function Hero() {
  return (
    <section className="pt-0 pb-0">
      <div className="relative w-full min-h-[70vh] sm:min-h-[85vh] overflow-hidden">
        {/* Background image with fallback */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-indy-navy"
          style={{ backgroundImage: "url('/images/hero.jpg')" }}
        />

        {/* Dark gradient overlay — heavier at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/10" />

        {/* Content — centered at bottom */}
        <div className="relative z-10 flex flex-col items-center justify-end min-h-[70vh] sm:min-h-[85vh] px-4 sm:px-6 pb-12 sm:pb-20 pt-24 sm:pt-32">
          <div className="max-w-3xl text-center space-y-5">
            {/* Headline */}
            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-white leading-[1.1]">
              777 Volunteers. One City.{" "}
              <span className="text-indy-gold">One Morning.</span>
            </h1>

            {/* Subhead */}
            <p className="text-base sm:text-lg text-white/70 max-w-xl mx-auto leading-relaxed">
              United in service. {VOLUNTEER_GOAL} neighbors coming together to clean up
              Indianapolis — one massive day of caring.
            </p>

            {/* Date line */}
            <p className="text-sm text-white/50">
              {EVENT_DATE_DISPLAY} &middot; {EVENT_TIME_DISPLAY}
            </p>

            {/* Live volunteer counter */}
            <div className="flex justify-center pt-2">
              <LiveCounter initialCount={0} goal={VOLUNTEER_GOAL} />
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3">
              <Link
                href="/map"
                className="inline-flex items-center justify-center font-semibold rounded-full transition-all duration-200 bg-white text-indy-navy hover:bg-white/90 active:scale-[0.98] px-8 py-3.5 text-sm"
              >
                Sign Up to Serve
              </Link>
              <Link
                href="/map"
                className="inline-flex items-center justify-center font-semibold rounded-full transition-all duration-200 border border-white/30 text-white hover:bg-white/10 px-8 py-3.5 text-sm"
              >
                View the Map
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
