/* Ticker — horizontal marquee banner */

const ITEMS = [
  'JavaScript', 'Python', 'C++', 'Game Loop', 'Delta Time',
  'Collision', 'AI Steering', 'Skill Tree', 'XP', 'Pyodide',
  'WebAssembly', 'Canvas API', 'Physics Engine', 'Vectors',
  'State Machine', 'Gravity', 'Momentum', 'Level Up',
];

interface TickerProps {
  reversed?: boolean;
}

export function Ticker({ reversed = false }: TickerProps) {
  const doubled = [...ITEMS, ...ITEMS]; // seamless loop

  return (
    <div className="ticker-wrap" aria-hidden="true">
      <div
        className="ticker-track"
        style={reversed ? { animationDirection: 'reverse' } : undefined}
      >
        {doubled.map((item, i) => (
          <div key={i} className="ticker-item">
            {item}
            <span>·</span>
          </div>
        ))}
      </div>
    </div>
  );
}

