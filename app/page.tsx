import AuthNav from '../components/AuthNav';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#2e2e2e] text-white font-sans overflow-x-hidden">
      {/* Navbar simple */}
      
<nav className="flex justify-between items-center h-22 bg-[#2e2e2e] relative z-30 shadow-[0_9px_50px_rgba(0,0,0,0.5)]">
  {/* Logo a la izquierda - Se mantiene con su padding */}
  <h1 className="text-[#fdc15a] font-['ITCMachine'] text-[60px] px-37">CNARG</h1>

  {/* Contenedor derecho: Agrupa links y botón */}
  <div className="flex items-center h-full">
    {/* Links de navegación - Eliminamos px lateral para que se peguen a la derecha */}
    <div className="flex space-x-9 text-sm font-['TrebuchetMS'] text-[#fdc15a] text-[20px] mr-15">
      <a href="/" className="cursor-pointer hover:text-white transition-colors">INICIO</a>
      <a href="/mappool" className="cursor-pointer hover:text-white transition-colors">MAPPOOL</a>
      <a href="/jugadores" className="cursor-pointer hover:text-white transition-colors">JUGADORES</a>
      <a href="/brackets" className="cursor-pointer hover:text-white transition-colors">BRACKETS</a>
      <a href="/staff" className="cursor-pointer hover:text-white transition-colors">STAFF</a>
      <a href="/estadisticas" className="cursor-pointer hover:text-white transition-colors">ESTADISTICAS</a>
    </div>

    {/* Botón Ingresar o Perfil */}
          <AuthNav />
        </div>
     </nav>


      {/* Hero Section dividido al 50/50 */}
      <div className="relative flex h-[calc(100vh-88px)] w-full overflow-hidden">
        
        {/* LADO IZQUIERDO: Texto (Exactamente 50%) */}
        <div className="w-1/2 flex flex-col justify-center px-37 bg-[#2e2e2e]">
          <h2 className="text-[139px] font-['ITCMachine'] uppercase leading-[0.85] tracking-tight">
            <span className="text-[#67a4da]">COPA</span><br />
            <span className="text-white">NACIONAL</span><br />
            <span className="text-[#67a4da]">ARGENTINA</span>
          </h2>
          <p className="mt-4 text-white font-['TrebuchetMS'] max-w-md text-[19px] leading-[1.5]">
            Un torneo argentino de Osu!mania 4K.<br />
            <span className="text-[#fdc15a]">Hosteado por Limber y Nubbo</span>
          </p>
          {/* Botón azul decorativo del diseño */}
          <div className="mt-8 w-56 h-14 bg-[#67a4da] rounded-xl shadow-lg opacity-90"></div>
        </div>

        {/* LADO DERECHO: GIF/Imagen (Exactamente 50%) */}
        <div className="w-1/2 relative">
          <img 
            src="/fondo.gif" 
            alt="Fondo"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>

        {/* LOGO CENTRAL: Flotando en la costura de ambos lados */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <img 
            src="/logo-4k.png" 
            alt="Logo 4K" 
            className="w-[30vw] max-w-[480px] min-w-[280px] drop-shadow-[0_0_20px_rgba(0,0,0,0.5)]" 
          />
        </div>
      </div>
      
    </main>
  );
}