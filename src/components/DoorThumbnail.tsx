import React from 'react';
import { DOOR_MAP } from '../data/catalog';

interface DoorThumbnailProps {
  doorId: string;
  className?: string;
}

export const DoorThumbnail: React.FC<DoorThumbnailProps> = ({
  doorId,
  className = 'w-16 h-20',
}) => {
  const door = DOOR_MAP[doorId] ?? DOOR_MAP.door_terracotta;
  const { style, frameColor, leafColor, accentColor, knobColor } = door;

  const isArch = style === 'arch_mediterranean';
  const hasGlass = style === 'sage_glass' || style === 'industrial_loft';

  return (
    <svg
      viewBox="0 0 80 100"
      className={className}
      role="img"
      aria-label={door.name}
    >
      {/* Subtle studio wall backdrop */}
      <rect x="0" y="0" width="80" height="100" rx="10" fill="#EFE8DC" />
      <rect x="0" y="88" width="80" height="12" fill="#E3DACB" />

      {isArch ? (
        <>
          {/* Arched cream frame */}
          <path
            d="M 15 92 L 15 38 A 25 25 0 0 1 65 38 L 65 92 Z"
            fill={frameColor}
            stroke="rgba(0,0,0,0.12)"
            strokeWidth="1.5"
          />
          {/* Arched walnut door leaf */}
          <path
            d="M 20 92 L 20 39 A 20 20 0 0 1 60 39 L 60 92 Z"
            fill={leafColor}
          />
          {/* Inner arch groove */}
          <path
            d="M 25 84 L 25 40 A 15 15 0 0 1 55 40 L 55 84 Z"
            fill="none"
            stroke={accentColor}
            strokeWidth="2"
          />
          <circle cx="53" cy="58" r="2.6" fill={knobColor} />
        </>
      ) : (
        <>
          {/* Rectangular door frame */}
          <rect
            x="15"
            y="10"
            width="50"
            height="82"
            rx="2"
            fill={frameColor}
            stroke="rgba(0,0,0,0.12)"
            strokeWidth="1.5"
          />
          {/* Door leaf */}
          <rect x="20" y="15" width="40" height="77" fill={leafColor} />

          {style === 'classic_panel' && (
            <>
              <rect x="25" y="21" width="30" height="27" rx="1.5" fill={accentColor} opacity="0.7" />
              <rect x="25" y="54" width="30" height="30" rx="1.5" fill={accentColor} opacity="0.7" />
              <circle cx="53" cy="53" r="2.8" fill={knobColor} />
            </>
          )}

          {style === 'ivory_molding' && (
            <>
              <rect
                x="24"
                y="20"
                width="32"
                height="28"
                rx="1"
                fill="none"
                stroke={accentColor}
                strokeWidth="2.2"
              />
              <rect
                x="24"
                y="54"
                width="32"
                height="30"
                rx="1"
                fill="none"
                stroke={accentColor}
                strokeWidth="2.2"
              />
              <rect x="49" y="51" width="7" height="2.4" rx="1" fill={knobColor} />
            </>
          )}

          {style === 'nordic_slat' && (
            <>
              {[24, 30, 36, 42, 48, 54].map((sx) => (
                <rect key={sx} x={sx} y="16" width="3" height="75" fill={accentColor} opacity="0.55" />
              ))}
              <rect x="52" y="42" width="2.8" height="22" rx="1.4" fill={knobColor} />
            </>
          )}

          {hasGlass && style === 'sage_glass' && (
            <>
              {/* Upper 4-pane window */}
              <rect x="24" y="20" width="32" height="34" rx="1.5" fill={accentColor} />
              <line x1="40" y1="20" x2="40" y2="54" stroke={frameColor} strokeWidth="2.2" />
              <line x1="24" y1="37" x2="56" y2="37" stroke={frameColor} strokeWidth="2.2" />
              {/* Lower wainscot panel */}
              <rect x="24" y="60" width="32" height="24" rx="1.5" fill="rgba(0,0,0,0.08)" />
              <circle cx="53" cy="56" r="2.5" fill={knobColor} />
            </>
          )}

          {hasGlass && style === 'industrial_loft' && (
            <>
              <rect x="23" y="18" width="34" height="62" fill={accentColor} opacity="0.88" />
              <line x1="40" y1="18" x2="40" y2="80" stroke={frameColor} strokeWidth="2.5" />
              <line x1="23" y1="38" x2="57" y2="38" stroke={frameColor} strokeWidth="2.5" />
              <line x1="23" y1="59" x2="57" y2="59" stroke={frameColor} strokeWidth="2.5" />
              <rect x="53" y="42" width="2.6" height="20" rx="1.2" fill={knobColor} />
            </>
          )}

          {style === 'xmas_wreath' && (
            <>
              <rect x="25" y="21" width="30" height="28" rx="1.5" fill="#18462E" />
              <rect x="25" y="54" width="30" height="30" rx="1.5" fill="#18462E" />
              {/* Festive pine wreath + red bow */}
              <circle cx="40" cy="37" r="10.5" fill="none" stroke="#15803D" strokeWidth="4.5" />
              <circle cx="34" cy="31" r="1.7" fill="#FACC15" />
              <circle cx="46" cy="33" r="1.7" fill="#EF4444" />
              <circle cx="36" cy="44" r="1.7" fill="#EF4444" />
              <circle cx="45" cy="43" r="1.7" fill="#FACC15" />
              <path d="M 35 27 L 40 30 L 45 27 L 42 32 L 38 32 Z" fill={accentColor} />
              <circle cx="53" cy="53" r="2.8" fill={knobColor} />
            </>
          )}
        </>
      )}
    </svg>
  );
};
