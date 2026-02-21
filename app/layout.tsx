import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from '../components/Navbar'; // Asegurate de que la ruta sea correcta

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CNARG 4K 2026",
  description: "Copa Nacional Argentina 4K 2026",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full overflow-hidden">{/* Ocultamos el scroll de la raíz */}
      <body className={`${geistSans.variable} flex flex-col h-full bg-[#2e2e2e] text-white`}>
        <Navbar />
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </main>
      </body>
    </html>
  );
}
