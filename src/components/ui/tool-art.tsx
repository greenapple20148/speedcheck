export function UploadHeroArt() {
  return (
    <svg viewBox="0 0 200 140" className="h-28 w-44" aria-hidden>
      <rect width="200" height="140" rx="24" className="fill-[#EAF8F1] [[data-theme=dark]_&]:fill-[#134E4A]/40" />
      <rect x="48" y="36" width="104" height="68" rx="10" fill="#FFFFFF" />
      <rect x="58" y="46" width="84" height="46" rx="6" className="fill-[#EAF8F1]" />
      <path d="M100 58 v22" stroke="#006B53" strokeWidth="3" strokeLinecap="round" />
      <path d="M91 67 l9 -10 9 10" fill="none" stroke="#006B53" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="78" y="104" width="44" height="6" rx="3" fill="#009B78" />
      <rect x="92" y="110" width="16" height="10" rx="2" fill="#006B53" />
    </svg>
  );
}

export function MeshHeroArt() {
  return (
    <svg viewBox="0 0 200 140" className="h-28 w-44" aria-hidden>
      <rect width="200" height="140" rx="24" className="fill-[#EAF8F1] [[data-theme=dark]_&]:fill-[#134E4A]/40" />
      <path d="M46 84 L100 48 L154 84 V112 H46 Z" fill="#FFFFFF" stroke="#009B78" strokeWidth="2" />
      <rect x="90" y="92" width="20" height="20" rx="2" className="fill-[#EAF8F1]" />
      <path d="M100 34 a10 10 0 0 1 0 8" fill="none" stroke="#006B53" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M86 28 a20 20 0 0 1 28 0" fill="none" stroke="#006B53" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="62" cy="108" r="8" fill="#006B53" />
      <circle cx="138" cy="108" r="8" fill="#009B78" />
    </svg>
  );
}

export function MeshSetupArt() {
  return (
    <svg viewBox="0 0 200 140" className="h-28 w-44" aria-hidden>
      <rect width="200" height="140" rx="24" className="fill-[#EAF8F1] [[data-theme=dark]_&]:fill-[#134E4A]/40" />
      {[58, 100, 142].map((x) => (
        <g key={x}>
          <rect x={x - 16} y="58" width="32" height="36" rx="12" fill="#FFFFFF" stroke="#009B78" strokeWidth="2" />
          <circle cx={x} cy="84" r="4" fill="#006B53" />
        </g>
      ))}
      <path d="M74 70 H126" stroke="#006B53" strokeWidth="2" strokeDasharray="3 3" />
    </svg>
  );
}
