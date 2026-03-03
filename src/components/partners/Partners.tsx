import Image from "next/image";

const PARTNERS = [
  { name: "Citizens 7", logo: "/images/logos/citizens7.webp" },
  { name: "Together Indy", logo: "/images/logos/together-indy.svg" },
  { name: "Multiply Indiana", logo: "/images/logos/multiply-indiana.png" },
  { name: "Roots Realty Co", logo: "/images/logos/Roots-Secondary-RGB (1) 1.png" },
  { name: "Indy Parks", logo: "/images/logos/indyparks.png" },
  { name: "Tuscan", logo: "/images/logos/Tuscan Logo Black.png" },
];

export function Partners() {
  return (
    <section id="partners" className="pt-16 pb-10 sm:pt-20 sm:pb-14 section-px">
      <div className="text-center space-y-10">
        <div className="space-y-3">
          <p className="text-sm font-medium text-indy-red uppercase tracking-wider">
            Presented by Citizens 7
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-indy-navy tracking-tight">
            Our Partners
          </h2>
          <p className="text-gray-600">
            This movement is powered by organizations that believe in the
            potential of Indianapolis.
          </p>
        </div>

        {/* Logo grid — each in its own white box, full width */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {PARTNERS.map((partner) => (
            <div
              key={partner.name}
              className="bg-white rounded-xl flex items-center justify-center p-6 min-h-[80px]"
            >
              <Image
                src={partner.logo}
                alt={partner.name}
                width={120}
                height={48}
                className="object-contain h-10 w-auto grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                unoptimized
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
