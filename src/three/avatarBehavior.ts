import * as THREE from 'three';
import { getPetFootprintTiles } from '../data/catalog';
import { OwnedPet, PlacedItem, WallFrameType } from '../types/studio';
import { AvatarRig3D } from './buildAvatar';

export type AvatarActivityType =
  | 'draw_at_desk'
  | 'paint_at_easel'
  | 'work_craft'
  | 'water_plant'
  | 'toggle_lamp'
  | 'look_window'
  | 'admire_frame'
  | 'relax_seat'
  | 'browse_books'
  | 'play_with_pet'
  | 'stroll';

export type SeatPoseKind = 'chair' | 'sofa' | 'beanbag' | 'floor';

export interface ActivityTarget {
  id: string;
  instanceId?: string;
  type: AvatarActivityType;
  label: string;
  standTile: { x: number; y: number };
  actionWorld?: { x: number; z: number };
  faceWorld: { x: number; z: number };
  duration: number;
  seatPose?: SeatPoseKind;
  usesSketchTool?: boolean;
}

const WALK_THROUGH_ITEMS = new Set(['woven_rug']);

function cellToWorld(x: number, y: number, gridSize: number, cellSize: number): [number, number] {
  const centerOffset = (gridSize - 1) / 2;
  return [(x - centerOffset) * cellSize, (y - centerOffset) * cellSize];
}

function itemLocalToWorld(
  item: PlacedItem,
  lx: number,
  lz: number,
  gridSize: number,
  cellSize: number
): { x: number; z: number } {
  const [cx, cz] = cellToWorld(item.x, item.y, gridSize, cellSize);
  const rotStep = item.rotationStep ?? (item.flipped ? 1 : 0);
  const yaw = (rotStep * Math.PI) / 2;
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  return {
    x: cx + lx * cos + lz * sin,
    z: cz - lx * sin + lz * cos,
  };
}

function getRotatedFrontDirs(item: PlacedItem): [number, number][] {
  const rotStep = ((item.rotationStep ?? (item.flipped ? 1 : 0)) % 4 + 4) % 4;
  const yaw = (rotStep * Math.PI) / 2;
  const fdx = Math.round(Math.sin(yaw));
  const fdz = Math.round(Math.cos(yaw));
  const rightDx = Math.round(Math.cos(yaw));
  const rightDz = -Math.round(Math.sin(yaw));

  return [
    [fdx, fdz],
    [rightDx, rightDz],
    [-rightDx, -rightDz],
    [-fdx, -fdz],
  ];
}

function getRotationStepFrontDirs(rotStepInput = 0): [number, number][] {
  const rotStep = ((rotStepInput % 4) + 4) % 4;
  const yaw = (rotStep * Math.PI) / 2;
  const fdx = Math.round(Math.sin(yaw));
  const fdz = Math.round(Math.cos(yaw));
  const rightDx = Math.round(Math.cos(yaw));
  const rightDz = -Math.round(Math.sin(yaw));

  return [
    [fdx, fdz],
    [rightDx, rightDz],
    [-rightDx, -rightDz],
    [-fdx, -fdz],
  ];
}

function computeSnugItemPlacement(
  centerX: number,
  centerZ: number,
  rotStepInput: number,
  standTile: { x: number; y: number },
  halfExtX: number,
  halfExtZ: number,
  avatarClearance: number,
  gridSize: number,
  cellSize: number,
  radialRadius?: number
): { actionWorld: { x: number; z: number }; faceWorld: { x: number; z: number } } {
  const [sx, sz] = cellToWorld(standTile.x, standTile.y, gridSize, cellSize);
  const dx = sx - centerX;
  const dz = sz - centerZ;

  if (radialRadius !== undefined) {
    const len = Math.max(0.01, Math.hypot(dx, dz));
    const dist = Math.min(cellSize * 0.48, radialRadius + avatarClearance);
    return {
      actionWorld: {
        x: centerX + (dx / len) * dist,
        z: centerZ + (dz / len) * dist,
      },
      faceWorld: { x: centerX, z: centerZ },
    };
  }

  const rotStep = ((rotStepInput % 4) + 4) % 4;
  const yaw = (rotStep * Math.PI) / 2;
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);

  // Transform approach vector into local item space
  const dlx = dx * cos - dz * sin;
  const dlz = dx * sin + dz * cos;

  let lx = 0;
  let lz = 0;
  if (Math.abs(dlz) >= Math.abs(dlx)) {
    lz = (dlz >= 0 ? 1 : -1) * Math.min(cellSize * 0.48, halfExtZ + avatarClearance);
  } else {
    lx = (dlx >= 0 ? 1 : -1) * Math.min(cellSize * 0.49, halfExtX + avatarClearance);
  }

  return {
    actionWorld: {
      x: centerX + lx * cos + lz * sin,
      z: centerZ - lx * sin + lz * cos,
    },
    faceWorld: { x: centerX, z: centerZ },
  };
}

function shortestAngleDiff(from: number, to: number): number {
  let diff = (to - from) % (Math.PI * 2);
  if (diff > Math.PI) diff -= Math.PI * 2;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

function buildWalkableGrid(
  placedItems: PlacedItem[],
  pets: OwnedPet[],
  gridSize: number
): boolean[][] {
  const walkable: boolean[][] = Array.from({ length: gridSize }, () =>
    Array.from({ length: gridSize }, () => true)
  );

  for (const item of placedItems) {
    if (WALK_THROUGH_ITEMS.has(item.itemId)) continue;
    if (item.x >= 0 && item.y >= 0 && item.x < gridSize && item.y < gridSize) {
      walkable[item.y][item.x] = false;
    }
  }

  for (const pet of pets) {
    for (const tile of getPetFootprintTiles(pet)) {
      if (tile.x >= 0 && tile.y >= 0 && tile.x < gridSize && tile.y < gridSize) {
        walkable[tile.y][tile.x] = false;
      }
    }
  }

  return walkable;
}

function findAdjacentWalkableTile(
  tx: number,
  ty: number,
  walkable: boolean[][],
  gridSize: number,
  preferredDirs: [number, number][] = [
    [0, 1],
    [1, 0],
    [-1, 0],
    [0, -1],
  ]
): { x: number; y: number } | null {
  for (const [dx, dy] of preferredDirs) {
    const nx = tx + dx;
    const ny = ty + dy;
    if (nx >= 0 && ny >= 0 && nx < gridSize && ny < gridSize && walkable[ny][nx]) {
      return { x: nx, y: ny };
    }
  }
  return null;
}

function bfsPath(
  start: { x: number; y: number },
  goal: { x: number; y: number },
  walkable: boolean[][],
  gridSize: number
): { x: number; y: number }[] {
  if (start.x === goal.x && start.y === goal.y) return [goal];

  const visited = new Set<string>();
  const parent = new Map<string, { x: number; y: number } | null>();
  const queue: { x: number; y: number }[] = [start];
  const startKey = `${start.x},${start.y}`;
  visited.add(startKey);
  parent.set(startKey, null);

  const dirs: [number, number][] = [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0],
  ];

  let found = false;
  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cur.x === goal.x && cur.y === goal.y) {
      found = true;
      break;
    }
    for (const [dx, dy] of dirs) {
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      if (nx < 0 || ny < 0 || nx >= gridSize || ny >= gridSize) continue;
      if (!walkable[ny][nx] && !(nx === goal.x && ny === goal.y)) continue;
      const key = `${nx},${ny}`;
      if (visited.has(key)) continue;
      visited.add(key);
      parent.set(key, cur);
      queue.push({ x: nx, y: ny });
    }
  }

  if (!found) {
    return [goal];
  }

  const path: { x: number; y: number }[] = [];
  let trace: { x: number; y: number } | null = goal;
  while (trace) {
    path.unshift(trace);
    trace = parent.get(`${trace.x},${trace.y}`) ?? null;
  }
  return path.length > 1 ? path.slice(1) : path;
}

export function buildStudioActivityTargets(
  placedItems: PlacedItem[],
  pets: OwnedPet[],
  ownedWallFrames: WallFrameType[],
  gridSize: number,
  cellSize: number
): ActivityTarget[] {
  const walkable = buildWalkableGrid(placedItems, pets, gridSize);
  const targets: ActivityTarget[] = [];

  for (const item of placedItems) {
    const [ix, iz] = cellToWorld(item.x, item.y, gridSize, cellSize);
    const frontDirs = getRotatedFrontDirs(item);
    const frontSpot = findAdjacentWalkableTile(item.x, item.y, walkable, gridSize, frontDirs);

    if (item.itemId === 'drafting_table') {
      if (frontSpot) {
        targets.push({
          id: `draw-${item.instanceId}`,
          instanceId: item.instanceId,
          type: 'draw_at_desk',
          label: 'กำลังนั่งวาดรูปบนโต๊ะดราฟต์',
          standTile: frontSpot,
          actionWorld: itemLocalToWorld(item, 0, 0.37, gridSize, cellSize),
          faceWorld: itemLocalToWorld(item, 0, -0.04, gridSize, cellSize),
          duration: 6.8,
          seatPose: 'chair',
          usesSketchTool: true,
        });
      }
    } else if (item.itemId === 'digital_desk') {
      if (frontSpot) {
        targets.push({
          id: `draw-${item.instanceId}`,
          instanceId: item.instanceId,
          type: 'draw_at_desk',
          label: 'กำลังนั่งวาดดิจิทัลอาร์ตที่โต๊ะคอม',
          standTile: frontSpot,
          actionWorld: itemLocalToWorld(item, 0, 0.32, gridSize, cellSize),
          faceWorld: itemLocalToWorld(item, 0.02, 0.04, gridSize, cellSize),
          duration: 6.8,
          seatPose: 'chair',
          usesSketchTool: true,
        });
      }
    } else if (item.itemId === 'cozy_sofa') {
      if (frontSpot) {
        targets.push({
          id: `relax-${item.instanceId}`,
          instanceId: item.instanceId,
          type: 'relax_seat',
          label: 'กำลังนั่งพักผ่อนบนโซฟา',
          standTile: frontSpot,
          actionWorld: itemLocalToWorld(item, 0, 0.09, gridSize, cellSize),
          faceWorld: itemLocalToWorld(item, 0, 1.15, gridSize, cellSize),
          duration: 6.2,
          seatPose: 'sofa',
        });
      }
    } else if (item.itemId === 'beanbag_yellow' || item.itemId === 'beanbag_purple') {
      if (frontSpot) {
        targets.push({
          id: `relax-${item.instanceId}`,
          instanceId: item.instanceId,
          type: 'relax_seat',
          label: 'กำลังนั่งเอนหลังบนเบาะบีนแบ็ก',
          standTile: frontSpot,
          actionWorld: itemLocalToWorld(item, 0, 0.09, gridSize, cellSize),
          faceWorld: itemLocalToWorld(item, 0, 1.15, gridSize, cellSize),
          duration: 6.0,
          seatPose: 'beanbag',
        });
      }
    } else if (item.itemId === 'woven_rug') {
      const spot = walkable[item.y]?.[item.x] ? { x: item.x, y: item.y } : frontSpot;
      if (spot) {
        targets.push({
          id: `relax-${item.instanceId}`,
          instanceId: item.instanceId,
          type: 'relax_seat',
          label: 'กำลังนั่งพักผ่อนบนพรมสตูดิโอ',
          standTile: spot,
          actionWorld: { x: ix, z: iz },
          faceWorld: itemLocalToWorld(item, 0.35, 0.9, gridSize, cellSize),
          duration: 5.5,
          seatPose: 'floor',
        });
      }
    } else if (item.itemId === 'sketch_mess') {
      if (frontSpot) {
        const [sx, sz] = cellToWorld(frontSpot.x, frontSpot.y, gridSize, cellSize);
        const vx = sx - ix;
        const vz = sz - iz;
        const len = Math.max(0.01, Math.hypot(vx, vz));
        targets.push({
          id: `draw-${item.instanceId}`,
          instanceId: item.instanceId,
          type: 'draw_at_desk',
          label: 'กำลังนั่งสเก็ตช์รูปบนพื้น',
          standTile: frontSpot,
          actionWorld: { x: ix + (vx / len) * 0.45, z: iz + (vz / len) * 0.45 },
          faceWorld: { x: ix, z: iz },
          duration: 6.0,
          seatPose: 'floor',
          usesSketchTool: true,
        });
      }
    } else if (item.itemId === 'monstera' || item.itemId === 'wall_shelf_paints' || item.itemId === 'xmas_tree') {
      if (frontSpot) {
        const rotStep = item.rotationStep ?? (item.flipped ? 1 : 0);
        const snug =
          item.itemId === 'monstera'
            ? computeSnugItemPlacement(ix, iz, rotStep, frontSpot, 0.19, 0.19, 0.14, gridSize, cellSize, 0.2)
            : item.itemId === 'xmas_tree'
              ? computeSnugItemPlacement(ix, iz, rotStep, frontSpot, 0.36, 0.36, 0.11, gridSize, cellSize, 0.35)
              : computeSnugItemPlacement(ix, iz, rotStep, frontSpot, 0.34, 0.17, 0.15, gridSize, cellSize);
        targets.push({
          id: `water-${item.instanceId}`,
          instanceId: item.instanceId,
          type: 'water_plant',
          label:
            item.itemId === 'xmas_tree'
              ? 'กำลังรดน้ำและดูแลต้นคริสต์มาส'
              : item.itemId === 'wall_shelf_paints'
                ? 'กำลังรดน้ำต้นกระบองเพชรและจัดขวดสี'
                : 'กำลังยืนชิดกระถางรดน้ำต้นมอนสเตอร่า',
          standTile: frontSpot,
          actionWorld: snug.actionWorld,
          faceWorld:
            item.itemId === 'wall_shelf_paints'
              ? itemLocalToWorld(item, 0.14, 0, gridSize, cellSize)
              : snug.faceWorld,
          duration: 5.4,
        });
      }
    } else if (
      item.itemId === 'akari_lamp' ||
      item.itemId === 'coffee_table' ||
      item.itemId === 'ny_countdown_lamp'
    ) {
      if (frontSpot) {
        const rotStep = item.rotationStep ?? (item.flipped ? 1 : 0);
        const snug =
          item.itemId === 'coffee_table'
            ? computeSnugItemPlacement(ix, iz, rotStep, frontSpot, 0.3, 0.265, 0.135, gridSize, cellSize)
            : item.itemId === 'akari_lamp'
              ? computeSnugItemPlacement(ix, iz, rotStep, frontSpot, 0.24, 0.24, 0.14, gridSize, cellSize, 0.24)
              : computeSnugItemPlacement(ix, iz, rotStep, frontSpot, 0.26, 0.26, 0.13, gridSize, cellSize, 0.26);
        const lampLabel =
          item.itemId === 'akari_lamp'
            ? 'กำลังเดินไปเปิด-ปิดโคมไฟ Akari'
            : item.itemId === 'ny_countdown_lamp'
              ? 'กำลังเปิด-ปิดแท่นไฟดาวปีใหม่'
              : 'กำลังเปิด-ปิดโคมไฟที่ตู้ลิ้นชัก';
        targets.push({
          id: `lamp-${item.instanceId}`,
          instanceId: item.instanceId,
          type: 'toggle_lamp',
          label: lampLabel,
          standTile: frontSpot,
          actionWorld: snug.actionWorld,
          faceWorld: snug.faceWorld,
          duration: 3.4,
        });
      }
    } else if (item.itemId === 'easel') {
      if (frontSpot) {
        const rotStep = item.rotationStep ?? (item.flipped ? 1 : 0);
        const snug = computeSnugItemPlacement(ix, iz, rotStep, frontSpot, 0.28, 0.22, 0.14, gridSize, cellSize);
        targets.push({
          id: `paint-${item.instanceId}`,
          instanceId: item.instanceId,
          type: 'paint_at_easel',
          label: 'กำลังยืนชิดขาตั้งวาดภาพลงสี',
          standTile: frontSpot,
          actionWorld: snug.actionWorld,
          faceWorld: snug.faceWorld,
          duration: 6.2,
          usesSketchTool: true,
        });
      }
    } else if (
      item.itemId === 'model_workbench' ||
      item.itemId === 'copic_rack' ||
      item.itemId === 'mannequin' ||
      item.itemId === 'geometry_pedestal' ||
      item.itemId === 'printer_3d' ||
      item.itemId === 'blueprint_basket'
    ) {
      if (frontSpot) {
        const rotStep = item.rotationStep ?? (item.flipped ? 1 : 0);
        const snug =
          item.itemId === 'model_workbench'
            ? computeSnugItemPlacement(ix, iz, rotStep, frontSpot, 0.42, 0.32, 0.14, gridSize, cellSize)
            : item.itemId === 'copic_rack'
              ? computeSnugItemPlacement(ix, iz, rotStep, frontSpot, 0.42, 0.24, 0.14, gridSize, cellSize)
              : item.itemId === 'printer_3d'
                ? computeSnugItemPlacement(ix, iz, rotStep, frontSpot, 0.34, 0.29, 0.14, gridSize, cellSize)
                : item.itemId === 'geometry_pedestal'
                  ? computeSnugItemPlacement(ix, iz, rotStep, frontSpot, 0.26, 0.26, 0.14, gridSize, cellSize)
                  : item.itemId === 'mannequin'
                    ? computeSnugItemPlacement(ix, iz, rotStep, frontSpot, 0.22, 0.22, 0.14, gridSize, cellSize, 0.22)
                    : computeSnugItemPlacement(ix, iz, rotStep, frontSpot, 0.24, 0.24, 0.14, gridSize, cellSize, 0.24);
        const workLabels: Record<string, string> = {
          model_workbench: 'กำลังปั้นหุ่นและตัดโมเดลที่โต๊ะเวิร์กเบนช์',
          copic_rack: 'กำลังเลือกสีโคปิกและผสมสีที่เคาน์เตอร์',
          mannequin: 'กำลังจัดท่าหุ่นไม้ฝึกอนาโตมี',
          geometry_pedestal: 'กำลังสเก็ตช์หุ่นนิ่งเรขาคณิต',
          printer_3d: 'กำลังตรวจดูโมเดลจากเครื่องพิมพ์ 3D',
          blueprint_basket: 'กำลังหยิบม้วนแบบแปลนมาตรวจดู',
        };
        targets.push({
          id: `craft-${item.instanceId}`,
          instanceId: item.instanceId,
          type: 'work_craft',
          label: workLabels[item.itemId] ?? 'กำลังทำงานศิลปะในสตูดิโอ',
          standTile: frontSpot,
          actionWorld: snug.actionWorld,
          faceWorld: snug.faceWorld,
          duration: 5.5,
          usesSketchTool: item.itemId === 'geometry_pedestal' || item.itemId === 'copic_rack',
        });
      }
    } else if (
      item.itemId === 'studio_cat' ||
      item.itemId === 'pet_bowl_set' ||
      item.itemId === 'pet_play_tunnel' ||
      item.itemId === 'pet_grooming_cart'
    ) {
      if (frontSpot) {
        const rotStep = item.rotationStep ?? (item.flipped ? 1 : 0);
        const snug =
          item.itemId === 'studio_cat'
            ? computeSnugItemPlacement(ix, iz, rotStep, frontSpot, 0.3, 0.3, 0.12, gridSize, cellSize, 0.3)
            : item.itemId === 'pet_bowl_set'
              ? computeSnugItemPlacement(ix, iz, rotStep, frontSpot, 0.31, 0.16, 0.14, gridSize, cellSize)
              : item.itemId === 'pet_play_tunnel'
                ? computeSnugItemPlacement(ix, iz, rotStep, frontSpot, 0.32, 0.26, 0.14, gridSize, cellSize)
                : computeSnugItemPlacement(ix, iz, rotStep, frontSpot, 0.27, 0.18, 0.15, gridSize, cellSize);
        const petDecorLabels: Record<string, string> = {
          studio_cat: 'กำลังเล่นและลูบหัวน้องแมวส้ม',
          pet_bowl_set: 'กำลังเติมอาหารและน้ำให้น้องสัตว์เลี้ยง',
          pet_play_tunnel: 'กำลังเล่นลูกบอลและอุโมงค์สัตว์เลี้ยง',
          pet_grooming_cart: 'กำลังจัดแปรงหวีขนดูแลสัตว์เลี้ยง',
        };
        targets.push({
          id: `petdecor-${item.instanceId}`,
          instanceId: item.instanceId,
          type: 'play_with_pet',
          label: petDecorLabels[item.itemId] ?? 'กำลังดูแลมุมสัตว์เลี้ยง',
          standTile: frontSpot,
          actionWorld: snug.actionWorld,
          faceWorld: snug.faceWorld,
          duration: 5.2,
        });
      }
    } else if (frontSpot) {
      // Catch-all for bookshelf, studio_certificate, bauhaus_poster, xmas_wreath_stand, xmas_snowman_plush, or any future item
      const rotStep = item.rotationStep ?? (item.flipped ? 1 : 0);
      const snug =
        item.itemId === 'bookshelf'
          ? computeSnugItemPlacement(ix, iz, rotStep, frontSpot, 0.42, 0.18, 0.15, gridSize, cellSize)
          : item.itemId === 'studio_certificate'
            ? computeSnugItemPlacement(ix, iz, rotStep, frontSpot, 0.26, 0.22, 0.14, gridSize, cellSize)
            : item.itemId === 'bauhaus_poster'
              ? computeSnugItemPlacement(ix, iz, rotStep, frontSpot, 0.27, 0.22, 0.14, gridSize, cellSize)
              : item.itemId === 'xmas_wreath_stand'
                ? computeSnugItemPlacement(ix, iz, rotStep, frontSpot, 0.32, 0.26, 0.14, gridSize, cellSize)
                : item.itemId === 'xmas_snowman_plush'
                  ? computeSnugItemPlacement(ix, iz, rotStep, frontSpot, 0.22, 0.22, 0.13, gridSize, cellSize, 0.22)
                  : computeSnugItemPlacement(ix, iz, rotStep, frontSpot, 0.26, 0.26, 0.15, gridSize, cellSize);
      const inspectLabels: Record<string, string> = {
        bookshelf: 'กำลังยืนเลือกดูหนังสืออาร์ตบุ๊กชิดตู้',
        studio_certificate: 'กำลังชื่นชมใบประกาศ Born to be Art',
        bauhaus_poster: 'กำลังดูแรงบันดาลใจจากโปสเตอร์',
        xmas_wreath_stand: 'กำลังจัดกล่องของขวัญและพวงมาลัย',
        xmas_snowman_plush: 'กำลังทักทายตุ๊กตาหิมะสุดคิวท์',
      };
      targets.push({
        id: `inspect-${item.instanceId}`,
        instanceId: item.instanceId,
        type: 'browse_books',
        label: inspectLabels[item.itemId] ?? 'กำลังตรวจดูของตกแต่งสตูดิโอ',
        standTile: frontSpot,
        actionWorld: snug.actionWorld,
        faceWorld: snug.faceWorld,
        duration: 4.8,
      });
    }
  }

  // Pet interaction spot for every adopted pet (steps closely into habitat edge / open pen doorway)
  for (const pet of pets) {
    const tiles = getPetFootprintTiles(pet);
    const rot = (pet.rotationStep ?? 0) % 4;
    const preferredDirs = getRotationStepFrontDirs(rot);

    // Find best adjacent tile prioritizing the habitat's front (+Z) side across all occupied tiles
    let spot: { x: number; y: number } | null = null;
    for (const dir of preferredDirs) {
      for (const t of tiles) {
        const nx = t.x + dir[0];
        const ny = t.y + dir[1];
        if (nx >= 0 && ny >= 0 && nx < gridSize && ny < gridSize && walkable[ny][nx]) {
          spot = { x: nx, y: ny };
          break;
        }
      }
      if (spot) break;
    }

    if (spot) {
      const baseW = pet.species === 'dog' ? 2 : 1;
      const baseH = 1;
      const effW = rot % 2 === 1 ? baseH : baseW;
      const effH = rot % 2 === 1 ? baseW : baseH;
      const [px, pz] = cellToWorld(
        pet.x + (effW - 1) / 2,
        pet.y + (effH - 1) / 2,
        gridSize,
        cellSize
      );

      let actionWorld: { x: number; z: number };
      if (pet.species === 'dog') {
        const yaw = (rot * Math.PI) / 2;
        const cos = Math.cos(yaw);
        const sin = Math.sin(yaw);
        const [sx, sz] = cellToWorld(spot.x, spot.y, gridSize, cellSize);
        const dx = sx - px;
        const dz = sz - pz;
        const dlx = dx * cos - dz * sin;
        const dlz = dx * sin + dz * cos;
        let lx = 0;
        let lz = 0;
        if (Math.abs(dlz) >= Math.abs(dlx) * 0.85) {
          // Open doorway on front (+Z) lets avatar stand right at the pen entrance
          lz = dlz >= 0 ? cellSize * 0.49 : -(cellSize * 0.44 + 0.14);
        } else {
          lx = (dlx >= 0 ? 1 : -1) * (cellSize * 0.92 + 0.14);
        }
        actionWorld = {
          x: px + lx * cos + lz * sin,
          z: pz - lx * sin + lz * cos,
        };
      } else if (pet.species === 'cat') {
        actionWorld = computeSnugItemPlacement(px, pz, rot, spot, 0.34, 0.34, 0.12, gridSize, cellSize, 0.34).actionWorld;
      } else if (pet.species === 'hedgehog') {
        actionWorld = computeSnugItemPlacement(px, pz, rot, spot, 0.41, 0.34, 0.13, gridSize, cellSize).actionWorld;
      } else {
        // goldfish & snake glass tanks
        actionWorld = computeSnugItemPlacement(px, pz, rot, spot, 0.39, 0.31, 0.14, gridSize, cellSize).actionWorld;
      }

      targets.push({
        id: `pet-${pet.instanceId}`,
        instanceId: pet.instanceId,
        type: 'play_with_pet',
        label: `กำลังเล่นกับน้อง ${pet.nickname}`,
        standTile: spot,
        actionWorld,
        faceWorld: { x: px, z: pz },
        duration: 5.4,
      });
    }
  }

  // Look out the back-right studio window (stand close to window sill)
  const winTileX = gridSize === 7 ? 4 : 2;
  const winCandidates: [number, number][] = [
    [winTileX, 0],
    [winTileX, 1],
    [Math.max(0, winTileX - 1), 0],
    [Math.min(gridSize - 1, winTileX + 1), 0],
  ];
  for (const [wx, wy] of winCandidates) {
    if (walkable[wy]?.[wx]) {
      const [worldX, worldZ] = cellToWorld(wx, wy, gridSize, cellSize);
      const halfSpan = (gridSize * cellSize) / 2;
      targets.push({
        id: 'window-view',
        type: 'look_window',
        label: 'กำลังเดินชมวิวนอกหน้าต่าง',
        standTile: { x: wx, y: wy },
        actionWorld: wy === 0 ? { x: worldX, z: -halfSpan + 0.34 } : { x: worldX, z: worldZ },
        faceWorld: { x: worldX, z: worldZ - 2.0 },
        duration: 5.0,
      });
      break;
    }
  }

  // Admire wall frames or left wall poster (stand closer to the framed wall)
  if (ownedWallFrames.includes('landscape')) {
    const lx = 0;
    for (let ly = 0; ly < 2; ly++) {
      if (walkable[ly]?.[lx]) {
        const [worldX, worldZ] = cellToWorld(lx, ly, gridSize, cellSize);
        const halfSpan = (gridSize * cellSize) / 2;
        targets.push({
          id: 'frame-landscape',
          type: 'admire_frame',
          label: 'กำลังชื่นชมผลงานบนผนัง',
          standTile: { x: lx, y: ly },
          actionWorld: ly === 0 ? { x: worldX, z: -halfSpan + 0.38 } : { x: worldX, z: worldZ },
          faceWorld: { x: worldX, z: worldZ - 2.0 },
          duration: 4.5,
        });
        break;
      }
    }
  } else {
    const px = 0;
    const py = gridSize === 7 ? 2 : 1;
    if (walkable[py]?.[px]) {
      const [worldX, worldZ] = cellToWorld(px, py, gridSize, cellSize);
      const halfSpan = (gridSize * cellSize) / 2;
      targets.push({
        id: 'frame-portrait',
        type: 'admire_frame',
        label: 'กำลังชื่นชมผลงานบนผนัง',
        standTile: { x: px, y: py },
        actionWorld: { x: -halfSpan + 0.38, z: worldZ },
        faceWorld: { x: worldX - 2.0, z: worldZ },
        duration: 4.5,
      });
    }
  }

  // Open stroll waypoint if room has very few targets
  if (targets.length < 3) {
    const openTiles: { x: number; y: number }[] = [];
    for (let gy = 0; gy < gridSize; gy++) {
      for (let gx = 0; gx < gridSize; gx++) {
        if (walkable[gy][gx]) openTiles.push({ x: gx, y: gy });
      }
    }
    if (openTiles.length > 0) {
      const tile = openTiles[Math.floor(openTiles.length * 0.5)];
      if (tile) {
        const [wx, wz] = cellToWorld(tile.x, tile.y, gridSize, cellSize);
        targets.push({
          id: 'stroll-0',
          type: 'stroll',
          label: 'กำลังเดินเล่นในสตูดิโอ',
          standTile: tile,
          faceWorld: { x: wx + 0.5, z: wz + 0.7 },
          duration: 2.8,
        });
      }
    }
  }

  return targets;
}

type ControllerPhase = 'walking' | 'entering' | 'acting' | 'exiting';

export class AvatarBehaviorController {
  private rig: AvatarRig3D;
  private gridSize: number;
  private cellSize: number;
  private walkable: boolean[][];
  private targets: ActivityTarget[];
  private shuffledQueue: ActivityTarget[] = [];
  private currentTile: { x: number; y: number };
  private currentTarget: ActivityTarget | null = null;
  private waypoints: { x: number; y: number }[] = [];
  private phase: ControllerPhase = 'acting';
  private actionElapsed = 0;
  private transitionElapsed = 0;
  private entryStartWorld = { x: 0, z: 0 };
  private walkCycle = 0;
  private lastActivityLabel = '';
  private lampToggledThisAction = false;
  private readonly hasUserHandItem: boolean;
  private readonly onToggleLamp?: (instanceId: string) => boolean | null;

  constructor(
    rig: AvatarRig3D,
    placedItems: PlacedItem[],
    pets: OwnedPet[],
    ownedWallFrames: WallFrameType[],
    gridSize: number,
    cellSize: number,
    initialTile: { x: number; y: number },
    hasUserHandItem: boolean,
    onToggleLamp?: (instanceId: string) => boolean | null
  ) {
    this.rig = rig;
    this.gridSize = gridSize;
    this.cellSize = cellSize;
    this.walkable = buildWalkableGrid(placedItems, pets, gridSize);
    this.targets = buildStudioActivityTargets(
      placedItems,
      pets,
      ownedWallFrames,
      gridSize,
      cellSize
    );
    this.currentTile = initialTile;
    this.hasUserHandItem = hasUserHandItem;
    this.onToggleLamp = onToggleLamp;

    const [wx, wz] = cellToWorld(initialTile.x, initialTile.y, gridSize, cellSize);
    this.rig.root.position.set(wx, 0, wz);
    this.rig.root.rotation.y = Math.PI * 0.2;

    if (this.targets.length > 0) {
      this.pickNextTarget();
    }
  }

  public getCurrentLabel(): string {
    return this.lastActivityLabel || 'กำลังเตรียมตัวในสตูดิโอ';
  }

  private refillShuffledQueue() {
    const pool = [...this.targets];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    if (pool.length > 1 && this.currentTarget && pool[0].id === this.currentTarget.id) {
      const swapIdx = 1 + Math.floor(Math.random() * (pool.length - 1));
      [pool[0], pool[swapIdx]] = [pool[swapIdx], pool[0]];
    }
    this.shuffledQueue = pool;
  }

  private pickNextTarget() {
    if (this.targets.length === 0) return;
    if (this.shuffledQueue.length === 0) {
      this.refillShuffledQueue();
    }
    const next = this.shuffledQueue.shift() ?? this.targets[0];
    this.currentTarget = next;
    this.lampToggledThisAction = false;
    this.waypoints = bfsPath(this.currentTile, next.standTile, this.walkable, this.gridSize);

    const needsWalk =
      this.waypoints.length > 0 &&
      (this.currentTile.x !== next.standTile.x || this.currentTile.y !== next.standTile.y);

    if (needsWalk) {
      this.phase = 'walking';
    } else if (next.actionWorld) {
      this.phase = 'entering';
      this.transitionElapsed = 0;
      this.entryStartWorld = {
        x: this.rig.root.position.x,
        z: this.rig.root.position.z,
      };
    } else {
      this.phase = 'acting';
    }
    this.actionElapsed = 0;
  }

  private getSeatMetrics(seatPose?: SeatPoseKind): { dropY: number; legAngle: number } {
    switch (seatPose) {
      case 'chair':
        return { dropY: 0.105, legAngle: -1.14 };
      case 'sofa':
        return { dropY: 0.055, legAngle: -1.18 };
      case 'beanbag':
        return { dropY: 0.02, legAngle: -1.18 };
      case 'floor':
        return { dropY: -0.26, legAngle: -1.52 };
      default:
        return { dropY: 0, legAngle: 0 };
    }
  }

  public update(delta: number, onActivityChange?: (label: string) => void) {
    const dt = Math.min(0.08, Math.max(0.001, delta));
    const target = this.currentTarget;

    if (!target) {
      this.rig.bodyGroup.position.y = Math.sin(performance.now() * 0.0025) * 0.012;
      return;
    }

    const isWatering = this.phase === 'acting' && target.type === 'water_plant';
    const isSketching =
      (this.phase === 'acting' || this.phase === 'entering') &&
      Boolean(target.usesSketchTool);

    this.rig.wateringCanGroup.visible = isWatering;
    this.rig.sketchPencilGroup.visible = isSketching;
    this.rig.propGroup.visible = this.hasUserHandItem;
    if (!isWatering) {
      this.rig.wateringCanGroup.rotation.x = THREE.MathUtils.damp(
        this.rig.wateringCanGroup.rotation.x,
        0,
        10,
        dt
      );
    }

    if (this.phase === 'walking') {
      const nextLabel = 'กำลังเดินในสตูดิโอ';
      if (nextLabel !== this.lastActivityLabel) {
        this.lastActivityLabel = nextLabel;
        onActivityChange?.(nextLabel);
      }

      this.rig.bodyGroup.position.y = THREE.MathUtils.damp(this.rig.bodyGroup.position.y, 0, 10, dt);
      this.rig.bodyGroup.rotation.x = THREE.MathUtils.damp(this.rig.bodyGroup.rotation.x, 0, 10, dt);

      const wp = this.waypoints[0];
      if (!wp) {
        if (target.actionWorld) {
          this.phase = 'entering';
          this.transitionElapsed = 0;
          this.entryStartWorld = {
            x: this.rig.root.position.x,
            z: this.rig.root.position.z,
          };
        } else {
          this.phase = 'acting';
          this.actionElapsed = 0;
        }
        return;
      }

      const [tx, tz] = cellToWorld(wp.x, wp.y, this.gridSize, this.cellSize);
      const dx = tx - this.rig.root.position.x;
      const dz = tz - this.rig.root.position.z;
      const dist = Math.hypot(dx, dz);

      if (dist < 0.06) {
        this.rig.root.position.x = tx;
        this.rig.root.position.z = tz;
        this.currentTile = wp;
        this.waypoints.shift();
        if (this.waypoints.length === 0) {
          if (target.actionWorld) {
            this.phase = 'entering';
            this.transitionElapsed = 0;
            this.entryStartWorld = { x: tx, z: tz };
          } else {
            this.phase = 'acting';
            this.actionElapsed = 0;
          }
        }
      } else {
        const walkSpeed = 1.25;
        const step = Math.min(dist, walkSpeed * dt);
        this.rig.root.position.x += (dx / dist) * step;
        this.rig.root.position.z += (dz / dist) * step;

        const desiredYaw = Math.atan2(dx, dz);
        const angleDiff = shortestAngleDiff(this.rig.root.rotation.y, desiredYaw);
        this.rig.root.rotation.y += angleDiff * Math.min(1, dt * 10);

        this.walkCycle += dt * 8.8;
        const steppedWalk = Math.floor(this.walkCycle * 2.2) / 2.2;
        const swing = Math.sin(steppedWalk) * 0.48;
        this.rig.leftLeg.rotation.x = swing;
        this.rig.rightLeg.rotation.x = -swing;
        const hp = this.rig.handHoldPose;
        if (this.hasUserHandItem) {
          this.rig.leftArm.rotation.x = hp.armX + swing * 0.14;
          this.rig.leftArm.rotation.z = THREE.MathUtils.damp(this.rig.leftArm.rotation.z, hp.armZ, 10, dt);
          this.rig.leftForearm.rotation.x = THREE.MathUtils.damp(this.rig.leftForearm.rotation.x, hp.forearmX, 12, dt);
          this.rig.leftForearm.rotation.y = THREE.MathUtils.damp(this.rig.leftForearm.rotation.y, hp.forearmY, 12, dt);
          this.rig.leftForearm.rotation.z = THREE.MathUtils.damp(this.rig.leftForearm.rotation.z, hp.forearmZ, 12, dt);
        } else {
          this.rig.leftArm.rotation.x = -swing * 0.62;
          this.rig.leftArm.rotation.z = THREE.MathUtils.damp(this.rig.leftArm.rotation.z, 0, 10, dt);
          this.rig.leftForearm.rotation.x = THREE.MathUtils.damp(this.rig.leftForearm.rotation.x, -0.1, 10, dt);
          this.rig.leftForearm.rotation.y = THREE.MathUtils.damp(this.rig.leftForearm.rotation.y, 0, 10, dt);
          this.rig.leftForearm.rotation.z = THREE.MathUtils.damp(this.rig.leftForearm.rotation.z, 0, 10, dt);
        }
        this.rig.rightArm.rotation.x = swing * 0.62;
        this.rig.rightArm.rotation.z = THREE.MathUtils.damp(this.rig.rightArm.rotation.z, 0, 10, dt);
        this.rig.rightForearm.rotation.x = THREE.MathUtils.damp(this.rig.rightForearm.rotation.x, -0.08, 10, dt);
        this.rig.rightForearm.rotation.z = THREE.MathUtils.damp(this.rig.rightForearm.rotation.z, 0, 10, dt);
        this.rig.headGroup.rotation.x = Math.sin(steppedWalk * 2) * 0.03;
        this.rig.headGroup.rotation.y = THREE.MathUtils.damp(this.rig.headGroup.rotation.y, 0, 8, dt);
        this.rig.bodyGroup.position.y = Math.abs(Math.sin(steppedWalk)) * 0.028;
      }
      return;
    }

    if (this.phase === 'entering' && target.actionWorld) {
      if (target.label !== this.lastActivityLabel) {
        this.lastActivityLabel = target.label;
        onActivityChange?.(target.label);
      }

      const enterDur = 0.42;
      this.transitionElapsed += dt;
      const p = Math.min(1, this.transitionElapsed / enterDur);
      const ease = p * p * (3 - 2 * p);

      this.rig.root.position.x = THREE.MathUtils.lerp(this.entryStartWorld.x, target.actionWorld.x, ease);
      this.rig.root.position.z = THREE.MathUtils.lerp(this.entryStartWorld.z, target.actionWorld.z, ease);

      const fx = target.faceWorld.x - target.actionWorld.x;
      const fz = target.faceWorld.z - target.actionWorld.z;
      if (Math.hypot(fx, fz) > 0.01) {
        const desiredYaw = Math.atan2(fx, fz);
        const diff = shortestAngleDiff(this.rig.root.rotation.y, desiredYaw);
        this.rig.root.rotation.y += diff * Math.min(1, dt * 12);
      }

      const hp = this.rig.handHoldPose;
      if (target.seatPose) {
        const { dropY, legAngle } = this.getSeatMetrics(target.seatPose);
        this.rig.leftLeg.rotation.x = THREE.MathUtils.damp(this.rig.leftLeg.rotation.x, legAngle, 14, dt);
        this.rig.rightLeg.rotation.x = THREE.MathUtils.damp(this.rig.rightLeg.rotation.x, legAngle, 14, dt);
        const cosLift = Math.max(0, 1 - Math.cos(this.rig.leftLeg.rotation.x));
        const safeDropY = dropY < 0 ? Math.max(dropY, -0.28 * Math.pow(cosLift, 1.45)) : dropY;
        this.rig.bodyGroup.position.y = THREE.MathUtils.damp(this.rig.bodyGroup.position.y, safeDropY, 16, dt);
        this.rig.leftArm.rotation.x = THREE.MathUtils.damp(this.rig.leftArm.rotation.x, this.hasUserHandItem ? hp.armX : -0.25, 10, dt);
        this.rig.leftArm.rotation.z = THREE.MathUtils.damp(this.rig.leftArm.rotation.z, this.hasUserHandItem ? hp.armZ : 0, 10, dt);
        this.rig.leftForearm.rotation.x = THREE.MathUtils.damp(this.rig.leftForearm.rotation.x, this.hasUserHandItem ? hp.forearmX : -0.18, 10, dt);
        this.rig.leftForearm.rotation.y = THREE.MathUtils.damp(this.rig.leftForearm.rotation.y, this.hasUserHandItem ? hp.forearmY : 0, 10, dt);
        this.rig.leftForearm.rotation.z = THREE.MathUtils.damp(this.rig.leftForearm.rotation.z, this.hasUserHandItem ? hp.forearmZ : 0, 10, dt);
        this.rig.rightArm.rotation.x = THREE.MathUtils.damp(this.rig.rightArm.rotation.x, -0.35, 10, dt);
        this.rig.rightForearm.rotation.x = THREE.MathUtils.damp(this.rig.rightForearm.rotation.x, -0.22, 10, dt);
        this.rig.rightForearm.rotation.z = THREE.MathUtils.damp(this.rig.rightForearm.rotation.z, 0, 10, dt);
      } else {
        const stride = Math.sin(p * Math.PI * 2) * 0.36;
        this.rig.leftLeg.rotation.x = stride;
        this.rig.rightLeg.rotation.x = -stride;
        this.rig.bodyGroup.position.y = Math.abs(Math.sin(p * Math.PI * 2)) * 0.022;
        this.rig.leftArm.rotation.x = this.hasUserHandItem ? hp.armX : -stride * 0.5;
        this.rig.leftArm.rotation.z = THREE.MathUtils.damp(this.rig.leftArm.rotation.z, this.hasUserHandItem ? hp.armZ : 0, 10, dt);
        this.rig.leftForearm.rotation.x = THREE.MathUtils.damp(this.rig.leftForearm.rotation.x, this.hasUserHandItem ? hp.forearmX : -0.1, 10, dt);
        this.rig.leftForearm.rotation.y = THREE.MathUtils.damp(this.rig.leftForearm.rotation.y, this.hasUserHandItem ? hp.forearmY : 0, 10, dt);
        this.rig.leftForearm.rotation.z = THREE.MathUtils.damp(this.rig.leftForearm.rotation.z, this.hasUserHandItem ? hp.forearmZ : 0, 10, dt);
        this.rig.rightArm.rotation.x = stride * 0.5;
        this.rig.rightForearm.rotation.x = THREE.MathUtils.damp(this.rig.rightForearm.rotation.x, -0.1, 10, dt);
        this.rig.rightForearm.rotation.z = THREE.MathUtils.damp(this.rig.rightForearm.rotation.z, 0, 10, dt);
      }

      if (p >= 1) {
        this.rig.root.position.x = target.actionWorld.x;
        this.rig.root.position.z = target.actionWorld.z;
        this.phase = 'acting';
        this.actionElapsed = 0;
      }
      return;
    }

    if (this.phase === 'exiting' && target.actionWorld) {
      const exitDur = 0.36;
      this.transitionElapsed += dt;
      const p = Math.min(1, this.transitionElapsed / exitDur);
      const ease = p * p * (3 - 2 * p);

      const [sx, sz] = cellToWorld(target.standTile.x, target.standTile.y, this.gridSize, this.cellSize);
      this.rig.root.position.x = THREE.MathUtils.lerp(target.actionWorld.x, sx, ease);
      this.rig.root.position.z = THREE.MathUtils.lerp(target.actionWorld.z, sz, ease);

      const hp = this.rig.handHoldPose;
      if (target.seatPose) {
        const { dropY } = this.getSeatMetrics(target.seatPose);
        this.rig.leftLeg.rotation.x = THREE.MathUtils.damp(this.rig.leftLeg.rotation.x, 0, 10, dt);
        this.rig.rightLeg.rotation.x = THREE.MathUtils.damp(this.rig.rightLeg.rotation.x, 0, 10, dt);
        const cosLift = Math.max(0, 1 - Math.cos(this.rig.leftLeg.rotation.x));
        const safeExitY = dropY < 0 ? Math.max(dropY, -0.28 * Math.pow(cosLift, 1.45)) : 0;
        this.rig.bodyGroup.position.y = THREE.MathUtils.damp(this.rig.bodyGroup.position.y, safeExitY, 22, dt);
        this.rig.bodyGroup.rotation.x = THREE.MathUtils.damp(this.rig.bodyGroup.rotation.x, 0, 12, dt);
        this.rig.leftArm.rotation.x = THREE.MathUtils.damp(this.rig.leftArm.rotation.x, this.hasUserHandItem ? hp.armX : 0, 12, dt);
        this.rig.leftArm.rotation.z = THREE.MathUtils.damp(this.rig.leftArm.rotation.z, this.hasUserHandItem ? hp.armZ : 0, 12, dt);
        this.rig.leftForearm.rotation.x = THREE.MathUtils.damp(this.rig.leftForearm.rotation.x, this.hasUserHandItem ? hp.forearmX : -0.08, 12, dt);
        this.rig.leftForearm.rotation.y = THREE.MathUtils.damp(this.rig.leftForearm.rotation.y, this.hasUserHandItem ? hp.forearmY : 0, 12, dt);
        this.rig.leftForearm.rotation.z = THREE.MathUtils.damp(this.rig.leftForearm.rotation.z, this.hasUserHandItem ? hp.forearmZ : 0, 12, dt);
        this.rig.rightArm.rotation.x = THREE.MathUtils.damp(this.rig.rightArm.rotation.x, 0, 12, dt);
        this.rig.rightArm.rotation.z = THREE.MathUtils.damp(this.rig.rightArm.rotation.z, 0, 12, dt);
        this.rig.rightForearm.rotation.x = THREE.MathUtils.damp(this.rig.rightForearm.rotation.x, -0.08, 12, dt);
        this.rig.rightForearm.rotation.z = THREE.MathUtils.damp(this.rig.rightForearm.rotation.z, 0, 12, dt);
      } else {
        const stride = Math.sin(p * Math.PI * 2) * 0.34;
        this.rig.leftLeg.rotation.x = stride;
        this.rig.rightLeg.rotation.x = -stride;
        this.rig.bodyGroup.position.y = Math.abs(Math.sin(p * Math.PI * 2)) * 0.02;
        this.rig.bodyGroup.rotation.x = THREE.MathUtils.damp(this.rig.bodyGroup.rotation.x, 0, 12, dt);
        this.rig.leftArm.rotation.x = this.hasUserHandItem ? hp.armX : -stride * 0.5;
        this.rig.leftArm.rotation.z = THREE.MathUtils.damp(this.rig.leftArm.rotation.z, this.hasUserHandItem ? hp.armZ : 0, 12, dt);
        this.rig.leftForearm.rotation.x = THREE.MathUtils.damp(this.rig.leftForearm.rotation.x, this.hasUserHandItem ? hp.forearmX : -0.08, 12, dt);
        this.rig.leftForearm.rotation.y = THREE.MathUtils.damp(this.rig.leftForearm.rotation.y, this.hasUserHandItem ? hp.forearmY : 0, 12, dt);
        this.rig.leftForearm.rotation.z = THREE.MathUtils.damp(this.rig.leftForearm.rotation.z, this.hasUserHandItem ? hp.forearmZ : 0, 12, dt);
        this.rig.rightArm.rotation.x = stride * 0.5;
        this.rig.rightArm.rotation.z = THREE.MathUtils.damp(this.rig.rightArm.rotation.z, 0, 12, dt);
        this.rig.rightForearm.rotation.x = THREE.MathUtils.damp(this.rig.rightForearm.rotation.x, -0.08, 12, dt);
        this.rig.rightForearm.rotation.z = THREE.MathUtils.damp(this.rig.rightForearm.rotation.z, 0, 12, dt);
      }

      if (p >= 1) {
        this.rig.root.position.x = sx;
        this.rig.root.position.z = sz;
        this.currentTile = target.standTile;
        this.pickNextTarget();
      }
      return;
    }

    // === ACTING PHASE AT FURNITURE / FEATURE ===
    if (this.actionElapsed === 0 && target.label !== this.lastActivityLabel) {
      this.lastActivityLabel = target.label;
      onActivityChange?.(target.label);
    }

    this.actionElapsed += dt;
    const fx = target.faceWorld.x - this.rig.root.position.x;
    const fz = target.faceWorld.z - this.rig.root.position.z;
    if (Math.hypot(fx, fz) > 0.01) {
      const desiredYaw = Math.atan2(fx, fz);
      const diff = shortestAngleDiff(this.rig.root.rotation.y, desiredYaw);
      this.rig.root.rotation.y += diff * Math.min(1, dt * 8);
    }

    // Subtle stop-motion pose quantization (~14 fps)
    const t = Math.floor(this.actionElapsed * 14) / 14;
    const hp = this.rig.handHoldPose;

    const dampLeftHandPose = (fallbackArmX: number, fallbackForearmX: number) => {
      this.rig.leftArm.rotation.x = THREE.MathUtils.damp(
        this.rig.leftArm.rotation.x,
        this.hasUserHandItem ? hp.armX + Math.sin(t * 1.6) * 0.04 : fallbackArmX,
        8,
        dt
      );
      this.rig.leftArm.rotation.z = THREE.MathUtils.damp(
        this.rig.leftArm.rotation.z,
        this.hasUserHandItem ? hp.armZ : 0,
        8,
        dt
      );
      this.rig.leftForearm.rotation.x = THREE.MathUtils.damp(
        this.rig.leftForearm.rotation.x,
        this.hasUserHandItem ? hp.forearmX + Math.sin(t * 1.6) * 0.04 : fallbackForearmX,
        8,
        dt
      );
      this.rig.leftForearm.rotation.y = THREE.MathUtils.damp(
        this.rig.leftForearm.rotation.y,
        this.hasUserHandItem ? hp.forearmY : 0,
        8,
        dt
      );
      this.rig.leftForearm.rotation.z = THREE.MathUtils.damp(
        this.rig.leftForearm.rotation.z,
        this.hasUserHandItem ? hp.forearmZ : 0,
        8,
        dt
      );
    };

    if (target.seatPose) {
      const { dropY, legAngle } = this.getSeatMetrics(target.seatPose);
      this.rig.bodyGroup.position.y = THREE.MathUtils.damp(
        this.rig.bodyGroup.position.y,
        dropY,
        9,
        dt
      );
      this.rig.leftLeg.rotation.x = THREE.MathUtils.damp(this.rig.leftLeg.rotation.x, legAngle, 9, dt);
      this.rig.rightLeg.rotation.x = THREE.MathUtils.damp(
        this.rig.rightLeg.rotation.x,
        legAngle,
        9,
        dt
      );

      if (target.type === 'draw_at_desk') {
        this.rig.bodyGroup.rotation.x = THREE.MathUtils.damp(this.rig.bodyGroup.rotation.x, 0.14, 8, dt);
        this.rig.rightArm.rotation.x = -0.58 + Math.sin(t * 7.8) * 0.12;
        this.rig.rightArm.rotation.z = Math.cos(t * 6.2) * 0.12;
        this.rig.rightForearm.rotation.x = THREE.MathUtils.damp(this.rig.rightForearm.rotation.x, -0.56, 10, dt);
        this.rig.rightForearm.rotation.z = THREE.MathUtils.damp(this.rig.rightForearm.rotation.z, -0.12, 10, dt);
        dampLeftHandPose(-0.32, -0.3);
        this.rig.headGroup.rotation.x = 0.16 + Math.sin(t * 2.2) * 0.04;
        this.rig.headGroup.rotation.y = Math.sin(t * 1.4) * 0.08;
      } else {
        this.rig.bodyGroup.rotation.x = THREE.MathUtils.damp(this.rig.bodyGroup.rotation.x, -0.08, 8, dt);
        dampLeftHandPose(-0.2, -0.18);
        this.rig.rightArm.rotation.x = THREE.MathUtils.damp(
          this.rig.rightArm.rotation.x,
          -0.34 + Math.sin(t * 1.6) * 0.06,
          8,
          dt
        );
        this.rig.rightArm.rotation.z = THREE.MathUtils.damp(this.rig.rightArm.rotation.z, -0.06, 8, dt);
        this.rig.rightForearm.rotation.x = THREE.MathUtils.damp(this.rig.rightForearm.rotation.x, -0.42, 8, dt);
        this.rig.rightForearm.rotation.z = THREE.MathUtils.damp(this.rig.rightForearm.rotation.z, -0.1, 8, dt);
        this.rig.headGroup.rotation.y = Math.sin(t * 1.2) * 0.18;
        this.rig.headGroup.rotation.x = Math.sin(t * 1.8) * 0.04;
      }
    } else if (target.type === 'paint_at_easel' || target.type === 'work_craft') {
      this.rig.bodyGroup.position.y = THREE.MathUtils.damp(this.rig.bodyGroup.position.y, 0, 10, dt);
      this.rig.bodyGroup.rotation.x = THREE.MathUtils.damp(this.rig.bodyGroup.rotation.x, 0.08, 8, dt);
      this.rig.leftLeg.rotation.x = THREE.MathUtils.damp(this.rig.leftLeg.rotation.x, 0, 10, dt);
      this.rig.rightLeg.rotation.x = THREE.MathUtils.damp(this.rig.rightLeg.rotation.x, 0, 10, dt);
      dampLeftHandPose(target.type === 'work_craft' ? -0.34 + Math.sin(t * 3.8) * 0.06 : -0.14, -0.26);
      this.rig.rightArm.rotation.x = -0.66 + Math.sin(t * 5.2) * 0.18;
      this.rig.rightArm.rotation.z = Math.sin(t * 3.4) * 0.14;
      this.rig.rightForearm.rotation.x = THREE.MathUtils.damp(this.rig.rightForearm.rotation.x, -0.72, 10, dt);
      this.rig.rightForearm.rotation.z = THREE.MathUtils.damp(this.rig.rightForearm.rotation.z, -0.14, 10, dt);
      this.rig.headGroup.rotation.y = Math.sin(t * 1.5) * 0.1;
      this.rig.headGroup.rotation.x = 0.06 + Math.sin(t * 2.1) * 0.05;
    } else if (target.type === 'water_plant') {
      this.rig.bodyGroup.position.y = THREE.MathUtils.damp(this.rig.bodyGroup.position.y, 0, 10, dt);
      this.rig.bodyGroup.rotation.x = THREE.MathUtils.damp(this.rig.bodyGroup.rotation.x, 0.14, 8, dt);
      this.rig.leftLeg.rotation.x = THREE.MathUtils.damp(this.rig.leftLeg.rotation.x, 0, 10, dt);
      this.rig.rightLeg.rotation.x = THREE.MathUtils.damp(this.rig.rightLeg.rotation.x, 0, 10, dt);
      dampLeftHandPose(0.14, -0.1);
      this.rig.rightArm.rotation.x = -0.58 + Math.sin(t * 3.4) * 0.08;
      this.rig.rightArm.rotation.z = -0.06;
      this.rig.rightForearm.rotation.x = THREE.MathUtils.damp(this.rig.rightForearm.rotation.x, -0.5, 10, dt);
      this.rig.rightForearm.rotation.z = THREE.MathUtils.damp(this.rig.rightForearm.rotation.z, 0, 10, dt);
      this.rig.wateringCanGroup.rotation.x = 0.34 + Math.sin(t * 4.4) * 0.16;
      this.rig.headGroup.rotation.x = 0.16;
      this.rig.headGroup.rotation.y = Math.sin(t * 1.6) * 0.08;
    } else if (target.type === 'toggle_lamp') {
      this.rig.bodyGroup.position.y = THREE.MathUtils.damp(this.rig.bodyGroup.position.y, 0, 10, dt);
      this.rig.bodyGroup.rotation.x = THREE.MathUtils.damp(this.rig.bodyGroup.rotation.x, 0.06, 8, dt);
      this.rig.leftLeg.rotation.x = THREE.MathUtils.damp(this.rig.leftLeg.rotation.x, 0, 10, dt);
      this.rig.rightLeg.rotation.x = THREE.MathUtils.damp(this.rig.rightLeg.rotation.x, 0, 10, dt);
      dampLeftHandPose(0, -0.08);
      // Reach right hand forward close to the drawer/lamp switch around t = 1.2s
      const reachWave = Math.sin(Math.min(Math.PI, (this.actionElapsed / target.duration) * Math.PI));
      this.rig.rightArm.rotation.x = -0.68 * reachWave;
      this.rig.rightArm.rotation.z = 0;
      this.rig.rightForearm.rotation.x = THREE.MathUtils.damp(
        this.rig.rightForearm.rotation.x,
        -0.44 * reachWave,
        10,
        dt
      );
      this.rig.rightForearm.rotation.z = THREE.MathUtils.damp(this.rig.rightForearm.rotation.z, 0, 10, dt);
      this.rig.headGroup.rotation.x = 0.04;
      this.rig.headGroup.rotation.y = Math.sin(t * 1.6) * 0.08;

      if (!this.lampToggledThisAction && this.actionElapsed >= 1.25 && target.instanceId) {
        this.lampToggledThisAction = true;
        const nextLit = this.onToggleLamp?.(target.instanceId) ?? null;
        if (nextLit !== null) {
          const toggleLabel = nextLit
            ? 'กำลังเปิดโคมไฟในสตูดิโอ'
            : 'กำลังปิดโคมไฟในสตูดิโอ';
          this.lastActivityLabel = toggleLabel;
          onActivityChange?.(toggleLabel);
        }
      }
    } else if (target.type === 'play_with_pet') {
      this.rig.bodyGroup.position.y = 0.02 + Math.abs(Math.sin(t * 4.2)) * 0.035;
      this.rig.bodyGroup.rotation.x = THREE.MathUtils.damp(this.rig.bodyGroup.rotation.x, 0.2, 8, dt);
      this.rig.leftLeg.rotation.x = THREE.MathUtils.damp(this.rig.leftLeg.rotation.x, -0.2, 10, dt);
      this.rig.rightLeg.rotation.x = THREE.MathUtils.damp(this.rig.rightLeg.rotation.x, -0.2, 10, dt);
      // Right hand always leads petting / playing with pets; left hand holds prop or rests gently
      dampLeftHandPose(-0.24, -0.2);
      this.rig.rightArm.rotation.x = -0.6 - Math.sin(t * 6.0) * 0.22;
      this.rig.rightArm.rotation.z = THREE.MathUtils.damp(this.rig.rightArm.rotation.z, -0.1, 10, dt);
      this.rig.rightForearm.rotation.x = THREE.MathUtils.damp(this.rig.rightForearm.rotation.x, -0.44, 10, dt);
      this.rig.headGroup.rotation.x = 0.2;
      this.rig.headGroup.rotation.z = Math.sin(t * 3.0) * 0.12;
    } else {
      // look_window, admire_frame, browse_books, stroll — right hand leads interactive gestures, left hand holds prop
      this.rig.bodyGroup.position.y = Math.sin(t * 2.4) * 0.014;
      this.rig.bodyGroup.rotation.x = THREE.MathUtils.damp(this.rig.bodyGroup.rotation.x, 0, 8, dt);
      this.rig.leftLeg.rotation.x = THREE.MathUtils.damp(this.rig.leftLeg.rotation.x, 0, 10, dt);
      this.rig.rightLeg.rotation.x = THREE.MathUtils.damp(this.rig.rightLeg.rotation.x, 0, 10, dt);
      dampLeftHandPose(-0.08, -0.08);
      this.rig.rightArm.rotation.x = THREE.MathUtils.damp(
        this.rig.rightArm.rotation.x,
        target.type === 'browse_books'
          ? -0.46 + Math.sin(t * 2.8) * 0.1
          : target.type === 'admire_frame' || target.type === 'look_window'
            ? -0.26 + Math.sin(t * 1.5) * 0.05
            : -0.06,
        8,
        dt
      );
      this.rig.rightArm.rotation.z = THREE.MathUtils.damp(
        this.rig.rightArm.rotation.z,
        target.type === 'browse_books' ? -0.08 : 0,
        8,
        dt
      );
      this.rig.rightForearm.rotation.x = THREE.MathUtils.damp(
        this.rig.rightForearm.rotation.x,
        target.type === 'browse_books'
          ? -0.48
          : target.type === 'admire_frame'
            ? -0.34
            : -0.12,
        8,
        dt
      );
      this.rig.rightForearm.rotation.z = THREE.MathUtils.damp(this.rig.rightForearm.rotation.z, -0.06, 8, dt);
      this.rig.headGroup.rotation.z = THREE.MathUtils.damp(this.rig.headGroup.rotation.z, 0, 8, dt);
      this.rig.headGroup.rotation.y = Math.sin(t * 1.35) * 0.22;
      this.rig.headGroup.rotation.x =
        target.type === 'look_window' || target.type === 'admire_frame'
          ? -0.06 + Math.sin(t * 1.7) * 0.04
          : Math.sin(t * 1.9) * 0.05;
    }

    if (this.actionElapsed >= target.duration) {
      this.rig.headGroup.rotation.z = 0;
      this.rig.rightArm.rotation.z = 0;
      this.rig.leftArm.rotation.z = this.hasUserHandItem ? hp.armZ : 0;
      if (target.actionWorld) {
        this.phase = 'exiting';
        this.transitionElapsed = 0;
      } else {
        this.pickNextTarget();
      }
    }
  }
}
