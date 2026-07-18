/**
 * Original static farm-world illustration. Always rendered beneath the
 * animated canvas so the landing page is never blank: it is the no-JS
 * state, the loading state, and the base for unsupported devices.
 */
export function WorldSceneFallback() {
  return (
    <svg
      className="world-scene__fallback"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="A cozy farm village: fields, a pond, trees, a cottage, and a fenced crop plot."
      focusable="false"
    >
      <rect width="1200" height="800" fill="#77a06b" />
      {/* rolling field bands */}
      <path d="M0 0h1200v260c-220 60-420 20-620 44S180 350 0 300Z" fill="#6d9c58" />
      <path d="M0 520c260-70 520 30 780-10s300-30 420-64V800H0Z" fill="#659253" />
      <path d="M0 660c300-60 620 30 900-20 120-20 220-10 300-26V800H0Z" fill="#5c884b" />
      {/* dirt path */}
      <path
        d="M-40 470c220-30 340-90 520-86s300 40 480 16 180-36 280-40l6 60c-160 10-220 34-380 50s-260-24-420-16-260 60-460 76Z"
        fill="#c2a173"
      />
      {/* pond */}
      <ellipse cx="255" cy="620" rx="150" ry="62" fill="#c2a173" />
      <ellipse cx="255" cy="616" rx="138" ry="54" fill="#4a7c8c" />
      <ellipse cx="225" cy="606" rx="52" ry="16" fill="#7fb2c0" opacity="0.7" />
      {/* fenced crop plot */}
      <g>
        <rect x="770" y="560" width="300" height="140" rx="10" fill="#6b4f35" />
        {[0, 1, 2, 3].map((row) =>
          [0, 1, 2, 3, 4, 5].map((col) => (
            <rect
              key={`${row}-${col}`}
              x={790 + col * 45}
              y={575 + row * 30}
              width="24"
              height="18"
              rx="4"
              fill={(row + col) % 2 === 0 ? '#8cc63f' : '#d4e27a'}
            />
          )),
        )}
        {[760, 830, 900, 970, 1040, 1080].map((x) => (
          <rect key={x} x={x} y="540" width="10" height="34" rx="3" fill="#8a6a48" />
        ))}
        <rect x="760" y="548" width="330" height="8" rx="4" fill="#8a6a48" />
      </g>
      {/* cottage */}
      <g>
        <rect x="360" y="240" width="190" height="120" rx="8" fill="#f3ead3" />
        <path d="M340 246 455 168l115 78Z" fill="#8b3a2a" />
        <rect x="500" y="180" width="22" height="46" fill="#9c8a74" />
        <rect x="430" y="296" width="42" height="64" rx="4" fill="#8a6a48" />
        <rect x="382" y="270" width="34" height="30" rx="4" fill="#e6c95c" />
        <rect x="496" y="270" width="34" height="30" rx="4" fill="#e6c95c" />
      </g>
      {/* barn */}
      <g>
        <rect x="880" y="300" width="180" height="110" rx="8" fill="#a34a32" />
        <path d="M862 306 970 236l108 70Z" fill="#5f3d2a" />
        <rect x="948" y="336" width="48" height="74" rx="4" fill="#f3ead3" />
      </g>
      {/* trees */}
      {(
        [
          [120, 300, 1],
          [200, 210, 0.8],
          [700, 210, 0.9],
          [1130, 210, 1],
          [80, 470, 0.9],
          [640, 420, 0.75],
          [1140, 480, 0.9],
          [520, 690, 1],
          [960, 740, 0.85],
          [660, 760, 0.8],
        ] as const
      ).map(([x, y, s], index) => (
        <g key={index} transform={`translate(${x} ${y}) scale(${s})`}>
          <rect x="-9" y="26" width="18" height="34" rx="4" fill="#6b4f35" />
          <path d="M0-58 44 34h-88Z" fill={index % 2 === 0 ? '#2f6b45' : '#3a7a50'} />
          <path d="M0-24 34 40h-68Z" fill={index % 2 === 0 ? '#3a7a50' : '#2f6b45'} />
        </g>
      ))}
      {/* animals */}
      <g>
        <rect x="820" y="470" width="56" height="32" rx="10" fill="#efe6d4" />
        <rect x="866" y="458" width="22" height="22" rx="6" fill="#e0d2b8" />
        <rect x="930" y="486" width="44" height="26" rx="9" fill="#e7a7ad" />
        <rect x="966" y="476" width="18" height="18" rx="5" fill="#dd949b" />
        <rect x="700" y="500" width="20" height="16" rx="5" fill="#f6f1e4" />
        <rect x="1010" y="446" width="58" height="34" rx="10" fill="#8a6242" />
        <rect x="1058" y="432" width="22" height="24" rx="6" fill="#7a5638" />
        <rect x="742" y="502" width="40" height="24" rx="8" fill="#cfc8bb" />
      </g>
      {/* cat by the cottage */}
      <g transform="translate(560 380)">
        <rect x="-16" y="-8" width="34" height="20" rx="7" fill="#d9873c" />
        <rect x="12" y="-18" width="16" height="16" rx="5" fill="#e09a50" />
        <path d="m13-18 4-8 4 8Z" fill="#c67a30" />
        <path d="m21-18 4-8 4 8Z" fill="#c67a30" />
        <rect x="-28" y="-4" width="14" height="6" rx="3" fill="#c67a30" />
      </g>
      {/* clouds */}
      <g fill="#fff8e8" opacity="0.9">
        <ellipse cx="220" cy="90" rx="90" ry="26" />
        <ellipse cx="280" cy="74" rx="52" ry="20" />
        <ellipse cx="820" cy="110" rx="100" ry="28" />
        <ellipse cx="890" cy="92" rx="56" ry="20" />
      </g>
      <g fill="#1a3a2c" opacity="0.05">
        <ellipse cx="250" cy="330" rx="120" ry="30" />
        <ellipse cx="850" cy="360" rx="130" ry="32" />
      </g>
    </svg>
  );
}
