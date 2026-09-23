import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from '../components/Navbar';
import BottomBar from '../components/BottomBar';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#fdc15a",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://cnarg-4k.vercel.app'),
  title: {
    default: "CNARG 4K 2026",
    template: "%s | CNARG 4K 2026",
  },
  description: "Copa Nacional Argentina 4K 2026 - Torneo argentino oficial de osu!mania 4K.",
  keywords: ["osu", "osu!mania", "CNARG", "CNARG 4K", "Argentina", "Torneo", "Esports", "osu 4k"],
  authors: [{ name: "CNARG Team" }],
  icons: {
    icon: "/icon.png",
  },
  openGraph: {
    title: "CNARG 4K 2026",
    description: "Copa Nacional Argentina 4K 2026 - Torneo argentino oficial de osu!mania 4K.",
    siteName: "CNARG 4K 2026",
    locale: "es_AR",
    type: "website",
    images: [
      {
        url: "/logo-4k.png",
        width: 800,
        height: 600,
        alt: "Logo CNARG 4K 2026",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CNARG 4K 2026",
    description: "Copa Nacional Argentina 4K 2026 - Torneo argentino oficial de osu!mania 4K.",
    images: ["/logo-4k.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full overflow-hidden">
      <body className={`${geistSans.variable} flex flex-col h-full bg-[#2e2e2e] text-white`}>
        <Navbar />
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </main>
        <BottomBar />
      </body>
    </html>
  );
}
