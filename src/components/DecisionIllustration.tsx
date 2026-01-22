interface DecisionIllustrationProps {
  decisionId: string;
  environment: string;
}

export function DecisionIllustration({ decisionId, environment }: DecisionIllustrationProps) {
  const getSkyColor = () => {
    switch (environment) {
      case 'desert': return '#4A5568';
      case 'mountains': return '#2D3748';
      case 'coast': return '#2C5282';
      case 'tundra': return '#1A202C';
      case 'forest': return '#22543D';
      default: return '#1A202C';
    }
  };

  const getGroundColor = () => {
    switch (environment) {
      case 'desert': return '#D69E2E';
      case 'mountains': return '#4A5568';
      case 'coast': return '#975A16';
      case 'tundra': return '#E2E8F0';
      case 'forest': return '#2F855A';
      default: return '#4A5568';
    }
  };

  const renderShelter = () => (
    <svg viewBox="0 0 400 300" className="w-full h-full">
      <rect fill={getSkyColor()} width="400" height="200" />
      <rect fill={getGroundColor()} y="200" width="400" height="100" />

      <polygon points="280,120 360,180 200,180" fill="#7C3AED" opacity="0.3" />
      <line x1="280" y1="120" x2="280" y2="180" stroke="#9F7AEA" strokeWidth="3" />
      <line x1="280" y1="120" x2="360" y2="180" stroke="#9F7AEA" strokeWidth="3" />
      <line x1="280" y1="120" x2="200" y2="180" stroke="#9F7AEA" strokeWidth="3" />

      <circle cx="250" cy="160" r="15" fill="#A0AEC0" />
      <rect x="243" y="175" width="14" height="25" fill="#718096" />
      <circle cx="245" cy="162" r="3" fill="#2D3748" />
      <circle cx="255" cy="162" r="3" fill="#2D3748" />
    </svg>
  );

  const renderFire = () => (
    <svg viewBox="0 0 400 300" className="w-full h-full">
      <rect fill={getSkyColor()} width="400" height="200" />
      <rect fill={getGroundColor()} y="200" width="400" height="100" />

      <ellipse cx="280" cy="210" rx="35" ry="8" fill="#4A5568" />
      <rect x="270" y="195" width="5" height="20" fill="#975A16" />
      <rect x="285" y="195" width="5" height="20" fill="#975A16" />
      <rect x="278" y="190" width="4" height="20" fill="#975A16" />

      <path d="M 280 185 Q 285 170 280 160 Q 275 170 280 185" fill="#F6AD55" opacity="0.8" />
      <path d="M 280 180 Q 283 170 280 165 Q 277 170 280 180" fill="#FBD38D" />
      <path d="M 280 175 Q 282 168 280 163 Q 278 168 280 175" fill="#FEEBC8" />

      <circle cx="230" cy="190" r="15" fill="#A0AEC0" />
      <rect x="223" y="205" width="14" height="25" fill="#718096" />
      <line x1="220" y1="210" x2="210" y2="215" stroke="#718096" strokeWidth="3" strokeLinecap="round" />
      <line x1="240" y1="210" x2="250" y2="215" stroke="#718096" strokeWidth="3" strokeLinecap="round" />
      <circle cx="225" cy="192" r="3" fill="#2D3748" />
      <circle cx="235" cy="192" r="3" fill="#2D3748" />
    </svg>
  );

  const renderRest = () => (
    <svg viewBox="0 0 400 300" className="w-full h-full">
      <rect fill={getSkyColor()} width="400" height="200" />
      <rect fill={getGroundColor()} y="200" width="400" height="100" />

      <ellipse cx="280" cy="220" rx="40" ry="15" fill="#718096" opacity="0.6" />
      <circle cx="270" cy="210" r="15" fill="#A0AEC0" />
      <ellipse cx="290" cy="218" rx="25" ry="12" fill="#718096" />
      <circle cx="268" cy="212" r="3" fill="#2D3748" />
      <line x1="268" y1="215" x2="272" y2="215" stroke="#2D3748" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );

  const renderWalking = () => (
    <svg viewBox="0 0 400 300" className="w-full h-full">
      <rect fill={getSkyColor()} width="400" height="200" />
      <rect fill={getGroundColor()} y="200" width="400" height="100" />

      <circle cx="280" cy="170" r="15" fill="#A0AEC0" />
      <rect x="273" y="185" width="14" height="28" fill="#718096" />
      <line x1="280" y1="213" x2="270" y2="235" stroke="#718096" strokeWidth="4" strokeLinecap="round" />
      <line x1="280" y1="213" x2="290" y2="230" stroke="#718096" strokeWidth="4" strokeLinecap="round" />
      <line x1="273" y1="190" x2="260" y2="185" stroke="#718096" strokeWidth="4" strokeLinecap="round" />
      <line x1="287" y1="190" x2="300" y2="195" stroke="#718096" strokeWidth="4" strokeLinecap="round" />
      <circle cx="275" cy="172" r="3" fill="#2D3748" />
      <circle cx="285" cy="172" r="3" fill="#2D3748" />

      <path d="M 220 210 Q 230 205 240 210 L 245 215 Q 235 212 225 215 Z" fill="#4A5568" opacity="0.4" />
      <path d="M 250 220 Q 255 215 265 220 L 268 223 Q 260 220 252 223 Z" fill="#4A5568" opacity="0.4" />
    </svg>
  );

  const renderClimbing = () => (
    <svg viewBox="0 0 400 300" className="w-full h-full">
      <rect fill={getSkyColor()} width="400" height="200" />
      <rect fill={getGroundColor()} y="200" width="400" height="100" />

      <path d="M 320 200 L 340 120 L 360 200" fill="#4A5568" stroke="#2D3748" strokeWidth="2" />

      <circle cx="345" cy="160" r="12" fill="#A0AEC0" />
      <rect x="340" y="172" width="10" height="20" fill="#718096" />
      <line x1="350" y1="175" x2="360" y2="165" stroke="#718096" strokeWidth="3" strokeLinecap="round" />
      <line x1="340" y1="180" x2="333" y2="190" stroke="#718096" strokeWidth="3" strokeLinecap="round" />
      <circle cx="342" cy="162" r="2" fill="#2D3748" />
      <circle cx="348" cy="162" r="2" fill="#2D3748" />
    </svg>
  );

  const renderSignal = () => (
    <svg viewBox="0 0 400 300" className="w-full h-full">
      <rect fill={getSkyColor()} width="400" height="200" />
      <rect fill={getGroundColor()} y="200" width="400" height="100" />

      <circle cx="260" cy="180" r="15" fill="#A0AEC0" />
      <rect x="253" y="195" width="14" height="25" fill="#718096" />
      <line x1="260" y1="195" x2="260" y2="165" stroke="#718096" strokeWidth="4" strokeLinecap="round" />
      <line x1="260" y1="165" x2="280" y2="145" stroke="#ECC94B" strokeWidth="3" />
      <circle cx="280" cy="145" r="5" fill="#F6E05E" />
      <circle cx="255" cy="182" r="3" fill="#2D3748" />
      <circle cx="265" cy="182" r="3" fill="#2D3748" />

      <path d="M 280 145 Q 290 140 300 135" stroke="#F6E05E" strokeWidth="2" opacity="0.6" strokeDasharray="2,2" />
      <path d="M 280 145 Q 290 145 300 145" stroke="#F6E05E" strokeWidth="2" opacity="0.6" strokeDasharray="2,2" />
      <path d="M 280 145 Q 290 150 300 155" stroke="#F6E05E" strokeWidth="2" opacity="0.6" strokeDasharray="2,2" />
    </svg>
  );

  const renderDrink = () => (
    <svg viewBox="0 0 400 300" className="w-full h-full">
      <rect fill={getSkyColor()} width="400" height="200" />
      <rect fill={getGroundColor()} y="200" width="400" height="100" />

      <circle cx="270" cy="175" r="15" fill="#A0AEC0" />
      <rect x="263" y="190" width="14" height="25" fill="#718096" />
      <rect x="280" y="165" width="8" height="18" rx="2" fill="#4299E1" stroke="#2B6CB0" strokeWidth="2" />
      <line x1="275" y1="190" x2="282" y2="175" stroke="#718096" strokeWidth="4" strokeLinecap="round" />
      <circle cx="265" cy="177" r="3" fill="#2D3748" />
      <circle cx="275" cy="177" r="3" fill="#2D3748" />
      <path d="M 282 168 Q 284 165 286 168" stroke="#63B3ED" strokeWidth="1.5" fill="none" />
    </svg>
  );

  const renderEat = () => (
    <svg viewBox="0 0 400 300" className="w-full h-full">
      <rect fill={getSkyColor()} width="400" height="200" />
      <rect fill={getGroundColor()} y="200" width="400" height="100" />

      <circle cx="270" cy="175" r="15" fill="#A0AEC0" />
      <rect x="263" y="190" width="14" height="25" fill="#718096" />
      <rect x="285" y="170" width="12" height="8" rx="1" fill="#D69E2E" />
      <line x1="275" y1="190" x2="285" y2="177" stroke="#718096" strokeWidth="4" strokeLinecap="round" />
      <circle cx="265" cy="177" r="3" fill="#2D3748" />
      <circle cx="275" cy="177" r="3" fill="#2D3748" />
      <line x1="267" y1="183" x2="273" y2="183" stroke="#2D3748" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );

  const renderScout = () => (
    <svg viewBox="0 0 400 300" className="w-full h-full">
      <rect fill={getSkyColor()} width="400" height="200" />
      <rect fill={getGroundColor()} y="200" width="400" height="100" />

      <circle cx="270" cy="175" r="15" fill="#A0AEC0" />
      <rect x="263" y="190" width="14" height="25" fill="#718096" />
      <line x1="270" y1="190" x2="255" y2="180" stroke="#718096" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="245" cy="177" rx="8" ry="12" fill="none" stroke="#A0AEC0" strokeWidth="2" />
      <circle cx="267" cy="177" r="3" fill="#2D3748" />
      <circle cx="273" cy="177" r="3" fill="#2D3748" />

      <circle cx="320" cy="190" r="8" fill="#48BB78" opacity="0.6" />
      <circle cx="335" cy="185" r="6" fill="#48BB78" opacity="0.6" />
      <rect x="308" y="205" width="4" height="10" fill="#975A16" opacity="0.6" />
    </svg>
  );

  const renderTreatment = () => (
    <svg viewBox="0 0 400 300" className="w-full h-full">
      <rect fill={getSkyColor()} width="400" height="200" />
      <rect fill={getGroundColor()} y="200" width="400" height="100" />

      <circle cx="270" cy="180" r="15" fill="#A0AEC0" />
      <rect x="263" y="195" width="14" height="25" fill="#718096" />
      <line x1="277" y1="195" x2="290" y2="190" stroke="#718096" strokeWidth="4" strokeLinecap="round" />
      <rect x="288" y="185" width="12" height="10" rx="1" fill="#E53E3E" />
      <line x1="291" y1="185" x2="291" y2="195" stroke="white" strokeWidth="1.5" />
      <line x1="286" y1="190" x2="296" y2="190" stroke="white" strokeWidth="1.5" />
      <circle cx="265" cy="182" r="3" fill="#2D3748" />
      <circle cx="275" cy="182" r="3" fill="#2D3748" />
    </svg>
  );

  const getIllustration = () => {
    if (decisionId.includes('shelter') || decisionId.includes('fortify')) return renderShelter();
    if (decisionId.includes('fire')) return renderFire();
    if (decisionId === 'rest') return renderRest();
    if (decisionId.includes('drink')) return renderDrink();
    if (decisionId.includes('eat')) return renderEat();
    if (decisionId.includes('signal') || decisionId.includes('whistle') || decisionId.includes('mirror') || decisionId.includes('flashlight-signal')) return renderSignal();
    if (decisionId.includes('climb') || decisionId.includes('vantage')) return renderClimbing();
    if (decisionId.includes('scout') || decisionId.includes('search')) return renderScout();
    if (decisionId.includes('treat') || decisionId.includes('injury')) return renderTreatment();
    if (decisionId.includes('descend') || decisionId.includes('travel') || decisionId.includes('navigate') ||
        decisionId.includes('retrace') || decisionId.includes('follow') || decisionId.includes('backtrack') ||
        decisionId.includes('panic')) return renderWalking();

    return renderWalking();
  };

  return (
    <div className="w-full h-full opacity-40">
      {getIllustration()}
    </div>
  );
}
