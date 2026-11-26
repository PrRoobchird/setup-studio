import React from 'react';
import { PET_BREED_MAP } from '../data/catalog';
import { PetSpecies } from '../types/studio';

interface PetIllustrationProps {
  breedId: string;
  className?: string;
}

export const PetIllustration: React.FC<PetIllustrationProps> = ({
  breedId,
  className = 'w-14 h-14',
}) => {
  const breed = PET_BREED_MAP[breedId];
  const primary = breed?.primaryHex ?? '#D98245';
  const secondary = breed?.secondaryHex ?? '#FFF6EB';
  const eye = breed?.eyeHex ?? '#1F1A17';
  const species: PetSpecies = breed?.species ?? 'dog';

  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden="true">
      {species === 'dog' && (
        <g>
          {/* Wooden playpen bars hint */}
          <rect x="10" y="54" width="60" height="12" rx="4" fill="#B98556" stroke="#2C1C13" strokeWidth="1.6" />
          <line x1="20" y1="54" x2="20" y2="66" stroke="#2C1C13" strokeWidth="1.3" />
          <line x1="60" y1="54" x2="60" y2="66" stroke="#2C1C13" strokeWidth="1.3" />
          {/* Dog body & ears */}
          <ellipse cx="40" cy="52" rx="14" ry="10" fill={primary} stroke="#2C1C13" strokeWidth="1.7" />
          <path d="M23 26 L28 14 L35 25 Z" fill={primary} stroke="#2C1C13" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="M57 26 L52 14 L45 25 Z" fill={primary} stroke="#2C1C13" strokeWidth="1.7" strokeLinejoin="round" />
          <circle cx="40" cy="34" r="15" fill={primary} stroke="#2C1C13" strokeWidth="1.8" />
          <ellipse cx="40" cy="40" rx="10" ry="7" fill={secondary} />
          <circle cx="34" cy="32" r="2.2" fill={eye} />
          <circle cx="46" cy="32" r="2.2" fill={eye} />
          <ellipse cx="40" cy="38" rx="3" ry="2.2" fill="#231C18" />
          <path d="M37 42 Q40 45 43 42" fill="none" stroke="#231C18" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      )}

      {species === 'cat' && (
        <g>
          {/* Cat condo pad */}
          <ellipse cx="40" cy="60" rx="22" ry="6" fill="#D5B895" stroke="#2C1C13" strokeWidth="1.6" />
          {/* Tail */}
          <path d="M52 54 Q66 44 60 32" fill="none" stroke={primary} strokeWidth="5" strokeLinecap="round" />
          <path d="M52 54 Q66 44 60 32" fill="none" stroke="#2C1C13" strokeWidth="1.5" strokeLinecap="round" />
          {/* Body */}
          <ellipse cx="40" cy="51" rx="13" ry="10" fill={primary} stroke="#2C1C13" strokeWidth="1.7" />
          <ellipse cx="40" cy="53" rx="7" ry="6" fill={secondary} />
          {/* Head + Ears */}
          <path d="M25 27 L24 14 L35 22 Z" fill={primary} stroke="#2C1C13" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="M55 27 L56 14 L45 22 Z" fill={primary} stroke="#2C1C13" strokeWidth="1.7" strokeLinejoin="round" />
          <circle cx="40" cy="33" r="14" fill={primary} stroke="#2C1C13" strokeWidth="1.8" />
          <ellipse cx="40" cy="37" rx="8" ry="6" fill={secondary} />
          <circle cx="34" cy="32" r="2.3" fill={eye} />
          <circle cx="46" cy="32" r="2.3" fill={eye} />
          <polygon points="38,36 42,36 40,38.5" fill="#FB7185" />
          <line x1="22" y1="35" x2="29" y2="36" stroke="#2C1C13" strokeWidth="1.2" />
          <line x1="58" y1="35" x2="51" y2="36" stroke="#2C1C13" strokeWidth="1.2" />
        </g>
      )}

      {species === 'goldfish' && (
        <g>
          {/* Glass Tank */}
          <rect x="14" y="20" width="52" height="42" rx="7" fill="#E0F2FE" fillOpacity="0.85" stroke="#0284C7" strokeWidth="2" />
          <rect x="16" y="28" width="48" height="32" rx="4" fill="#7DD3FC" fillOpacity="0.45" />
          <path d="M16 55 Q40 52 64 55 L64 60 L16 60 Z" fill="#E7C896" />
          {/* Aquatic Plant */}
          <path d="M25 56 Q22 44 26 36 M28 56 Q32 45 29 38" fill="none" stroke="#16A34A" strokeWidth="2.6" strokeLinecap="round" />
          {/* Goldfish */}
          <path d="M48 42 L61 33 L58 42 L61 51 Z" fill={secondary} stroke="#2C1C13" strokeWidth="1.4" strokeLinejoin="round" />
          <ellipse cx="39" cy="42" rx="12" ry="8" fill={primary} stroke="#2C1C13" strokeWidth="1.6" />
          <circle cx="32" cy="40" r="2" fill={eye} />
          <circle cx="29" cy="31" r="2" fill="#FFFFFF" opacity="0.85" />
          <circle cx="34" cy="25" r="1.5" fill="#FFFFFF" opacity="0.85" />
        </g>
      )}

      {species === 'hedgehog' && (
        <g>
          {/* Terrarium Tray & Wheel */}
          <rect x="12" y="48" width="56" height="16" rx="4" fill="#D5A678" stroke="#2C1C13" strokeWidth="1.7" />
          <circle cx="53" cy="36" r="13" fill="none" stroke="#64748B" strokeWidth="3" />
          <circle cx="53" cy="36" r="3" fill="#64748B" />
          {/* Spiky Dorsal Dome */}
          <path
            d="M19 49 C18 30 43 24 50 40 L48 50 Z"
            fill={primary}
            stroke="#2C1C13"
            strokeWidth="1.8"
          />
          {/* Face */}
          <path d="M18 49 C19 40 28 38 34 45 L33 50 Z" fill={secondary} stroke="#2C1C13" strokeWidth="1.5" />
          <circle cx="24" cy="45" r="2" fill={eye} />
          <circle cx="17" cy="48" r="2.2" fill="#231C18" />
        </g>
      )}

      {species === 'snake' && (
        <g>
          {/* Glass Terrarium Box */}
          <rect x="13" y="20" width="54" height="44" rx="6" fill="#ECFEFF" fillOpacity="0.65" stroke="#334155" strokeWidth="1.8" />
          <rect x="15" y="51" width="50" height="11" rx="2" fill="#E6CFA9" />
          {/* Driftwood Branch */}
          <path d="M18 53 Q36 42 60 35" fill="none" stroke="#8C6239" strokeWidth="4" strokeLinecap="round" />
          {/* Coiled Snake Body */}
          <path
            d="M23 52 C22 44 58 44 56 51 C55 57 25 57 26 48 C27 40 48 42 46 34 C45 29 36 28 31 32"
            fill="none"
            stroke="#2C1C13"
            strokeWidth="9.5"
            strokeLinecap="round"
          />
          <path
            d="M23 52 C22 44 58 44 56 51 C55 57 25 57 26 48 C27 40 48 42 46 34 C45 29 36 28 31 32"
            fill="none"
            stroke={primary}
            strokeWidth="6.5"
            strokeLinecap="round"
          />
          {/* Pattern Spots */}
          <circle cx="34" cy="45.5" r="2.1" fill={secondary} />
          <circle cx="46" cy="46.5" r="2.1" fill={secondary} />
          <circle cx="36" cy="54" r="2.1" fill={secondary} />
          <circle cx="45" cy="36" r="2" fill={secondary} />
          {/* Cute Rounded Head & Forked Tongue */}
          <ellipse cx="29" cy="32" rx="6.5" ry="5" fill={primary} stroke="#2C1C13" strokeWidth="1.5" />
          <circle cx="27" cy="30.8" r="1.5" fill={eye} />
          <circle cx="31.5" cy="30.8" r="1.5" fill={eye} />
          <path d="M23 33 L18 33 L16 31.5 M18 33 L16 34.5" fill="none" stroke="#EF4444" strokeWidth="1.3" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
};
