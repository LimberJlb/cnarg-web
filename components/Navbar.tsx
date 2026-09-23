'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { label: 'INICIO', href: '/' },
  { label: 'MAPPOOL', href: '/mappool' },
  { label: 'JUGADORES', href: '/jugadores' },
  { label: 'BRACKETS', href: '/brackets' },
  { label: 'STAFF', href: '/staff' },
  { label: 'ESTADISTICAS', href: '/estadisticas' },
  { label: 'AWARDS', href: '/awards' },
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="w-full bg-[#2e2e2e] shadow-[0_9px_50px_rgba(0,0,0,0.5)] z-[400] relative">
      <div className="max-w-[1920px] mx-auto flex justify-between items-center h-20 lg:h-22 px-4 sm:px-6 lg:px-12">
        
        {/* LOGO */}
        <Link href="/" className="z-50" onClick={() => setIsMenuOpen(false)}>
          <h1 className="text-[#fdc15a] font-['ITCMachine'] text-3xl sm:text-4xl lg:text-[60px] leading-none cursor-pointer hover:scale-105 transition-transform">
            CNARG
          </h1>
        </Link>

        {/* LINKS ESCRITORIO */}
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

        {/* Botón Celular con SVG */}
        <button 
          className="md:hidden text-[#fdc15a] p-2 focus:outline-none rounded-lg hover:bg-white/5 transition-colors cursor-pointer flex items-center justify-center w-10 h-10"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          {isMenuOpen ? (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          )}
        </button>
      </div>

      {/* OVERLAY OSCURO EN MÓVIL */}
      {isMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 top-20 bg-black/80 backdrop-blur-sm z-[340] animate-in fade-in duration-200"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* MENÚ MÓVIL TIPO DRAWER */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#181818] border-b-2 border-[#fdc15a]/40 absolute w-full left-0 top-20 shadow-2xl z-[350] animate-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col p-5 space-y-1.5 max-h-[calc(100dvh-5rem)] overflow-y-auto custom-scrollbar">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link 
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`font-['ITCMachine'] text-lg py-3 px-4 rounded-lg transition-all flex items-center justify-between ${
                    isActive
                      ? 'text-white bg-[#fdc15a]/15 border-l-4 border-[#fdc15a]'
                      : 'text-[#fdc15a] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>{link.label}</span>
                  {isActive && <span className="text-xs text-[#fdc15a] font-mono">ACTIVO</span>}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}