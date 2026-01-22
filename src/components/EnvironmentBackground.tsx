import type { Environment } from '../types/game';

interface EnvironmentBackgroundProps {
  environment: Environment;
}

export function EnvironmentBackground({ environment }: EnvironmentBackgroundProps) {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30">
      {environment === 'mountains' && <MountainsBackground />}
      {environment === 'coast' && <CoastBackground />}
      {environment === 'forest' && <ForestBackground />}
      {environment === 'desert' && <DesertBackground />}
      {environment === 'tundra' && <TundraBackground />}
      {environment === 'urban-edge' && <UrbanBackground />}
    </div>
  );
}

function MountainsBackground() {
  return (
    <svg
      className="absolute bottom-0 w-full h-full"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMax slice"
    >
      <defs>
        <linearGradient id="mountain-sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4A90E2" />
          <stop offset="100%" stopColor="#87CEEB" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="1200" height="800" fill="url(#mountain-sky)" />

      <path
        d="M0 800 L0 450 L150 320 L280 420 L350 350 L450 280 L550 380 L600 250 L700 350 L850 200 L1000 350 L1100 280 L1200 400 L1200 800 Z"
        fill="#6B7F8C"
        stroke="#4A5F6C"
        strokeWidth="4"
      />
      <path
        d="M0 800 L0 550 L200 400 L400 500 L550 380 L750 480 L900 300 L1100 450 L1200 380 L1200 800 Z"
        fill="#8B9BA8"
        stroke="#5D6D7A"
        strokeWidth="3"
      />
      <path
        d="M200 450 L250 400 L300 420"
        fill="none"
        stroke="#E8F4F8"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M600 280 L650 250 L680 270 L700 250"
        fill="none"
        stroke="#E8F4F8"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CoastBackground() {
  return (
    <svg
      className="absolute bottom-0 w-full h-full"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMax slice"
    >
      <defs>
        <linearGradient id="coast-sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#87CEEB" />
          <stop offset="100%" stopColor="#B0E0E6" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="1200" height="800" fill="url(#coast-sky)" />

      <path
        d="M0 600 Q150 580 300 600 T600 600 T900 600 T1200 600 L1200 800 L0 800 Z"
        fill="#1E88E5"
        stroke="#1565C0"
        strokeWidth="3"
      />
      <path
        d="M0 650 Q200 630 400 650 T800 650 T1200 650"
        fill="none"
        stroke="#0D47A1"
        strokeWidth="2"
        strokeDasharray="5,5"
      />

      <path
        d="M0 600 L200 590 L400 600 L1200 600 L1200 800 L0 800 Z"
        fill="#D2B48C"
        opacity="0.6"
      />

      <ellipse cx="200" cy="500" rx="40" ry="60" fill="none" stroke="#8B7355" strokeWidth="4" />
      <ellipse cx="250" cy="520" rx="35" ry="55" fill="none" stroke="#8B7355" strokeWidth="4" />
      <ellipse cx="180" cy="530" rx="30" ry="45" fill="none" stroke="#6B5644" strokeWidth="3" />
      <ellipse cx="700" cy="480" rx="50" ry="70" fill="none" stroke="#8B7355" strokeWidth="4" />
      <ellipse cx="760" cy="510" rx="40" ry="60" fill="none" stroke="#8B7355" strokeWidth="4" />
      <ellipse cx="650" cy="520" rx="35" ry="50" fill="none" stroke="#6B5644" strokeWidth="3" />
      <path
        d="M100 550 L120 530 L110 520 L130 500"
        fill="none"
        stroke="#8B7355"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M900 520 L920 500 L910 490 L930 475"
        fill="none"
        stroke="#8B7355"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ForestBackground() {
  return (
    <svg
      className="absolute bottom-0 w-full h-full"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMax slice"
    >
      <defs>
        <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#87CEEB" />
          <stop offset="100%" stopColor="#B0D8F0" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="1200" height="550" fill="url(#sky)" />

      <path
        d="M0 550 L1200 550 L1200 800 L0 800 Z"
        fill="#8B7355"
      />

      <path
        d="M0 550 Q200 530 400 550 T800 550 T1200 550"
        fill="none"
        stroke="#6B5644"
        strokeWidth="3"
      />

      {[...Array(12)].map((_, i) => {
        const x = (i * 110) + (i % 3) * 20;
        const baseY = 550;
        const height = 200 + (i % 3) * 50;
        return (
          <g key={i}>
            <line
              x1={x}
              y1={baseY}
              x2={x}
              y2={baseY - height}
              stroke="#5D4037"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d={`M${x - 30} ${baseY - height * 0.7} Q${x} ${baseY - height * 0.9} ${x + 30} ${baseY - height * 0.7}`}
              fill="none"
              stroke="#2E7D32"
              strokeWidth="4"
            />
            <path
              d={`M${x - 35} ${baseY - height * 0.5} Q${x} ${baseY - height * 0.75} ${x + 35} ${baseY - height * 0.5}`}
              fill="none"
              stroke="#388E3C"
              strokeWidth="4"
            />
            <path
              d={`M${x - 40} ${baseY - height * 0.3} Q${x} ${baseY - height * 0.6} ${x + 40} ${baseY - height * 0.3}`}
              fill="none"
              stroke="#43A047"
              strokeWidth="4"
            />
          </g>
        );
      })}
    </svg>
  );
}

function DesertBackground() {
  return (
    <svg
      className="absolute bottom-0 w-full h-full"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMax slice"
    >
      <defs>
        <linearGradient id="desert-sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#FFA07A" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="1200" height="800" fill="url(#desert-sky)" />

      <path
        d="M0 600 Q200 550 400 600 T800 600 T1200 600 L1200 800 L0 800 Z"
        fill="#EDC9AF"
        stroke="#D2B48C"
        strokeWidth="3"
      />
      <path
        d="M100 650 Q250 620 400 650 T700 650 T1000 650"
        fill="none"
        stroke="#C4A57B"
        strokeWidth="3"
      />
      <path
        d="M200 680 Q300 660 400 680 T600 680"
        fill="none"
        stroke="#B8956A"
        strokeWidth="2"
      />
      <circle cx="150" cy="450" r="4" fill="#8B7355" />
      <circle cx="400" cy="500" r="3" fill="#8B7355" />
      <circle cx="650" cy="480" r="4" fill="#8B7355" />
      <circle cx="900" cy="520" r="3" fill="#8B7355" />
      <path
        d="M300 550 L300 520 M295 535 L305 535"
        stroke="#6B8E23"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M800 580 L800 550 M795 565 L805 565"
        stroke="#6B8E23"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TundraBackground() {
  return (
    <svg
      className="absolute bottom-0 w-full h-full"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMax slice"
    >
      <defs>
        <linearGradient id="tundra-sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#B0C4DE" />
          <stop offset="100%" stopColor="#D3D3D3" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="1200" height="800" fill="url(#tundra-sky)" />

      <path
        d="M0 650 Q300 630 600 650 T1200 650 L1200 800 L0 800 Z"
        fill="#E8E8E8"
        stroke="#C0C0C0"
        strokeWidth="3"
      />
      <path
        d="M0 680 Q200 670 400 680 T800 680 T1200 680"
        fill="none"
        stroke="#A8A8A8"
        strokeWidth="2"
        strokeDasharray="8,4"
      />
      <circle cx="200" cy="580" r="3" fill="#6B7280" />
      <circle cx="500" cy="600" r="3" fill="#6B7280" />
      <circle cx="800" cy="590" r="3" fill="#6B7280" />
      <circle cx="350" cy="610" r="2" fill="#6B7280" />
      <circle cx="650" cy="620" r="2" fill="#6B7280" />
      <circle cx="950" cy="615" r="2" fill="#6B7280" />
      <path
        d="M100 620 L105 610 L110 620 L115 605 L120 620"
        fill="none"
        stroke="#556B2F"
        strokeWidth="2"
      />
      <path
        d="M600 640 L605 630 L610 640 L615 625 L620 640"
        fill="none"
        stroke="#556B2F"
        strokeWidth="2"
      />
      <path
        d="M1000 635 L1005 625 L1010 635 L1015 620 L1020 635"
        fill="none"
        stroke="#556B2F"
        strokeWidth="2"
      />
    </svg>
  );
}

function UrbanBackground() {
  return (
    <svg
      className="absolute bottom-0 w-full h-full"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMax slice"
    >
      <defs>
        <linearGradient id="urban-sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#708090" />
          <stop offset="100%" stopColor="#A0AEC0" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="1200" height="800" fill="url(#urban-sky)" />

      <rect x="0" y="780" width="1200" height="20" fill="#4A5568" />

      <rect x="50" y="400" width="100" height="400" fill="#616161" stroke="#424242" strokeWidth="4" />
      <rect x="200" y="300" width="120" height="500" fill="#757575" stroke="#424242" strokeWidth="4" />
      <rect x="370" y="450" width="80" height="350" fill="#616161" stroke="#424242" strokeWidth="3" />
      <rect x="500" y="350" width="140" height="450" fill="#757575" stroke="#424242" strokeWidth="4" />
      <rect x="690" y="500" width="90" height="300" fill="#616161" stroke="#424242" strokeWidth="3" />
      <rect x="830" y="380" width="110" height="420" fill="#757575" stroke="#424242" strokeWidth="4" />
      <rect x="990" y="450" width="95" height="350" fill="#616161" stroke="#424242" strokeWidth="3" />
      {[...Array(4)].map((_, i) => (
        <line
          key={`h1-${i}`}
          x1="50"
          y1={500 + i * 80}
          x2="150"
          y2={500 + i * 80}
          stroke="#FDD835"
          strokeWidth="2"
        />
      ))}
      {[...Array(5)].map((_, i) => (
        <line
          key={`h2-${i}`}
          x1="200"
          y1={400 + i * 80}
          x2="320"
          y2={400 + i * 80}
          stroke="#FDD835"
          strokeWidth="2"
        />
      ))}
      {[...Array(5)].map((_, i) => (
        <line
          key={`h3-${i}`}
          x1="500"
          y1={450 + i * 80}
          x2="640"
          y2={450 + i * 80}
          stroke="#FDD835"
          strokeWidth="2"
        />
      ))}
    </svg>
  );
}
