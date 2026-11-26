import React from 'react';
import { AVATAR_ITEM_MAP } from '../data/catalog';

interface FashionIllustrationProps {
  itemId: string;
  className?: string;
}

export const FashionIllustration: React.FC<FashionIllustrationProps> = ({
  itemId,
  className = 'w-14 h-14',
}) => {
  const item = AVATAR_ITEM_MAP[itemId];
  const primary = item?.primaryHex ?? '#7FA3C7';
  const secondary = item?.secondaryHex ?? '#EFE4D2';

  const renderGraphic = () => {
    switch (itemId) {
      // === OUTFITS ===
      case 'outfit_clay_overalls':
        return (
          <g>
            {/* Striped clay shirt */}
            <path
              d="M18 25 L30 20 L50 20 L62 25 L67 44 L57 47 L53 33 L53 66 L27 66 L27 33 L23 47 L13 44 Z"
              fill={secondary}
              stroke="#3B2B23"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <line x1="17" y1="30" x2="63" y2="30" stroke="#C95443" strokeWidth="2.4" />
            <line x1="15" y1="38" x2="65" y2="38" stroke="#C95443" strokeWidth="2.4" />
            {/* Solid terracotta-red collar & wrist cuffs */}
            <path d="M31 20 Q40 25 49 20" fill="none" stroke="#C95443" strokeWidth="2.6" strokeLinecap="round" />
            <path d="M13 43 L23 46" stroke="#C95443" strokeWidth="3.2" strokeLinecap="round" />
            <path d="M57 46 L67 43" stroke="#C95443" strokeWidth="3.2" strokeLinecap="round" />
            {/* Denim Overalls */}
            <path
              d="M29 31 L51 31 L53 67 L43 67 L42 53 L38 53 L37 67 L27 67 Z"
              fill={primary}
              stroke="#3B2B23"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <rect x="30" y="21" width="4" height="12" fill={primary} stroke="#3B2B23" strokeWidth="1.3" />
            <rect x="46" y="21" width="4" height="12" fill={primary} stroke="#3B2B23" strokeWidth="1.3" />
            <circle cx="32" cy="32" r="2.1" fill="#E0A284" stroke="#B98963" strokeWidth="0.9" />
            <circle cx="48" cy="32" r="2.1" fill="#E0A284" stroke="#B98963" strokeWidth="0.9" />
            <path d="M34 38 H46 V44 Q46 48 40 48 Q34 48 34 44 Z" fill="#44638A" stroke="#3B2B23" strokeWidth="1.2" />
          </g>
        );

      case 'outfit_bjd_ribbon_dress':
        return (
          <g>
            {/* Cream puffy sleeves & bodice */}
            <path
              d="M21 25 C17 28 16 36 22 38 L29 35 L29 42 L51 42 L51 35 L58 38 C64 36 63 28 59 25 L49 20 L31 20 Z"
              fill={secondary}
              stroke="#4B3832"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            {/* Layered ruffled dress skirt */}
            <path
              d="M29 41 L51 41 L61 65 Q50 68 40 65 Q30 68 19 65 Z"
              fill={primary}
              stroke="#4B3832"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path
              d="M24 53 Q32 56 40 53 Q48 56 56 53"
              fill="none"
              stroke={secondary}
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            {/* Waist ribbon bow */}
            <path d="M31 40 L40 43 L31 46 Z" fill="#D97284" stroke="#4B3832" strokeWidth="1.2" />
            <path d="M49 40 L40 43 L49 46 Z" fill="#D97284" stroke="#4B3832" strokeWidth="1.2" />
            <circle cx="40" cy="43" r="2.2" fill="#E88D9C" stroke="#4B3832" strokeWidth="1.1" />
          </g>
        );

      case 'outfit_starter_tank':
        return (
          <g>
            {/* Sleeveless tank top */}
            <path
              d="M28 19 L34 19 L36 25 Q40 28 44 25 L46 19 L52 19 L53 45 L27 45 L28 19 Z"
              fill={primary}
              stroke="#2C1C13"
              strokeWidth="1.9"
              strokeLinejoin="round"
            />
            {/* Ribbed neckline detail */}
            <path d="M34 19 Q40 28 46 19" fill="none" stroke="#94A3B8" strokeWidth="1.3" />
            {/* Casual shorts */}
            <path
              d="M27 45 L53 45 L56 64 L43 64 L41 53 L39 53 L37 64 L24 64 Z"
              fill={secondary}
              stroke="#2C1C13"
              strokeWidth="1.9"
              strokeLinejoin="round"
            />
            <line x1="27" y1="48" x2="53" y2="48" stroke="#2C1C13" strokeWidth="1.2" opacity="0.45" />
          </g>
        );

      case 'outfit_hoodie_apron':
        return (
          <g>
            {/* Hoodie shoulders & sleeves */}
            <path
              d="M20 26 L30 20 L50 20 L60 26 L67 44 L58 48 L54 34 L54 66 L26 66 L26 34 L22 48 L13 44 Z"
              fill={primary}
              stroke="#2C1C13"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            {/* Hood collar */}
            <path d="M31 20 Q40 28 49 20" fill="none" stroke="#2C1C13" strokeWidth="1.8" />
            {/* Apron overlay */}
            <path
              d="M30 30 L50 30 L52 66 L28 66 Z"
              fill={secondary}
              stroke="#2C1C13"
              strokeWidth="1.5"
            />
            <rect x="35" y="45" width="10" height="8" rx="1.5" fill="#D5C4AA" stroke="#2C1C13" strokeWidth="1.1" />
            {/* Paint smudge */}
            <circle cx="44" cy="39" r="2.2" fill="#E11D48" />
            <circle cx="36" cy="59" r="2" fill="#2563EB" />
          </g>
        );

      case 'outfit_overalls':
        return (
          <g>
            {/* Mustard tee underneath */}
            <path
              d="M19 25 L30 20 L50 20 L61 25 L67 40 L57 44 L53 33 L53 66 L27 66 L27 33 L23 44 L13 40 Z"
              fill={secondary}
              stroke="#2C1C13"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            {/* Denim Overalls */}
            <path
              d="M29 31 L51 31 L53 67 L43 67 L42 53 L38 53 L37 67 L27 67 Z"
              fill={primary}
              stroke="#2C1C13"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            {/* Straps */}
            <rect x="30" y="21" width="4" height="12" fill={primary} stroke="#2C1C13" strokeWidth="1.3" />
            <rect x="46" y="21" width="4" height="12" fill={primary} stroke="#2C1C13" strokeWidth="1.3" />
            {/* Front pocket & pencils */}
            <rect x="34" y="37" width="12" height="9" rx="1.5" fill="#3C5982" stroke="#2C1C13" strokeWidth="1.2" />
            <line x1="38" y1="33" x2="38" y2="39" stroke="#FDE047" strokeWidth="2" />
            <line x1="42" y1="32" x2="42" y2="39" stroke="#FB7185" strokeWidth="2" />
          </g>
        );

      case 'outfit_cardigan':
        return (
          <g>
            {/* Pleated Skirt */}
            <path
              d="M29 48 L51 48 L57 67 L23 67 Z"
              fill={secondary}
              stroke="#2C1C13"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            {/* Cardigan body & sleeves */}
            <path
              d="M19 25 L30 20 L50 20 L61 25 L67 45 L58 48 L53 33 L53 50 L27 50 L27 33 L22 48 L13 45 Z"
              fill={primary}
              stroke="#2C1C13"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            {/* Inner white tee V-neck */}
            <path d="M34 20 L40 34 L46 20 Z" fill="#FFFFFF" stroke="#2C1C13" strokeWidth="1.2" />
            {/* Buttons */}
            <circle cx="40" cy="38" r="1.4" fill="#6D4C3D" />
            <circle cx="40" cy="44" r="1.4" fill="#6D4C3D" />
          </g>
        );

      case 'outfit_pastel_atelier':
        return (
          <g>
            {/* Cream Blouse */}
            <path
              d="M20 25 L30 20 L50 20 L60 25 L66 43 L57 46 L52 33 L28 33 L23 46 L14 43 Z"
              fill={secondary}
              stroke="#2C1C13"
              strokeWidth="1.7"
            />
            {/* Sage Linen Pinafore */}
            <path
              d="M29 28 L51 28 L57 67 L23 67 Z"
              fill={primary}
              stroke="#2C1C13"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <rect x="30" y="20" width="4" height="10" fill={primary} stroke="#2C1C13" strokeWidth="1.2" />
            <rect x="46" y="20" width="4" height="10" fill={primary} stroke="#2C1C13" strokeWidth="1.2" />
            <path d="M27 46 L53 46" stroke="#2C1C13" strokeWidth="1.3" />
          </g>
        );

      case 'outfit_varsity':
        return (
          <g>
            {/* Cream sleeves */}
            <path
              d="M20 24 L30 20 L50 20 L60 24 L67 45 L58 48 L53 33 L27 33 L22 48 L13 45 Z"
              fill={secondary}
              stroke="#2C1C13"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            {/* Brick red body */}
            <path
              d="M28 21 L52 21 L53 60 L27 60 Z"
              fill={primary}
              stroke="#2C1C13"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            {/* Collar & hem ribs */}
            <rect x="27" y="56" width="26" height="5" fill="#1F2937" stroke="#2C1C13" strokeWidth="1.3" />
            <line x1="40" y1="21" x2="40" y2="56" stroke={secondary} strokeWidth="2.2" />
            {/* Art Badge */}
            <circle cx="34" cy="34" r="3.4" fill="#FBBF24" stroke="#2C1C13" strokeWidth="1.2" />
          </g>
        );

      case 'outfit_arch_blazer':
        return (
          <g>
            {/* Turtleneck */}
            <rect x="34" y="16" width="12" height="7" rx="2" fill={secondary} stroke="#2C1C13" strokeWidth="1.4" />
            {/* Blazer */}
            <path
              d="M19 25 L31 20 L49 20 L61 25 L67 46 L58 49 L53 34 L54 66 L26 66 L27 34 L22 49 L13 46 Z"
              fill={primary}
              stroke="#2C1C13"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            {/* Inner shirt V */}
            <path d="M35 21 L40 40 L45 21 Z" fill={secondary} stroke="#2C1C13" strokeWidth="1.2" />
            {/* Lapels */}
            <path d="M31 20 L36 39 L30 33 Z" fill="#373D46" stroke="#2C1C13" strokeWidth="1.1" />
            <path d="M49 20 L44 39 L50 33 Z" fill="#373D46" stroke="#2C1C13" strokeWidth="1.1" />
            <circle cx="40" cy="46" r="1.5" fill="#CBD5E1" />
          </g>
        );

      case 'outfit_xmas_knit':
        return (
          <g>
            {/* Red knit sweater */}
            <path
              d="M19 26 L30 21 L50 21 L61 26 L67 45 L58 48 L53 34 L53 64 L27 64 L27 34 L22 48 L13 45 Z"
              fill={primary}
              stroke="#2C1C13"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            {/* White trim */}
            <rect x="27" y="58" width="26" height="6" rx="1.5" fill="#FAF8F4" stroke="#2C1C13" strokeWidth="1.2" />
            {/* Zigzag holiday pattern */}
            <path d="M28 45 L34 39 L40 45 L46 39 L52 45" fill="none" stroke="#FDE047" strokeWidth="2" strokeLinecap="round" />
            {/* Green scarf */}
            <rect x="30" y="19" width="20" height="8" rx="3" fill={secondary} stroke="#2C1C13" strokeWidth="1.4" />
            <path d="M42 26 L48 26 L49 46 L42 46 Z" fill={secondary} stroke="#2C1C13" strokeWidth="1.4" />
          </g>
        );

      case 'outfit_ny_party':
        return (
          <g>
            {/* Inner black shirt */}
            <path d="M33 20 L47 20 L45 45 L35 45 Z" fill="#111827" />
            {/* Midnight navy long coat */}
            <path
              d="M19 25 L31 20 L49 20 L61 25 L67 46 L58 49 L53 34 L56 68 L24 68 L27 34 L22 49 L13 46 Z"
              fill={primary}
              stroke="#2C1C13"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            {/* Gold lapels */}
            <path d="M31 20 L37 42 L31 35 Z" fill={secondary} stroke="#2C1C13" strokeWidth="1.2" />
            <path d="M49 20 L43 42 L49 35 Z" fill={secondary} stroke="#2C1C13" strokeWidth="1.2" />
            {/* Gold belt/buttons */}
            <circle cx="37" cy="48" r="1.6" fill={secondary} />
            <circle cx="43" cy="48" r="1.6" fill={secondary} />
            <circle cx="37" cy="56" r="1.6" fill={secondary} />
            <circle cx="43" cy="56" r="1.6" fill={secondary} />
          </g>
        );

      // === HEADWEAR ===
      case 'head_beret_pink':
      case 'head_beret_navy':
        return (
          <g>
            <ellipse cx="40" cy="44" rx="23" ry="12" transform="rotate(-10 40 44)" fill={primary} stroke="#2C1C13" strokeWidth="2" />
            <ellipse cx="40" cy="49" rx="18" ry="5" fill={secondary} stroke="#2C1C13" strokeWidth="1.5" />
            <path d="M38 31 L41 26" stroke="#2C1C13" strokeWidth="2.4" strokeLinecap="round" />
          </g>
        );

      case 'head_beanie_mustard':
        return (
          <g>
            <path d="M20 47 C20 26 60 26 60 47 Z" fill={primary} stroke="#2C1C13" strokeWidth="2" />
            <rect x="18" y="45" width="44" height="11" rx="5" fill={secondary} stroke="#2C1C13" strokeWidth="1.8" />
            <line x1="27" y1="45" x2="27" y2="56" stroke="#2C1C13" strokeWidth="1.1" opacity="0.4" />
            <line x1="35" y1="45" x2="35" y2="56" stroke="#2C1C13" strokeWidth="1.1" opacity="0.4" />
            <line x1="45" y1="45" x2="45" y2="56" stroke="#2C1C13" strokeWidth="1.1" opacity="0.4" />
            <line x1="53" y1="45" x2="53" y2="56" stroke="#2C1C13" strokeWidth="1.1" opacity="0.4" />
            <circle cx="40" cy="25" r="5" fill={secondary} stroke="#2C1C13" strokeWidth="1.6" />
          </g>
        );

      case 'head_cap_cobalt':
        return (
          <g>
            <path d="M21 48 C21 28 57 28 57 48 Z" fill={primary} stroke="#2C1C13" strokeWidth="2" />
            <path d="M34 30 L42 30 L43 47 L33 47 Z" fill={secondary} stroke="#2C1C13" strokeWidth="1.4" />
            <path d="M40 47 L67 49 C66 54 54 55 40 53 Z" fill={primary} stroke="#2C1C13" strokeWidth="1.8" />
          </g>
        );

      case 'head_cat_ears':
        return (
          <g>
            <path d="M22 52 C22 33 58 33 58 52" fill="none" stroke="#2C1C13" strokeWidth="4" strokeLinecap="round" />
            <path d="M22 41 L25 22 L36 36 Z" fill={primary} stroke="#2C1C13" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M58 41 L55 22 L44 36 Z" fill={primary} stroke="#2C1C13" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M25 38 L27 27 L33 35 Z" fill={secondary} />
            <path d="M55 38 L53 27 L47 35 Z" fill={secondary} />
          </g>
        );

      case 'head_santa_hat':
        return (
          <g>
            <path d="M20 48 C22 25 46 21 58 34 L63 42 L53 43 C48 39 45 43 46 48 Z" fill={primary} stroke="#2C1C13" strokeWidth="2" strokeLinejoin="round" />
            <rect x="17" y="45" width="38" height="11" rx="5.5" fill={secondary} stroke="#2C1C13" strokeWidth="1.8" />
            <circle cx="63" cy="43" r="6" fill={secondary} stroke="#2C1C13" strokeWidth="1.8" />
          </g>
        );

      case 'head_reindeer':
        return (
          <g>
            <path d="M23 54 C23 36 57 36 57 54" fill="none" stroke="#DC2626" strokeWidth="4" strokeLinecap="round" />
            <path d="M29 40 L23 20 M25 29 L17 24 M26 26 L31 20" stroke={primary} strokeWidth="3.8" strokeLinecap="round" />
            <path d="M51 40 L57 20 M55 29 L63 24 M54 26 L49 20" stroke={primary} strokeWidth="3.8" strokeLinecap="round" />
            <circle cx="28" cy="40" r="3.2" fill={secondary} stroke="#2C1C13" strokeWidth="1.2" />
            <circle cx="52" cy="40" r="3.2" fill={secondary} stroke="#2C1C13" strokeWidth="1.2" />
            <circle cx="40" cy="39" r="3" fill="#16A34A" />
          </g>
        );

      // === GLASSES ===
      case 'glasses_round_gold':
        return (
          <g>
            <circle cx="26" cy="42" r="11" fill={secondary} fillOpacity="0.45" stroke={primary} strokeWidth="2.8" />
            <circle cx="54" cy="42" r="11" fill={secondary} fillOpacity="0.45" stroke={primary} strokeWidth="2.8" />
            <path d="M37 41 Q40 38 43 41" fill="none" stroke={primary} strokeWidth="2.5" />
            <line x1="15" y1="40" x2="10" y2="35" stroke={primary} strokeWidth="2.2" strokeLinecap="round" />
            <line x1="65" y1="40" x2="70" y2="35" stroke={primary} strokeWidth="2.2" strokeLinecap="round" />
          </g>
        );

      case 'glasses_square_black':
        return (
          <g>
            <rect x="14" y="33" width="22" height="16" rx="3" fill={secondary} fillOpacity="0.4" stroke={primary} strokeWidth="3.2" />
            <rect x="44" y="33" width="22" height="16" rx="3" fill={secondary} fillOpacity="0.4" stroke={primary} strokeWidth="3.2" />
            <line x1="36" y1="40" x2="44" y2="40" stroke={primary} strokeWidth="3.2" />
            <line x1="14" y1="37" x2="9" y2="34" stroke={primary} strokeWidth="2.4" strokeLinecap="round" />
            <line x1="66" y1="37" x2="71" y2="34" stroke={primary} strokeWidth="2.4" strokeLinecap="round" />
          </g>
        );

      case 'glasses_tinted_amber':
        return (
          <g>
            <rect x="14" y="33" width="22" height="16" rx="6" fill={secondary} fillOpacity="0.72" stroke={primary} strokeWidth="2.6" />
            <rect x="44" y="33" width="22" height="16" rx="6" fill={secondary} fillOpacity="0.72" stroke={primary} strokeWidth="2.6" />
            <line x1="36" y1="39" x2="44" y2="39" stroke={primary} strokeWidth="2.5" />
            <line x1="19" y1="37" x2="25" y2="44" stroke="#FFFFFF" strokeWidth="1.6" opacity="0.7" />
            <line x1="49" y1="37" x2="55" y2="44" stroke="#FFFFFF" strokeWidth="1.6" opacity="0.7" />
          </g>
        );

      // === HAND ITEMS ===
      case 'head_none':
      case 'glasses_none':
      case 'hand_none':
        return (
          <g>
            <circle cx="40" cy="40" r="18" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="2" strokeDasharray="4 3" />
            <line x1="29" y1="40" x2="51" y2="40" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        );

      case 'hand_brush':
        return (
          <g transform="rotate(-35 40 40)">
            <rect x="37" y="24" width="6" height="38" rx="2.5" fill={primary} stroke="#2C1C13" strokeWidth="1.6" />
            <rect x="36.5" y="18" width="7" height="8" fill="#CBD5E1" stroke="#2C1C13" strokeWidth="1.4" />
            <path d="M36 18 C36 8 44 8 44 18 Z" fill={secondary} stroke="#2C1C13" strokeWidth="1.5" />
          </g>
        );

      case 'hand_coffee':
        return (
          <g>
            <path d="M27 32 L53 32 L49 62 L31 62 Z" fill={primary} stroke="#2C1C13" strokeWidth="1.8" strokeLinejoin="round" />
            <rect x="28" y="40" width="24" height="12" fill={secondary} stroke="#2C1C13" strokeWidth="1.3" />
            <rect x="25" y="26" width="30" height="6" rx="2" fill="#FFFFFF" stroke="#2C1C13" strokeWidth="1.6" />
            <path d="M34 19 Q36 14 34 11 M45 19 Q47 14 45 11" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
          </g>
        );

      case 'hand_sketchbook':
        return (
          <g>
            <rect x="21" y="19" width="38" height="44" rx="4" fill={primary} stroke="#2C1C13" strokeWidth="1.8" />
            <rect x="25" y="19" width="5" height="44" fill="#9E3B2E" stroke="#2C1C13" strokeWidth="1.2" />
            <rect x="34" y="28" width="18" height="12" rx="2" fill={secondary} stroke="#2C1C13" strokeWidth="1.2" />
            <line x1="53" y1="19" x2="53" y2="63" stroke="#2C1C13" strokeWidth="2" />
          </g>
        );

      case 'hand_stylus':
        return (
          <g>
            <rect x="16" y="24" width="44" height="32" rx="4" fill={primary} stroke="#2C1C13" strokeWidth="1.8" />
            <rect x="20" y="28" width="36" height="24" rx="2" fill={secondary} />
            <path d="M26 44 Q36 32 48 40" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />
            <line x1="54" y1="54" x2="66" y2="28" stroke="#F8FAFC" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="54" y1="54" x2="66" y2="28" stroke="#2C1C13" strokeWidth="1.2" strokeLinecap="round" />
          </g>
        );

      case 'hand_camera':
        return (
          <g>
            <rect x="17" y="28" width="46" height="30" rx="5" fill={primary} stroke="#2C1C13" strokeWidth="1.8" />
            <rect x="17" y="28" width="46" height="9" rx="3" fill={secondary} stroke="#2C1C13" strokeWidth="1.6" />
            <rect x="28" y="23" width="14" height="6" rx="2" fill={secondary} stroke="#2C1C13" strokeWidth="1.5" />
            <circle cx="40" cy="44" r="10" fill="#1E293B" stroke={secondary} strokeWidth="2.5" />
            <circle cx="40" cy="44" r="5.5" fill="#38BDF8" />
            <circle cx="56" cy="33" r="2" fill="#EF4444" />
          </g>
        );

      case 'hand_xmas_gift':
        return (
          <g>
            <rect x="20" y="30" width="40" height="32" rx="3" fill={primary} stroke="#2C1C13" strokeWidth="1.8" />
            <rect x="18" y="25" width="44" height="9" rx="2.5" fill={primary} stroke="#2C1C13" strokeWidth="1.8" />
            <rect x="36" y="25" width="8" height="37" fill={secondary} stroke="#2C1C13" strokeWidth="1.3" />
            <ellipse cx="34" cy="21" rx="6" ry="4" fill={secondary} stroke="#2C1C13" strokeWidth="1.4" />
            <ellipse cx="46" cy="21" rx="6" ry="4" fill={secondary} stroke="#2C1C13" strokeWidth="1.4" />
          </g>
        );

      default:
        return (
          <g>
            <circle cx="40" cy="40" r="16" fill={primary} stroke="#2C1C13" strokeWidth="1.8" />
            <circle cx="48" cy="46" r="10" fill={secondary} stroke="#2C1C13" strokeWidth="1.5" />
          </g>
        );
    }
  };

  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden="true">
      {renderGraphic()}
    </svg>
  );
};
