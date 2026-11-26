import React from 'react';

interface FurnitureIllustrationProps {
  itemId: string;
  flipped?: boolean;
  nightMode?: boolean;
}

/**
 * Lineless 3D-shaded stylized matte diorama illustrations
 * inspired by Setup Dream Room (clean directional lighting:
 * brightest top plane, warm mid-tone left plane, deeper shaded right plane).
 */
export const FurnitureIllustration: React.FC<FurnitureIllustrationProps> = ({
  itemId,
  flipped = false,
  nightMode = false,
}) => {
  return (
    <g transform={flipped ? 'scale(-1, 1)' : undefined}>
      {/* Soft ambient occlusion contact shadow on floor */}
      <ellipse cx="0" cy="6" rx="34" ry="15" fill="rgba(36, 22, 14, 0.16)" />

      {itemId === 'drafting_table' && (
        <g>
          {/* Steel legs */}
          <path d="M-28,-1 L-28,-26 M28,-3 L28,-25 M-6,13 L-6,-13 M8,4 L8,-16" stroke="#707882" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M-26,-11 L10,-1" stroke="#5B636D" strokeWidth="2.2" strokeLinecap="round" />
          {/* Tilted oak drafting surface (top / left thickness / right thickness) */}
          <polygon points="-40,-24 6,-47 40,-27 -6,-4" fill="#E9C69A" />
          <polygon points="-40,-24 -6,-4 -6,1 -40,-19" fill="#C79F70" />
          <polygon points="-6,-4 40,-27 40,-22 -6,1" fill="#A98256" />
          {/* Blueprint paper */}
          <polygon points="-28,-24 4,-40 26,-27 -6,-11" fill="#F8FAFC" />
          <polygon points="-20,-24 2,-35 16,-27 -6,-16" fill="#DCEBFB" />
          <line x1="-10" y1="-28" x2="4" y2="-21" stroke="#60A5FA" strokeWidth="1" />
          <line x1="-13" y1="-22" x2="-2" y2="-28" stroke="#60A5FA" strokeWidth="1" />
          {/* Yellow ruler & cup */}
          <polygon points="8,-34 19,-34 15,-27" fill="#F5B841" />
          <ellipse cx="-24" cy="-16" rx="5" ry="2.2" fill="#CBD5E1" />
          <rect x="20" y="-36" width="6.5" height="9" rx="1.5" fill="#6D8A96" />
          <line x1="22" y1="-36" x2="20" y2="-42" stroke="#E05A47" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="25" y1="-36" x2="27" y2="-42" stroke="#F5B841" strokeWidth="1.5" strokeLinecap="round" />
          {/* Stylized swivel drafting chair */}
          <path d="M-14,10 L-14,22 M-21,22 L-7,20" stroke="#5B636D" strokeWidth="2.4" strokeLinecap="round" />
          <ellipse cx="-14" cy="9" rx="11" ry="6" fill="#6F8FAF" />
          <ellipse cx="-14" cy="7.5" rx="10" ry="5" fill="#88A8C7" />
          <path d="M-23,5 Q-24,-7 -13,-8 Q-7,-7 -8,4" fill="#7D9DBA" />
        </g>
      )}

      {itemId === 'model_workbench' && (
        <g>
          {/* Solid wood legs & bottom shelf */}
          <path d="M-32,2 L-32,-25 M32,-4 L32,-31 M-4,15 L-4,-11 M6,-17 L6,-35" stroke="#9E764E" strokeWidth="3.6" strokeLinecap="round" />
          <polygon points="-28,-4 6,-21 28,-10 -6,7" fill="#BA8E61" />
          {/* Thick beech workbench */}
          <polygon points="-40,-20 6,-43 40,-26 -6,-3" fill="#E8C79D" />
          <polygon points="-40,-20 -6,-3 -6,3 -40,-14" fill="#C9A071" />
          <polygon points="-6,-3 40,-26 40,-20 -6,3" fill="#AD8356" />
          {/* Architectural wood block model */}
          <polygon points="0,-24 22,-35 32,-30 10,-19" fill="#F2E6D5" />
          <polygon points="8,-26 15,-29 15,-42 8,-39" fill="#D4B087" />
          <polygon points="15,-29 21,-26 21,-39 15,-42" fill="#B38D63" />
          <polygon points="8,-39 15,-42 21,-39 14,-36" fill="#F3DEC2" />
          <polygon points="16,-22 23,-25 23,-34 16,-31" fill="#DFBE97" />
          {/* Sculpted clay pottery */}
          <ellipse cx="-16" cy="-21" rx="9" ry="4.5" fill="#CBD5E1" />
          <path d="M-21,-22 Q-22,-36 -16,-38 Q-10,-36 -11,-22 Z" fill="#D28C67" />
          <ellipse cx="-16" cy="-38" rx="4" ry="2.2" fill="#E2A482" />
          <line x1="-6" y1="-15" x2="6" y2="-9" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      )}

      {itemId === 'digital_desk' && (
        <g>
          {/* Sleek matte grey legs */}
          <path d="M-32,2 L-32,-25 M30,-4 L30,-29 M-6,15 L-6,-13" stroke="#6B7280" strokeWidth="3.2" strokeLinecap="round" />
          {/* PC tower */}
          <polygon points="10,2 22,-4 22,-24 10,-18" fill="#64748B" />
          <polygon points="22,-4 28,-1 28,-21 22,-24" fill="#475569" />
          <circle cx="14" cy="-16" r="1.4" fill="#38BDF8" />
          {/* Clean desk top */}
          <polygon points="-40,-20 6,-43 40,-26 -6,-3" fill="#EAE2D6" />
          <polygon points="-40,-20 -6,-3 -6,2 -40,-15" fill="#CFC5B6" />
          <polygon points="-6,-3 40,-26 40,-21 -6,2" fill="#B6AB9B" />
          {/* Dual monitors */}
          <polygon points="-24,-32 -2,-43 -2,-63 -24,-52" fill="#374151" />
          <polygon points="-21,-35 -5,-43 -5,-59 -21,-51" fill={nightMode ? '#93C5FD' : '#F1F5F9'} />
          <circle cx="-13" cy="-47" r="4.5" fill="#EC6B5B" />
          <circle cx="-10" cy="-45" r="3.5" fill="#4B83D8" opacity="0.85" />
          <polygon points="2,-41 24,-30 24,-50 2,-61" fill="#1F2937" />
          <polygon points="5,-42 21,-34 21,-49 5,-57" fill={nightMode ? '#BAE6FD' : '#DBEAFE'} />
          <path d="M7,-44 L14,-51 L19,-42 Z" fill="#F59E0B" />
          {/* Drawing tablet & keyboard */}
          <polygon points="-22,-22 -8,-29 0,-25 -14,-18" fill="#475569" />
          <polygon points="-6,-18 10,-26 15,-23 -1,-15" fill="#FFFFFF" />
          {/* Ergonomic chair */}
          <path d="M-16,12 L-16,24 M-24,24 L-8,22" stroke="#4B5563" strokeWidth="2.4" strokeLinecap="round" />
          <ellipse cx="-16" cy="10" rx="12" ry="6.5" fill="#637994" />
          <ellipse cx="-16" cy="8.5" rx="10.5" ry="5.5" fill="#7C94B2" />
          <polygon points="-26,8 -28,-12 -14,-16 -12,4" fill="#6F87A6" />
        </g>
      )}

      {itemId === 'bookshelf' && (
        <g>
          {/* 3D Matte Wardrobe-style Bookcase */}
          <polygon points="-28,2 14,-19 14,-88 -28,-67" fill="#8C857D" />
          <polygon points="14,-19 28,-12 28,-81 14,-88" fill="#736C64" />
          <polygon points="-28,-67 14,-88 28,-81 -14,-60" fill="#B4ADA5" />
          <polygon points="-28,2 -14,9 -14,-60 -28,-67" fill="#9E978E" />
          {/* Inner dark wood shelf recesses */}
          <polygon points="-24,-18 14,-37 25,-31 -13,-12" fill="#D2C9BD" />
          <polygon points="-24,-39 14,-58 25,-52 -13,-33" fill="#D2C9BD" />
          <polygon points="-24,-58 14,-77 25,-71 -13,-52" fill="#D2C9BD" />
          {/* Crisp lineless books */}
          {[
            { x: -18, y: -22, c: '#5B8FD9' },
            { x: -12, y: -25, c: '#E06453' },
            { x: -6, y: -28, c: '#EAB348' },
            { x: 0, y: -31, c: '#58A87A' },
            { x: -18, y: -43, c: '#DF7A8E' },
            { x: -12, y: -46, c: '#7C74C9' },
            { x: -6, y: -49, c: '#F2995A' },
            { x: -17, y: -62, c: '#52A8A0' },
            { x: -10, y: -65, c: '#E5B85C' },
          ].map((b, i) => (
            <polygon
              key={i}
              points={`${b.x},${b.y} ${b.x + 5},${b.y - 2.5} ${b.x + 5},${b.y - 14.5} ${b.x},${b.y - 12}`}
              fill={b.c}
            />
          ))}
          {/* Plant on top */}
          <polygon points="-6,-79 4,-79 2,-70 -4,-70" fill="#D9815A" />
          <circle cx="-4" cy="-84" r="5" fill="#5CA372" />
          <circle cx="3" cy="-83" r="4.5" fill="#77BE8B" />
          {/* Rolled blueprint scrolls */}
          <polygon points="26,-4 31,-6 35,-36 30,-34" fill="#F1F5F9" />
          <polygon points="31,-2 36,-4 39,-31 34,-29" fill="#E2E8F0" />
        </g>
      )}

      {itemId === 'copic_rack' && (
        <g>
          {/* Matte 3D drawer cabinet (inspired by Setup Dream Room's crisp drawers) */}
          <polygon points="-34,2 -10,14 -10,-16 -34,-28" fill="#8C857D" />
          <polygon points="-10,14 32,-7 32,-37 -10,-16" fill="#726B64" />
          <polygon points="-34,-28 8,-49 32,-37 -10,-16" fill="#B5AEA6" />
          {/* Drawer fronts & brass knobs */}
          <polygon points="-31,-14 -13,-5 -13,-14 -31,-23" fill="#9E978E" />
          <polygon points="-31,-2 -13,7 -13,-2 -31,-11" fill="#9E978E" />
          <circle cx="-22" cy="-14" r="1.4" fill="#F3E7D3" />
          <circle cx="-22" cy="-2" r="1.4" fill="#F3E7D3" />
          {/* Marker stand on top */}
          <polygon points="4,-38 22,-47 28,-44 10,-35" fill="#FFFFFF" />
          <polygon points="4,-38 10,-35 10,-48 4,-51" fill="#E2E8F0" />
          <polygon points="10,-35 28,-44 28,-57 10,-48" fill="#CBD5E1" />
          {['#E05A47', '#F2B138', '#4EA874', '#4A89DC', '#8C6EC9'].map((col, idx) => (
            <line
              key={col}
              x1={12 + idx * 3.5}
              y1={-44 - idx * 1.6}
              x2={12 + idx * 3.5}
              y2={-58 - idx * 1.6}
              stroke={col}
              strokeWidth="2.6"
              strokeLinecap="round"
            />
          ))}
          {/* Palette */}
          <ellipse cx="-14" cy="-28" rx="8" ry="4" fill="#FFFFFF" />
          <circle cx="-17" cy="-28" r="1.5" fill="#E05A47" />
          <circle cx="-14" cy="-27" r="1.5" fill="#F2B138" />
          <circle cx="-11" cy="-28" r="1.5" fill="#4A89DC" />
          <circle cx="-14" cy="-30" r="1.5" fill="#4EA874" />
        </g>
      )}

      {itemId === 'easel' && (
        <g>
          {/* Beech tripod easel */}
          <path d="M-16,10 L0,-68 L16,8 M0,-68 L-2,-6" fill="none" stroke="#B78A5B" strokeWidth="3.6" strokeLinecap="round" />
          <polygon points="-20,-22 14,-39 19,-36 -15,-19" fill="#D5AA7C" />
          <polygon points="-18,-24 14,-40 14,-76 -18,-60" fill="#FAF8F4" />
          {/* Geometric modernist painting on canvas */}
          <polygon points="-14,-30 10,-42 10,-70 -14,-58" fill="#EDE4D5" />
          <circle cx="-4" cy="-52" r="6.5" fill="#E06453" />
          <polygon points="-10,-34 6,-42 0,-54" fill="#4A89DC" />
          <polygon points="2,-58 10,-62 10,-52 2,-48" fill="#EAB348" />
          <polygon points="10,12 24,5 30,9 16,16" fill="#FFFFFF" />
          <polygon points="20,-2 26,-2 25,6 21,6" fill="#CBD5E1" />
        </g>
      )}

      {itemId === 'printer_3d' && (
        <g>
          <polygon points="-22,2 -4,11 -4,17 -22,8" fill="#475569" />
          <polygon points="-4,11 26,-4 26,2 -4,17" fill="#334155" />
          <polygon points="-22,2 8,-13 26,-4 -4,11" fill="#64748B" />
          <polygon points="-18,0 6,-12 6,-48 -18,-36" fill="#38BDF8" opacity={nightMode ? 0.35 : 0.18} />
          <path d="M-20,0 L-20,-38 L6,-51 L24,-42 L24,-4" fill="none" stroke="#475569" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M-20,-38 L-2,-29 L24,-42 M-2,-29 L-2,10" fill="none" stroke="#64748B" strokeWidth="2.4" strokeLinecap="round" />
          <polygon points="-4,-3 6,-8 6,-19 -4,-14" fill="#38BDF8" />
          <polygon points="6,-8 12,-5 12,-16 6,-19" fill="#0284C7" />
          <polygon points="-4,-14 6,-19 12,-16 2,-11" fill="#7DD3FC" />
        </g>
      )}

      {itemId === 'blueprint_basket' && (
        <g>
          <polygon points="-14,-20 14,-20 11,6 -11,6" fill="#C97B55" />
          <ellipse cx="0" cy="-20" rx="14" ry="6" fill="#A65E3B" />
          <polygon points="-9,-18 -3,-18 -6,-40 -12,-40" fill="#F8FAFC" />
          <ellipse cx="-9" cy="-40" rx="3" ry="1.5" fill="#CBD5E1" />
          <polygon points="-2,-19 4,-19 5,-44 -1,-44" fill="#FFFFFF" />
          <ellipse cx="2" cy="-44" rx="3" ry="1.5" fill="#E2E8F0" />
          <polygon points="4,-18 10,-18 13,-37 7,-37" fill="#FDE68A" />
        </g>
      )}

      {itemId === 'sketch_mess' && (
        <g>
          <polygon points="-22,2 -2,-8 12,-1 -8,9" fill="#FFFFFF" />
          <polygon points="-2,-8 18,-18 32,-11 12,-1" fill="#F8F5EE" />
          <circle cx="-4" cy="0" r="4" fill="#60A5FA" opacity="0.85" />
          <circle cx="14" cy="-9" r="4.5" fill="#E06453" opacity="0.8" />
          <polygon points="-26,-10 -18,-10 -19,-1 -25,-1" fill="#BAE6FD" />
          <line x1="-22" y1="-6" x2="-15" y2="-16" stroke="#B78A5B" strokeWidth="1.8" strokeLinecap="round" />
          <ellipse cx="14" cy="8" rx="9" ry="4.5" fill="#FFFFFF" />
          <circle cx="11" cy="7" r="1.5" fill="#E05A47" />
          <circle cx="15" cy="9" r="1.5" fill="#F2B138" />
          <circle cx="18" cy="7" r="1.5" fill="#4A89DC" />
        </g>
      )}

      {itemId === 'studio_cat' && (
        <g>
          {/* 3D Clay sculpted cat */}
          <ellipse cx="0" cy="1" rx="18" ry="11" fill="#EB9F60" />
          <ellipse cx="-2" cy="-1" rx="14" ry="8" fill="#F4B47B" />
          <path d="M12,4 Q22,0 16,-8 Q11,-11 6,-7" fill="none" stroke="#E08F4E" strokeWidth="4.5" strokeLinecap="round" />
          <ellipse cx="-10" cy="-4" rx="10" ry="8.5" fill="#F5BA85" />
          <polygon points="-17,-9 -15,-17 -10,-11" fill="#EB9F60" />
          <polygon points="-8,-11 -3,-17 -2,-9" fill="#EB9F60" />
          <circle cx="-13" cy="-4" r="1.3" fill="#423328" />
          <circle cx="-6" cy="-4" r="1.3" fill="#423328" />
          <circle cx="-9.5" cy="-1.5" r="1.3" fill="#EC7080" />
        </g>
      )}

      {itemId === 'beanbag_yellow' && (
        <g>
          <path d="M-22,2 Q-24,-18 -4,-22 Q16,-24 22,-4 Q26,10 0,12 Q-20,12 -22,2 Z" fill="#E9AE3D" />
          <ellipse cx="-3" cy="-8" rx="16" ry="11" fill="#F6C458" />
          <ellipse cx="-6" cy="-13" rx="8" ry="4" fill="#FDE08D" opacity="0.65" />
        </g>
      )}

      {itemId === 'beanbag_purple' && (
        <g>
          <path d="M-22,2 Q-24,-18 -4,-22 Q16,-24 22,-4 Q26,10 0,12 Q-20,12 -22,2 Z" fill="#9D82C4" />
          <ellipse cx="-3" cy="-8" rx="16" ry="11" fill="#B59AD9" />
          <ellipse cx="-6" cy="-13" rx="8" ry="4" fill="#D5C4EE" opacity="0.65" />
        </g>
      )}

      {itemId === 'woven_rug' && (
        <g>
          {/* Round concentric striped rug matching Setup Dream Room! */}
          <ellipse cx="0" cy="2" rx="42" ry="21" fill="#ECCCB8" />
          <ellipse cx="0" cy="2" rx="34" ry="17" fill="#F5E5D7" />
          <ellipse cx="0" cy="2" rx="25" ry="12.5" fill="#E6B8A2" />
          <ellipse cx="0" cy="2" rx="16" ry="8" fill="#F5E5D7" />
          <ellipse cx="0" cy="2" rx="8" ry="4" fill="#E6B8A2" />
        </g>
      )}

      {itemId === 'wall_shelf_paints' && (
        <g>
          <polygon points="-20,0 -20,-42 14,-59 14,-17" fill="#C9A071" />
          <polygon points="14,-17 24,-12 24,-54 14,-59" fill="#AD8356" />
          <polygon points="-20,-42 14,-59 24,-54 -10,-37" fill="#E8C79D" />
          <polygon points="-17,-20 14,-35 22,-31 -9,-16" fill="#DFBE97" />
          <rect x="-12" y="-33" width="5" height="10" rx="1" fill="#E05A47" />
          <rect x="-5" y="-36" width="5" height="10" rx="1" fill="#F2B138" />
          <rect x="2" y="-39" width="5" height="10" rx="1" fill="#4A89DC" />
          <rect x="9" y="-42" width="5" height="10" rx="1" fill="#4EA874" />
          <polygon points="-12,-46 -6,-49 -6,-60 -12,-57" fill="#7C74C9" />
          <polygon points="-5,-49 1,-52 1,-63 -5,-60" fill="#E06453" />
          <circle cx="11" cy="-56" r="5" fill="#5CA372" />
        </g>
      )}

      {itemId === 'studio_certificate' && (
        <g>
          <path d="M-14,8 L0,-54 L14,8" fill="none" stroke="#B78A5B" strokeWidth="3" strokeLinecap="round" />
          <polygon points="-18,-18 16,-35 16,-66 -18,-49" fill="#D59B49" />
          <polygon points="-15,-22 13,-36 13,-61 -15,-47" fill="#FFFDF7" />
          <line x1="-9" y1="-44" x2="7" y2="-52" stroke="#6B5346" strokeWidth="1.4" />
          <line x1="-9" y1="-38" x2="5" y2="-45" stroke="#CBD5E1" strokeWidth="1.2" />
          <circle cx="5" cy="-35" r="3.5" fill="#E06453" />
        </g>
      )}

      {itemId === 'cozy_sofa' && (
        <g>
          {/* Soft matte 3D sofa */}
          <path d="M-30,2 L-30,10 M28,-4 L28,4 M-4,15 L-4,22" stroke="#8F6A47" strokeWidth="3.2" strokeLinecap="round" />
          <polygon points="-36,0 -6,15 -6,21 -36,6" fill="#7C8594" />
          <polygon points="-6,15 34,-5 34,1 -6,21" fill="#636B78" />
          <polygon points="-36,0 4,-20 4,-44 -36,-24" fill="#98A2B3" />
          <polygon points="-36,-24 4,-44 10,-41 -30,-21" fill="#B2BAC7" />
          <polygon points="-30,-4 4,-21 28,-9 -6,8" fill="#8C96A6" />
          <polygon points="-24,-14 -12,-20 -10,-8 -22,-2" fill="#E9AE3D" />
          <polygon points="-8,-21 3,-26 5,-14 -6,-9" fill="#5CA372" />
        </g>
      )}

      {itemId === 'coffee_table' && (
        <g>
          {/* Matte nightstand / coffee table with warm glowing lamp */}
          <polygon points="-22,2 -2,12 -2,-10 -22,-20" fill="#8C857D" />
          <polygon points="-2,12 22,0 22,-22 -2,-10" fill="#726B64" />
          <polygon points="-22,-20 2,-32 22,-22 -2,-10" fill="#B5AEA6" />
          <polygon points="-19,-9 -5,-2 -5,-8 -19,-15" fill="#9E978E" />
          <polygon points="-19,0 -5,7 -5,1 -19,-6" fill="#9E978E" />
          {/* Warm glowing bedside lamp */}
          <ellipse cx="2" cy="-22" rx="15" ry="15" fill="#FDE68A" opacity={nightMode ? 0.55 : 0.25} />
          <rect x="0" y="-26" width="4" height="6" fill="#94A3B8" />
          <polygon points="-5,-26 9,-26 6,-36 -2,-36" fill="#FFFBEB" />
          <ellipse cx="2" cy="-36" rx="4" ry="1.8" fill="#FEF3C7" />
        </g>
      )}

      {itemId === 'mannequin' && (
        <g>
          <ellipse cx="0" cy="4" rx="14" ry="7" fill="#C9A071" />
          <line x1="0" y1="2" x2="0" y2="-16" stroke="#9E764E" strokeWidth="2.8" />
          <path d="M-4,-16 L-7,-34 M4,-16 L7,-34" stroke="#E8C79D" strokeWidth="3.6" strokeLinecap="round" />
          <polygon points="-10,-36 10,-36 13,-56 -13,-56" fill="#E8C79D" />
          <ellipse cx="0" cy="-65" rx="6.5" ry="8" fill="#F2D7B4" />
          <path d="M-13,-53 L-21,-40 L-16,-28 M13,-53 L22,-42 L18,-56" fill="none" stroke="#DFBE97" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}

      {itemId === 'geometry_pedestal' && (
        <g>
          <polygon points="-16,2 -2,9 -2,-30 -16,-37" fill="#E2E8F0" />
          <polygon points="-2,9 16,0 16,-39 -2,-30" fill="#CBD5E1" />
          <polygon points="-16,-37 2,-46 16,-39 -2,-30" fill="#F8FAFC" />
          <polygon points="-11,-38 -5,-35 -5,-47 -11,-50" fill="#CBD5E1" />
          <circle cx="6" cy="-46" r="7.5" fill="#F8FAFC" />
        </g>
      )}

      {itemId === 'monstera' && (
        <g>
          <polygon points="-13,-16 13,-16 10,4 -10,4" fill="#D2825D" />
          <ellipse cx="0" cy="-16" rx="13.5" ry="5.5" fill="#E59874" />
          <ellipse cx="0" cy="-16" rx="10" ry="3.8" fill="#6F4E3C" />
          <path d="M0,-16 Q-14,-35 -20,-40 M0,-16 Q4,-40 16,-45 M0,-16 Q-2,-48 -2,-58" fill="none" stroke="#3B7A54" strokeWidth="2.4" strokeLinecap="round" />
          <ellipse cx="-18" cy="-40" rx="12" ry="8.5" transform="rotate(-25 -18 -40)" fill="#5AA070" />
          <ellipse cx="16" cy="-44" rx="12" ry="8.5" transform="rotate(20 16 -44)" fill="#73B987" />
          <ellipse cx="-2" cy="-58" rx="12.5" ry="9" fill="#46895C" />
        </g>
      )}

      {itemId === 'bauhaus_poster' && (
        <g>
          <path d="M-18,6 L-12,-58 M16,-8 L10,-66" stroke="#64748B" strokeWidth="3" strokeLinecap="round" />
          <polygon points="-20,-6 14,-23 14,-68 -20,-51" fill="#FAF8F4" />
          <circle cx="-4" cy="-44" r="8.5" fill="#4A89DC" />
          <polygon points="-14,-20 6,-30 -4,-40" fill="#E05A47" />
          <rect x="-14" y="-56" width="14" height="5" transform="skewY(-26)" fill="#F2B138" />
        </g>
      )}

      {itemId === 'akari_lamp' && (
        <g>
          <path d="M-10,6 L0,-24 L10,6 M0,-24 L0,8" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="0" cy="-44" rx="26" ry="28" fill="#FDE68A" opacity={nightMode ? 0.55 : 0.3} />
          <ellipse cx="0" cy="-44" rx="15" ry="20" fill="#FFFDF5" />
          <path d="M-14,-48 Q0,-43 14,-48 M-15,-40 Q0,-35 15,-40 M-12,-56 Q0,-52 12,-56" fill="none" stroke="#EAE0CE" strokeWidth="1" />
        </g>
      )}

      {itemId === 'wall_frame_landscape' && (
        <g>
          <rect x="-32" y="-56" width="64" height="44" rx="4" fill="#A6784B" />
          <rect x="-27" y="-51" width="54" height="34" rx="2" fill="#FAF6EE" />
          <rect x="-22" y="-46" width="44" height="24" fill="#DCEBFB" />
          <path d="M-22,-22 L-6,-38 L6,-28 L14,-35 L22,-22 Z" fill="#E07A5F" />
          <circle cx="11" cy="-40" r="4" fill="#F59E0B" />
        </g>
      )}

      {itemId === 'wall_frame_portrait' && (
        <g>
          <rect x="-22" y="-68" width="44" height="60" rx="4" fill="#3B342E" />
          <rect x="-17" y="-63" width="34" height="50" rx="2" fill="#FAF6EE" />
          <rect x="-12" y="-58" width="24" height="40" fill="#F1E7D8" />
          <circle cx="0" cy="-41" r="7.5" fill="#2563EB" />
          <polygon points="-10,-22 10,-22 0,-34" fill="#E11D48" />
        </g>
      )}

      {itemId === 'xmas_tree' && (
        <g>
          <polygon points="-10,-12 10,-12 8,4 -8,4" fill="#B45309" />
          <polygon points="-24,-14 24,-14 0,-40" fill="#15803D" />
          <polygon points="-20,-30 20,-30 0,-56" fill="#16A34A" />
          <polygon points="-14,-46 14,-46 0,-70" fill="#22C55E" />
          <polygon points="0,-78 3,-71 10,-71 4,-67 6,-60 0,-64 -6,-60 -4,-67 -10,-71 -3,-71" fill="#FACC15" />
          <circle cx="-8" cy="-22" r="3" fill="#EF4444" />
          <circle cx="8" cy="-24" r="3" fill="#FACC15" />
          <circle cx="-5" cy="-40" r="2.8" fill="#38BDF8" />
          <circle cx="6" cy="-42" r="2.8" fill="#EF4444" />
        </g>
      )}

      {itemId === 'xmas_wreath_stand' && (
        <g>
          <line x1="0" y1="-60" x2="0" y2="4" stroke="#A6784B" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="0" cy="-48" r="16" fill="none" stroke="#15803D" strokeWidth="7" />
          <circle cx="-6" cy="-58" r="2.5" fill="#EF4444" />
          <circle cx="8" cy="-54" r="2.5" fill="#FACC15" />
          <rect x="-18" y="-12" width="18" height="14" rx="2" fill="#DC2626" />
          <rect x="-11" y="-12" width="4" height="14" fill="#FACC15" />
          <rect x="2" y="-8" width="16" height="11" rx="2" fill="#16A34A" />
          <rect x="8" y="-8" width="4" height="11" fill="#DC2626" />
        </g>
      )}

      {itemId === 'ny_countdown_lamp' && (
        <g>
          <ellipse cx="0" cy="2" rx="14" ry="5" fill="#334155" />
          <line x1="0" y1="0" x2="0" y2="-28" stroke="#475569" strokeWidth="3.5" />
          <circle cx="0" cy="-46" r="22" fill="#FEF08A" opacity="0.45" />
          <circle cx="0" cy="-46" r="16" fill="none" stroke="#F5EFE6" strokeWidth="3" />
          <polygon points="0,-57 4,-49 12,-49 6,-44 8,-36 0,-41 -8,-36 -6,-44 -12,-49 -4,-49" fill="#FACC15" />
        </g>
      )}

      {itemId === 'xmas_snowman_plush' && (
        <g>
          <ellipse cx="0" cy="4" rx="22" ry="8" fill="#DBEAFE" />
          <circle cx="0" cy="-12" r="14" fill="#F8FAFC" />
          <circle cx="0" cy="-32" r="10.5" fill="#F8FAFC" />
          <rect x="-9" y="-25" width="18" height="5" rx="2.5" fill="#DC2626" />
          <rect x="-10" y="-44" width="20" height="3.5" rx="1.5" fill="#1F2937" />
          <rect x="-6.5" y="-54" width="13" height="10" rx="1.5" fill="#1F2937" />
          <circle cx="-3.5" cy="-34" r="1.5" fill="#1E293B" />
          <circle cx="3.5" cy="-34" r="1.5" fill="#1E293B" />
          <polygon points="0,-32 8,-30 0,-28" fill="#F97316" />
        </g>
      )}

      {itemId === 'pet_bowl_set' && (
        <g>
          <rect x="-24" y="-12" width="48" height="12" rx="4" fill="#C7925B" />
          <ellipse cx="-11" cy="-14" rx="9" ry="4.5" fill="#FAF8F4" stroke="#6E675F" strokeWidth="1.5" />
          <ellipse cx="-11" cy="-15" rx="6" ry="2.8" fill="#7C4A26" />
          <ellipse cx="11" cy="-14" rx="9" ry="4.5" fill="#FAF8F4" stroke="#6E675F" strokeWidth="1.5" />
          <ellipse cx="11" cy="-15" rx="6" ry="2.8" fill="#38BDF8" />
        </g>
      )}

      {itemId === 'pet_play_tunnel' && (
        <g>
          <ellipse cx="0" cy="4" rx="26" ry="10" fill="#F5EFE6" />
          <rect x="-20" y="-28" width="40" height="24" rx="12" fill="#F472B6" />
          <ellipse cx="-20" cy="-16" rx="7" ry="12" fill="#831843" stroke="#FDE68A" strokeWidth="3" />
          <circle cx="16" cy="-4" r="6" fill="#38BDF8" />
        </g>
      )}

      {itemId === 'pet_grooming_cart' && (
        <g>
          <line x1="-18" y1="-50" x2="-18" y2="2" stroke="#475569" strokeWidth="3" />
          <line x1="18" y1="-50" x2="18" y2="2" stroke="#475569" strokeWidth="3" />
          <rect x="-20" y="-20" width="40" height="6" rx="2" fill="#F8FAFC" />
          <rect x="-20" y="-44" width="40" height="6" rx="2" fill="#F8FAFC" />
          <rect x="-12" y="-58" width="10" height="14" rx="3" fill="#EC4899" />
          <rect x="4" y="-50" width="12" height="6" rx="2" fill="#D99B66" />
          <rect x="-12" y="-28" width="22" height="8" rx="2" fill="#7DD3FC" />
        </g>
      )}
    </g>
  );
};

/**
 * Cute 3D clay figurine art student standing in the studio
 */
export const StudioStudentAvatar: React.FC<{ shirtColor?: string }> = ({
  shirtColor = '#7D9DBA',
}) => {
  return (
    <g>
      <ellipse cx="0" cy="4" rx="13" ry="6" fill="rgba(36, 22, 14, 0.16)" />
      <ellipse cx="-5" cy="1" rx="4.5" ry="2.5" fill="#F8FAFC" />
      <ellipse cx="5" cy="1" rx="4.5" ry="2.5" fill="#F8FAFC" />
      <path d="M-6,-2 L-6,-18 L6,-18 L6,-2 M0,-18 L0,-2" fill="#475569" />
      <polygon points="-10,-17 10,-17 11,-37 -11,-37" fill={shirtColor} />
      <polygon points="-6.5,-15 6.5,-15 7.5,-33 -7.5,-33" fill="#F5EBDC" />
      <path d="M-11,-34 L-15,-22 L-9,-20 M11,-34 L15,-22 L9,-20" fill="none" stroke={shirtColor} strokeWidth="3.6" strokeLinecap="round" />
      {/* Clay sculpted head */}
      <circle cx="0" cy="-49" r="11.5" fill="#F8D9C6" />
      <path d="M-11.5,-49 Q-11.5,-62 0,-61 Q11.5,-62 11.5,-49 Q7,-54 2,-52 Q-2,-55 -6,-52 Q-9,-54 -11.5,-49 Z" fill="#5D4438" />
      <ellipse cx="2" cy="-60.5" rx="9.5" ry="4.2" transform="rotate(-10 2 -60.5)" fill="#E06453" />
      <circle cx="-4.2" cy="-47.5" r="1.6" fill="#3B2D26" />
      <circle cx="4.2" cy="-47.5" r="1.6" fill="#3B2D26" />
      <ellipse cx="-7" cy="-44.5" rx="2" ry="1.1" fill="#F2958D" opacity="0.7" />
      <ellipse cx="7" cy="-44.5" rx="2" ry="1.1" fill="#F2958D" opacity="0.7" />
    </g>
  );
};
