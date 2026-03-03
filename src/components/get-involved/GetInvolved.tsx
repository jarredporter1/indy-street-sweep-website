import Link from "next/link";

const LEADER_BENEFITS = [
  "Free trial sweep attendance (March/April/May)",
  "Pre-event training meeting (April or May at 6338 Westfield Blvd)",
  "Full support from our team",
  "Direct communication with your volunteers",
  "All materials provided",
];

export function GetInvolved() {
  return (
    <section className="bg-indy-navy py-0">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[600px]">
        {/* Left — Trial Sweep */}
        <div className="relative overflow-hidden min-h-[400px] lg:min-h-full">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/images/image3.jpg')" }}
          />
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative z-10 flex flex-col justify-between h-full p-8 sm:p-12">
            <div className="space-y-4 pt-4">
              <p className="text-sm font-medium text-indy-gold uppercase tracking-wider">
                Preview event
              </p>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Try It Before 7/7
              </h2>
              <p className="text-white/70 leading-relaxed max-w-md">
                Join us for a trial street sweep and see what the big day looks like.
                No commitment — just come check it out.
              </p>
            </div>

            <div className="space-y-6 mt-8">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-white/80">
                  <svg className="w-4 h-4 text-indy-gold shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Broad Ripple Park</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-white/80">
                  <svg className="w-4 h-4 text-indy-gold shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {/* TODO: Replace with actual date */}
                  <span>March 2026 — Date TBD</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-white/80">
                  <svg className="w-4 h-4 text-indy-gold shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>9:00 AM – 11:00 AM</span>
                </div>
              </div>

              <a
                href="https://www.eventbrite.com/e/1983552917171?aff=oddtdtcreator"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center font-semibold rounded-full transition-all duration-200 bg-white text-indy-navy hover:bg-white/90 active:scale-[0.98] px-8 py-3.5 text-sm w-full"
              >
                Sign Up for Trial Sweep
              </a>
            </div>
          </div>
        </div>

        {/* Right — Lead a Rally Point */}
        <div className="bg-indy-navy p-8 sm:p-12 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="space-y-4">
              <p className="text-sm font-medium text-indy-gold uppercase tracking-wider">
                Make a bigger impact
              </p>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Lead a Rally Point
              </h2>
              <p className="text-white/70 leading-relaxed max-w-md">
                Site leaders manage ~30 volunteers at one park. You set the tone,
                we give you everything you need.
              </p>
            </div>

            <ul className="space-y-3">
              {LEADER_BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-indy-gold shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white/60 text-sm">{b}</span>
                </li>
              ))}
            </ul>

            <div className="flex gap-4">
              <div className="bg-white/10 rounded-xl p-4 flex-1 space-y-1">
                <p className="text-sm font-semibold text-white">April Meeting</p>
                {/* TODO: Replace with actual date */}
                <p className="text-xs text-white/50">Date TBD — 9:00 AM</p>
                <p className="text-xs text-white/50">6338 Westfield Blvd or Google Meet</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4 flex-1 space-y-1">
                <p className="text-sm font-semibold text-white">May Meeting</p>
                {/* TODO: Replace with actual date */}
                <p className="text-xs text-white/50">Date TBD — 9:00 AM</p>
                <p className="text-xs text-white/50">6338 Westfield Blvd or Google Meet</p>
              </div>
            </div>
          </div>

          <Link
            href="/map"
            className="inline-flex items-center justify-center font-semibold rounded-full transition-all duration-200 bg-white text-indy-navy hover:bg-white/90 active:scale-[0.98] px-8 py-3.5 text-sm w-full mt-8"
          >
            Sign Up to Lead a Site
          </Link>
        </div>
      </div>
    </section>
  );
}
