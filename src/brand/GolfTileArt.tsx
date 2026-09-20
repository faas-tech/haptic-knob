export function GolfTileArt() {
  return (
    <svg
      className="tile-golf-art"
      viewBox="0 0 640 400"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="golf-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#07101c" />
          <stop offset="1" stopColor="#0a1628" />
        </linearGradient>
        <linearGradient id="golf-rough" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0c3d32" />
          <stop offset="1" stopColor="#082820" />
        </linearGradient>
        <linearGradient id="golf-fairway" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#1a8a64" />
          <stop offset="1" stopColor="#0f6a4c" />
        </linearGradient>
        <radialGradient id="golf-green-glow" cx="79%" cy="40%" r="18%">
          <stop offset="0" stopColor="#4ad07a" />
          <stop offset="1" stopColor="#237a4c" />
        </radialGradient>
      </defs>
      <rect width="640" height="400" fill="url(#golf-sky)" />
      {Array.from({ length: 12 }, (_, index) => (
        <line
          key={`h-${index}`}
          x1="0"
          x2="640"
          y1={24 + index * 32}
          y2={24 + index * 32}
          stroke="rgba(244,247,251,0.07)"
          strokeWidth="1"
        />
      ))}
      {Array.from({ length: 16 }, (_, index) => (
        <line
          key={`v-${index}`}
          y1="0"
          y2="400"
          x1={20 + index * 40}
          x2={20 + index * 40}
          stroke="rgba(244,247,251,0.07)"
          strokeWidth="1"
        />
      ))}
      <path
        d="M-20 400 L-20 268 C80 250 150 228 240 210 C360 186 470 168 640 158 L640 400 Z"
        fill="url(#golf-rough)"
      />
      <path
        d="M70 400 C120 320 170 268 250 236 C340 200 430 184 560 176 C520 210 480 248 470 400 Z"
        fill="url(#golf-fairway)"
      />
      <ellipse cx="508" cy="170" rx="82" ry="38" fill="#1f6b44" />
      <ellipse cx="508" cy="166" rx="60" ry="27" fill="url(#golf-green-glow)" />
      <ellipse cx="428" cy="200" rx="30" ry="15" fill="#e8c57a" />
      <ellipse cx="428" cy="198" rx="22" ry="10" fill="#d4ae62" />
      <ellipse cx="596" cy="214" rx="34" ry="16" fill="#2aa3c7" opacity="0.88" />
      <GolfTileTree x={156} y={196} />
      <GolfTileTree x={208} y={178} />
      <GolfTileTree x={386} y={150} />
      <GolfTileTree x={574} y={140} />
      <GolfTileTree x={614} y={156} />
      <path
        d="M248 318 C310 250 390 198 508 166"
        fill="none"
        stroke="rgba(244,247,251,0.55)"
        strokeDasharray="7 8"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <line
        x1="508"
        y1="166"
        x2="508"
        y2="76"
        stroke="#f4f7fb"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M508 78 L560 98 L508 118 Z" fill="#e11d2e" />
      <circle cx="248" cy="318" r="7" fill="#f4f7fb" />
      <circle cx="246" cy="316" r="2.4" fill="#ffffff" />
    </svg>
  );
}

function GolfTileTree(props: { x: number; y: number }) {
  return (
    <g transform={`translate(${props.x} ${props.y})`}>
      <ellipse cx="0" cy="36" rx="11" ry="4" fill="#061810" opacity="0.35" />
      <rect x="-3" y="18" width="6" height="16" rx="1" fill="#4a3422" />
      <polygon points="0,-26 18,10 -18,10" fill="#0f4f32" />
      <polygon points="0,-22 20,22 -20,22" fill="#145c3a" />
    </g>
  );
}
