import Image from "next/image";

export function About() {
  return (
    <section id="about" className="pt-6 sm:pt-10 pb-16 sm:pb-24 section-px">
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-stretch">
        {/* Left — text + stats stacked */}
        <div className="lg:max-w-[50%] flex flex-col justify-between gap-10">
          <p className="font-heading text-3xl sm:text-4xl md:text-[2.75rem] font-semibold leading-[1.25]">
            <span className="text-indy-navy">Indy Street Sweep is a citywide Day of Caring bringing together 777 volunteers on 7/7 to clean up Indianapolis.</span>{" "}
            <span className="text-gray-400">One morning. 25 locations.</span>
          </p>

          {/* Stats in white boxes */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="bg-white rounded-xl p-3 sm:p-5">
              <p className="font-heading text-3xl sm:text-5xl font-bold text-indy-gold">
                777
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Volunteers
              </p>
            </div>
            <div className="bg-white rounded-xl p-3 sm:p-5">
              <p className="font-heading text-3xl sm:text-5xl font-bold text-indy-gold">
                25
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Rally points
              </p>
            </div>
            <div className="bg-white rounded-xl p-3 sm:p-5">
              <p className="font-heading text-3xl sm:text-5xl font-bold text-indy-gold">
                1
              </p>
              <p className="text-xs text-gray-500 mt-1">
                City
              </p>
            </div>
          </div>
        </div>

        {/* Image — right side */}
        <div className="lg:flex-1 flex justify-end">
          <div className="relative w-full aspect-[3/2] rounded-2xl overflow-hidden">
            <Image
              src="/images/image2.jpg"
              alt="Volunteers serving Indianapolis"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              unoptimized
            />
          </div>
        </div>
      </div>
    </section>
  );
}
