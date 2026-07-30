export function OptimalLogo() {
  const bars = [
    { x: 0, w: 6, h: 12, fill: "#D8F5F0" },
    { x: 9, w: 6, h: 18, fill: "#A8E8E0" },
    { x: 18, w: 6, h: 26, fill: "#78DBD0" },
    { x: 27, w: 6, h: 34, fill: "#4ECDC4" },
  ];

  return (
    <div className="flex items-center gap-2.5">
      <svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Optimal logo"
        className="shrink-0"
      >
        {bars.map((bar) => (
          <rect
            key={bar.x}
            x={bar.x}
            y={(36 - bar.h) / 2}
            width={bar.w}
            height={bar.h}
            rx="1.5"
            fill={bar.fill}
          />
        ))}
      </svg>
      <div className="flex items-baseline">
        <span className="text-lg font-bold tracking-tight text-white">Optimal</span>
        <span className="text-lg font-bold text-[#4ECDC4]">.</span>
      </div>
    </div>
  );
}
