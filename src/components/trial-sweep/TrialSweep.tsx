export function TrialSweep() {
  return (
    <section className="py-16 sm:py-20 section-px">
      <div className="max-w-3xl mx-auto">
        <div className="bg-indy-navy rounded-2xl p-8 sm:p-12 text-center space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-medium text-indy-gold uppercase tracking-wider">
              Preview event
            </p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Try It Before 7/7
            </h2>
            <p className="text-white/70 max-w-xl mx-auto">
              Join us for a trial street sweep and see what the big day looks like.
              No commitment — just come check it out.
            </p>
          </div>

          <div className="bg-white/10 rounded-xl p-6 inline-block text-left space-y-3">
            <p className="text-white font-semibold">Next Trial Sweep</p>
            <div className="space-y-2 text-sm text-white/80">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-indy-gold shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Broad Ripple Park</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-indy-gold shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {/* TODO: Replace with actual date */}
                <span>March 2026 — Date TBD</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-indy-gold shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>9:00 AM – 11:00 AM</span>
              </div>
            </div>
          </div>

          <div>
            <a
              href="https://www.eventbrite.com/e/1983552917171?aff=oddtdtcreator"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center font-semibold rounded-full transition-all duration-200 bg-white text-indy-navy hover:bg-white/90 active:scale-[0.98] px-8 py-3.5 text-sm"
            >
              Sign Up for Trial Sweep
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
