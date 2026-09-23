import React from 'react';

export default function BottomBar() {
  return (
    <footer className="w-full flex-shrink-0 bg-[#1e1e1e] border-t border-white/10 shadow-[0_-9px_40px_rgba(0,0,0,0.5)] z-40 relative select-none">
      <div className="max-w-[1920px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4 h-auto md:h-12 py-3 md:py-0 px-4 sm:px-6 lg:px-12">
        
        {/* LADO IZQUIERDO: Información del torneo, campeón y créditos */}
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 sm:gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="font-bold tracking-widest uppercase text-white">
              TORNEO FINALIZADO
            </span>
          </div>

          <span className="text-white/20 hidden sm:inline">|</span>

          <span className="text-zinc-400">
            MODALIDAD: <strong className="text-zinc-200">osu!mania 4K (1v1 • Teams de 2)</strong>
          </span>

          <span className="text-white/20 hidden sm:inline">|</span>

          <span className="text-zinc-400">
            CAMPEÓN: <strong className="text-[#fdc15a]">FurryJack</strong>
          </span>

          <span className="text-white/20 hidden lg:inline">|</span>

          {/* CRÉDITO DISEÑADORA */}
          <div className="flex items-center gap-1.5 text-zinc-400">
            <span>DISEÑADORA:</span>
            <a
              href="https://osu.ppy.sh/users/4585260"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-zinc-200 hover:text-[#fdc15a] font-bold transition-all hover:scale-105"
              title="Perfil de osu! de aluuu"
            >
              <svg className="w-3.5 h-3.5 text-[#fdc15a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
                <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
                <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
                <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
              </svg>
              <span>aluuu</span>
              <span className="text-[10px] text-[#fdc15a] leading-none">↗</span>
            </a>
          </div>
        </div>

        {/* LADO DERECHO: Canales Oficiales con Iconos SVG */}
        <div className="flex items-center gap-4 sm:gap-5 font-mono text-[11px]">
          {/* TWITCH */}
          <a
            href="https://twitch.tv/cnarg_4k"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-zinc-400 hover:text-[#a970ff] transition-all hover:scale-105 uppercase tracking-wider"
            title="Twitch Oficial (@cnarg_4k)"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
            </svg>
            <span>TWITCH</span>
          </a>

          <span className="text-white/20">•</span>

          {/* YOUTUBE */}
          <a
            href="https://www.youtube.com/@CNARG4K"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-zinc-400 hover:text-[#ff0000] transition-all hover:scale-105 uppercase tracking-wider"
            title="YouTube Oficial (@CNARG4K)"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            <span>YOUTUBE</span>
          </a>

          <span className="text-white/20">•</span>

          {/* DISCORD */}
          <a
            href="https://discord.gg/m9fYkMDztx"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-zinc-400 hover:text-[#5865f2] transition-all hover:scale-105 uppercase tracking-wider"
            title="Discord Oficial de la Comunidad"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            <span>DISCORD</span>
          </a>
        </div>

      </div>
    </footer>
  );
}
