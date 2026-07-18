/**
 * Original static farm-world illustration. Always rendered beneath the
 * animated canvas so the landing page is never blank: it is the no-JS
 * state, the loading state, and the base for unsupported devices. Its
 * composition mirrors the animated diorama — plaza at the crossing of
 * two paths, cottage northwest, barn and paddock east, crops southeast,
 * pond southwest — so the enhancement never feels like a scene swap.
 */
export function WorldSceneFallback() {
  return (
    <svg
      className="world-scene__fallback"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="A cozy farm village: a stone plaza where two paths cross, a cottage with chimney smoke, a barn beside a fenced animal paddock, crop rows, a reeded pond, and trees all around."
      focusable="false"
    >
      <rect width="1200" height="800" fill="#78a26c" />
      {/* rolling field bands */}
      <path d="M0 0h1200v240c-220 60-420 20-620 44S180 330 0 280Z" fill="#6d9c58" />
      <path d="M0 520c260-70 520 30 780-10s300-30 420-64V800H0Z" fill="#659253" />
      <path d="M0 660c300-60 620 30 900-20 120-20 220-10 300-26V800H0Z" fill="#5c884b" />
      {/* meadow patches */}
      <g fill="#82b06a" opacity="0.55">
        <ellipse cx="180" cy="420" rx="120" ry="36" />
        <ellipse cx="1020" cy="250" rx="140" ry="40" />
        <ellipse cx="620" cy="700" rx="150" ry="38" />
      </g>

      {/* horizontal path */}
      <path
        d="M-20 452c220-26 340-58 520-54s300 34 480 12 160-26 240-30l4 54c-150 10-200 30-360 44s-260-22-420-16-260 40-460 54Z"
        fill="#c2a173"
      />
      {/* vertical path */}
      <path
        d="M586 210c10 80 6 150 12 220s16 160 10 240l52-4c4-84-6-160-12-232s-12-146-10-222Z"
        fill="#c2a173"
      />
      {/* plaza where paths cross */}
      <ellipse cx="618" cy="446" rx="98" ry="44" fill="#b9ab90" />
      <g fill="#a99b80" opacity="0.8">
        <ellipse cx="580" cy="436" rx="16" ry="8" />
        <ellipse cx="622" cy="452" rx="17" ry="8" />
        <ellipse cx="662" cy="438" rx="15" ry="7" />
        <ellipse cx="600" cy="464" rx="14" ry="7" />
        <ellipse cx="646" cy="466" rx="13" ry="6" />
      </g>

      {/* pond with shore, lily pads, reeds (southwest) */}
      <ellipse cx="240" cy="628" rx="162" ry="66" fill="#c2a173" />
      <ellipse cx="240" cy="622" rx="146" ry="57" fill="#4a7c8c" />
      <ellipse cx="208" cy="610" rx="54" ry="16" fill="#7fb2c0" opacity="0.7" />
      <g fill="#3a7a50">
        <ellipse cx="286" cy="636" rx="17" ry="8" />
        <ellipse cx="196" cy="646" rx="14" ry="7" />
        <ellipse cx="252" cy="600" rx="12" ry="6" />
      </g>
      <g stroke="#4c7a3f" strokeWidth="6" strokeLinecap="round">
        <path d="M372 598v-40" />
        <path d="M390 612v-34" />
        <path d="M120 640v-38" />
      </g>
      <g fill="#8a6a48">
        <ellipse cx="372" cy="552" rx="6" ry="12" />
        <ellipse cx="390" cy="572" rx="5" ry="10" />
        <ellipse cx="120" cy="596" rx="6" ry="11" />
      </g>

      {/* crop field with fence (southeast) */}
      <g>
        <rect x="790" y="580" width="300" height="140" rx="10" fill="#6b4f35" />
        {[0, 1, 2, 3].map((row) =>
          [0, 1, 2, 3, 4, 5].map((col) => (
            <rect
              key={`${row}-${col}`}
              x={810 + col * 45}
              y={595 + row * 30}
              width="24"
              height="18"
              rx={row % 2 === 0 ? 4 : 9}
              fill={['#8cc63f', '#d4e27a', '#e8a13c', '#7cbc63'][row]}
            />
          )),
        )}
        {[780, 850, 920, 990, 1060, 1100].map((x) => (
          <rect key={x} x={x} y="560" width="10" height="34" rx="3" fill="#8a6a48" />
        ))}
        <rect x="780" y="568" width="330" height="8" rx="4" fill="#8a6a48" />
      </g>

      {/* fenced paddock with the five animals (east) */}
      <g>
        <rect x="760" y="420" width="330" height="8" rx="4" fill="#8a6a48" />
        <rect x="760" y="530" width="330" height="8" rx="4" fill="#8a6a48" />
        {[760, 838, 916, 994, 1072].map((x) => (
          <rect key={x} x={x} y="412" width="10" height="34" rx="3" fill="#8a6a48" />
        ))}
        {[760, 838, 916, 994, 1072].map((x) => (
          <rect key={`b-${x}`} x={x} y="522" width="10" height="34" rx="3" fill="#8a6a48" />
        ))}
        {/* cow */}
        <g>
          <rect x="800" y="470" width="56" height="32" rx="10" fill="#efe6d4" />
          <rect x="846" y="456" width="22" height="24" rx="6" fill="#e0d2b8" />
          <rect x="806" y="498" width="8" height="12" rx="3" fill="#e0d2b8" />
          <rect x="840" y="498" width="8" height="12" rx="3" fill="#e0d2b8" />
        </g>
        {/* pig */}
        <g>
          <rect x="930" y="486" width="44" height="26" rx="9" fill="#e7a7ad" />
          <rect x="966" y="474" width="18" height="20" rx="5" fill="#dd949b" />
          <rect x="934" y="508" width="7" height="10" rx="3" fill="#dd949b" />
          <rect x="960" y="508" width="7" height="10" rx="3" fill="#dd949b" />
        </g>
        {/* horse */}
        <g>
          <rect x="1010" y="446" width="58" height="34" rx="10" fill="#8a6242" />
          <rect x="1058" y="430" width="22" height="26" rx="6" fill="#7a5638" />
          <rect x="1016" y="476" width="8" height="14" rx="3" fill="#7a5638" />
          <rect x="1052" y="476" width="8" height="14" rx="3" fill="#7a5638" />
        </g>
        {/* chicken */}
        <rect x="880" y="504" width="20" height="16" rx="5" fill="#f6f1e4" />
        <path d="M884 504l3-6 3 6Z" fill="#c94f3d" />
        {/* goat */}
        <g>
          <rect x="1000" y="498" width="40" height="24" rx="8" fill="#cfc8bb" />
          <rect x="1032" y="486" width="16" height="18" rx="5" fill="#bfb7a8" />
        </g>
      </g>

      {/* cottage (northwest) with smoke */}
      <g>
        <rect x="330" y="240" width="190" height="120" rx="8" fill="#f3ead3" />
        <path d="M310 246 425 168l115 78Z" fill="#8b3a2a" />
        <rect x="470" y="180" width="22" height="46" fill="#9c8a74" />
        <circle cx="481" cy="160" r="12" fill="#fdf9ee" opacity="0.85" />
        <circle cx="494" cy="140" r="9" fill="#fdf9ee" opacity="0.65" />
        <circle cx="504" cy="124" r="6" fill="#fdf9ee" opacity="0.45" />
        <rect x="400" y="296" width="42" height="64" rx="4" fill="#8a6a48" />
        <rect x="352" y="270" width="34" height="30" rx="4" fill="#e6c95c" />
        <rect x="466" y="270" width="34" height="30" rx="4" fill="#e6c95c" />
        {/* spur path from door to the main path */}
        <path d="M410 360c4 24 2 48 6 70l30-2c-4-22-2-46-6-68Z" fill="#c2a173" />
      </g>

      {/* barn (east) */}
      <g>
        <rect x="880" y="300" width="180" height="110" rx="8" fill="#a34a32" />
        <path d="M862 306 970 236l108 70Z" fill="#5f3d2a" />
        <rect x="948" y="336" width="48" height="74" rx="4" fill="#f3ead3" />
        <rect x="936" y="330" width="72" height="8" rx="4" fill="#f3ead3" />
      </g>

      {/* trees — mixed pines and round oaks */}
      {(
        [
          [120, 300, 1, 'pine'],
          [200, 200, 0.8, 'oak'],
          [700, 200, 0.9, 'pine'],
          [1130, 200, 1, 'oak'],
          [70, 470, 0.9, 'pine'],
          [650, 330, 0.7, 'oak'],
          [1140, 480, 0.9, 'pine'],
          [520, 700, 1, 'oak'],
          [960, 750, 0.85, 'pine'],
          [680, 760, 0.8, 'oak'],
          [420, 480, 0.6, 'oak'],
          [60, 180, 0.85, 'pine'],
        ] as const
      ).map(([x, y, s, kind], index) => (
        <g key={index} transform={`translate(${x} ${y}) scale(${s})`}>
          <rect x="-9" y="26" width="18" height="34" rx="4" fill="#6b4f35" />
          {kind === 'pine' ? (
            <>
              <path d="M0-58 44 34h-88Z" fill={index % 2 === 0 ? '#2f6b45' : '#3a7a50'} />
              <path d="M0-24 34 40h-68Z" fill={index % 2 === 0 ? '#3a7a50' : '#2f6b45'} />
            </>
          ) : (
            <>
              <circle cx="0" cy="-10" r="40" fill={index % 2 === 0 ? '#4c8a45' : '#5c9a52'} />
              <circle cx="18" cy="-32" r="22" fill="#5c9a52" />
            </>
          )}
        </g>
      ))}

      {/* flowers scattered on open meadow */}
      <g>
        {(
          [
            [160, 520, '#e8b8b0'],
            [300, 380, '#e6c95c'],
            [420, 560, '#fdf9ee'],
            [540, 620, '#c94f3d'],
            [720, 560, '#d9a7e0'],
            [250, 480, '#e6c95c'],
            [820, 260, '#e8b8b0'],
            [1100, 320, '#fdf9ee'],
            [980, 640, '#e6c95c'],
            [80, 620, '#d9a7e0'],
            [360, 300, '#fdf9ee'],
            [760, 720, '#e8b8b0'],
          ] as const
        ).map(([x, y, fill], index) => (
          <circle key={index} cx={x} cy={y} r="6" fill={fill} />
        ))}
      </g>

      {/* the cat companion on the plaza */}
      <g transform="translate(660 430)">
        <rect x="-20" y="-10" width="42" height="24" rx="9" fill="#d9873c" />
        <rect x="14" y="-24" width="20" height="20" rx="6" fill="#e09a50" />
        <path d="m15-24 5-10 5 10Z" fill="#c67a30" />
        <path d="m25-24 5-10 5 10Z" fill="#c67a30" />
        <rect x="-34" y="-6" width="16" height="7" rx="3.5" fill="#c67a30" />
        <rect x="16" y="-6" width="10" height="10" rx="3" fill="#fdf3e0" />
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
