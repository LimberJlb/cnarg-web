'use client';

import React from 'react';

interface LoadingScreenProps {
  message?: string;
  className?: string;
}

export default function LoadingScreen({
  message = 'CARGANDO...',
  className = '',
}: LoadingScreenProps) {
  return (
    <div
      className={`min-h-[calc(100vh-140px)] flex flex-col items-center justify-center gap-6 select-none ${className}`}
      role="status"
      aria-label={message}
    >
      <div className="w-16 h-16 border-4 border-white/10 border-t-[#fdc15a] rounded-full animate-spin"></div>
      <div className="font-['ITCMachine'] text-[#fdc15a] text-2xl sm:text-3xl md:text-4xl animate-pulse tracking-widest drop-shadow-[0_0_15px_rgba(253,193,90,0.4)] text-center px-4">
        {message}
      </div>
    </div>
  );
}
