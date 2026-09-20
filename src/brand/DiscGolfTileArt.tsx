export function DiscGolfTileArt() {
  return (
    <svg
      className="tile-golf-art"
      viewBox="0 0 640 400"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="640" height="400" fill="#050508" />
      {Array.from({ length: 10 }, (_, index) => (
        <line
          key={`h-${index}`}
          x1="0"
          x2="640"
          y1={20 + index * 40}
          y2={20 + index * 40}
          stroke="#2de2e6"
          strokeOpacity="0.16"
        />
      ))}
      {Array.from({ length: 14 }, (_, index) => (
        <line
          key={`v-${index}`}
          y1="0"
          y2="400"
          x1={20 + index * 46}
          x2={20 + index * 46}
          stroke="#2de2e6"
          strokeOpacity="0.16"
        />
      ))}
      <path
        d="M80 400 C140 300 180 240 260 200 C360 150 470 140 580 168 C540 230 500 300 490 400 Z"
        fill="#0d3d3e"
      />
      <path
        d="M80 400 C140 300 180 240 260 200 C360 150 470 140 580 168"
        fill="none"
        stroke="#2de2e6"
        strokeWidth="3"
      />
      <ellipse cx="508" cy="168" rx="58" ry="24" fill="#b6ff3b" opacity="0.28" />
      <circle cx="508" cy="168" r="7" fill="#b6ff3b" />
      <line
        x1="508"
        y1="168"
        x2="508"
        y2="88"
        stroke="#ffffff"
        strokeWidth="3"
      />
      <polygon points="180,200 196,248 164,248" fill="#ff2bd6" />
      <polygon points="390,148 404,188 376,188" fill="#ff2bd6" />
      <polygon points="590,142 604,184 576,184" fill="#ff2bd6" />
      <path
        d="M240 320 C300 250 390 198 508 168"
        fill="none"
        stroke="#ffffff"
        strokeDasharray="7 8"
        strokeWidth="2.4"
      />
      <ellipse cx="236" cy="322" rx="10" ry="3.4" fill="#ffffff" />
    </svg>
  );
}
