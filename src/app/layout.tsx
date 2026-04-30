import type { Metadata } from "next";
import { Lora, Montserrat } from "next/font/google";
import "./globals.css";

const lora = Lora({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Street Sweep Indy | 777 Volunteers Cleaning Up Indianapolis on 7/7",
  description:
    "Join 777 neighbors on July 7, 2026 for the biggest volunteer cleanup day Indianapolis has ever seen. Pick a park, grab your crew, and make a difference in just two hours.",
  keywords: [
    "Indianapolis volunteer",
    "community cleanup Indianapolis",
    "street sweep Indy",
    "day of caring 777",
    "Indianapolis parks cleanup",
    "volunteer Indianapolis 2026",
    "Citizens 7",
  ],
  openGraph: {
    title: "Street Sweep Indy",
    description:
      "777 volunteers. 26 parks. 1 city. July 7, 2026. Join the biggest cleanup day Indianapolis has ever seen.",
    type: "website",
    url: "https://indystreetsweep.com",
    siteName: "Street Sweep Indy",
    images: [
      {
        url: "/images/social.png",
        width: 1200,
        height: 630,
        alt: "Street Sweep Indy - 777 volunteers cleaning up Indianapolis",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Street Sweep Indy",
    description:
      "777 volunteers. 26 parks. 1 city. July 7, 2026. Join the biggest cleanup day Indianapolis has ever seen.",
    images: ["/images/social.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${lora.variable} ${montserrat.variable} antialiased`}>{children}</body>
    </html>
  );
}
