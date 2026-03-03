"use client";

import { Navbar } from "@/components/nav/Navbar";
import { Hero } from "@/components/hero/Hero";
import { Partners } from "@/components/partners/Partners";
import { About } from "@/components/about/About";
import { EventInfo } from "@/components/event-info/EventInfo";
import { FAQ } from "@/components/faq/FAQ";
import { GetInvolved } from "@/components/get-involved/GetInvolved";
import { Footer } from "@/components/footer/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Partners />
      <About />
      <EventInfo />
      <FAQ />
      <GetInvolved />
      <Footer />
    </main>
  );
}
