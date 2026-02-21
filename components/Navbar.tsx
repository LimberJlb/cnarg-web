'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AuthNav from './AuthNav';

const NAV_LINKS = [
  { label: 'INICIO', href: '/' },
  { label: 'MAPPOOL', href: '/mappool' },
  { label: 'JUGADORES', href: '/jugadores' },
  { label: 'BRACKETS', href: '/brackets' },
  { label: 'STAFF', href: '/staff' },
  { label: 'ESTADISTICAS', href: '/estadisticas' },
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="w-full bg-[#2e2e2e] shadow-[0_9px_50px_rgba(0,0,0,0.5)] z-50 relative">
      {/* Contenedor Principal: Limita el ancho en monitores gigantes */}
      <div className="max-w-[1920px] mx-auto flex justify-between items-center h-20 lg:h-22 px-6 lg:px-12">
        
        {/* LOGO: Tamaño fluido según resolución */}
        <Link href="/" className="z-50">
          <h1 className="text-[#fdc15a] font-['ITCMachine'] text-4xl lg:text-[60px] leading-none cursor-pointer hover:scale-105 transition-transform">
            CNARG
          </h1>
        </Link>

        {/* CONTENEDOR DERECHO */}
        <div className="flex items-center gap-8 h-full">
          
          {/* LINKS ESCRITORIO: Se ocultan en celulares (md:flex) */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-9">
            {NAV_LINKS.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                className={`text-[16px] lg:text-[20px] font-['TrebuchetMS'] transition-all duration-300 hover:text-white ${
                  pathname === link.href ? 'text-white border-b-2 border-[#fdc15a]' : 'text-[#fdc15a]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* BOTÓN AUTH: Siempre visible */}
          <div className="h-full flex items-center">
            <AuthNav />
          </div>

          {/* BOTÓN CELULAR: Solo visible en pantallas pequeñas */}
          <button 
            className="md:hidden text-[#fdc15a] p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span className="text-3xl">{isMenuOpen ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>

      {/* MENÚ MÓVIL: Aparece al clickear la hamburguesa */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#1a1a1a] border-t border-[#fdc15a]/20 absolute w-full left-0 animate-in slide-in-from-top duration-300">
          <div className="flex flex-col p-6 space-y-4">
            {NAV_LINKS.map((link) => (
              <Link 
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="text-[#fdc15a] font-['ITCMachine'] text-xl hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}