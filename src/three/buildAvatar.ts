import * as THREE from 'three';
import { AVATAR_ITEM_MAP, BLUSH_STYLES } from '../data/catalog';
import { AvatarConfig, EyeStyleId } from '../types/studio';
import {
  createClayStripedTexture,
  createPlasticineBumpTexture,
  createTerracottaRoughnessTexture,
  createTerracottaSurfaceTexture,
  sculptClayGeo,
} from './textures';

export interface HandHoldPose {
  armX: number;
  armZ: number;
  forearmX: number;
  forearmY: number;
  forearmZ: number;
}

export interface AvatarRig3D {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  headGroup: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftForearm: THREE.Group;
  rightForearm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  propGroup: THREE.Group;
  wateringCanGroup: THREE.Group;
  sketchPencilGroup: THREE.Group;
  handHoldPose: HandHoldPose;
}

export function getHandHoldPose(handItemId?: string): HandHoldPose {
  switch (handItemId) {
    case 'hand_brush':
      return { armX: -0.24, armZ: -0.08, forearmX: -1.32, forearmY: 0.08, forearmZ: 0.24 };
    case 'hand_coffee':
      return { armX: -0.2, armZ: -0.07, forearmX: -1.16, forearmY: 0.06, forearmZ: 0.22 };
    case 'hand_sketchbook':
      return { armX: -0.22, armZ: -0.1, forearmX: -1.26, forearmY: 0.14, forearmZ: 0.28 };
    case 'hand_stylus':
      return { armX: -0.26, armZ: -0.09, forearmX: -1.18, forearmY: 0.12, forearmZ: 0.24 };
    case 'hand_camera':
      return { armX: -0.3, armZ: -0.08, forearmX: -1.28, forearmY: 0.08, forearmZ: 0.2 };
    case 'hand_xmas_gift':
      return { armX: -0.18, armZ: -0.09, forearmX: -1.06, forearmY: 0.1, forearmZ: 0.24 };
    default:
      return { armX: -0.2, armZ: -0.07, forearmX: -1.16, forearmY: 0.06, forearmZ: 0.22 };
  }
}

/**
 * Unglazed matte terracotta / earthenware clay material ("หุ่นดินเผาสไตล์การ์ตูนโค้งมน").
 */
function clayMat(
  color: string | number,
  roughness = 0.86,
  bumpScale = 0.013,
  mapTex?: THREE.Texture | null
): THREE.MeshPhysicalMaterial {
  const albedoTex = mapTex ?? createTerracottaSurfaceTexture(2.2, 2.2);
  const bumpTex = createPlasticineBumpTexture(2.2, 2.2);
  const roughTex = createTerracottaRoughnessTexture(2.2, 2.2);
  return new THREE.MeshPhysicalMaterial({
    color: mapTex ? 0xffffff : color,
    ...(albedoTex ? { map: albedoTex } : {}),
    ...(bumpTex ? { bumpMap: bumpTex, bumpScale } : {}),
    ...(roughTex ? { roughnessMap: roughTex } : {}),
    roughness: Math.max(0.84, roughness),
    metalness: 0.0,
    sheen: 0.08,
    sheenRoughness: 0.92,
    sheenColor: new THREE.Color(0xffe6d2),
    clearcoat: 0.0,
  });
}

/**
 * Soft satin-glazed clay material for eyes, buttons, and metallic accents.
 */
function satinClayMat(color: string | number, roughness = 0.26): THREE.MeshPhysicalMaterial {
  const bumpTex = createPlasticineBumpTexture(1.0, 1.0);
  return new THREE.MeshPhysicalMaterial({
    color,
    ...(bumpTex ? { bumpMap: bumpTex, bumpScale: 0.003 } : {}),
    roughness,
    metalness: 0.02,
    clearcoat: 0.24,
    clearcoatRoughness: 0.34,
  });
}

function addMesh(
  parent: THREE.Object3D,
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  pos: [number, number, number],
  rot?: [number, number, number],
  scale?: [number, number, number]
): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(pos[0], pos[1], pos[2]);
  if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
  if (scale) m.scale.set(scale[0], scale[1], scale[2]);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

/**
 * Creates a smooth rounded-corner beveled panel using ExtrudeGeometry (replaces boxy slabs).
 */
function createRoundedPanelGeo(
  width: number,
  height: number,
  depth: number,
  cornerRadius = 0.022,
  bevelSize = 0.007
): THREE.BufferGeometry {
  const hw = Math.max(0.01, width / 2 - bevelSize);
  const hh = Math.max(0.01, height / 2 - bevelSize);
  const r = Math.min(cornerRadius, hw * 0.85, hh * 0.85);

  const shape = new THREE.Shape();
  shape.moveTo(-hw + r, -hh);
  shape.lineTo(hw - r, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
  shape.lineTo(hw, hh - r);
  shape.quadraticCurveTo(hw, hh, hw - r, hh);
  shape.lineTo(-hw + r, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
  shape.lineTo(-hw, -hh + r);
  shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);

  const coreDepth = Math.max(0.003, depth - bevelSize * 2);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: coreDepth,
    bevelEnabled: true,
    bevelThickness: bevelSize,
    bevelSize,
    bevelSegments: 4,
    curveSegments: 10,
  });
  geo.center();
  geo.computeVertexNormals();
  return sculptClayGeo(geo, 0.0005);
}

function createClayTorsoGeo(
  topR: number,
  midR: number,
  botR: number,
  height: number
): THREE.LatheGeometry {
  const half = height / 2;
  const pts = [
    new THREE.Vector2(0.005, -half),
    new THREE.Vector2(botR * 0.86, -half),
    new THREE.Vector2(botR, -half + height * 0.24),
    new THREE.Vector2(midR, 0),
    new THREE.Vector2(topR, half - height * 0.18),
    new THREE.Vector2(topR * 0.74, half),
    new THREE.Vector2(0.005, half),
  ];
  return sculptClayGeo(new THREE.LatheGeometry(pts, 32), 0.0008);
}

function createSmoothLegGeo(): THREE.LatheGeometry {
  // Smooth continuous thigh -> knee -> calf -> ankle curve (y = -0.32 .. 0)
  const pts = [
    new THREE.Vector2(0.005, -0.32),
    new THREE.Vector2(0.043, -0.318),
    new THREE.Vector2(0.046, -0.255),
    new THREE.Vector2(0.05, -0.175),
    new THREE.Vector2(0.054, -0.095),
    new THREE.Vector2(0.057, -0.02),
    new THREE.Vector2(0.042, 0.0),
    new THREE.Vector2(0.005, 0.0),
  ];
  return sculptClayGeo(new THREE.LatheGeometry(pts, 26), 0.0007);
}

function createSmoothSleeveGeo(
  topR: number,
  midR: number,
  botR: number,
  length: number
): THREE.LatheGeometry {
  const half = length / 2;
  const pts = [
    new THREE.Vector2(0.004, -half),
    new THREE.Vector2(botR * 0.9, -half),
    new THREE.Vector2(botR, -half + length * 0.18),
    new THREE.Vector2(midR, 0),
    new THREE.Vector2(topR, half - length * 0.18),
    new THREE.Vector2(topR * 0.65, half),
    new THREE.Vector2(0.004, half),
  ];
  return sculptClayGeo(new THREE.LatheGeometry(pts, 22), 0.0006);
}

function createSmoothNeckBlendGeo(): THREE.LatheGeometry {
  // Smooth trapezius flare connecting slender neck seamlessly into shoulder line
  const pts = [
    new THREE.Vector2(0.004, -0.022),
    new THREE.Vector2(0.072, -0.022),
    new THREE.Vector2(0.056, -0.008),
    new THREE.Vector2(0.036, 0.006),
    new THREE.Vector2(0.029, 0.02),
    new THREE.Vector2(0.004, 0.02),
  ];
  return sculptClayGeo(new THREE.LatheGeometry(pts, 24), 0.0004);
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * Evaluates a point on the cute extra-rounded terracotta cartoon-clay head surface (matching IMG_1797).
 * Features a full spherical cranium, plump soft cheeks, very gentle rounded U-jawline,
 * smooth under-jaw curve into the short neck, and subtle soft cushion for the round clay nose.
 */
function evalSculptedHeadPoint(
  ux: number,
  uy: number,
  uz: number,
  isMale: boolean
): [number, number, number] {
  const halfW = isMale ? 0.129 : 0.126;
  const halfH = 0.125;
  const halfD = 0.122;

  let x = ux * halfW;
  let y = uy * halfH;
  let z = uz * halfD;

  const frontMask = smoothstep(-0.35, 0.35, uz);

  // Plump rounded cartoon cheeks across Front, 3/4, and Low Angle
  const cheekMask =
    Math.exp(-Math.pow((uy + 0.16) / 0.28, 2)) *
    smoothstep(0.0, 0.62, uz) *
    smoothstep(0.18, 0.76, Math.abs(ux));
  x *= 1 + (isMale ? 0.05 : 0.062) * cheekMask;
  z += 0.0065 * cheekMask;

  // Gentle soft U-curve jawline (preserves cute rounded clay-doll plumpness)
  if (uy < -0.26) {
    const jawProgress = clamp01((-uy - 0.26) / 0.74);
    const jawTaper = (isMale ? 0.045 : 0.06) * Math.pow(jawProgress, 1.45) * (0.4 + 0.6 * frontMask);
    x *= 1 - jawTaper;
  }

  // Smooth rounded under-jaw curve rising cleanly into the short neck
  if (uy < -0.28) {
    const lowerT = smoothstep(-0.28, -0.88, uy);
    const underJawLift = smoothstep(0.55, -0.35, uz) * lowerT;
    y += 0.024 * underJawLift;
  }

  // Broad, softly rounded chin curve (no sharp point)
  const chinSpot =
    Math.exp(-Math.pow((uy + 0.78) / 0.24, 2)) *
    Math.exp(-Math.pow(ux / 0.52, 2)) *
    smoothstep(0.15, 0.68, uz);
  y -= 0.003 * chinSpot;
  z += 0.006 * chinSpot;

  // Very gentle eye cushion so dark pill eyes nest naturally
  const eyeHollow =
    Math.exp(-Math.pow((uy - 0.01) / 0.16, 2)) *
    Math.exp(-Math.pow((Math.abs(ux) - 0.34) / 0.22, 2)) *
    smoothstep(0.5, 0.86, uz);
  z -= 0.002 * eyeHollow;

  // Soft rounded mound base under the sculpted clay button nose
  if (uz > 0.68 && uy >= -0.28 && uy <= 0.02 && Math.abs(ux) < 0.22) {
    const moundY = Math.exp(-Math.pow((uy + 0.145) / 0.11, 2));
    const moundX = Math.exp(-Math.pow(ux / 0.12, 2));
    const moundMask = moundY * moundX * smoothstep(0.72, 0.94, uz);
    z += 0.0055 * moundMask;
  }

  // Subtle soft lip/chin contour
  if (uz > 0.66 && uy >= -0.64 && uy <= -0.32 && Math.abs(ux) < 0.28) {
    const lipWidth = Math.exp(-Math.pow(ux / 0.18, 2)) * smoothstep(0.66, 0.9, uz);
    const upperLip = Math.exp(-Math.pow((uy + 0.43) / 0.06, 2));
    const lowerLip = Math.exp(-Math.pow((uy + 0.51) / 0.06, 2));
    z += (0.0022 * upperLip + 0.0018 * lowerLip) * lipWidth;
  }

  return [x, y, z];
}

function createSculptedHeadGeo(isMale: boolean): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(1, 84, 64);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const ux = pos.getX(i);
    const uy = pos.getY(i);
    const uz = pos.getZ(i);
    const [x, y, z] = evalSculptedHeadPoint(ux, uy, uz, isMale);
    pos.setXYZ(i, x, y, z);
  }
  pos.needsUpdate = true;

  // Hand-kneaded terracotta micro-undulation while preserving clean cartoon contours
  const nPos = geo.attributes.position;
  for (let i = 0; i < nPos.count; i++) {
    const x = nPos.getX(i);
    const y = nPos.getY(i);
    const z = nPos.getZ(i);
    const faceFade = z > 0.04 && y < 0.06 ? 0.24 : 0.55;
    const n =
      Math.sin(x * 39 + y * 45 + z * 31) * 0.5 +
      Math.cos(x * 73 - y * 57 + z * 65) * 0.5;
    nPos.setXYZ(i, x + n * 0.00065 * faceFade, y + n * 0.00058 * faceFade, z + n * 0.00065 * faceFade);
  }
  nPos.needsUpdate = true;
  geo.computeVertexNormals();
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  return geo;
}

function addClayStrand(
  parent: THREE.Object3D,
  points: [number, number, number][],
  radius: number,
  mat: THREE.Material
) {
  const vecs = points.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
  const curve = new THREE.CatmullRomCurve3(vecs);
  const geo = sculptClayGeo(new THREE.TubeGeometry(curve, 18, radius, 10, false), 0.0007);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);

  const end = vecs[vecs.length - 1];
  addMesh(parent, new THREE.SphereGeometry(radius * 0.92, 10, 10), mat, [end.x, end.y, end.z]);
}

function addTaperedClayStrand(
  parent: THREE.Object3D,
  points: [number, number, number][],
  radiusStart: number,
  radiusEnd: number,
  mat: THREE.Material,
  tubularSegments = 16
) {
  const vecs = points.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
  const curve = new THREE.CatmullRomCurve3(vecs);
  const radialSegs = 10;
  const geo = new THREE.TubeGeometry(curve, tubularSegments, 1, radialSegs, false);
  const pos = geo.attributes.position;
  for (let i = 0; i <= tubularSegments; i++) {
    const t = i / tubularSegments;
    const center = curve.getPointAt(t);
    const r = radiusStart + (radiusEnd - radiusStart) * Math.pow(t, 1.25);
    for (let j = 0; j <= radialSegs; j++) {
      const idx = i * (radialSegs + 1) + j;
      const vx = pos.getX(idx) - center.x;
      const vy = pos.getY(idx) - center.y;
      const vz = pos.getZ(idx) - center.z;
      pos.setXYZ(idx, center.x + vx * r, center.y + vy * r, center.z + vz * r);
    }
  }
  pos.needsUpdate = true;
  sculptClayGeo(geo, 0.0006);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);

  const end = vecs[vecs.length - 1];
  addMesh(parent, new THREE.SphereGeometry(radiusEnd * 0.94, 8, 8), mat, [end.x, end.y, end.z]);
}

function addClayBow(
  parent: THREE.Object3D,
  mat: THREE.Material,
  pos: [number, number, number],
  scale = 1,
  rot?: [number, number, number]
) {
  const bow = new THREE.Group();
  bow.position.set(pos[0], pos[1], pos[2]);
  bow.scale.setScalar(scale);
  if (rot) bow.rotation.set(rot[0], rot[1], rot[2]);

  addMesh(bow, new THREE.SphereGeometry(0.013, 12, 10), mat, [0, 0, 0.004]);
  for (const s of [-1, 1]) {
    addMesh(
      bow,
      new THREE.SphereGeometry(0.02, 12, 10),
      mat,
      [s * 0.022, 0.003, 0],
      [0, 0, s * 0.2],
      [1.2, 0.85, 0.65]
    );
    addMesh(
      bow,
      new THREE.CapsuleGeometry(0.006, 0.03, 6, 8),
      mat,
      [s * 0.013, -0.023, 0.004],
      [0.1, 0, s * -0.3]
    );
  }
  parent.add(bow);
}

export function buildAvatarRig3D(config: AvatarConfig): AvatarRig3D {
  const root = new THREE.Group();
  root.name = 'student_avatar_3d';
  root.userData.isAvatar = true;

  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const isMale = config.gender === 'male';
  const eyeStyle: EyeStyleId = config.eyeStyleId ?? 'classic';
  const eyebrowStyle = config.eyebrowStyleId ?? 'soft';
  const mouthStyle = config.mouthStyleId ?? 'smile';
  const blushStyle = config.blushStyleId ?? 'rosy';

  const skinHex = config.skinToneHex || '#E9AA8A';
  const skinMat = clayMat(skinHex, 0.87, 0.012);
  const earInnerColor = new THREE.Color(skinHex).multiplyScalar(0.84);
  const earInnerMat = clayMat(earInnerColor.getHex(), 0.88, 0.01);
  const noseTintColor = new THREE.Color(skinHex).lerp(new THREE.Color('#D97864'), 0.14);
  const noseMat = clayMat(noseTintColor.getHex(), 0.86, 0.011);
  const hairMat = clayMat(config.hairColorHex || '#5E4235', 0.89, 0.015);
  const browMat = clayMat(0x3a261d, 0.86, 0.008);
  const eyeMat = satinClayMat(0x1f1714, 0.24);
  const whiteMat = clayMat(0xf7efe3, 0.84, 0.007);
  const lipMat = clayMat(0xc9666b, 0.84, 0.008);
  const buttonMat = clayMat('#E0A284', 0.84, 0.011);
  const buckleMat = clayMat('#B98963', 0.85, 0.011);
  const brassMat = satinClayMat(0xdcb05e, 0.32);

  const outfitId = AVATAR_ITEM_MAP[config.outfitId]
    ? config.outfitId
    : 'outfit_clay_overalls';
  const outfitDef = AVATAR_ITEM_MAP[outfitId] ?? AVATAR_ITEM_MAP.outfit_clay_overalls;

  const isClayOveralls = outfitId === 'outfit_clay_overalls';
  const isOveralls = isClayOveralls || outfitId === 'outfit_overalls';
  const isStarterTank = outfitId === 'outfit_starter_tank';
  const isStarterPolo = outfitId === 'outfit_starter_polo';
  const isBjdRibbonDress = outfitId === 'outfit_bjd_ribbon_dress';
  const isSanta = outfitId === 'outfit_xmas_santa';
  const isSanty = outfitId === 'outfit_xmas_santy';
  const isElfMale = outfitId === 'outfit_xmas_elf_male';
  const isElfFemale = outfitId === 'outfit_xmas_elf_female';
  const isSkirtOutfit =
    isBjdRibbonDress ||
    outfitId === 'outfit_cardigan' ||
    outfitId === 'outfit_pastel_atelier' ||
    outfitId === 'outfit_french_blouse' ||
    outfitId === 'outfit_fem_trench' ||
    isSanty ||
    isElfFemale;

  const primaryMat = clayMat(outfitDef.primaryHex, 0.78, 0.007);
  const secondaryMat = clayMat(outfitDef.secondaryHex, 0.79, 0.006);
  const leatherDarkMat = clayMat('#2B2625', 0.72, 0.006);

  const redStripeHex = '#C95443';
  const creamStripeHex = outfitDef.secondaryHex || '#F5ECE0';
  const stripedTex = isClayOveralls
    ? createClayStripedTexture(creamStripeHex, redStripeHex, 5)
    : null;
  const elfSockTex = isElfFemale
    ? createClayStripedTexture('#FAF7F2', '#D13B47', 6)
    : null;
  const redCuffMat = clayMat(redStripeHex, 0.78, 0.006);

  const shirtMat = isClayOveralls
    ? clayMat(creamStripeHex, 0.78, 0.006, stripedTex)
    : isOveralls
    ? secondaryMat
    : primaryMat;

  const denimHex = isClayOveralls
    ? '#4E6E96'
    : outfitId === 'outfit_overalls'
    ? '#52729B'
    : isStarterTank
    ? '#4A668C'
    : isStarterPolo
    ? '#D9CCB8'
    : outfitId === 'outfit_arch_blazer'
    ? '#343A44'
    : outfitId === 'outfit_street_cargo'
    ? '#58624F'
    : outfitId === 'outfit_male_trench'
    ? '#2A2F3A'
    : outfitId === 'outfit_cardigan'
    ? '#8B6E5B'
    : outfitId === 'outfit_french_blouse'
    ? '#7A2D3F'
    : outfitId === 'outfit_fem_trench'
    ? '#4A3B36'
    : outfitId === 'outfit_ny_party'
    ? '#1F293D'
    : isSanta
    ? '#B92936'
    : isElfMale
    ? '#1E5E3B'
    : '#435C7D';

  const denimMat = clayMat(denimHex, 0.82, 0.008);
  const denimSeamMat = clayMat('#6F8DB3', 0.78, 0.005);
  const cuffBlueMat = clayMat('#7A9CC3', 0.8, 0.007);
  const pocketMat = clayMat('#44638A', 0.82, 0.007);

  const shoeUpperMat = clayMat(
    isClayOveralls || outfitId === 'outfit_overalls'
      ? '#885542'
      : isBjdRibbonDress || outfitId === 'outfit_french_blouse'
      ? '#6B3641'
      : isStarterTank
      ? '#4E637E'
      : isStarterPolo
      ? '#334E73'
      : isSanta || isSanty || outfitId === 'outfit_fem_trench'
      ? '#2E2625'
      : isElfMale || isElfFemale
      ? '#1E5E3B'
      : outfitId === 'outfit_male_trench' || outfitId === 'outfit_arch_blazer'
      ? '#382C26'
      : '#744D3D',
    0.76,
    0.006
  );
  const soleMat = clayMat('#F2EADF', 0.78, 0.005);

  // ==========================================================
  // 1. SMOOTH ROUNDED CARTOON LEGS & ROUND-TOE SNEAKERS (hip y = 0.395, sole at y = 0)
  // ==========================================================
  const bareLowerLeg =
    isStarterTank ||
    isStarterPolo ||
    isBjdRibbonDress ||
    outfitId === 'outfit_cardigan' ||
    outfitId === 'outfit_pastel_atelier' ||
    outfitId === 'outfit_french_blouse' ||
    outfitId === 'outfit_fem_trench' ||
    isSanty ||
    isElfFemale;

  const smoothLegGeo = createSmoothLegGeo();
  const cuffTubeGeo = sculptClayGeo(
    new THREE.CylinderGeometry(0.056, 0.058, 0.052, 24),
    0.0007
  );
  const cuffRimGeo = sculptClayGeo(new THREE.TorusGeometry(0.054, 0.0075, 10, 24), 0.0005);

  const createLegGroup = (side: -1 | 1): THREE.Group => {
    const legPivot = new THREE.Group();
    legPivot.position.set(side * 0.068, 0.395, 0);

    if (bareLowerLeg) {
      const upperLegGeo = sculptClayGeo(
        new THREE.CylinderGeometry(0.057, 0.052, 0.165, 22),
        0.0007
      );
      const lowerLegGeo = sculptClayGeo(
        new THREE.CylinderGeometry(0.05, 0.042, 0.165, 22),
        0.0007
      );
      const calfMat = isElfFemale
        ? clayMat('#FAF7F2', 0.8, 0.005, elfSockTex)
        : isBjdRibbonDress || isSanty || outfitId === 'outfit_french_blouse'
        ? whiteMat
        : skinMat;
      addMesh(legPivot, upperLegGeo, skinMat, [0, -0.082, 0], undefined, [1.0, 1.0, 0.96]);
      addMesh(legPivot, lowerLegGeo, calfMat, [0, -0.238, 0], undefined, [1.0, 1.0, 0.96]);
      if (isStarterTank || isStarterPolo) {
        addMesh(
          legPivot,
          sculptClayGeo(new THREE.CylinderGeometry(0.061, 0.059, 0.125, 22), 0.0007),
          denimMat,
          [0, -0.058, 0]
        );
      }
      if (isSanty) {
        addMesh(
          legPivot,
          sculptClayGeo(new THREE.TorusGeometry(0.049, 0.012, 10, 20), 0.0006),
          whiteMat,
          [0, -0.258, 0],
          [Math.PI / 2, 0, 0]
        );
      }
    } else {
      addMesh(legPivot, smoothLegGeo, denimMat, [0, 0, 0], undefined, [1.0, 1.0, 0.97]);
      if (outfitId === 'outfit_street_cargo') {
        addMesh(
          legPivot,
          createRoundedPanelGeo(0.024, 0.072, 0.048, 0.008, 0.004),
          clayMat('#495241', 0.8, 0.006),
          [side * 0.05, -0.155, 0.004]
        );
      }
    }

    if (isOveralls) {
      // Soft rolled light-blue denim cuff right above shoe
      addMesh(legPivot, cuffTubeGeo, cuffBlueMat, [0, -0.282, 0]);
      addMesh(legPivot, cuffRimGeo, cuffBlueMat, [0, -0.256, 0], [Math.PI / 2, 0, 0]);
    } else if (isSanta) {
      addMesh(
        legPivot,
        sculptClayGeo(new THREE.TorusGeometry(0.052, 0.015, 10, 20), 0.0007),
        whiteMat,
        [0, -0.278, 0],
        [Math.PI / 2, 0, 0]
      );
    } else if (isElfMale || isElfFemale) {
      addMesh(
        legPivot,
        sculptClayGeo(new THREE.TorusGeometry(0.047, 0.011, 10, 20), 0.0006),
        secondaryMat,
        [0, -0.285, 0],
        [Math.PI / 2, 0, 0]
      );
    }

    // Soft rounded cartoon two-tone sneakers / boots resting flush at y = 0
    const shoeGroup = new THREE.Group();
    shoeGroup.position.set(0, -0.352, 0.018);
    shoeGroup.rotation.y = side * 0.08;
    legPivot.add(shoeGroup);

    const shoeFrontToeMat =
      isSanta || isSanty || outfitId === 'outfit_fem_trench' || outfitId === 'outfit_arch_blazer'
        ? shoeUpperMat
        : soleMat;

    // Cream rounded sole (0.395 - 0.352 - 0.043 = 0)
    addMesh(
      shoeGroup,
      sculptClayGeo(new THREE.CylinderGeometry(0.056, 0.059, 0.022, 24), 0.0006),
      soleMat,
      [0, -0.032, 0.006],
      undefined,
      [0.95, 1, 1.38]
    );
    // Rounded shoe collar & upper
    addMesh(
      shoeGroup,
      sculptClayGeo(new THREE.SphereGeometry(0.056, 22, 16), 0.0007),
      shoeUpperMat,
      [0, 0.003, -0.006],
      undefined,
      [0.9, 0.82, 1.15]
    );
    addMesh(
      shoeGroup,
      sculptClayGeo(new THREE.CylinderGeometry(0.046, 0.053, 0.044, 22), 0.0006),
      shoeUpperMat,
      [0, 0.016, -0.016]
    );
    // Plump smooth rounded toe cap
    addMesh(
      shoeGroup,
      sculptClayGeo(new THREE.SphereGeometry(0.053, 20, 16), 0.0006),
      shoeFrontToeMat,
      [0, -0.006, 0.042],
      undefined,
      [0.94, 0.62, 0.96]
    );
    // Cute rounded lace bars across instep
    addMesh(
      shoeGroup,
      new THREE.CapsuleGeometry(0.0045, 0.032, 6, 8),
      isSanta || isSanty ? brassMat : soleMat,
      [0, 0.024, 0.032],
      [0.22, 0, Math.PI / 2]
    );
    addMesh(
      shoeGroup,
      new THREE.CapsuleGeometry(0.0045, 0.034, 6, 8),
      isSanta || isSanty ? brassMat : soleMat,
      [0, 0.032, 0.012],
      [0.22, 0, Math.PI / 2]
    );

    if (isElfMale || isElfFemale) {
      addMesh(shoeGroup, new THREE.SphereGeometry(0.012, 10, 10), brassMat, [0, 0.012, 0.072]);
    }

    if (isBjdRibbonDress || outfitId === 'outfit_french_blouse') {
      addMesh(
        shoeGroup,
        new THREE.TorusGeometry(0.041, 0.007, 8, 16, Math.PI * 1.1),
        shoeUpperMat,
        [0, 0.032, -0.004],
        [0.2, 0, 0]
      );
      addMesh(
        shoeGroup,
        new THREE.SphereGeometry(0.009, 8, 8),
        brassMat,
        [side * 0.033, 0.032, 0.004]
      );
    }

    return legPivot;
  };

  const leftLeg = createLegGroup(-1);
  const rightLeg = createLegGroup(1);
  bodyGroup.add(leftLeg);
  bodyGroup.add(rightLeg);

  // ==========================================================
  // 2. HARMONIZED ROUNDED CARTOON TORSO, NECK-TO-SHOULDER & BEVELED OUTFITS
  // ==========================================================
  const shoulderHalf = isMale ? 0.122 : 0.112;
  const waistRadius = isMale ? 0.118 : 0.108;
  const hipRadius = isMale ? 0.132 : 0.134;

  const torsoGroup = new THREE.Group();
  bodyGroup.add(torsoGroup);

  // Short cute terracotta neck + smooth trapezius blend into collar (y = 0.712 .. 0.764)
  addMesh(
    torsoGroup,
    sculptClayGeo(new THREE.CylinderGeometry(0.033, 0.036, 0.052, 22), 0.0006),
    skinMat,
    [0, 0.738, -0.008]
  );
  addMesh(
    torsoGroup,
    createSmoothNeckBlendGeo(),
    skinMat,
    [0, 0.722, -0.006],
    undefined,
    [1.16, 0.9, 0.86]
  );

  const frontChestZ = isMale ? 0.088 : 0.081;

  if (isOveralls) {
    // Softly contoured striped shirt upper torso
    addMesh(
      torsoGroup,
      createClayTorsoGeo(shoulderHalf * 0.94, waistRadius * 0.98, hipRadius * 0.96, 0.255),
      shirtMat,
      [0, 0.6, 0],
      undefined,
      [1.02, 1, 0.8]
    );
    // Ribbed crew collar ring at neck base
    addMesh(
      torsoGroup,
      sculptClayGeo(new THREE.TorusGeometry(0.048, 0.011, 10, 24), 0.0006),
      isClayOveralls ? redCuffMat : secondaryMat,
      [0, 0.724, 0.002],
      [Math.PI / 2 + 0.1, 0, 0],
      [1.1, 0.94, 1]
    );

    // Rounded denim overalls pelvis & waist block
    addMesh(
      torsoGroup,
      createClayTorsoGeo(hipRadius * 0.99, hipRadius * 1.02, hipRadius * 0.94, 0.145),
      denimMat,
      [0, 0.422, 0],
      undefined,
      [1.02, 1, 0.8]
    );
    addMesh(
      torsoGroup,
      sculptClayGeo(new THREE.CylinderGeometry(hipRadius * 1.02, hipRadius * 1.02, 0.022, 24), 0.0007),
      denimMat,
      [0, 0.486, 0],
      undefined,
      [1.02, 1, 0.82]
    );
    // Fly stitch & curved hip pocket details
    addMesh(
      torsoGroup,
      new THREE.CapsuleGeometry(0.0038, 0.052, 6, 8),
      denimSeamMat,
      [0, 0.428, hipRadius * 0.81]
    );
    for (const s of [-1, 1]) {
      addMesh(
        torsoGroup,
        new THREE.TorusGeometry(0.036, 0.005, 8, 14, Math.PI * 0.62),
        denimSeamMat,
        [s * 0.105, 0.455, 0.076],
        [0.12, s * 0.55, s * 2.5]
      );
    }

    // Smooth beveled front & back bib panels tucked seamlessly into torso curve
    addMesh(
      torsoGroup,
      createRoundedPanelGeo(0.15, 0.16, 0.036, 0.024, 0.008),
      denimMat,
      [0, 0.562, frontChestZ - 0.001]
    );
    addMesh(
      torsoGroup,
      createRoundedPanelGeo(0.148, 0.14, 0.032, 0.022, 0.007),
      denimMat,
      [0, 0.548, -frontChestZ + 0.004]
    );

    // Centered U-shaped front pocket seated flush on bib
    addMesh(
      torsoGroup,
      createRoundedPanelGeo(0.08, 0.062, 0.016, 0.016, 0.005),
      pocketMat,
      [0, 0.552, frontChestZ + 0.015]
    );
    addMesh(
      torsoGroup,
      new THREE.CylinderGeometry(0.039, 0.039, 0.016, 18, 1, false, Math.PI * 0.5, Math.PI),
      pocketMat,
      [0, 0.528, frontChestZ + 0.015],
      [Math.PI / 2, 0, Math.PI / 2]
    );

    // Contoured denim shoulder straps + tan clay buckles & buttons seated flush
    for (const s of [-1, 1]) {
      addClayStrand(
        torsoGroup,
        [
          [s * 0.058, 0.634, frontChestZ + 0.002],
          [s * 0.066, 0.724, 0.036],
          [s * 0.064, 0.718, -0.036],
          [s * 0.058, 0.614, -frontChestZ + 0.004],
        ],
        0.017,
        denimMat
      );
      addMesh(
        torsoGroup,
        new THREE.TorusGeometry(0.013, 0.004, 8, 14),
        buckleMat,
        [s * 0.058, 0.634, frontChestZ + 0.017],
        [0, 0, 0],
        [1, 1.12, 0.7]
      );
      addMesh(
        torsoGroup,
        new THREE.CylinderGeometry(0.011, 0.011, 0.01, 14),
        buttonMat,
        [s * 0.058, 0.627, frontChestZ + 0.019],
        [Math.PI / 2, 0, 0]
      );
    }
  } else if (isSkirtOutfit) {
    // Inner matching pelvis/bloomer base so sitting never exposes hollow space inside flared skirts
    const innerPelvisMat = isBjdRibbonDress || isSanty || outfitId === 'outfit_french_blouse' ? whiteMat : denimMat;
    addMesh(
      torsoGroup,
      createClayTorsoGeo(hipRadius * 0.92, hipRadius * 0.96, hipRadius * 0.88, 0.12),
      innerPelvisMat,
      [0, 0.415, 0],
      undefined,
      [1.0, 1, 0.8]
    );

    const skirtMat = isBjdRibbonDress
      ? primaryMat
      : outfitId === 'outfit_pastel_atelier' || isSanty || isElfFemale
      ? primaryMat
      : secondaryMat;
    const bodiceMat =
      outfitId === 'outfit_pastel_atelier' || outfitId === 'outfit_french_blouse'
        ? secondaryMat
        : primaryMat;

    // Smooth flared A-line / pleated skirt cone
    addMesh(
      torsoGroup,
      createClayTorsoGeo(waistRadius * 0.94, 0.146, 0.178, 0.215),
      skirtMat,
      [0, 0.428, 0],
      undefined,
      [1.02, 1, 0.86]
    );
    // Rounded upper bodice
    addMesh(
      torsoGroup,
      createClayTorsoGeo(shoulderHalf * 0.93, waistRadius * 0.92, waistRadius * 0.98, 0.215),
      bodiceMat,
      [0, 0.615, 0],
      undefined,
      [1.02, 1, 0.82]
    );

    if (isBjdRibbonDress) {
      addMesh(
        torsoGroup,
        new THREE.TorusGeometry(0.052, 0.012, 10, 22),
        whiteMat,
        [0, 0.718, 0.004],
        [Math.PI / 2 + 0.12, 0, 0]
      );
      addMesh(
        torsoGroup,
        new THREE.TorusGeometry(0.11, 0.012, 10, 24),
        whiteMat,
        [0, 0.518, 0],
        [Math.PI / 2, 0, 0],
        [1.02, 0.84, 1]
      );
      addMesh(
        torsoGroup,
        new THREE.TorusGeometry(0.145, 0.012, 10, 24),
        whiteMat,
        [0, 0.335, 0],
        [Math.PI / 2, 0, 0],
        [1.02, 0.86, 1]
      );
      addClayBow(torsoGroup, clayMat('#E4899D', 0.78), [0, 0.525, frontChestZ + 0.012], 1.08);
    } else if (outfitId === 'outfit_cardigan') {
      // Wrap-around knitted collar + cream inner tee + flush cardigan placket & buttons
      addMesh(
        torsoGroup,
        new THREE.TorusGeometry(0.054, 0.013, 10, 24),
        primaryMat,
        [0, 0.718, 0.002],
        [Math.PI / 2 + 0.12, 0, 0]
      );
      addMesh(
        torsoGroup,
        createRoundedPanelGeo(0.046, 0.142, 0.022, 0.014, 0.005),
        whiteMat,
        [0, 0.635, frontChestZ + 0.004]
      );
      for (const s of [-1, 1]) {
        addMesh(
          torsoGroup,
          createRoundedPanelGeo(0.02, 0.155, 0.02, 0.008, 0.004),
          primaryMat,
          [s * 0.028, 0.628, frontChestZ + 0.006],
          [0, 0, s * 0.08]
        );
      }
      addMesh(
        torsoGroup,
        createRoundedPanelGeo(0.028, 0.09, 0.02, 0.008, 0.004),
        primaryMat,
        [0, 0.558, frontChestZ + 0.006]
      );
      for (const [by, bz] of [
        [0.582, frontChestZ + 0.015],
        [0.542, frontChestZ + 0.016],
      ]) {
        addMesh(torsoGroup, new THREE.CylinderGeometry(0.007, 0.007, 0.006, 12), buckleMat, [0, by, bz], [Math.PI / 2, 0, 0]);
      }
    } else if (outfitId === 'outfit_pastel_atelier') {
      // Cream blouse collar + sage linen pinafore apron bib + contoured back straps
      addMesh(
        torsoGroup,
        new THREE.TorusGeometry(0.05, 0.011, 10, 22),
        secondaryMat,
        [0, 0.72, 0.003],
        [Math.PI / 2 + 0.1, 0, 0]
      );
      for (const s of [-1, 1]) {
        addMesh(
          torsoGroup,
          createRoundedPanelGeo(0.032, 0.024, 0.012, 0.006, 0.003),
          secondaryMat,
          [s * 0.026, 0.706, 0.052],
          [0.32, s * -0.24, s * 0.28]
        );
      }
      addMesh(
        torsoGroup,
        createRoundedPanelGeo(0.138, 0.142, 0.03, 0.02, 0.006),
        primaryMat,
        [0, 0.575, frontChestZ + 0.001]
      );
      for (const s of [-1, 1] as const) {
        addClayStrand(
          torsoGroup,
          [
            [s * 0.052, 0.64, frontChestZ + 0.004],
            [s * 0.062, 0.726, 0.024],
            [s * 0.056, 0.716, -0.04],
            [s * 0.048, 0.525, -frontChestZ - 0.004],
          ],
          0.013,
          primaryMat
        );
        addMesh(
          torsoGroup,
          new THREE.CylinderGeometry(0.0075, 0.0075, 0.007, 12),
          buckleMat,
          [s * 0.052, 0.635, frontChestZ + 0.016],
          [Math.PI / 2, 0, 0]
        );
      }
      addMesh(
        torsoGroup,
        new THREE.TorusGeometry(0.11, 0.014, 10, 24),
        primaryMat,
        [0, 0.515, 0],
        [Math.PI / 2, 0, 0],
        [1.02, 0.84, 1]
      );
    } else if (outfitId === 'outfit_french_blouse') {
      // Cream Peter Pan collar + burgundy satin ribbon bow + center placket + flush pearl buttons
      addMesh(
        torsoGroup,
        new THREE.TorusGeometry(0.054, 0.011, 10, 22),
        secondaryMat,
        [0, 0.718, 0.004],
        [Math.PI / 2 + 0.1, 0, 0]
      );
      for (const s of [-1, 1]) {
        addMesh(
          torsoGroup,
          createRoundedPanelGeo(0.034, 0.024, 0.012, 0.008, 0.003),
          secondaryMat,
          [s * 0.026, 0.704, 0.052],
          [0.34, s * -0.22, s * 0.25]
        );
      }
      addMesh(
        torsoGroup,
        createRoundedPanelGeo(0.022, 0.165, 0.014, 0.006, 0.003),
        secondaryMat,
        [0, 0.6, frontChestZ + 0.004]
      );
      addClayBow(torsoGroup, primaryMat, [0, 0.688, frontChestZ + 0.012], 0.94);
      for (const [by, bz] of [
        [0.64, frontChestZ + 0.012],
        [0.59, frontChestZ + 0.013],
        [0.545, frontChestZ + 0.015],
      ]) {
        addMesh(torsoGroup, new THREE.SphereGeometry(0.0065, 10, 10), whiteMat, [0, by, bz]);
      }
      addMesh(
        torsoGroup,
        new THREE.TorusGeometry(0.11, 0.013, 10, 24),
        primaryMat,
        [0, 0.515, 0],
        [Math.PI / 2, 0, 0],
        [1.02, 0.84, 1]
      );
    } else if (outfitId === 'outfit_fem_trench') {
      // Wrap-around trench collar + inner cream top + lapels + double-breasted buttons + flush belt buckle
      addMesh(
        torsoGroup,
        new THREE.TorusGeometry(0.056, 0.014, 10, 24),
        primaryMat,
        [0, 0.718, 0.0],
        [Math.PI / 2 + 0.1, 0, 0]
      );
      addMesh(
        torsoGroup,
        createRoundedPanelGeo(0.048, 0.165, 0.022, 0.012, 0.004),
        whiteMat,
        [0, 0.625, frontChestZ + 0.003]
      );
      for (const s of [-1, 1]) {
        addMesh(
          torsoGroup,
          createRoundedPanelGeo(0.032, 0.175, 0.022, 0.01, 0.004),
          primaryMat,
          [s * 0.034, 0.625, frontChestZ + 0.008],
          [0, 0, s * 0.12]
        );
      }
      for (const [by, bz] of [
        [0.585, frontChestZ + 0.015],
        [0.545, frontChestZ + 0.016],
      ]) {
        for (const s of [-1, 1]) {
          addMesh(torsoGroup, new THREE.CylinderGeometry(0.0065, 0.0065, 0.006, 12), secondaryMat, [s * 0.022, by, bz], [Math.PI / 2, 0, 0]);
        }
      }
      addMesh(
        torsoGroup,
        new THREE.TorusGeometry(0.11, 0.015, 10, 24),
        secondaryMat,
        [0, 0.518, 0],
        [Math.PI / 2, 0, 0],
        [1.04, 0.86, 1]
      );
      // Belt outer front surface at R * 0.86 + tubeR = 0.1096 -> seat brass buckle cleanly on surface
      addMesh(torsoGroup, createRoundedPanelGeo(0.026, 0.024, 0.012, 0.006, 0.003), brassMat, [0, 0.518, 0.108]);
    } else if (isSanty) {
      // Plush white fur skirt hem, fluffy shoulder capelet, coat trim + flush pom buttons + black belt & flush gold buckle
      addMesh(
        torsoGroup,
        sculptClayGeo(new THREE.TorusGeometry(0.156, 0.022, 12, 26), 0.001),
        whiteMat,
        [0, 0.338, 0],
        [Math.PI / 2, 0, 0],
        [1.03, 0.87, 1]
      );
      addMesh(
        torsoGroup,
        sculptClayGeo(new THREE.CylinderGeometry(0.068, 0.13, 0.066, 24), 0.0009),
        whiteMat,
        [0, 0.695, 0.002],
        undefined,
        [1.06, 1, 0.86]
      );
      addMesh(
        torsoGroup,
        createRoundedPanelGeo(0.032, 0.17, 0.018, 0.01, 0.004),
        whiteMat,
        [0, 0.585, frontChestZ + 0.006]
      );
      addMesh(
        torsoGroup,
        new THREE.TorusGeometry(0.109, 0.016, 10, 24),
        leatherDarkMat,
        [0, 0.516, 0],
        [Math.PI / 2, 0, 0],
        [1.04, 0.86, 1]
      );
      addMesh(torsoGroup, createRoundedPanelGeo(0.03, 0.026, 0.012, 0.006, 0.003), brassMat, [0, 0.516, 0.108]);
      for (const py of [0.625, 0.578]) {
        addMesh(torsoGroup, new THREE.SphereGeometry(0.011, 10, 10), whiteMat, [0, py, frontChestZ + 0.016]);
      }
    } else if (isElfFemale) {
      // Scalloped red-and-gold elf collar + jingle bell + brown belt with flush gold buckle
      addMesh(
        torsoGroup,
        sculptClayGeo(new THREE.CylinderGeometry(0.056, 0.128, 0.062, 12), 0.0008),
        secondaryMat,
        [0, 0.694, 0.002],
        undefined,
        [1.06, 1, 0.86]
      );
      addMesh(torsoGroup, new THREE.SphereGeometry(0.014, 12, 12), brassMat, [0, 0.654, frontChestZ + 0.015]);
      addMesh(
        torsoGroup,
        new THREE.TorusGeometry(0.109, 0.015, 10, 24),
        buckleMat,
        [0, 0.516, 0],
        [Math.PI / 2, 0, 0],
        [1.04, 0.86, 1]
      );
      addMesh(torsoGroup, createRoundedPanelGeo(0.028, 0.024, 0.012, 0.006, 0.003), brassMat, [0, 0.516, 0.107]);
      addMesh(
        torsoGroup,
        new THREE.TorusGeometry(0.156, 0.014, 10, 24),
        secondaryMat,
        [0, 0.338, 0],
        [Math.PI / 2, 0, 0],
        [1.03, 0.87, 1]
      );
    }
  } else {
    addMesh(
      torsoGroup,
      createClayTorsoGeo(waistRadius, hipRadius, hipRadius * 0.94, 0.145),
      denimMat,
      [0, 0.422, 0],
      undefined,
      [1.02, 1, 0.8]
    );
    addMesh(
      torsoGroup,
      createClayTorsoGeo(shoulderHalf * 0.94, waistRadius * 0.98, hipRadius * 0.96, 0.255),
      primaryMat,
      [0, 0.6, 0],
      undefined,
      [1.02, 1, 0.8]
    );

    if (isStarterTank) {
      // Smooth contoured neck & shoulder-wrapping tank straps
      addMesh(torsoGroup, new THREE.CylinderGeometry(0.048, 0.056, 0.048, 22), skinMat, [0, 0.71, 0.012]);
      addMesh(
        torsoGroup,
        new THREE.TorusGeometry(0.056, 0.01, 10, 22),
        primaryMat,
        [0, 0.692, 0.014],
        [Math.PI / 2 + 0.22, 0, 0]
      );
      for (const s of [-1, 1]) {
        addClayStrand(
          torsoGroup,
          [
            [s * 0.064, 0.668, 0.054],
            [s * 0.072, 0.728, 0.008],
            [s * 0.064, 0.668, -0.054],
          ],
          0.015,
          primaryMat
        );
      }
      addMesh(
        torsoGroup,
        new THREE.CylinderGeometry(hipRadius * 1.03, hipRadius * 1.03, 0.024, 24),
        secondaryMat,
        [0, 0.478, 0],
        undefined,
        [1.02, 1, 0.82]
      );
    } else if (isStarterPolo) {
      // Folded polo collar flaps + seamless extended placket + flush buttons
      addMesh(
        torsoGroup,
        new THREE.TorusGeometry(0.052, 0.013, 10, 22),
        primaryMat,
        [0, 0.722, 0.004],
        [Math.PI / 2 + 0.14, 0, 0]
      );
      addMesh(
        torsoGroup,
        createRoundedPanelGeo(0.032, 0.104, 0.016, 0.008, 0.004),
        secondaryMat,
        [0, 0.672, frontChestZ + 0.005]
      );
      for (const s of [-1, 1]) {
        addMesh(
          torsoGroup,
          createRoundedPanelGeo(0.036, 0.024, 0.012, 0.006, 0.003),
          primaryMat,
          [s * 0.025, 0.708, 0.054],
          [0.34, s * -0.25, s * 0.28]
        );
      }
      for (const by of [0.694, 0.664, 0.635]) {
        addMesh(torsoGroup, new THREE.CylinderGeometry(0.006, 0.006, 0.006, 10), whiteMat, [0, by, frontChestZ + 0.014], [Math.PI / 2, 0, 0]);
      }
      addMesh(
        torsoGroup,
        new THREE.CylinderGeometry(hipRadius * 1.02, hipRadius * 1.02, 0.024, 24),
        secondaryMat,
        [0, 0.478, 0],
        undefined,
        [1.02, 1, 0.82]
      );
    } else if (outfitId === 'outfit_hoodie_apron') {
      const apronMat = secondaryMat;
      const apronTrimMat = clayMat('#D6C3A5', 0.8);

      // Front hood collar + sculpted cozy back hood drape
      addMesh(
        torsoGroup,
        new THREE.TorusGeometry(0.078, 0.026, 10, 22),
        primaryMat,
        [0, 0.715, -0.014],
        [Math.PI / 2 + 0.18, 0, 0]
      );
      addMesh(
        torsoGroup,
        sculptClayGeo(new THREE.SphereGeometry(0.072, 18, 14), 0.0009),
        primaryMat,
        [0, 0.706, -0.068],
        [-0.3, 0, 0],
        [1.1, 0.56, 0.9]
      );

      // Contoured front apron bib + pocket
      addMesh(
        torsoGroup,
        createRoundedPanelGeo(0.144, 0.2, 0.028, 0.022, 0.007),
        apronMat,
        [0, 0.562, frontChestZ + 0.002]
      );
      addMesh(
        torsoGroup,
        createRoundedPanelGeo(0.086, 0.056, 0.018, 0.014, 0.005),
        apronTrimMat,
        [0, 0.515, frontChestZ + 0.015]
      );

      // Real apron shoulder straps curving over shoulders and crossing in an X across the back
      const waistX = hipRadius * 0.96 * 1.02;
      const backWaistZ = -(hipRadius * 0.96 * 0.8);
      for (const s of [-1, 1] as const) {
        addClayStrand(
          torsoGroup,
          [
            [s * 0.052, 0.654, frontChestZ + 0.004],
            [s * 0.064, 0.728, 0.028],
            [s * 0.058, 0.716, -0.044],
            [0, 0.612, -frontChestZ - 0.009],
            [-s * 0.074, 0.506, backWaistZ - 0.004],
          ],
          0.0135,
          apronMat
        );
        addMesh(
          torsoGroup,
          new THREE.SphereGeometry(0.009, 10, 10),
          brassMat,
          [s * 0.052, 0.648, frontChestZ + 0.015]
        );
        addClayStrand(
          torsoGroup,
          [
            [s * 0.072, 0.504, frontChestZ + 0.006],
            [s * (waistX + 0.007), 0.504, 0.012],
            [s * (waistX * 0.84), 0.504, backWaistZ * 0.78],
            [0, 0.504, backWaistZ - 0.01],
          ],
          0.012,
          apronMat
        );
      }
      addClayBow(torsoGroup, apronMat, [0, 0.504, backWaistZ - 0.015], 0.96, [0, Math.PI, 0]);
    } else if (outfitId === 'outfit_street_cargo') {
      // Olive overshirt folded collar + inner white tee + dual plackets with buttons + dual chest utility pockets
      addMesh(
        torsoGroup,
        new THREE.TorusGeometry(0.054, 0.013, 10, 22),
        primaryMat,
        [0, 0.72, 0.003],
        [Math.PI / 2 + 0.12, 0, 0]
      );
      for (const s of [-1, 1]) {
        addMesh(
          torsoGroup,
          createRoundedPanelGeo(0.036, 0.024, 0.012, 0.006, 0.003),
          primaryMat,
          [s * 0.028, 0.706, 0.056],
          [0.34, s * -0.24, s * 0.25]
        );
      }
      addMesh(
        torsoGroup,
        createRoundedPanelGeo(0.052, 0.21, 0.022, 0.012, 0.004),
        secondaryMat,
        [0, 0.605, frontChestZ + 0.003]
      );
      for (const s of [-1, 1]) {
        addMesh(
          torsoGroup,
          createRoundedPanelGeo(0.018, 0.205, 0.018, 0.006, 0.003),
          primaryMat,
          [s * 0.028, 0.602, frontChestZ + 0.007]
        );
        addMesh(
          torsoGroup,
          createRoundedPanelGeo(0.048, 0.052, 0.018, 0.01, 0.004),
          clayMat('#495B44', 0.8, 0.006),
          [s * 0.058, 0.61, frontChestZ + 0.011]
        );
        addMesh(
          torsoGroup,
          new THREE.CylinderGeometry(0.0055, 0.0055, 0.006, 10),
          buckleMat,
          [s * 0.058, 0.622, frontChestZ + 0.02],
          [Math.PI / 2, 0, 0]
        );
      }
      for (const [by, bz] of [
        [0.665, frontChestZ + 0.015],
        [0.605, frontChestZ + 0.015],
        [0.545, frontChestZ + 0.017],
      ]) {
        addMesh(torsoGroup, new THREE.CylinderGeometry(0.006, 0.006, 0.006, 10), buckleMat, [0.028, by, bz], [Math.PI / 2, 0, 0]);
      }
    } else if (outfitId === 'outfit_varsity') {
      // Ribbed varsity collar + seamless snap placket + flush snap buttons + hem band
      addMesh(
        torsoGroup,
        new THREE.TorusGeometry(0.054, 0.013, 10, 22),
        secondaryMat,
        [0, 0.72, 0.003],
        [Math.PI / 2 + 0.12, 0, 0]
      );
      addMesh(
        torsoGroup,
        createRoundedPanelGeo(0.036, 0.228, 0.024, 0.012, 0.005),
        secondaryMat,
        [0, 0.604, frontChestZ + 0.005]
      );
      for (const [by, bz] of [
        [0.678, frontChestZ + 0.016],
        [0.632, frontChestZ + 0.016],
        [0.586, frontChestZ + 0.017],
        [0.54, frontChestZ + 0.019],
      ]) {
        addMesh(torsoGroup, new THREE.CylinderGeometry(0.0065, 0.0065, 0.006, 12), brassMat, [0, by, bz], [Math.PI / 2, 0, 0]);
      }
      addMesh(torsoGroup, new THREE.SphereGeometry(0.02, 10, 10), brassMat, [0.056, 0.63, frontChestZ + 0.012]);
      addMesh(
        torsoGroup,
        new THREE.TorusGeometry(0.118, 0.014, 10, 24),
        leatherDarkMat,
        [0, 0.482, 0],
        [Math.PI / 2, 0, 0],
        [1.04, 0.82, 1]
      );
    } else if (outfitId === 'outfit_arch_blazer') {
      // Crisp collared dress shirt + explicit 3D necktie (knot + tapered blade) + continuous blazer collar & notched lapels + buttons
      const tieMat = clayMat('#6E2C36', 0.76, 0.006);
      const lapelMat = clayMat('#343942', 0.8, 0.006);
      // Blazer wrap-around collar behind neck
      addMesh(
        torsoGroup,
        new THREE.TorusGeometry(0.058, 0.014, 10, 24),
        lapelMat,
        [0, 0.718, -0.002],
        [Math.PI / 2 + 0.1, 0, 0]
      );
      // Dress shirt neck stand & angled shirt collar wings
      addMesh(torsoGroup, new THREE.CylinderGeometry(0.048, 0.058, 0.058, 22), secondaryMat, [0, 0.708, 0.002]);
      for (const s of [-1, 1]) {
        addMesh(
          torsoGroup,
          createRoundedPanelGeo(0.032, 0.024, 0.01, 0.005, 0.003),
          secondaryMat,
          [s * 0.022, 0.706, 0.052],
          [0.36, s * -0.22, s * 0.34]
        );
      }
      // White dress shirt front
      addMesh(
        torsoGroup,
        createRoundedPanelGeo(0.052, 0.178, 0.022, 0.012, 0.005),
        secondaryMat,
        [0, 0.608, frontChestZ + 0.003]
      );
      // Explicit 3D Necktie: sculpted knot tucked under shirt collar + tapered blade resting flush on shirt front
      addMesh(
        torsoGroup,
        createRoundedPanelGeo(0.022, 0.022, 0.014, 0.007, 0.004),
        tieMat,
        [0, 0.692, frontChestZ - 0.009],
        [-0.22, 0, 0]
      );
      const tieShape = new THREE.Shape();
      tieShape.moveTo(-0.008, 0.058);
      tieShape.lineTo(0.008, 0.058);
      tieShape.lineTo(0.015, -0.038);
      tieShape.lineTo(0, -0.062);
      tieShape.lineTo(-0.015, -0.038);
      tieShape.closePath();
      const tieGeo = new THREE.ExtrudeGeometry(tieShape, {
        depth: 0.008,
        bevelEnabled: true,
        bevelThickness: 0.0025,
        bevelSize: 0.0025,
        bevelSegments: 2,
      });
      tieGeo.center();
      tieGeo.computeVertexNormals();
      addMesh(torsoGroup, sculptClayGeo(tieGeo, 0.0004), tieMat, [0, 0.625, frontChestZ + 0.016]);
      // Notched blazer lapels framing shirt & tie seamlessly
      for (const s of [-1, 1]) {
        addMesh(
          torsoGroup,
          createRoundedPanelGeo(0.026, 0.172, 0.02, 0.008, 0.004),
          lapelMat,
          [s * 0.034, 0.622, frontChestZ + 0.008],
          [0, 0, s * 0.1]
        );
      }
      // Flush blazer closure buttons
      for (const [by, bz] of [
        [0.562, frontChestZ + 0.016],
        [0.522, frontChestZ + 0.018],
      ]) {
        addMesh(torsoGroup, new THREE.CylinderGeometry(0.007, 0.007, 0.006, 12), leatherDarkMat, [0, by, bz], [Math.PI / 2, 0, 0]);
      }
    } else if (outfitId === 'outfit_male_trench') {
      // Minimalist camel long trench coat + wrap collar + charcoal turtleneck + double-breasted buttons + flush belt buckle
      addMesh(
        torsoGroup,
        new THREE.TorusGeometry(0.058, 0.014, 10, 24),
        primaryMat,
        [0, 0.718, -0.002],
        [Math.PI / 2 + 0.1, 0, 0]
      );
      addMesh(torsoGroup, new THREE.CylinderGeometry(0.05, 0.062, 0.06, 20), secondaryMat, [0, 0.708, 0]);
      addMesh(
        torsoGroup,
        createRoundedPanelGeo(0.05, 0.18, 0.022, 0.012, 0.005),
        secondaryMat,
        [0, 0.608, frontChestZ + 0.004]
      );
      for (const s of [-1, 1]) {
        addMesh(
          torsoGroup,
          createRoundedPanelGeo(0.028, 0.172, 0.02, 0.008, 0.004),
          primaryMat,
          [s * 0.034, 0.62, frontChestZ + 0.008],
          [0, 0, s * 0.1]
        );
      }
      for (const [by, bz] of [
        [0.585, frontChestZ + 0.015],
        [0.548, frontChestZ + 0.017],
      ]) {
        for (const s of [-1, 1]) {
          addMesh(torsoGroup, new THREE.CylinderGeometry(0.0065, 0.0065, 0.006, 12), clayMat('#6A4D33', 0.8), [s * 0.022, by, bz], [Math.PI / 2, 0, 0]);
        }
      }
      addMesh(
        torsoGroup,
        createClayTorsoGeo(hipRadius * 0.98, hipRadius * 1.12, hipRadius * 1.24, 0.155),
        primaryMat,
        [0, 0.435, 0],
        undefined,
        [1.04, 1, 0.85]
      );
      addMesh(
        torsoGroup,
        new THREE.TorusGeometry(0.118, 0.014, 10, 24),
        clayMat('#916D48', 0.8, 0.006),
        [0, 0.515, 0],
        [Math.PI / 2, 0, 0],
        [1.04, 0.85, 1]
      );
      addMesh(torsoGroup, createRoundedPanelGeo(0.026, 0.022, 0.012, 0.005, 0.003), brassMat, [0, 0.515, 0.113]);
    } else if (outfitId === 'outfit_ny_party') {
      // Tailored unisex New Year midnight navy long coat + wrap champagne lapels + crisp shirt collar & bowtie + flush buttons
      addMesh(
        torsoGroup,
        new THREE.TorusGeometry(0.056, 0.013, 10, 24),
        secondaryMat,
        [0, 0.718, -0.002],
        [Math.PI / 2 + 0.1, 0, 0]
      );
      addMesh(
        torsoGroup,
        createClayTorsoGeo(hipRadius * 0.98, hipRadius * 1.12, hipRadius * 1.22, 0.155),
        primaryMat,
        [0, 0.435, 0],
        undefined,
        [1.04, 1, 0.85]
      );
      addMesh(torsoGroup, new THREE.CylinderGeometry(0.048, 0.058, 0.054, 20), whiteMat, [0, 0.708, 0.002]);
      addMesh(
        torsoGroup,
        createRoundedPanelGeo(0.048, 0.175, 0.022, 0.012, 0.005),
        whiteMat,
        [0, 0.612, frontChestZ + 0.004]
      );
      addClayBow(torsoGroup, primaryMat, [0, 0.688, frontChestZ + 0.008], 0.84);
      for (const s of [-1, 1]) {
        addMesh(
          torsoGroup,
          createRoundedPanelGeo(0.022, 0.175, 0.022, 0.008, 0.004),
          secondaryMat,
          [s * 0.032, 0.618, frontChestZ + 0.008],
          [0, 0, s * 0.08]
        );
      }
      for (const [by, bz] of [
        [0.562, frontChestZ + 0.015],
        [0.512, frontChestZ + 0.018],
      ]) {
        for (const s of [-1, 1]) {
          addMesh(torsoGroup, new THREE.CylinderGeometry(0.007, 0.007, 0.006, 10), secondaryMat, [s * 0.024, by, bz], [Math.PI / 2, 0, 0]);
        }
      }
    } else if (outfitId === 'outfit_xmas_knit') {
      addMesh(
        torsoGroup,
        new THREE.TorusGeometry(0.112, 0.02, 10, 24),
        whiteMat,
        [0, 0.485, 0],
        [Math.PI / 2, 0, 0],
        [1.02, 0.82, 1]
      );
      addMesh(
        torsoGroup,
        new THREE.TorusGeometry(0.082, 0.026, 10, 24),
        secondaryMat,
        [0, 0.71, 0.004],
        [Math.PI / 2 + 0.15, 0, 0]
      );
      // Scarf tail rooted cleanly inside scarf ring
      addMesh(
        torsoGroup,
        new THREE.CapsuleGeometry(0.022, 0.105, 6, 10),
        secondaryMat,
        [0.044, 0.635, frontChestZ + 0.014],
        [0.14, 0, -0.16]
      );
    } else if (isSanta) {
      // Classic Male Santa crimson velvet coat + plush white fur trim + flush buttons + black belt & flush gold buckle
      addMesh(
        torsoGroup,
        createClayTorsoGeo(hipRadius * 1.0, hipRadius * 1.12, hipRadius * 1.2, 0.15),
        primaryMat,
        [0, 0.435, 0],
        undefined,
        [1.04, 1, 0.85]
      );
      addMesh(
        torsoGroup,
        sculptClayGeo(new THREE.TorusGeometry(0.145, 0.02, 10, 24), 0.0009),
        whiteMat,
        [0, 0.365, 0],
        [Math.PI / 2, 0, 0],
        [1.04, 0.85, 1]
      );
      addMesh(
        torsoGroup,
        sculptClayGeo(new THREE.TorusGeometry(0.072, 0.024, 10, 24), 0.0009),
        whiteMat,
        [0, 0.716, 0.004],
        [Math.PI / 2 + 0.14, 0, 0]
      );
      addMesh(
        torsoGroup,
        createRoundedPanelGeo(0.036, 0.25, 0.02, 0.014, 0.005),
        whiteMat,
        [0, 0.56, frontChestZ + 0.006]
      );
      for (const py of [0.642, 0.588]) {
        addMesh(torsoGroup, new THREE.SphereGeometry(0.01, 10, 10), leatherDarkMat, [0, py, frontChestZ + 0.016]);
      }
      addMesh(
        torsoGroup,
        new THREE.TorusGeometry(0.118, 0.018, 10, 24),
        leatherDarkMat,
        [0, 0.515, 0],
        [Math.PI / 2, 0, 0],
        [1.05, 0.86, 1]
      );
      addMesh(torsoGroup, createRoundedPanelGeo(0.032, 0.028, 0.012, 0.006, 0.003), brassMat, [0, 0.515, 0.118]);
    } else if (isElfMale) {
      // Male Christmas Elf green tunic + scalloped red collar + brown belt & flush gold buckle
      addMesh(
        torsoGroup,
        createClayTorsoGeo(hipRadius * 0.98, hipRadius * 1.14, hipRadius * 1.22, 0.135),
        primaryMat,
        [0, 0.438, 0],
        undefined,
        [1.03, 1, 0.84]
      );
      addMesh(
        torsoGroup,
        sculptClayGeo(new THREE.CylinderGeometry(0.056, 0.13, 0.064, 12), 0.0008),
        secondaryMat,
        [0, 0.694, 0.002],
        undefined,
        [1.08, 1, 0.86]
      );
      addMesh(torsoGroup, new THREE.SphereGeometry(0.014, 12, 12), brassMat, [0, 0.654, frontChestZ + 0.015]);
      addMesh(
        torsoGroup,
        new THREE.TorusGeometry(0.118, 0.016, 10, 24),
        buckleMat,
        [0, 0.515, 0],
        [Math.PI / 2, 0, 0],
        [1.04, 0.85, 1]
      );
      addMesh(torsoGroup, createRoundedPanelGeo(0.028, 0.024, 0.012, 0.006, 0.003), brassMat, [0, 0.515, 0.115]);
      addMesh(
        torsoGroup,
        new THREE.TorusGeometry(0.145, 0.014, 10, 24),
        secondaryMat,
        [0, 0.375, 0],
        [Math.PI / 2, 0, 0],
        [1.03, 0.85, 1]
      );
    }
  }

  // ==========================================================
  // 3. PROPORTIONED SMOOTH ARMS, CUFFS & CARTOON-CLAY HANDS
  // ==========================================================
  const isShortSleeveOutfit =
    isStarterPolo || isBjdRibbonDress || outfitId === 'outfit_french_blouse';

  const sleeveMat = isStarterTank
    ? skinMat
    : isClayOveralls
    ? shirtMat
    : outfitId === 'outfit_varsity' ||
      outfitId === 'outfit_overalls' ||
      outfitId === 'outfit_pastel_atelier' ||
      outfitId === 'outfit_french_blouse'
    ? secondaryMat
    : primaryMat;

  const lowerArmMat = isShortSleeveOutfit ? skinMat : sleeveMat;

  const armRTop = isStarterTank ? 0.032 : 0.038;
  const armRMid = isStarterTank ? 0.031 : isShortSleeveOutfit ? 0.032 : 0.039;
  const armRBot = isStarterTank || isShortSleeveOutfit ? 0.028 : 0.036;
  const shoulderBulbGeo = sculptClayGeo(new THREE.SphereGeometry(armRTop + 0.004, 18, 14), 0.0006);
  const upperSleeveGeo = createSmoothSleeveGeo(armRTop, armRMid, armRMid * 0.96, 0.118);
  const elbowBulbGeo = sculptClayGeo(new THREE.SphereGeometry(armRMid * 0.95, 16, 12), 0.0005);
  const lowerSleeveGeo = createSmoothSleeveGeo(armRMid * 0.95, armRMid * 0.94, armRBot, 0.1);
  const wristCuffGeo = sculptClayGeo(new THREE.TorusGeometry(0.034, 0.0095, 10, 22), 0.0005);
  const palmGeo = sculptClayGeo(new THREE.SphereGeometry(0.031, 16, 14), 0.0005);
  const fingerGeo = sculptClayGeo(new THREE.CapsuleGeometry(0.0072, 0.02, 6, 8), 0.0004);
  const thumbGeo = sculptClayGeo(new THREE.CapsuleGeometry(0.008, 0.017, 6, 8), 0.0004);

  const buildArm = (side: -1 | 1): { arm: THREE.Group; forearm: THREE.Group } => {
    const arm = new THREE.Group();
    arm.position.set(side * (shoulderHalf + 0.006), 0.665, 0.004);

    addMesh(arm, shoulderBulbGeo, sleeveMat, [0, 0, 0]);
    addMesh(
      arm,
      upperSleeveGeo,
      sleeveMat,
      [side * 0.01, -0.056, 0.004],
      [-0.04, 0, side * 0.12]
    );
    if (isShortSleeveOutfit) {
      addMesh(
        arm,
        sculptClayGeo(new THREE.TorusGeometry(0.035, 0.0085, 10, 20), 0.0005),
        sleeveMat,
        [side * 0.017, -0.104, 0.006],
        [Math.PI / 2 - 0.04, side * 0.12, 0]
      );
    }

    // Articulated elbow joint pivot
    const forearm = new THREE.Group();
    forearm.position.set(side * 0.018, -0.112, 0.006);
    arm.add(forearm);

    addMesh(forearm, elbowBulbGeo, lowerArmMat, [0, 0, 0]);
    addMesh(
      forearm,
      lowerSleeveGeo,
      lowerArmMat,
      [side * 0.009, -0.046, 0.004],
      [-0.06, 0, side * 0.12]
    );

    if (isClayOveralls) {
      addMesh(
        forearm,
        wristCuffGeo,
        redCuffMat,
        [side * 0.016, -0.092, 0.01],
        [Math.PI / 2 - 0.06, side * 0.12, 0]
      );
    } else if (isSanta || isSanty) {
      addMesh(
        forearm,
        wristCuffGeo,
        whiteMat,
        [side * 0.016, -0.092, 0.01],
        [Math.PI / 2 - 0.06, side * 0.12, 0]
      );
    } else if (isElfMale || isElfFemale) {
      addMesh(
        forearm,
        wristCuffGeo,
        secondaryMat,
        [side * 0.016, -0.092, 0.01],
        [Math.PI / 2 - 0.06, side * 0.12, 0]
      );
    }

    const hand = new THREE.Group();
    hand.position.set(side * 0.018, -0.124, 0.014);
    hand.rotation.set(-0.06, 0, side * 0.08);
    forearm.add(hand);

    addMesh(hand, palmGeo, skinMat, [0, 0, 0], undefined, [0.78, 1.05, 0.92]);
    addMesh(
      hand,
      thumbGeo,
      skinMat,
      [side * -0.019, -0.01, 0.024],
      [0.32, 0, side * -0.26]
    );
    for (let f = 0; f < 4; f++) {
      const zOff = 0.015 - f * 0.01;
      const lenScale = f === 1 || f === 2 ? 1.05 : 0.88;
      addMesh(
        hand,
        fingerGeo,
        skinMat,
        [side * -0.004, -0.031, zOff],
        [0, 0, side * -0.22],
        [1, lenScale, 1]
      );
    }

    return { arm, forearm };
  };

  const { arm: leftArm, forearm: leftForearm } = buildArm(-1);
  const { arm: rightArm, forearm: rightForearm } = buildArm(1);
  bodyGroup.add(leftArm);
  bodyGroup.add(rightArm);

  // Natural per-object bent left arm pose whenever holding a hand prop (coffee, brush, sketchbook, etc.)
  const hasUserHandItem = config.handItemId !== 'hand_none';
  const handHoldPose = getHandHoldPose(config.handItemId);
  if (hasUserHandItem) {
    leftArm.rotation.set(handHoldPose.armX, 0, handHoldPose.armZ);
    leftForearm.rotation.set(handHoldPose.forearmX, handHoldPose.forearmY, handHoldPose.forearmZ);
  }

  // ==========================================================
  // 4. CARTOON-CLAY HAND PROPS (LEFT HAND) + ACTIVITY PROPS (RIGHT HAND)
  // ==========================================================
  const propGroup = new THREE.Group();
  propGroup.position.set(-0.018, -0.13, 0.02);
  if (config.handItemId === 'hand_brush') {
    // Collinear paintbrush held naturally upward across left palm & curled fingers
    const brushGroup = new THREE.Group();
    brushGroup.position.set(0.006, -0.002, 0.02);
    brushGroup.rotation.set(0.92, 0, 0.24);
    // Rounded wood handle tail cap + tapered wooden shaft
    addMesh(brushGroup, new THREE.SphereGeometry(0.0075, 10, 10), clayMat(0xc58f5b, 0.76), [0, -0.077, 0]);
    addMesh(brushGroup, new THREE.CylinderGeometry(0.0105, 0.0075, 0.175, 16), clayMat(0xc58f5b, 0.76), [0, 0.01, 0]);
    // Metallic ferrule overlapping handle top seamlessly
    addMesh(brushGroup, new THREE.CylinderGeometry(0.0124, 0.0106, 0.034, 16), clayMat(0xcbd5e1, 0.56), [0, 0.112, 0]);
    // Sculpted belly + pointed bristle tip sitting flush inside ferrule
    addMesh(brushGroup, new THREE.SphereGeometry(0.0126, 14, 12), clayMat(0xc95443, 0.76), [0, 0.131, 0]);
    addMesh(brushGroup, new THREE.ConeGeometry(0.0126, 0.036, 16), clayMat(0xc95443, 0.76), [0, 0.149, 0]);
    propGroup.add(brushGroup);
  } else if (config.handItemId === 'hand_sketchbook') {
    // Sketchbook cradled comfortably against left forearm & palm
    const bookGroup = new THREE.Group();
    bookGroup.position.set(0.014, 0.004, 0.036);
    bookGroup.rotation.set(0.88, 0.24, -0.24);
    addMesh(bookGroup, createRoundedPanelGeo(0.125, 0.155, 0.024, 0.012, 0.004), clayMat(0xc95443, 0.8), [0, 0, 0]);
    addMesh(bookGroup, createRoundedPanelGeo(0.106, 0.136, 0.016, 0.008, 0.003), whiteMat, [-0.004, 0, 0.008]);
    propGroup.add(bookGroup);
  } else if (config.handItemId === 'hand_stylus') {
    // Drawing tablet held angled toward viewer/artist in left hand
    const tabGroup = new THREE.Group();
    tabGroup.position.set(0.016, 0.006, 0.042);
    tabGroup.rotation.set(0.76, 0.2, -0.2);
    addMesh(tabGroup, createRoundedPanelGeo(0.145, 0.104, 0.016, 0.012, 0.004), clayMat(0x2d333d, 0.7), [0, 0, 0]);
    addMesh(
      tabGroup,
      createRoundedPanelGeo(0.116, 0.076, 0.008, 0.006, 0.002),
      new THREE.MeshStandardMaterial({
        color: 0x93c5fd,
        emissive: 0x3b82f6,
        emissiveIntensity: 0.3,
        roughness: 0.35,
      }),
      [0, 0.004, 0.008]
    );
    propGroup.add(tabGroup);
  } else if (config.handItemId === 'hand_coffee') {
    // Upright level coffee cup wrapped snugly in left fingers & thumb
    const coffeeGroup = new THREE.Group();
    coffeeGroup.position.set(0.012, -0.006, 0.026);
    coffeeGroup.rotation.set(1.36, 0, -0.15);
    addMesh(coffeeGroup, new THREE.CylinderGeometry(0.038, 0.03, 0.086, 18), clayMat(0xf5efe6, 0.76), [0, 0, 0]);
    addMesh(coffeeGroup, new THREE.CylinderGeometry(0.04, 0.039, 0.028, 18), clayMat(0x8c5e3c, 0.8), [0, -0.006, 0]);
    addMesh(coffeeGroup, new THREE.CylinderGeometry(0.041, 0.041, 0.015, 18), whiteMat, [0, 0.044, 0]);
    propGroup.add(coffeeGroup);
  } else if (config.handItemId === 'hand_camera') {
    // Camera held upright & aiming forward at chest height
    const camGroup = new THREE.Group();
    camGroup.position.set(0.012, 0.004, 0.038);
    camGroup.rotation.set(1.52, 0.14, -0.14);
    addMesh(camGroup, createRoundedPanelGeo(0.1, 0.068, 0.05, 0.012, 0.006), clayMat(0x28313d, 0.72), [0, 0, 0]);
    addMesh(camGroup, new THREE.CylinderGeometry(0.023, 0.023, 0.034, 16), clayMat(0x475569, 0.62), [0, 0, 0.032], [Math.PI / 2, 0, 0]);
    propGroup.add(camGroup);
  } else if (config.handItemId === 'hand_xmas_gift') {
    // Gift box supported comfortably from underneath by left palm
    const giftGroup = new THREE.Group();
    giftGroup.position.set(0.012, 0.004, 0.056);
    giftGroup.rotation.set(1.24, 0.18, -0.15);
    const giftRed = clayMat(0xd13b47, 0.78);
    const ribbonGold = clayMat(0xe5b842, 0.7);
    addMesh(giftGroup, createRoundedPanelGeo(0.102, 0.094, 0.102, 0.014, 0.006), giftRed, [0, 0, 0]);
    addMesh(giftGroup, createRoundedPanelGeo(0.106, 0.098, 0.022, 0.006, 0.003), ribbonGold, [0, 0, 0]);
    addMesh(giftGroup, createRoundedPanelGeo(0.022, 0.098, 0.106, 0.006, 0.003), ribbonGold, [0, 0, 0]);
    propGroup.add(giftGroup);
  }
  leftForearm.add(propGroup);

  // Activity-only Terracotta Watering Can
  const wateringCanGroup = new THREE.Group();
  wateringCanGroup.position.set(0.018, -0.13, 0.028);
  wateringCanGroup.visible = false;
  const canMat = clayMat(0x3a8f63, 0.78);
  addMesh(wateringCanGroup, new THREE.CylinderGeometry(0.042, 0.048, 0.084, 16), canMat, [0, 0.02, 0.03]);
  addMesh(wateringCanGroup, new THREE.CylinderGeometry(0.01, 0.014, 0.094, 10), canMat, [0, 0.04, 0.094], [1.1, 0, 0]);
  addMesh(wateringCanGroup, new THREE.ConeGeometry(0.02, 0.022, 12), brassMat, [0, 0.062, 0.144], [-1.1, 0, 0]);
  addMesh(wateringCanGroup, new THREE.TorusGeometry(0.03, 0.0075, 8, 16, Math.PI), canMat, [0, 0.026, -0.02], [0, Math.PI / 2, 0]);
  rightForearm.add(wateringCanGroup);

  // Activity-only Clay Stylus / Sculpting Tool
  const sketchPencilGroup = new THREE.Group();
  sketchPencilGroup.position.set(0.018, -0.13, 0.022);
  sketchPencilGroup.visible = false;
  const pencilSub = new THREE.Group();
  pencilSub.position.set(0.006, 0.02, 0.028);
  pencilSub.rotation.set(0.65, 0, -0.2);
  addMesh(pencilSub, new THREE.CylinderGeometry(0.0085, 0.0085, 0.14, 10), clayMat(0xc57d52, 0.78), [0, 0, 0]);
  addMesh(pencilSub, new THREE.ConeGeometry(0.0095, 0.026, 10), clayMat(0x5e4235, 0.76), [0, 0.082, 0]);
  sketchPencilGroup.add(pencilSub);
  rightForearm.add(sketchPencilGroup);

  // ==========================================================
  // 5. EXTRA-ROUNDED CUTE TERRACOTTA CARTOON HEAD, EARS, ROUND NOSE & FACE
  // ==========================================================
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.734, 0);
  bodyGroup.add(headGroup);

  const hcY = 0.128;

  addMesh(headGroup, createSculptedHeadGeo(isMale), skinMat, [0, hcY, 0]);

  const headSurfacePos = (ux: number, uy: number, zPush = 0): [number, number, number] => {
    const uz = Math.sqrt(Math.max(0.0001, 1 - ux * ux - uy * uy));
    const [sx, sy, sz] = evalSculptedHeadPoint(ux, uy, uz, isMale);
    return [sx, hcY + sy, sz + zPush];
  };

  // Cute round C-ears tucked nicely on the sides
  for (const s of [-1, 1]) {
    const ear = new THREE.Group();
    ear.position.set(s * (isMale ? 0.128 : 0.125), hcY - 0.014, -0.012);
    ear.rotation.set(0, s * -0.18, s * -0.06);
    addMesh(ear, new THREE.SphereGeometry(0.025, 16, 14), skinMat, [0, 0, 0], undefined, [0.64, 0.96, 0.62]);
    addMesh(ear, new THREE.SphereGeometry(0.0145, 12, 10), earInnerMat, [s * 0.004, -0.001, 0.005], undefined, [0.48, 0.82, 0.44]);
    headGroup.add(ear);
  }

  // Adorable round curved terracotta-clay nose button (matches IMG_1797)
  const [noseTipX, noseTipY, noseTipZ] = headSurfacePos(0, -0.145, 0.004);
  addMesh(
    headGroup,
    sculptClayGeo(new THREE.SphereGeometry(0.0148, 22, 18), 0.0004),
    noseMat,
    [noseTipX, noseTipY, noseTipZ],
    [0.16, 0, 0],
    [0.86, 1.12, 0.96]
  );

  // 5b. Short Rounded Cartoon Eyebrows sitting neatly above eyes
  for (const s of [-1, 1]) {
    const browR = isMale ? 0.0054 : 0.0044;
    const [bx, by, bz] = headSurfacePos(s * 0.34, 0.2, 0.0024);
    if (eyebrowStyle === 'straight') {
      addMesh(
        headGroup,
        new THREE.CapsuleGeometry(browR, 0.021, 6, 10),
        browMat,
        [bx, by, bz],
        [0, s * -0.24, Math.PI / 2 + s * (eyeStyle === 'sharp' ? 0.16 : 0.03)]
      );
    } else if (eyebrowStyle === 'arched') {
      addMesh(
        headGroup,
        new THREE.CapsuleGeometry(browR, 0.02, 6, 10),
        browMat,
        [bx, by + 0.002, bz],
        [0, s * -0.24, Math.PI / 2 + s * 0.2]
      );
    } else {
      addMesh(
        headGroup,
        new THREE.TorusGeometry(0.016, browR, 8, 14, Math.PI * 0.64),
        browMat,
        [bx, by - 0.009, bz - 0.001],
        [0, s * -0.24, 0.54]
      );
    }
  }

  // 5c. Adorable Cartoon-Clay Vertical Pill Eyes (matching poster style)
  if (eyeStyle === 'chill') {
    for (const s of [-1, 1]) {
      const [ex, ey, ez] = headSurfacePos(s * 0.35, -0.02, 0.0025);
      addMesh(
        headGroup,
        new THREE.TorusGeometry(0.0145, 0.0038, 8, 16, Math.PI * 0.9),
        browMat,
        [ex, ey - 0.003, ez],
        [0.08, s * -0.24, 0.14]
      );
    }
  } else {
    for (const s of [-1, 1]) {
      const [ex, ey, ez] = headSurfacePos(s * 0.35, -0.02, 0.0012);
      const eyeGroup = new THREE.Group();
      eyeGroup.position.set(ex, ey, ez);
      eyeGroup.rotation.set(0.04, s * 0.24, 0);
      headGroup.add(eyeGroup);

      const isSharp = eyeStyle === 'sharp';
      const isSparkle = eyeStyle === 'sparkle';

      // Smooth rounded vertical-pill dark cartoon eyes
      addMesh(
        eyeGroup,
        new THREE.SphereGeometry(0.0132, 18, 16),
        eyeMat,
        [0, 0, 0],
        undefined,
        [isSparkle ? 0.84 : 0.78, isSparkle ? 1.28 : isSharp ? 1.04 : 1.22, 0.46]
      );

      if (isSparkle) {
        addMesh(
          eyeGroup,
          new THREE.SphereGeometry(0.0038, 8, 8),
          whiteMat,
          [s * -0.0032, 0.0052, 0.0056]
        );
        addMesh(
          eyeGroup,
          new THREE.SphereGeometry(0.0021, 8, 8),
          whiteMat,
          [s * 0.0026, -0.0044, 0.0056]
        );
      }

      if (isSharp) {
        addMesh(
          eyeGroup,
          new THREE.TorusGeometry(0.0138, 0.0032, 8, 16, Math.PI * 0.86),
          browMat,
          [0, 0.004, 0.0022],
          [0.08, 0, s * -0.14 + 0.22]
        );
      }
    }
  }

  // 5d. Soft Blended Cheek Blush on rounded cartoon cheeks
  if (blushStyle !== 'none') {
    const blushInfo = BLUSH_STYLES.find((b) => b.id === blushStyle) ?? BLUSH_STYLES[0];
    const blendedBlush = new THREE.Color(skinHex).lerp(new THREE.Color(blushInfo.hex), 0.32);
    const cheekMat = clayMat(blendedBlush.getHex(), 0.82, 0.004);
    for (const s of [-1, 1]) {
      const [cx, cy, cz] = headSurfacePos(s * 0.56, -0.22, -0.001);
      addMesh(
        headGroup,
        new THREE.SphereGeometry(0.02, 14, 12),
        cheekMat,
        [cx, cy, cz],
        [0, s * 0.48, 0],
        [1.15, 0.72, 0.16]
      );
    }
  }

  // 5e. Cute Curved Cartoon Smile aligned to rounded lower face
  const [, mouthY, mouthZ] = headSurfacePos(0, -0.45, 0.0012);
  if (mouthStyle === 'smile') {
    addMesh(
      headGroup,
      new THREE.TorusGeometry(0.0125, 0.0027, 8, 16, Math.PI * 0.82),
      browMat,
      [0, mouthY + 0.005, mouthZ],
      [Math.PI, 0, -Math.PI * 0.09]
    );
  } else if (mouthStyle === 'cat') {
    addMesh(
      headGroup,
      new THREE.TorusGeometry(0.007, 0.0025, 8, 12, Math.PI),
      browMat,
      [-0.007, mouthY + 0.002, mouthZ],
      [Math.PI, 0, 0]
    );
    addMesh(
      headGroup,
      new THREE.TorusGeometry(0.007, 0.0025, 8, 12, Math.PI),
      browMat,
      [0.007, mouthY + 0.002, mouthZ],
      [Math.PI, 0, 0]
    );
  } else if (mouthStyle === 'grin') {
    addMesh(
      headGroup,
      new THREE.SphereGeometry(0.015, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
      lipMat,
      [0, mouthY + 0.003, mouthZ - 0.001],
      [Math.PI, 0, 0],
      [1.14, 0.84, 0.36]
    );
    addMesh(
      headGroup,
      new THREE.BoxGeometry(0.019, 0.0046, 0.006),
      whiteMat,
      [0, mouthY + 0.001, mouthZ + 0.0025]
    );
  } else {
    addMesh(
      headGroup,
      new THREE.CapsuleGeometry(0.0026, 0.016, 6, 10),
      browMat,
      [0, mouthY, mouthZ],
      [0, 0, Math.PI / 2]
    );
  }

  // ==========================================================
  // 6. SOFT FLUFFY TERRACOTTA-CLAY HAIR (Seamless crown joints + 12 styles)
  // ==========================================================
  const isBeretHat =
    config.headwearId === 'head_beret_pink' || config.headwearId === 'head_beret_navy';
  const isFullDomeHat =
    config.headwearId === 'head_santa_hat' ||
    config.headwearId === 'head_beanie_mustard' ||
    config.headwearId === 'head_cap_cobalt';
  const hasCrownHat = isFullDomeHat || isBeretHat;
  const crownTuckY = hasCrownHat ? -0.016 : 0;
  const crownScaleY = hasCrownHat ? 0.86 : 0.955;
  // Primary upper skull hair cap (slightly tucked under full hats like Santa hat)
  addMesh(
    headGroup,
    sculptClayGeo(
      new THREE.SphereGeometry(0.133, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.54),
      0.001
    ),
    hairMat,
    [0, hcY + 0.016 + crownTuckY, -0.01],
    [-0.22, 0, 0],
    [isMale ? 1.035 : 1.015, crownScaleY, 0.99]
  );

  // Seamless upper-crown / frontal hairline blend cushion so bangs & top styles flow smoothly out of the cap
  addMesh(
    headGroup,
    sculptClayGeo(new THREE.SphereGeometry(0.121, 28, 20), 0.0009),
    hairMat,
    [0, hcY + 0.064 + crownTuckY, 0.002],
    [0.14, 0, 0],
    [isMale ? 1.02 : 1.0, isFullDomeHat ? 0.62 : 0.72, 0.9]
  );

  // Back skull volume recessed cleanly behind cheeks & ears
  addMesh(
    headGroup,
    sculptClayGeo(new THREE.SphereGeometry(0.126, 26, 20), 0.001),
    hairMat,
    [0, hcY - 0.006, -0.036],
    undefined,
    [isMale ? 1.04 : 1.02, 0.955, 0.89]
  );

  // Smooth temple bridge + slim tapered sideburns cleanly in front of ears
  for (const s of [-1, 1]) {
    addMesh(
      headGroup,
      sculptClayGeo(new THREE.SphereGeometry(0.024, 14, 12), 0.0007),
      hairMat,
      [s * 0.114, hcY + 0.044, -0.002],
      undefined,
      [0.68, 1.15, 1.05]
    );
    addTaperedClayStrand(
      headGroup,
      [
        [s * 0.118, hcY + 0.052, 0.002],
        [s * 0.122, hcY + 0.018, 0.008],
        [s * 0.115, hcY - 0.014, 0.01],
      ],
      0.016,
      0.0065,
      hairMat,
      10
    );
  }

  // Helper for smooth crown-blended bangs (starts deep inside crown cushion & wraps along forehead)
  const addBangLock = (
    points: [number, number, number][],
    rStart = 0.021,
    rEnd = 0.008
  ) => {
    addTaperedClayStrand(headGroup, points, rStart, rEnd, hairMat, 16);
  };

  // Natural sculpted front bangs & crown styling tailored to hairstyle (always cleanly above brows)
  if (config.hairStyleId === 'side_part') {
    // Fluffy parted bangs matching IMG_1797's signature style with smooth crown bridge
    addMesh(
      headGroup,
      sculptClayGeo(new THREE.SphereGeometry(0.078, 20, 16), 0.0009),
      hairMat,
      [0.024, hcY + 0.104, 0.006],
      [0.08, 0, -0.15],
      [1.12, 0.58, 1.0]
    );
    addMesh(
      headGroup,
      sculptClayGeo(new THREE.SphereGeometry(0.068, 20, 16), 0.0009),
      hairMat,
      [-0.052, hcY + 0.095, 0.014],
      [0.08, 0, 0.2],
      [1.04, 0.6, 0.96]
    );
    for (const s of [-1, 1]) {
      addBangLock(
        [
          [s * 0.004, hcY + 0.118, 0.032],
          [s * 0.028, hcY + 0.105, 0.076],
          [s * 0.058, hcY + 0.084, 0.092],
          [s * 0.088, hcY + 0.054, 0.086],
        ],
        0.024,
        0.008
      );
      addBangLock(
        [
          [s * 0.026, hcY + 0.11, 0.034],
          [s * 0.058, hcY + 0.092, 0.076],
          [s * 0.086, hcY + 0.072, 0.082],
          [s * 0.11, hcY + 0.042, 0.064],
        ],
        0.021,
        0.007
      );
    }
  } else if (config.hairStyleId === 'comma_hair') {
    // Korean Comma Hair (male): parted crown volume + sweeping inward C-curve comma bangs
    addMesh(
      headGroup,
      sculptClayGeo(new THREE.SphereGeometry(0.078, 20, 16), 0.0009),
      hairMat,
      [0.028, hcY + 0.104, 0.004],
      [0.08, 0, -0.16],
      [1.08, 0.6, 1.0]
    );
    addMesh(
      headGroup,
      sculptClayGeo(new THREE.SphereGeometry(0.066, 20, 16), 0.0009),
      hairMat,
      [-0.05, hcY + 0.098, 0.008],
      [0.08, 0, 0.18],
      [1.0, 0.58, 0.96]
    );
    // Primary thick comma lock curling gracefully inward on right forehead
    addBangLock(
      [
        [0.012, hcY + 0.118, 0.028],
        [0.052, hcY + 0.102, 0.078],
        [0.072, hcY + 0.074, 0.104],
        [0.044, hcY + 0.048, 0.112],
        [0.018, hcY + 0.052, 0.114],
      ],
      0.023,
      0.0085
    );
    // Supporting outer strand on comma side
    addBangLock(
      [
        [0.036, hcY + 0.11, 0.028],
        [0.082, hcY + 0.086, 0.078],
        [0.104, hcY + 0.048, 0.076],
      ],
      0.02,
      0.0075
    );
    // Opposite soft comma sweep
    addBangLock(
      [
        [-0.014, hcY + 0.115, 0.028],
        [-0.054, hcY + 0.096, 0.082],
        [-0.07, hcY + 0.066, 0.102],
        [-0.046, hcY + 0.048, 0.108],
      ],
      0.021,
      0.0075
    );
    addBangLock(
      [
        [-0.042, hcY + 0.104, 0.026],
        [-0.086, hcY + 0.08, 0.074],
        [-0.108, hcY + 0.042, 0.064],
      ],
      0.018,
      0.0065
    );
  } else if (config.hairStyleId === 'two_block') {
    // Two-Block Minimal (male): fuller layered crown cap + neat textured fringe + clean tapered sides
    addMesh(
      headGroup,
      sculptClayGeo(new THREE.SphereGeometry(0.124, 24, 18), 0.0009),
      hairMat,
      [0, hcY + 0.072, -0.002],
      [0.06, 0, 0],
      [1.06, 0.66, 1.02]
    );
    const twoBlockFringe: [number, number, number][][] = [
      [
        [-0.068, hcY + 0.106, 0.026],
        [-0.084, hcY + 0.086, 0.076],
        [-0.094, hcY + 0.054, 0.084],
      ],
      [
        [-0.036, hcY + 0.114, 0.032],
        [-0.046, hcY + 0.088, 0.092],
        [-0.05, hcY + 0.054, 0.102],
      ],
      [
        [-0.004, hcY + 0.118, 0.036],
        [-0.006, hcY + 0.09, 0.098],
        [-0.008, hcY + 0.056, 0.108],
      ],
      [
        [0.03, hcY + 0.115, 0.034],
        [0.036, hcY + 0.088, 0.094],
        [0.038, hcY + 0.052, 0.104],
      ],
      [
        [0.066, hcY + 0.106, 0.026],
        [0.082, hcY + 0.084, 0.078],
        [0.094, hcY + 0.05, 0.082],
      ],
    ];
    for (const pts of twoBlockFringe) {
      addBangLock(pts, 0.021, 0.0085);
    }
    // Neat layered nape weight at back
    addMesh(
      headGroup,
      sculptClayGeo(new THREE.SphereGeometry(0.092, 18, 14), 0.0009),
      hairMat,
      [0, hcY + 0.014, -0.072],
      undefined,
      [1.18, 0.62, 0.72]
    );
  } else if (config.hairStyleId === 'curly_crop') {
    // Artistic Curly Crop (male): clustered fluffy clay curls seamlessly covering crown & fringe
    const curlPuffs: [number, number, number, number][] = [
      [0, hcY + 0.128, 0.022, 0.042],
      [-0.044, hcY + 0.122, 0.016, 0.038],
      [0.046, hcY + 0.122, 0.014, 0.039],
      [-0.08, hcY + 0.104, -0.002, 0.035],
      [0.082, hcY + 0.104, -0.004, 0.035],
      [-0.032, hcY + 0.118, -0.042, 0.04],
      [0.036, hcY + 0.118, -0.044, 0.04],
      [0, hcY + 0.104, -0.082, 0.039],
      [-0.058, hcY + 0.09, -0.078, 0.036],
      [0.058, hcY + 0.09, -0.078, 0.036],
      // Fluffy curly fringe puffs cleanly above brows
      [-0.064, hcY + 0.082, 0.084, 0.031],
      [-0.024, hcY + 0.086, 0.098, 0.033],
      [0.018, hcY + 0.088, 0.1, 0.034],
      [0.058, hcY + 0.082, 0.086, 0.031],
      [-0.092, hcY + 0.068, 0.056, 0.028],
      [0.094, hcY + 0.068, 0.056, 0.028],
      // Soft back nape curls
      [-0.05, hcY + 0.034, -0.114, 0.032],
      [0.0, hcY + 0.038, -0.118, 0.034],
      [0.05, hcY + 0.034, -0.114, 0.032],
    ];
    for (const [cx, cy, cz, cr] of curlPuffs) {
      if (hasCrownHat && cy > hcY + 0.092) continue;
      addMesh(
        headGroup,
        sculptClayGeo(new THREE.SphereGeometry(cr, 14, 12), 0.0012),
        hairMat,
        [cx, cy + (hasCrownHat ? -0.014 : 0), cz],
        undefined,
        [1.06, 0.92, 1.02]
      );
    }
  } else if (config.hairStyleId === 'slick_back') {
    // Sleek Swept-Back Pompadour (male): sculpted wave rising smoothly from clean forehead hairline
    addMesh(
      headGroup,
      sculptClayGeo(new THREE.SphereGeometry(0.104, 22, 16), 0.0009),
      hairMat,
      [0, hcY + 0.098 + (hasCrownHat ? -0.024 : 0), 0.002],
      [-0.2, 0, 0],
      [1.04, hasCrownHat ? 0.5 : 0.68, 1.1]
    );
    const waveX = [-0.078, -0.044, -0.012, 0.02, 0.054, 0.082];
    waveX.forEach((wx, idx) => {
      const lift = 1 - Math.abs(wx) * 3.8;
      const archY = hcY + 0.112 + Math.max(0, lift) * 0.028 + (hasCrownHat ? -0.032 : 0);
      addBangLock(
        [
          [wx * 0.88, hcY + 0.074 + (idx % 2) * 0.004, 0.092 - Math.abs(wx) * 0.25],
          [wx * 0.94, archY, 0.046],
          [wx, hcY + 0.124 + (hasCrownHat ? -0.036 : 0), -0.025],
          [wx * 0.96, hcY + 0.094 + (hasCrownHat ? -0.02 : 0), -0.096],
        ],
        0.021,
        0.012
      );
    });
  } else if (config.hairStyleId === 'bob') {
    // Smooth frontal bang veil + overlapping flat clay bangs
    addMesh(
      headGroup,
      sculptClayGeo(new THREE.SphereGeometry(0.116, 24, 18), 0.0008),
      hairMat,
      [0, hcY + 0.072, 0.014],
      [0.24, 0, 0],
      [1.0, 0.56, 0.92]
    );
    const bobLocks: [number, number, number][][] = [
      [
        [-0.078, hcY + 0.108, 0.028],
        [-0.088, hcY + 0.084, 0.074],
        [-0.096, hcY + 0.05, 0.078],
      ],
      [
        [-0.042, hcY + 0.116, 0.036],
        [-0.046, hcY + 0.088, 0.09],
        [-0.046, hcY + 0.052, 0.098],
      ],
      [
        [0.0, hcY + 0.12, 0.04],
        [0.001, hcY + 0.09, 0.096],
        [0.002, hcY + 0.054, 0.104],
      ],
      [
        [0.042, hcY + 0.116, 0.036],
        [0.046, hcY + 0.088, 0.09],
        [0.048, hcY + 0.052, 0.098],
      ],
      [
        [0.078, hcY + 0.108, 0.028],
        [0.088, hcY + 0.084, 0.074],
        [0.096, hcY + 0.05, 0.078],
      ],
    ];
    for (const pts of bobLocks) {
      addBangLock(pts, 0.021, 0.009);
    }
  } else if (config.hairStyleId === 'ponytail') {
    for (const s of [-1, 1]) {
      addBangLock(
        [
          [s * 0.01, hcY + 0.118, 0.028],
          [s * 0.046, hcY + 0.098, 0.078],
          [s * 0.082, hcY + 0.074, 0.082],
          [s * 0.104, hcY + 0.046, 0.06],
        ],
        0.019,
        0.007
      );
    }
  } else if (
    config.hairStyleId === 'wavy' ||
    config.hairStyleId === 'twintails' ||
    config.hairStyleId === 'bun'
  ) {
    // Soft center-parted front cushions bridging smoothly into bangs
    for (const s of [-1, 1]) {
      addMesh(
        headGroup,
        sculptClayGeo(new THREE.SphereGeometry(0.062, 18, 14), 0.0008),
        hairMat,
        [s * 0.044, hcY + 0.098, 0.014],
        [0.14, 0, s * -0.22],
        [1.04, 0.54, 0.96]
      );
      addBangLock(
        [
          [s * 0.004, hcY + 0.118, 0.03],
          [s * 0.032, hcY + 0.1, 0.078],
          [s * 0.062, hcY + 0.078, 0.092],
          [s * 0.088, hcY + 0.05, 0.084],
        ],
        0.022,
        0.0075
      );
      addBangLock(
        [
          [s * 0.028, hcY + 0.11, 0.03],
          [s * 0.064, hcY + 0.086, 0.076],
          [s * 0.092, hcY + 0.064, 0.076],
          [s * 0.11, hcY + 0.036, 0.058],
        ],
        0.019,
        0.0068
      );
    }
  } else {
    // messy_short & wolf_cut feathered front fringe rooted cleanly inside crown
    const featherLocks: [number, number, number][][] = [
      [
        [-0.038, hcY + 0.115, 0.032],
        [-0.064, hcY + 0.088, 0.078],
        [-0.092, hcY + 0.05, 0.08],
      ],
      [
        [-0.008, hcY + 0.12, 0.036],
        [-0.018, hcY + 0.092, 0.09],
        [-0.03, hcY + 0.054, 0.1],
      ],
      [
        [0.018, hcY + 0.118, 0.036],
        [0.034, hcY + 0.09, 0.088],
        [0.05, hcY + 0.052, 0.095],
      ],
      [
        [0.044, hcY + 0.11, 0.032],
        [0.074, hcY + 0.084, 0.078],
        [0.104, hcY + 0.046, 0.072],
      ],
    ];
    for (const pts of featherLocks) {
      addBangLock(pts, 0.02, 0.0075);
    }
  }

  // Hairstyle-specific back & side silhouettes + smooth gather bridges
  if (config.hairStyleId === 'bob') {
    addMesh(
      headGroup,
      sculptClayGeo(
        new THREE.CylinderGeometry(0.127, 0.138, 0.146, 26, 1, false, Math.PI * 0.46, Math.PI * 1.08),
        0.001
      ),
      hairMat,
      [0, hcY - 0.046, -0.018],
      undefined,
      [1.02, 1, 0.96]
    );
    for (const s of [-1, 1]) {
      addTaperedClayStrand(
        headGroup,
        [
          [s * 0.116, hcY + 0.036, -0.004],
          [s * 0.126, hcY - 0.036, 0.005],
          [s * 0.112, hcY - 0.108, 0.012],
        ],
        0.024,
        0.015,
        hairMat
      );
    }
  } else if (config.hairStyleId === 'ponytail') {
    // Smooth pulled-back crown gather cone connecting skull cap seamlessly into hair tie
    addMesh(
      headGroup,
      sculptClayGeo(new THREE.CylinderGeometry(0.034, 0.068, 0.054, 18), 0.0008),
      hairMat,
      [0, hcY + 0.058, -0.118],
      [-Math.PI / 2 - 0.34, 0, 0]
    );
    for (const sx of [-0.044, 0.044]) {
      addTaperedClayStrand(
        headGroup,
        [
          [sx * 1.5, hcY + 0.072, -0.052],
          [sx * 0.7, hcY + 0.064, -0.106],
          [0, hcY + 0.054, -0.138],
        ],
        0.022,
        0.016,
        hairMat,
        10
      );
    }
    addMesh(
      headGroup,
      new THREE.TorusGeometry(0.032, 0.011, 10, 20),
      clayMat('#E07A88', 0.86),
      [0, hcY + 0.054, -0.14],
      [0.38, 0, 0]
    );
    addTaperedClayStrand(
      headGroup,
      [
        [0, hcY + 0.052, -0.138],
        [0, hcY + 0.018, -0.172],
        [0, hcY - 0.048, -0.178],
        [0, hcY - 0.126, -0.166],
      ],
      0.043,
      0.019,
      hairMat
    );
  } else if (config.hairStyleId === 'wavy') {
    for (const s of [-1, 1]) {
      addTaperedClayStrand(
        headGroup,
        [
          [s * 0.116, hcY + 0.036, -0.014],
          [s * 0.13, hcY - 0.048, -0.01],
          [s * 0.122, hcY - 0.138, -0.002],
          [s * 0.126, hcY - 0.208, -0.014],
        ],
        0.027,
        0.015,
        hairMat
      );
    }
    for (const bx of [-0.052, 0, 0.052]) {
      addTaperedClayStrand(
        headGroup,
        [
          [bx, hcY - 0.002, -0.122],
          [bx * 1.15, hcY - 0.11, -0.134],
          [bx * 1.05, hcY - 0.212, -0.12],
        ],
        0.032,
        0.018,
        hairMat
      );
    }
  } else if (config.hairStyleId === 'messy_short' && !hasCrownHat) {
    addMesh(
      headGroup,
      sculptClayGeo(new THREE.ConeGeometry(0.042, 0.062, 12), 0.001),
      hairMat,
      [-0.046, hcY + 0.134, 0.006],
      [0.1, 0, 0.36]
    );
    addMesh(
      headGroup,
      sculptClayGeo(new THREE.ConeGeometry(0.04, 0.058, 12), 0.001),
      hairMat,
      [0.052, hcY + 0.128, -0.01],
      [-0.1, 0, -0.38]
    );
  } else if (config.hairStyleId === 'twintails') {
    for (const s of [-1, 1]) {
      // Smooth side gather cone bridging skull cap seamlessly into hair bobble
      addMesh(
        headGroup,
        sculptClayGeo(new THREE.CylinderGeometry(0.024, 0.046, 0.042, 16), 0.0007),
        hairMat,
        [s * 0.114, hcY + 0.048, -0.03],
        [0, 0, s * -1.18]
      );
      addMesh(
        headGroup,
        new THREE.SphereGeometry(0.022, 12, 12),
        clayMat('#E8B94A', 0.84),
        [s * 0.128, hcY + 0.046, -0.036]
      );
      addTaperedClayStrand(
        headGroup,
        [
          [s * 0.128, hcY + 0.042, -0.036],
          [s * 0.158, hcY + 0.008, -0.046],
          [s * 0.172, hcY - 0.052, -0.05],
          [s * 0.16, hcY - 0.142, -0.04],
        ],
        0.035,
        0.016,
        hairMat
      );
    }
  } else if (config.hairStyleId === 'wolf_cut') {
    for (const s of [-1, 1]) {
      addTaperedClayStrand(
        headGroup,
        [
          [s * 0.116, hcY + 0.032, -0.006],
          [s * 0.128, hcY - 0.06, 0.0],
          [s * 0.106, hcY - 0.134, -0.012],
        ],
        0.024,
        0.011,
        hairMat
      );
    }
    for (const bx of [-0.046, 0, 0.046]) {
      addTaperedClayStrand(
        headGroup,
        [
          [bx, hcY - 0.008, -0.12],
          [bx * 1.15, hcY - 0.092, -0.132],
          [bx * 1.24, hcY - 0.154, -0.118],
        ],
        0.028,
        0.012,
        hairMat
      );
    }
  } else if (config.hairStyleId === 'bun' && !hasCrownHat) {
    // Seamless flared hair-gather cone & swept-up strands connecting crown cap into the top bun
    addMesh(
      headGroup,
      sculptClayGeo(new THREE.CylinderGeometry(0.038, 0.072, 0.05, 22), 0.0008),
      hairMat,
      [0, hcY + 0.118, -0.026],
      [-0.18, 0, 0]
    );
    for (let k = 0; k < 4; k++) {
      const ang = (k / 4) * Math.PI * 2 + 0.4;
      addTaperedClayStrand(
        headGroup,
        [
          [Math.cos(ang) * 0.088, hcY + 0.092, -0.018 + Math.sin(ang) * 0.076],
          [Math.cos(ang) * 0.044, hcY + 0.12, -0.024 + Math.sin(ang) * 0.04],
          [Math.cos(ang) * 0.018, hcY + 0.14, -0.028 + Math.sin(ang) * 0.016],
        ],
        0.021,
        0.014,
        hairMat,
        10
      );
    }
    addMesh(
      headGroup,
      new THREE.TorusGeometry(0.037, 0.011, 10, 20),
      clayMat('#E57399', 0.86),
      [0, hcY + 0.134, -0.028],
      [Math.PI / 2 - 0.18, 0, 0]
    );
    addMesh(
      headGroup,
      sculptClayGeo(new THREE.SphereGeometry(0.058, 20, 16), 0.001),
      hairMat,
      [0, hcY + 0.158, -0.032],
      undefined,
      [1.04, 0.9, 1.02]
    );
  }

  // ==========================================================
  // 7. CARTOON-CLAY GLASSES (Fitted cleanly around rounded nose & eyes)
  // ==========================================================
  if (config.glassesId !== 'glasses_none') {
    const gDef = AVATAR_ITEM_MAP[config.glassesId];
    const frameMat = clayMat(gDef?.primaryHex ?? '#2F333B', 0.84, 0.008);
    const lensMat = new THREE.MeshPhysicalMaterial({
      color: gDef?.secondaryHex ?? '#E0F2FE',
      transparent: true,
      opacity: config.glassesId === 'glasses_tinted_amber' ? 0.52 : 0.26,
      roughness: 0.22,
    });

    for (const s of [-1, 1]) {
      if (config.glassesId === 'glasses_square_black') {
        addMesh(
          headGroup,
          createRoundedPanelGeo(0.056, 0.044, 0.01, 0.01, 0.003),
          frameMat,
          [s * 0.044, hcY - 0.002, 0.126],
          [0, s * -0.16, 0]
        );
        addMesh(
          headGroup,
          createRoundedPanelGeo(0.044, 0.033, 0.012, 0.007, 0.002),
          lensMat,
          [s * 0.044, hcY - 0.002, 0.128],
          [0, s * -0.16, 0]
        );
      } else {
        addMesh(
          headGroup,
          new THREE.TorusGeometry(0.0265, 0.0046, 10, 22),
          frameMat,
          [s * 0.044, hcY - 0.002, 0.127],
          [0, s * -0.16, 0]
        );
        addMesh(
          headGroup,
          new THREE.CylinderGeometry(0.024, 0.024, 0.005, 20),
          lensMat,
          [s * 0.044, hcY - 0.002, 0.127],
          [Math.PI / 2, 0, s * 0.16]
        );
      }
    }
    addMesh(
      headGroup,
      new THREE.CapsuleGeometry(0.003, 0.024, 6, 8),
      frameMat,
      [0, hcY + 0.003, 0.132],
      [0, 0, Math.PI / 2]
    );
  }

  // ==========================================================
  // 8. HANDMADE TERRACOTTA HEADWEAR (Fitted cleanly to rounder crown)
  // ==========================================================
  if (config.headwearId !== 'head_none') {
    const hDef = AVATAR_ITEM_MAP[config.headwearId];
    const hatPrimary = clayMat(hDef?.primaryHex ?? '#EB8F9C', 0.88, 0.013);
    const hatSecondary = clayMat(hDef?.secondaryHex ?? '#D1707E', 0.89, 0.012);

    if (config.headwearId === 'head_beret_pink' || config.headwearId === 'head_beret_navy') {
      const beret = new THREE.Group();
      beret.position.set(0.01, hcY + 0.112, -0.01);
      beret.rotation.set(-0.08, 0, -0.15);
      addMesh(
        beret,
        sculptClayGeo(new THREE.SphereGeometry(0.142, 24, 18), 0.0012),
        hatPrimary,
        [0, 0.012, 0],
        undefined,
        [1.06, 0.44, 1.02]
      );
      addMesh(
        beret,
        new THREE.TorusGeometry(0.115, 0.016, 10, 24),
        hatSecondary,
        [0, -0.02, 0],
        [Math.PI / 2, 0, 0]
      );
      addMesh(beret, new THREE.CylinderGeometry(0.008, 0.01, 0.028, 10), hatSecondary, [0, 0.068, 0]);
      headGroup.add(beret);
    } else if (config.headwearId === 'head_beanie_mustard') {
      addMesh(
        headGroup,
        sculptClayGeo(new THREE.SphereGeometry(0.144, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.54), 0.0012),
        hatPrimary,
        [0, hcY + 0.048, -0.008],
        undefined,
        [1.02, 0.95, 0.98]
      );
      addMesh(
        headGroup,
        new THREE.TorusGeometry(0.132, 0.019, 10, 24),
        hatSecondary,
        [0, hcY + 0.068, -0.002],
        [Math.PI / 2 - 0.12, 0, 0]
      );
      addMesh(headGroup, new THREE.SphereGeometry(0.03, 14, 14), hatSecondary, [0, hcY + 0.194, -0.014]);
    } else if (config.headwearId === 'head_cat_ears') {
      const bandR = 0.135;
      const bandY = hcY + 0.046;
      const bandZ = 0.004;
      addMesh(
        headGroup,
        new THREE.TorusGeometry(bandR, 0.0105, 12, 28, Math.PI * 1.06),
        hatPrimary,
        [0, bandY, bandZ],
        [0, 0, -Math.PI * 0.03],
        [1.02, 0.95, 1]
      );

      // Realistic sculpted curved-triangle cat ear shape
      const createCatEarShapeGeo = (width: number, height: number, depth: number, bevel: number) => {
        const shape = new THREE.Shape();
        const hw = width * 0.5;
        shape.moveTo(-hw, -0.008);
        shape.quadraticCurveTo(-hw * 0.96, height * 0.45, -0.005, height);
        shape.quadraticCurveTo(0, height + 0.006, 0.005, height);
        shape.quadraticCurveTo(hw * 0.96, height * 0.45, hw, -0.008);
        shape.quadraticCurveTo(0, -0.014, -hw, -0.008);
        const geo = new THREE.ExtrudeGeometry(shape, {
          depth,
          bevelEnabled: true,
          bevelThickness: bevel,
          bevelSize: bevel,
          bevelSegments: 4,
          curveSegments: 14,
        });
        geo.translate(0, 0, -depth * 0.5);
        geo.computeVertexNormals();
        return sculptClayGeo(geo, 0.0005);
      };

      const outerEarGeo = createCatEarShapeGeo(0.068, 0.064, 0.015, 0.005);
      const innerEarGeo = createCatEarShapeGeo(0.04, 0.042, 0.008, 0.003);
      const catAlpha = 0.56;

      for (const s of [-1, 1] as const) {
        // Seat ear group directly into the headband arch core at angle catAlpha
        const earAnchor = new THREE.Group();
        earAnchor.position.set(
          s * bandR * 1.02 * Math.sin(catAlpha),
          bandY + bandR * 0.95 * Math.cos(catAlpha),
          bandZ
        );
        earAnchor.rotation.set(0.06, s * -0.14, s * -0.52);

        // Seamless wrapping cuff around the headband arch so ear fuses solidly with zero gap
        addMesh(earAnchor, new THREE.CylinderGeometry(0.016, 0.02, 0.022, 14), hatPrimary, [0, -0.001, 0], [0, 0, Math.PI / 2], [0.85, 1.5, 0.95]);
        addMesh(earAnchor, outerEarGeo, hatPrimary, [0, 0.002, 0]);
        addMesh(earAnchor, innerEarGeo, hatSecondary, [0, 0.011, 0.0065]);
        // Cute inner fur tuft accent at ear base
        addMesh(earAnchor, new THREE.CapsuleGeometry(0.004, 0.012, 4, 8), hatSecondary, [s * -0.008, 0.012, 0.01], [0, 0, s * 0.35]);
        headGroup.add(earAnchor);
      }
    } else if (config.headwearId === 'head_cap_cobalt') {
      // Baseball cap crown dome + stitched base rim + seamless beveled crescent visor embedded into crown
      addMesh(
        headGroup,
        sculptClayGeo(new THREE.SphereGeometry(0.145, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.54), 0.001),
        hatPrimary,
        [0, hcY + 0.046, -0.008],
        undefined,
        [1.02, 0.96, 0.99]
      );
      addMesh(
        headGroup,
        sculptClayGeo(new THREE.SphereGeometry(0.1465, 24, 16, -Math.PI * 0.22, Math.PI * 0.44, 0.12, Math.PI * 0.4), 0.0008),
        hatSecondary,
        [0, hcY + 0.047, -0.007],
        [0, Math.PI / 2, 0],
        [1.025, 0.965, 0.995]
      );
      // Sweatband/piping ring sealing crown lower rim cleanly
      addMesh(
        headGroup,
        new THREE.TorusGeometry(0.141, 0.0075, 10, 30),
        hatPrimary,
        [0, hcY + 0.052, -0.008],
        [Math.PI / 2, 0, 0],
        [1.02, 0.99, 1]
      );
      addMesh(headGroup, new THREE.SphereGeometry(0.014, 12, 12), hatSecondary, [0, hcY + 0.184, -0.008]);

      // Crescent cap visor sculpted in XZ plane with inner radius inside the cap dome so zero seam gap appears
      const visorShape = new THREE.Shape();
      const innerR = 0.112;
      const outerRx = 0.148;
      const outerRz = 0.224;
      const halfSpan = Math.PI * 0.42;
      const segs = 22;
      for (let i = 0; i <= segs; i++) {
        const a = -halfSpan + (i / segs) * (halfSpan * 2);
        const vx = Math.sin(a) * outerRx;
        const vy = Math.cos(a) * outerRz;
        if (i === 0) visorShape.moveTo(vx, vy);
        else visorShape.lineTo(vx, vy);
      }
      for (let i = segs; i >= 0; i--) {
        const a = -halfSpan + (i / segs) * (halfSpan * 2);
        const vx = Math.sin(a) * innerR;
        const vy = Math.cos(a) * innerR;
        visorShape.lineTo(vx, vy);
      }
      visorShape.closePath();
      const visorGeo = new THREE.ExtrudeGeometry(visorShape, {
        depth: 0.008,
        bevelEnabled: true,
        bevelThickness: 0.003,
        bevelSize: 0.003,
        bevelSegments: 3,
        curveSegments: 16,
      });
      visorGeo.rotateX(Math.PI / 2);
      visorGeo.computeVertexNormals();
      addMesh(
        headGroup,
        sculptClayGeo(visorGeo, 0.0004),
        hatPrimary,
        [0, hcY + 0.066, -0.006],
        [0.14, 0, 0]
      );
    } else if (config.headwearId === 'head_santa_hat') {
      // Full-coverage plush dome + fluffy fur cuff + curved drooping tail & pom-pom (zero hair poking out)
      const santaGroup = new THREE.Group();
      santaGroup.position.set(0, hcY + 0.052, -0.009);
      addMesh(
        santaGroup,
        sculptClayGeo(new THREE.TorusGeometry(0.145, 0.025, 14, 30), 0.001),
        hatSecondary,
        [0, 0.004, 0],
        [Math.PI / 2 - 0.14, 0, 0],
        [1.03, 1.0, 1.03]
      );
      addMesh(
        santaGroup,
        sculptClayGeo(
          new THREE.SphereGeometry(0.154, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.58),
          0.0011
        ),
        hatPrimary,
        [0, -0.002, -0.002],
        [-0.14, 0, 0],
        [1.03, 1.04, 1.03]
      );
      addTaperedClayStrand(
        santaGroup,
        [
          [0, 0.12, -0.01],
          [0.064, 0.172, -0.032],
          [0.128, 0.126, -0.044],
          [0.148, 0.074, -0.04],
        ],
        0.078,
        0.018,
        hatPrimary,
        18
      );
      addMesh(santaGroup, sculptClayGeo(new THREE.SphereGeometry(0.032, 14, 14), 0.0009), hatSecondary, [0.152, 0.066, -0.04]);
      headGroup.add(santaGroup);
    } else if (config.headwearId === 'head_reindeer') {
      const bandR = 0.135;
      const bandY = hcY + 0.046;
      const bandZ = 0.004;
      const bandMat = clayMat(0xd13b47, 0.86);
      addMesh(
        headGroup,
        new THREE.TorusGeometry(bandR, 0.0105, 12, 26, Math.PI * 1.06),
        bandMat,
        [0, bandY, bandZ],
        [0, 0, -Math.PI * 0.03],
        [1.02, 0.95, 1]
      );
      const antlerAlpha = 0.44;
      for (const s of [-1, 1] as const) {
        const antlerAnchor = new THREE.Group();
        antlerAnchor.position.set(
          s * bandR * 1.02 * Math.sin(antlerAlpha),
          bandY + bandR * 0.95 * Math.cos(antlerAlpha),
          bandZ
        );
        antlerAnchor.rotation.set(0, 0, s * -0.24);

        // Snug mounting collar & cute reindeer ear hugging the top of the headband arch
        addMesh(antlerAnchor, new THREE.CylinderGeometry(0.015, 0.018, 0.022, 14), bandMat, [0, 0.002, 0]);
        addMesh(
          antlerAnchor,
          new THREE.SphereGeometry(0.018, 12, 10),
          hatPrimary,
          [s * 0.022, 0.006, -0.004],
          [0, 0, s * -0.82],
          [0.65, 1.35, 0.48]
        );
        // Main antler trunk rooted inside mounting collar
        addTaperedClayStrand(
          antlerAnchor,
          [
            [0, 0.002, 0],
            [s * 0.008, 0.052, 0],
            [s * 0.018, 0.112, -0.002],
          ],
          0.0115,
          0.0085,
          hatPrimary,
          14
        );
        // Side forked tines rooted directly inside main trunk
        addTaperedClayStrand(
          antlerAnchor,
          [
            [s * 0.006, 0.044, 0],
            [s * 0.036, 0.068, 0],
            [s * 0.052, 0.096, 0],
          ],
          0.0095,
          0.007,
          hatPrimary,
          10
        );
        addTaperedClayStrand(
          antlerAnchor,
          [
            [s * 0.012, 0.076, 0],
            [s * -0.012, 0.098, 0.002],
          ],
          0.0085,
          0.0065,
          hatPrimary,
          8
        );
        // Golden jingle bell seated flush on headband inner edge
        addMesh(antlerAnchor, new THREE.SphereGeometry(0.014, 12, 12), hatSecondary, [s * -0.016, 0.002, 0.009]);
        headGroup.add(antlerAnchor);
      }
    }
  }

  return {
    root,
    bodyGroup,
    headGroup,
    leftArm,
    rightArm,
    leftForearm,
    rightForearm,
    leftLeg,
    rightLeg,
    propGroup,
    wateringCanGroup,
    sketchPencilGroup,
    handHoldPose,
  };
}

export function buildAvatar3D(config: AvatarConfig): THREE.Group {
  return buildAvatarRig3D(config).root;
}
