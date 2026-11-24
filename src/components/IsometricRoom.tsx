import React from 'react';
import { FLOOR_MAP, ITEM_MAP, WALL_MAP } from '../data/catalog';
import { PlacedItem } from '../types/studio';
import { FurnitureIllustration, StudioStudentAvatar } from './FurnitureIllustration';

interface IsometricRoomProps {
  wallThemeId: string;
  floorThemeId: string;
  placedItems: PlacedItem[];
  selectedInstanceId?: string | null;
  pendingItemId?: string | null;
  readOnly?: boolean;
  nightMode?: boolean;
  onTileClick?: (x: number, y: number) => void;
  onSelectPlaced?: (instanceId: string) => void;
}

const GRID_SIZE = 5;
const ORIGIN_X = 360;
const ORIGIN_Y = 148;
const TW = 56;
const TH = 28;
const WALL_H = 136;

function getTileCenter(x: number, y: number) {
  return {
    cx: ORIGIN_X + (x - y) * TW,
    cy: ORIGIN_Y + (x + y + 1) * TH,
  };
}

function getTilePoints(x: number, y: number): string {
  const { cx, cy } = getTileCenter(x, y);
  return `${cx},${cy - TH} ${cx + TW},${cy} ${cx},${cy + TH} ${cx - TW},${cy}`;
}

export const IsometricRoom: React.FC<IsometricRoomProps> = ({
  wallThemeId,
  floorThemeId,
  placedItems,
  selectedInstanceId = null,
  pendingItemId = null,
  readOnly = false,
  nightMode = false,
  onTileClick,
  onSelectPlaced,
}) => {
  const wall = WALL_MAP[wallThemeId] ?? WALL_MAP.warm_ivory;
  const floor = FLOOR_MAP[floorThemeId] ?? FLOOR_MAP.japanese_oak;

  const occupiedMap = new Map<string, PlacedItem>();
  for (const item of placedItems) {
    occupiedMap.set(`${item.x},${item.y}`, item);
  }

  let avatarSpot: { x: number; y: number } | null = null;
  const preferredSpots = [
    { x: 2, y: 2 },
    { x: 2, y: 3 },
    { x: 3, y: 2 },
    { x: 1, y: 2 },
    { x: 2, y: 1 },
  ];
  for (const spot of preferredSpots) {
    if (!occupiedMap.has(`${spot.x},${spot.y}`)) {
      avatarSpot = spot;
      break;
    }
  }
  if (!avatarSpot) {
    for (let y = 0; y < GRID_SIZE && !avatarSpot; y++) {
      for (let x = 0; x < GRID_SIZE && !avatarSpot; x++) {
        if (!occupiedMap.has(`${x},${y}`)) {
          avatarSpot = { x, y };
        }
      }
    }
  }

  type RenderEntity =
    | { kind: 'item'; data: PlacedItem; depth: number }
    | { kind: 'avatar'; x: number; y: number; depth: number };

  const entities: RenderEntity[] = placedItems.map((p) => ({
    kind: 'item',
    data: p,
    depth: p.x + p.y,
  }));

  if (avatarSpot) {
    entities.push({
      kind: 'avatar',
      x: avatarSpot.x,
      y: avatarSpot.y,
      depth: avatarSpot.x + avatarSpot.y,
    });
  }

  entities.sort((a, b) => a.depth - b.depth);

  const isPlacingOrMoving = Boolean(pendingItemId || selectedInstanceId);

  return (
    <div className="relative w-full select-none">
      <svg
        viewBox="0 0 720 470"
        className="w-full h-auto max-h-[520px]"
        role="img"
        aria-label="ห้องสตูดิโอ 3D Diorama แบบเกม Setup Dream Room"
      >
        <defs>
          <linearGradient id="setupSunBeam" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={nightMode ? '#93C5FD' : '#FFF9DC'} stopOpacity={nightMode ? '0.2' : '0.45'} />
            <stop offset="100%" stopColor={nightMode ? '#93C5FD' : '#FFF9DC'} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="dioramaCastShadow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(36, 18, 8, 0.34)" />
            <stop offset="100%" stopColor="rgba(36, 18, 8, 0.08)" />
          </linearGradient>
        </defs>

        {/* Long Perspective Cast Shadow onto Stage (Signature Setup Dream Room Diorama Shadow) */}
        <polygon
          points="72,306 360,450 648,306 692,470 28,470"
          fill="url(#dioramaCastShadow)"
          pointerEvents="none"
        />

        {/* Crisp Architectural White Cutaway Wall Rim Top Cap */}
        <polygon
          points={`72,148 ${ORIGIN_X},${ORIGIN_Y - WALL_H - 4} 648,148 640,152 ${ORIGIN_X},${ORIGIN_Y - WALL_H + 4} 80,152`}
          fill="#F5F1EB"
        />
        {/* Cutaway Outer Wall Thickness (Left & Right) */}
        <polygon points={`72,148 80,152 80,288 72,292`} fill="#D8D1C7" />
        <polygon points={`640,152 648,148 648,292 640,288`} fill="#C2BAB0" />

        {/* Back-Left Wall */}
        <polygon
          points={`80,288 ${ORIGIN_X},${ORIGIN_Y} ${ORIGIN_X},${ORIGIN_Y - WALL_H} 80,${288 - WALL_H}`}
          fill={wall.leftWall}
        />
        {/* Back-Right Wall */}
        <polygon
          points={`${ORIGIN_X},${ORIGIN_Y} 640,288 640,${288 - WALL_H} ${ORIGIN_X},${ORIGIN_Y - WALL_H}`}
          fill={wall.rightWall}
        />

        {/* Subtle wall shadow gradient in corner */}
        <polygon
          points={`${ORIGIN_X - 24},${ORIGIN_Y + 12} ${ORIGIN_X},${ORIGIN_Y} ${ORIGIN_X},${ORIGIN_Y - WALL_H} ${ORIGIN_X - 24},${ORIGIN_Y - WALL_H + 12}`}
          fill="rgba(0,0,0,0.035)"
        />

        {/* Crisp White Baseboard */}
        <polygon
          points={`80,288 ${ORIGIN_X},${ORIGIN_Y} ${ORIGIN_X},${ORIGIN_Y - 8} 80,${288 - 8}`}
          fill="#EDE7DE"
        />
        <polygon
          points={`${ORIGIN_X},${ORIGIN_Y} 640,288 640,${288 - 8} ${ORIGIN_X},${ORIGIN_Y - 8}`}
          fill="#DFD8CE"
        />

        {/* Left Wall: Modern Studio Door + Framed Geometric Bauhaus Artwork (Setup Dream Room layout) */}
        <g>
          {/* Door white frame */}
          <polygon points="104,276 164,246 164,148 104,178" fill="#EBE5DC" />
          {/* Terracotta-red studio door */}
          <polygon points="110,273 158,249 158,158 110,182" fill="#D14E33" />
          <polygon points="115,256 153,237 153,167 115,186" fill="#C4442A" opacity="0.55" />
          {/* Silver door handle */}
          <circle cx="151" cy="212" r="2.6" fill="#E2E8F0" />

          {/* Framed Abstract Geometric Art Print */}
          <polygon points="204,182 260,154 260,96 204,124" fill="#635D57" />
          <polygon points="208,178 256,154 256,101 208,125" fill="#F4EDE2" />
          <polygon points="212,171 235,148 225,126 212,138" fill="#4A7EC7" />
          <polygon points="234,160 252,151 245,120 227,138" fill="#E05A47" />
          <polygon points="222,130 245,118 238,108 218,118" fill="#EAB348" />
        </g>

        {/* Right Wall: Large White-Trimmed Sunlit Window casting light beams across floor */}
        <g>
          {/* Outer window frame */}
          <polygon points="452,194 562,249 562,144 452,89" fill="#E8E3DC" />
          {/* Sky & distant soft stylized cityscape outside */}
          <polygon
            points="460,190 554,237 554,148 460,101"
            fill={nightMode ? '#293757' : '#CDE4F7'}
          />
          {/* Distant pastel buildings/roofs */}
          <polygon points="466,193 496,208 496,170 466,155" fill={nightMode ? '#3B4C73' : '#E2C3A8'} />
          <polygon points="502,211 540,230 540,180 502,161" fill={nightMode ? '#475A85' : '#D5B293'} />
          {nightMode && <circle cx="532" cy="158" r="6" fill="#FEF08A" opacity="0.9" />}
          {/* Window crossbars */}
          <line x1="507" y1="125" x2="507" y2="213" stroke="#F4F0EA" strokeWidth="4" />
          <line x1="460" y1="146" x2="554" y2="193" stroke="#F4F0EA" strokeWidth="4" />
          {/* Window sill */}
          <polygon points="448,196 566,255 572,251 454,192" fill="#F5F1EB" />
        </g>

        {/* Floor Platform Thick Cutaway Slab */}
        <polygon points={`72,292 360,436 360,450 72,306`} fill="#CEC5B9" />
        <polygon points={`360,436 648,292 648,306 360,450`} fill="#B5ACA0" />

        {/* 5x5 Isometric Floor Grid */}
        {Array.from({ length: GRID_SIZE }).map((_, y) =>
          Array.from({ length: GRID_SIZE }).map((__, x) => {
            const tileKey = `${x},${y}`;
            const occupant = occupiedMap.get(tileKey);
            const isSelectedTile = occupant && occupant.instanceId === selectedInstanceId;
            const isCheckerAlt = (x + y) % 2 === 1;
            const fill = isSelectedTile
              ? '#DBEAFE'
              : isCheckerAlt
              ? floor.tileB
              : floor.tileA;

            const { cx, cy } = getTileCenter(x, y);

            return (
              <g
                key={tileKey}
                onClick={() => {
                  if (readOnly) return;
                  if (pendingItemId || selectedInstanceId) {
                    onTileClick?.(x, y);
                  } else if (occupant) {
                    onSelectPlaced?.(occupant.instanceId);
                  } else {
                    onTileClick?.(x, y);
                  }
                }}
                className={readOnly ? undefined : 'cursor-pointer group'}
              >
                <polygon
                  points={getTilePoints(x, y)}
                  fill={fill}
                  stroke={isSelectedTile ? '#3B82F6' : floor.borderColor}
                  strokeOpacity={isPlacingOrMoving && !readOnly ? 0.65 : 0.22}
                  strokeWidth={isSelectedTile ? 2.2 : 0.9}
                  className={
                    readOnly
                      ? undefined
                      : 'transition-colors duration-150 group-hover:brightness-97'
                  }
                />
                {/* Subtle hardwood plank grain */}
                <line
                  x1={cx - TW * 0.55}
                  y1={cy - TH * 0.55}
                  x2={cx + TW * 0.55}
                  y2={cy + TH * 0.55}
                  stroke={floor.borderColor}
                  strokeOpacity="0.22"
                  strokeWidth="0.9"
                  pointerEvents="none"
                />
                {!readOnly && isPlacingOrMoving && !occupant && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r="5.5"
                    fill="#3B82F6"
                    opacity="0.45"
                    className="transition-opacity group-hover:opacity-90"
                  />
                )}
              </g>
            );
          })
        )}

        {/* Warm Diagonal Sunlight Stripes across the Floor from Window */}
        <g pointerEvents="none">
          <polygon
            points="458,200 502,222 330,368 274,340"
            fill="url(#setupSunBeam)"
          />
          <polygon
            points="510,226 554,248 398,388 344,361"
            fill="url(#setupSunBeam)"
          />
        </g>

        {/* Night mode atmospheric room tint */}
        {nightMode && (
          <polygon
            points={`80,288 ${ORIGIN_X},${ORIGIN_Y} 640,288 360,428`}
            fill="#1E293B"
            opacity="0.24"
            pointerEvents="none"
          />
        )}

        {/* Placed Furniture & Clay Student Figurine in Painter's Order */}
        {entities.map((entity) => {
          if (entity.kind === 'avatar') {
            const { cx, cy } = getTileCenter(entity.x, entity.y);
            return (
              <g
                key="studio-student-avatar"
                transform={`translate(${cx}, ${cy})`}
                pointerEvents="none"
              >
                <StudioStudentAvatar />
              </g>
            );
          }

          const placed = entity.data;
          const def = ITEM_MAP[placed.itemId];
          if (!def) return null;
          const { cx, cy } = getTileCenter(placed.x, placed.y);
          const isSelected = placed.instanceId === selectedInstanceId;

          return (
            <g
              key={placed.instanceId}
              transform={`translate(${cx}, ${cy})`}
              onClick={(e) => {
                if (readOnly) return;
                e.stopPropagation();
                if (
                  pendingItemId ||
                  (selectedInstanceId && selectedInstanceId !== placed.instanceId)
                ) {
                  onTileClick?.(placed.x, placed.y);
                } else {
                  onSelectPlaced?.(placed.instanceId);
                }
              }}
              className={
                readOnly
                  ? undefined
                  : 'cursor-pointer transition-transform duration-150 hover:-translate-y-1'
              }
            >
              {isSelected && (
                <ellipse
                  cx="0"
                  cy="3"
                  rx="42"
                  ry="20"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="2.4"
                  strokeDasharray="5 3"
                />
              )}
              <FurnitureIllustration
                itemId={placed.itemId}
                flipped={placed.flipped}
                nightMode={nightMode}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
};
