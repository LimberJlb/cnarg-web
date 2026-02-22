const BracketConnector = ({ type, active }: { type: 'up' | 'down' | 'straight', active: boolean }) => {
  const color = active ? '#fdc15a' : '#444'; // Se ilumina si el equipo está hovered
  const strokeWidth = active ? 3 : 2;

  return (
    <svg className="absolute left-full top-1/2 -translate-y-1/2 w-10 h-32 overflow-visible pointer-events-none">
      {type === 'down' && (
        <path 
          d="M 0 0 L 20 0 L 20 40 L 40 40" 
          fill="none" stroke={color} strokeWidth={strokeWidth} 
        />
      )}
      {type === 'up' && (
        <path 
          d="M 0 0 L 20 0 L 20 -40 L 40 -40" 
          fill="none" stroke={color} strokeWidth={strokeWidth} 
        />
      )}
      {type === 'straight' && (
        <line x1="0" y1="0" x2="40" y2="0" stroke={color} strokeWidth={strokeWidth} />
      )}
    </svg>
  );
};
export default BracketConnector;
