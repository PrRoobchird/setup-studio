import * as THREE from 'three';
import { PET_BREED_MAP } from '../data/catalog';
import { OwnedPet } from '../types/studio';
import { createPlasticineBumpTexture, sculptClayGeo } from './textures';

function stdMat(color: number | string, roughness = 0.84, metalness = 0.02): THREE.MeshStandardMaterial {
  const bumpTex = createPlasticineBumpTexture(1.6, 1.6);
  return new THREE.MeshStandardMaterial({
    color,
    roughness: Math.max(0.7, roughness),
    metalness: Math.min(0.12, metalness),
    ...(bumpTex ? { bumpMap: bumpTex, bumpScale: 0.011 } : {}),
  });
}

function addPart(
  parent: THREE.Object3D,
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  pos: [number, number, number],
  rot?: [number, number, number],
  castShadow = true,
  receiveShadow = true
): THREE.Mesh {
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(pos[0], pos[1], pos[2]);
  if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = receiveShadow;
  parent.add(mesh);
  return mesh;
}

export interface AnimatedPetHandle {
  instanceId: string;
  species: OwnedPet['species'];
  isSick: boolean;
  creatureGroup: THREE.Group;
  tailGroup?: THREE.Object3D;
  wheelGroup?: THREE.Object3D;
  headGroup?: THREE.Object3D;
  baseY: number;
}

export function buildPetHabitat3D(
  pet: OwnedPet,
  cellSize: number,
  nightMode = false
): { root: THREE.Group; anim: AnimatedPetHandle } {
  const breed = PET_BREED_MAP[pet.breedId];
  const primary = breed?.primaryHex ?? '#D98245';
  const secondary = breed?.secondaryHex ?? '#FFF6EB';
  const eyeHex = breed?.eyeHex ?? '#1F1A17';
  const isSick = pet.status === 'sick';

  const root = new THREE.Group();
  root.userData.petInstanceId = pet.instanceId;

  const creatureGroup = new THREE.Group();
  let tailGroup: THREE.Object3D | undefined;
  let wheelGroup: THREE.Object3D | undefined;
  let headGroup: THREE.Object3D | undefined;
  let baseY = 0;

  if (pet.species === 'dog') {
    // 2x1 Wooden Playpen centered at (0,0) spanning ~2*cellSize wide by 1*cellSize deep
    const penW = cellSize * 1.84;
    const penD = cellSize * 0.88;
    const woodMat = stdMat(0xb98556, 0.7);
    const darkWoodMat = stdMat(0x8e5d38, 0.72);
    const padMat = stdMat(0xf5e8d6, 0.9);
    const cushionMat = stdMat(0xe78a6a, 0.85);
    const bowlMat = stdMat(0x38bdf8, 0.35);

    // Base soft floor mat
    addPart(root, new THREE.BoxGeometry(penW, 0.03, penD), padMat, [0, 0.015, 0], undefined, false, true);

    // Corner posts & rails
    const halfW = penW / 2 - 0.04;
    const halfD = penD / 2 - 0.04;
    for (const px of [-halfW, 0, halfW]) {
      for (const pz of [-halfD, halfD]) {
        if (px === 0 && pz === halfD) continue; // open front entry
        addPart(root, new THREE.CylinderGeometry(0.032, 0.035, 0.44, 10), darkWoodMat, [px, 0.22, pz]);
      }
    }
    // Back rail & side rails
    addPart(root, new THREE.BoxGeometry(penW - 0.06, 0.05, 0.045), woodMat, [0, 0.36, -halfD]);
    addPart(root, new THREE.BoxGeometry(penW - 0.06, 0.05, 0.045), woodMat, [0, 0.18, -halfD]);
    for (const sx of [-halfW, halfW]) {
      addPart(root, new THREE.BoxGeometry(0.045, 0.05, penD - 0.06), woodMat, [sx, 0.36, 0]);
      addPart(root, new THREE.BoxGeometry(0.045, 0.05, penD - 0.06), woodMat, [sx, 0.18, 0]);
    }
    // Front partial picket fence with center doorway
    addPart(root, new THREE.BoxGeometry(penW * 0.32, 0.05, 0.045), woodMat, [-halfW + penW * 0.15, 0.32, halfD]);
    addPart(root, new THREE.BoxGeometry(penW * 0.32, 0.05, 0.045), woodMat, [halfW - penW * 0.15, 0.32, halfD]);

    // Cozy Dog Bed on left side & Bowl on right
    addPart(root, new THREE.CylinderGeometry(0.28, 0.3, 0.09, 20), cushionMat, [-0.52, 0.07, -0.08]);
    addPart(root, new THREE.CylinderGeometry(0.11, 0.13, 0.06, 16), bowlMat, [0.58, 0.055, -0.2]);

    // Articulated 3D Dog
    const bodyMat = stdMat(primary, 0.72);
    const bellyMat = stdMat(secondary, 0.78);
    const eyeMat = stdMat(eyeHex, 0.25);
    const noseMat = stdMat(0x231c18, 0.25);

    // Body
    const torso = addPart(creatureGroup, sculptClayGeo(new THREE.CapsuleGeometry(0.115, 0.22, 8, 16), 0.002), bodyMat, [0, 0.22, 0], [0, 0, Math.PI / 2]);
    torso.scale.set(1, 1, 0.95);
    // Chest patch
    addPart(creatureGroup, sculptClayGeo(new THREE.SphereGeometry(0.1, 14, 14), 0.0015), bellyMat, [0.1, 0.21, 0]);
    // 4 legs
    for (const [lx, lz] of [
      [-0.1, -0.065],
      [-0.1, 0.065],
      [0.11, -0.065],
      [0.11, 0.065],
    ]) {
      addPart(creatureGroup, new THREE.CapsuleGeometry(0.032, 0.09, 6, 10), bellyMat, [lx, 0.08, lz]);
    }
    // Head
    addPart(creatureGroup, sculptClayGeo(new THREE.SphereGeometry(0.125, 18, 16), 0.002), bodyMat, [0.18, 0.34, 0]);
    // Snout
    addPart(creatureGroup, sculptClayGeo(new THREE.SphereGeometry(0.068, 14, 12), 0.0012), bellyMat, [0.27, 0.31, 0]);
    addPart(creatureGroup, new THREE.SphereGeometry(0.025, 10, 10), noseMat, [0.33, 0.325, 0]);
    // Eyes
    addPart(creatureGroup, new THREE.SphereGeometry(0.017, 8, 8), eyeMat, [0.27, 0.37, -0.055]);
    addPart(creatureGroup, new THREE.SphereGeometry(0.017, 8, 8), eyeMat, [0.27, 0.37, 0.055]);
    // Ears
    const earDroop = isSick ? 0.55 : 0.1;
    addPart(creatureGroup, new THREE.ConeGeometry(0.045, 0.11, 10), bodyMat, [0.15, 0.45 - earDroop * 0.08, -0.08], [earDroop, 0, -0.15]);
    addPart(creatureGroup, new THREE.ConeGeometry(0.045, 0.11, 10), bodyMat, [0.15, 0.45 - earDroop * 0.08, 0.08], [-earDroop, 0, -0.15]);
    // Tail
    const tail = new THREE.Group();
    tail.position.set(-0.18, 0.26, 0);
    addPart(tail, new THREE.CapsuleGeometry(0.026, 0.1, 6, 10), bodyMat, [-0.04, 0.06, 0], [0, 0, 0.5]);
    creatureGroup.add(tail);
    tailGroup = tail;
    baseY = 0.02;
    creatureGroup.position.set(0, baseY, 0.05);
    root.add(creatureGroup);
  } else if (pet.species === 'cat') {
    // 1x1 Plush Cat Condo + Scratcher Mat
    const baseMat = stdMat(0xd6be9f, 0.9);
    const postMat = stdMat(0xc49c6e, 0.92);
    const plushMat = stdMat(0xf5ece0, 0.92);
    const toyMat = stdMat(0xf472b6, 0.5);

    addPart(root, new THREE.CylinderGeometry(0.42, 0.44, 0.06, 24), baseMat, [0, 0.03, 0]);
    addPart(root, new THREE.CylinderGeometry(0.075, 0.075, 0.5, 14), postMat, [-0.18, 0.3, -0.16]);
    addPart(root, new THREE.CylinderGeometry(0.24, 0.24, 0.06, 20), plushMat, [-0.18, 0.56, -0.16]);
    addPart(root, new THREE.SphereGeometry(0.04, 10, 10), toyMat, [0.02, 0.42, -0.16]);
    // Cushion pad at front
    addPart(root, new THREE.CylinderGeometry(0.24, 0.26, 0.06, 20), stdMat(0xfbcfe8, 0.9), [0.1, 0.07, 0.1]);

    // 3D Cat
    const bodyMat = stdMat(primary, 0.75);
    const accentMat = stdMat(secondary, 0.78);
    const eyeMat = stdMat(eyeHex, 0.22);
    const noseMat = stdMat(0xfb7185, 0.35);

    addPart(creatureGroup, sculptClayGeo(new THREE.CapsuleGeometry(0.095, 0.16, 8, 16), 0.0018), bodyMat, [0, 0.18, 0], [0, 0, Math.PI / 2]);
    addPart(creatureGroup, sculptClayGeo(new THREE.SphereGeometry(0.08, 12, 12), 0.0014), accentMat, [0.08, 0.17, 0]);
    for (const [lx, lz] of [
      [-0.08, -0.055],
      [-0.08, 0.055],
      [0.09, -0.055],
      [0.09, 0.055],
    ]) {
      addPart(creatureGroup, new THREE.CapsuleGeometry(0.024, 0.07, 6, 10), accentMat, [lx, 0.06, lz]);
    }
    addPart(creatureGroup, sculptClayGeo(new THREE.SphereGeometry(0.11, 18, 16), 0.0018), bodyMat, [0.14, 0.29, 0]);
    addPart(creatureGroup, sculptClayGeo(new THREE.SphereGeometry(0.055, 12, 10), 0.0012), accentMat, [0.21, 0.26, 0]);
    addPart(creatureGroup, new THREE.SphereGeometry(0.018, 8, 8), eyeMat, [0.22, 0.315, -0.048]);
    addPart(creatureGroup, new THREE.SphereGeometry(0.018, 8, 8), eyeMat, [0.22, 0.315, 0.048]);
    addPart(creatureGroup, new THREE.SphereGeometry(0.016, 8, 8), noseMat, [0.26, 0.28, 0]);

    const earDrop = isSick ? 0.5 : 0;
    addPart(creatureGroup, new THREE.ConeGeometry(0.04, 0.09, 10), bodyMat, [0.12, 0.39 - earDrop * 0.06, -0.07], [earDrop, 0, 0]);
    addPart(creatureGroup, new THREE.ConeGeometry(0.04, 0.09, 10), bodyMat, [0.12, 0.39 - earDrop * 0.06, 0.07], [-earDrop, 0, 0]);

    const tail = new THREE.Group();
    tail.position.set(-0.14, 0.2, 0);
    addPart(tail, new THREE.CapsuleGeometry(0.02, 0.16, 6, 10), bodyMat, [-0.04, 0.09, 0], [0, 0, 0.45]);
    creatureGroup.add(tail);
    tailGroup = tail;
    baseY = 0.08;
    creatureGroup.position.set(0.08, baseY, 0.08);
    root.add(creatureGroup);
  } else if (pet.species === 'goldfish') {
    // 1x1 Wooden Aquarium Stand + Glass Tank + Swimming Goldfish
    const standMat = stdMat(0xc5935f, 0.62);
    const gravelMat = stdMat(0xe5cfa8, 0.9);
    const plantMat = stdMat(0x22c55e, 0.78);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.32,
      roughness: 0.15,
      depthWrite: false,
    });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.26,
      roughness: 0.08,
      metalness: 0.1,
      depthWrite: false,
    });
    const frameMat = stdMat(0x334155, 0.4, 0.25);

    // Cabinet Stand
    addPart(root, new THREE.BoxGeometry(0.76, 0.52, 0.58), standMat, [0, 0.26, 0]);
    addPart(root, new THREE.BoxGeometry(0.8, 0.05, 0.62), standMat, [0, 0.53, 0]);
    // Tank frame & gravel
    addPart(root, new THREE.BoxGeometry(0.72, 0.04, 0.52), frameMat, [0, 0.57, 0]);
    addPart(root, new THREE.BoxGeometry(0.68, 0.05, 0.48), gravelMat, [0, 0.6, 0]);
    // Aquatic plants
    addPart(root, new THREE.ConeGeometry(0.06, 0.24, 8), plantMat, [-0.18, 0.72, -0.1]);
    addPart(root, new THREE.ConeGeometry(0.05, 0.19, 8), plantMat, [-0.12, 0.69, -0.04]);
    // Water volume & Glass walls
    addPart(root, new THREE.BoxGeometry(0.68, 0.34, 0.48), waterMat, [0, 0.79, 0], undefined, false, false);
    addPart(root, new THREE.BoxGeometry(0.71, 0.4, 0.51), glassMat, [0, 0.79, 0], undefined, false, false);
    addPart(root, new THREE.BoxGeometry(0.73, 0.035, 0.53), frameMat, [0, 0.99, 0]);
    if (nightMode) {
      const tankLight = new THREE.PointLight(0x7dd3fc, 0.95, 2.5);
      tankLight.position.set(0, 0.94, 0.05);
      root.add(tankLight);
    }

    // 3D Goldfish inside water
    const fishMat = stdMat(primary, 0.42);
    const finMat = stdMat(secondary, 0.55);
    const eyeMat = stdMat(eyeHex, 0.2);

    const body = addPart(creatureGroup, new THREE.SphereGeometry(0.065, 16, 14), fishMat, [0, 0, 0], undefined, false, false);
    body.scale.set(1.45, 0.95, 0.78);
    addPart(creatureGroup, new THREE.SphereGeometry(0.015, 8, 8), eyeMat, [0.06, 0.02, -0.035], undefined, false, false);
    addPart(creatureGroup, new THREE.SphereGeometry(0.015, 8, 8), eyeMat, [0.06, 0.02, 0.035], undefined, false, false);
    // Dorsal fin
    addPart(creatureGroup, new THREE.ConeGeometry(0.032, 0.06, 6), finMat, [-0.01, 0.065, 0], [0, 0, 0.35], false, false);

    const tail = new THREE.Group();
    tail.position.set(-0.085, 0, 0);
    addPart(tail, new THREE.ConeGeometry(0.052, 0.1, 6), finMat, [-0.045, 0, 0], [0, 0, Math.PI / 2], false, false);
    creatureGroup.add(tail);
    tailGroup = tail;
    baseY = 0.78;
    creatureGroup.position.set(0, baseY, 0);
    root.add(creatureGroup);
  } else if (pet.species === 'hedgehog') {
    // 1x1 Hedgehog Terrarium + Exercise Wheel
    const trayMat = stdMat(0xc5935f, 0.68);
    const beddingMat = stdMat(0xf5e8d1, 0.95);
    const houseMat = stdMat(0xa67346, 0.75);
    const glassWallMat = new THREE.MeshStandardMaterial({
      color: 0xe2f1fa,
      transparent: true,
      opacity: 0.28,
      roughness: 0.12,
      depthWrite: false,
    });
    const wheelMat = stdMat(0x64748b, 0.45, 0.2);

    // Stand + Tray
    addPart(root, new THREE.BoxGeometry(0.84, 0.18, 0.68), trayMat, [0, 0.09, 0]);
    addPart(root, new THREE.BoxGeometry(0.76, 0.04, 0.6), beddingMat, [0, 0.19, 0]);
    // Clear glass sides
    addPart(root, new THREE.BoxGeometry(0.82, 0.28, 0.66), glassWallMat, [0, 0.32, 0], undefined, false, false);
    // Tiny wood hideout
    addPart(root, new THREE.BoxGeometry(0.24, 0.18, 0.22), houseMat, [-0.24, 0.28, -0.16]);

    // Spinning Exercise Wheel
    const wheel = new THREE.Group();
    wheel.position.set(0.22, 0.34, -0.12);
    addPart(wheel, new THREE.TorusGeometry(0.13, 0.022, 10, 22), wheelMat, [0, 0, 0]);
    addPart(wheel, new THREE.CylinderGeometry(0.015, 0.015, 0.26, 8), wheelMat, [0, 0, 0]);
    addPart(wheel, new THREE.CylinderGeometry(0.015, 0.015, 0.26, 8), wheelMat, [0, 0, 0], [0, 0, Math.PI / 2]);
    root.add(wheel);
    wheelGroup = wheel;

    // 3D Hedgehog
    const spineMat = stdMat(primary, 0.85);
    const faceMat = stdMat(secondary, 0.78);
    const eyeMat = stdMat(eyeHex, 0.2);
    const noseMat = stdMat(0x231c18, 0.25);

    const spines = addPart(creatureGroup, sculptClayGeo(new THREE.SphereGeometry(0.095, 16, 14), 0.002), spineMat, [-0.02, 0.085, 0]);
    spines.scale.set(1.2, 0.9, 1.0);
    // Little pointy spine spikes on back
    for (const [sx, sy, sz] of [
      [-0.08, 0.14, 0],
      [-0.03, 0.16, -0.04],
      [-0.03, 0.16, 0.04],
      [-0.09, 0.11, -0.05],
      [-0.09, 0.11, 0.05],
    ]) {
      addPart(creatureGroup, new THREE.ConeGeometry(0.024, 0.06, 6), spineMat, [sx, sy, sz], [0, 0, 0.5]);
    }
    const snout = addPart(creatureGroup, new THREE.ConeGeometry(0.058, 0.12, 12), faceMat, [0.09, 0.068, 0], [0, 0, -Math.PI / 2]);
    snout.scale.set(1, 1, 0.95);
    addPart(creatureGroup, new THREE.SphereGeometry(0.014, 8, 8), eyeMat, [0.09, 0.095, -0.032]);
    addPart(creatureGroup, new THREE.SphereGeometry(0.014, 8, 8), eyeMat, [0.09, 0.095, 0.032]);
    addPart(creatureGroup, new THREE.SphereGeometry(0.016, 8, 8), noseMat, [0.15, 0.068, 0]);
    baseY = 0.21;
    creatureGroup.position.set(-0.04, baseY, 0.1);
    root.add(creatureGroup);
  } else if (pet.species === 'snake') {
    // 1x1 Wooden Cabinet Stand + Glass Snake Terrarium + Driftwood & Moss + Coiled 3D Snake
    const standMat = stdMat(0xb68656, 0.68);
    const frameMat = stdMat(0x334155, 0.45, 0.2);
    const sandMat = stdMat(0xebd8b7, 0.94);
    const mossMat = stdMat(0x558b47, 0.9);
    const branchMat = stdMat(0x7c5334, 0.86);
    const rockMat = stdMat(0x94a3b8, 0.88);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xe2f5fb,
      transparent: true,
      opacity: 0.24,
      roughness: 0.08,
      metalness: 0.08,
      depthWrite: false,
    });

    // Cabinet base & terrarium floor
    addPart(root, new THREE.BoxGeometry(0.76, 0.46, 0.58), standMat, [0, 0.23, 0]);
    addPart(root, new THREE.BoxGeometry(0.8, 0.045, 0.62), standMat, [0, 0.48, 0]);
    addPart(root, new THREE.BoxGeometry(0.74, 0.04, 0.54), frameMat, [0, 0.52, 0]);
    addPart(root, new THREE.BoxGeometry(0.7, 0.045, 0.5), sandMat, [0, 0.55, 0]);

    // Decorative moss patches, smooth basking rock, & climbing driftwood branch
    addPart(root, sculptClayGeo(new THREE.SphereGeometry(0.11, 12, 10), 0.002), mossMat, [-0.21, 0.56, 0.11]).scale.set(1.2, 0.28, 0.95);
    addPart(root, sculptClayGeo(new THREE.DodecahedronGeometry(0.08, 1), 0.002), rockMat, [0.22, 0.585, -0.1]).scale.set(1.15, 0.62, 0.9);
    const branchCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.26, 0.56, -0.14),
      new THREE.Vector3(-0.08, 0.65, -0.1),
      new THREE.Vector3(0.14, 0.72, -0.05),
      new THREE.Vector3(0.28, 0.78, 0.04),
    ]);
    addPart(root, sculptClayGeo(new THREE.TubeGeometry(branchCurve, 18, 0.024, 10, false), 0.001), branchMat, [0, 0, 0]);

    // Glass walls & dark top lid frame + warm basking lamp dome
    addPart(root, new THREE.BoxGeometry(0.73, 0.38, 0.53), glassMat, [0, 0.73, 0], undefined, false, false);
    addPart(root, new THREE.BoxGeometry(0.75, 0.032, 0.55), frameMat, [0, 0.93, 0]);
    addPart(root, new THREE.CylinderGeometry(0.06, 0.095, 0.065, 14), frameMat, [0.2, 0.96, -0.08]);
    if (nightMode) {
      const heatLamp = new THREE.PointLight(0xffb454, 1.05, 2.5);
      heatLamp.position.set(0.2, 0.91, -0.08);
      root.add(heatLamp);
    }

    // 3D Sculpted Coiled Clay Snake
    const snakeBodyMat = stdMat(primary, 0.66, 0.04);
    const patternMat = stdMat(secondary, 0.72, 0.02);
    const darkBandMat = stdMat(0x231c18, 0.74, 0.02);
    const eyeMat = stdMat(eyeHex, 0.18, 0.05);
    const tongueMat = stdMat(0xef4444, 0.5, 0.02);

    const snakeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.18, 0.014, 0.09),
      new THREE.Vector3(-0.05, 0.017, 0.15),
      new THREE.Vector3(0.13, 0.019, 0.12),
      new THREE.Vector3(0.17, 0.022, -0.02),
      new THREE.Vector3(0.03, 0.024, -0.11),
      new THREE.Vector3(-0.12, 0.032, -0.03),
      new THREE.Vector3(-0.08, 0.068, 0.07),
      new THREE.Vector3(0.02, 0.105, 0.095),
    ]);

    const tubularSegs = 44;
    const radialSegs = 12;
    const bodyGeo = new THREE.TubeGeometry(snakeCurve, tubularSegs, 1, radialSegs, false);
    const bPos = bodyGeo.attributes.position;
    for (let i = 0; i <= tubularSegs; i++) {
      const u = i / tubularSegs;
      const center = snakeCurve.getPointAt(u);
      // Taper tail smoothly (u -> 0) and swell plumply mid-body -> neck
      const r = u < 0.25
        ? 0.009 + (0.023 * u) / 0.25
        : u < 0.85
          ? 0.032 - (u - 0.25) * 0.008
          : 0.027 - (u - 0.85) * 0.02;
      for (let j = 0; j <= radialSegs; j++) {
        const idx = i * (radialSegs + 1) + j;
        bPos.setXYZ(
          idx,
          center.x + (bPos.getX(idx) - center.x) * r,
          center.y + (bPos.getY(idx) - center.y) * r,
          center.z + (bPos.getZ(idx) - center.z) * r
        );
      }
    }
    bPos.needsUpdate = true;
    sculptClayGeo(bodyGeo, 0.0005);
    addPart(creatureGroup, bodyGeo, snakeBodyMat, [0, 0, 0]);

    // Pattern bands / blotches customized per snake breed
    const ringCount = pet.breedId === 'snake_milk' ? 10 : 8;
    for (let k = 1; k <= ringCount; k++) {
      const u = 0.12 + (k / (ringCount + 1)) * 0.78;
      const pt = snakeCurve.getPointAt(u);
      const tangent = snakeCurve.getTangentAt(u).normalize();
      const bodyRadius = u < 0.25 ? 0.009 + (0.023 * u) / 0.25 : 0.031 - (u - 0.25) * 0.008;

      const bandMat =
        pet.breedId === 'snake_milk' && k % 2 === 0 ? darkBandMat : patternMat;
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(bodyRadius * 0.96, 0.0075, 8, 14),
        bandMat
      );
      ring.position.copy(pt);
      ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
      creatureGroup.add(ring);
    }

    // Adorable Clay Snake Head at curve end (slightly raised & animated)
    const snakeHead = new THREE.Group();
    const headBase = snakeCurve.getPointAt(1);
    snakeHead.position.set(headBase.x, headBase.y, headBase.z);
    snakeHead.rotation.y = 0.28;
    const headMesh = addPart(
      snakeHead,
      sculptClayGeo(new THREE.SphereGeometry(0.036, 16, 14), 0.0008),
      snakeBodyMat,
      [0.01, 0.006, 0]
    );
    headMesh.scale.set(1.22, 0.76, 1.04);
    // Cute round snout & glossy eyes
    addPart(snakeHead, new THREE.SphereGeometry(0.008, 8, 8), eyeMat, [0.028, 0.014, -0.022]);
    addPart(snakeHead, new THREE.SphereGeometry(0.008, 8, 8), eyeMat, [0.028, 0.014, 0.022]);
    // Tiny cute forked red tongue
    addPart(snakeHead, new THREE.CapsuleGeometry(0.0028, 0.018, 4, 8), tongueMat, [0.056, 0.001, 0], [0, 0, Math.PI / 2]);
    addPart(snakeHead, new THREE.CapsuleGeometry(0.0022, 0.009, 4, 6), tongueMat, [0.068, 0.001, -0.004], [0, 0.45, Math.PI / 2]);
    addPart(snakeHead, new THREE.CapsuleGeometry(0.0022, 0.009, 4, 6), tongueMat, [0.068, 0.001, 0.004], [0, -0.45, Math.PI / 2]);

    creatureGroup.add(snakeHead);
    headGroup = snakeHead;

    baseY = 0.575;
    creatureGroup.position.set(-0.02, baseY, 0.04);
    root.add(creatureGroup);
  }

  // Sick Warning Halo on floor if hungry > 7 days
  if (isSick) {
    const warnRing = new THREE.Mesh(
      new THREE.RingGeometry(0.36, 0.43, 24),
      new THREE.MeshBasicMaterial({
        color: 0xef4444,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.78,
      })
    );
    warnRing.rotation.x = -Math.PI / 2;
    warnRing.position.set(0, 0.022, 0);
    root.add(warnRing);
  }

  return {
    root,
    anim: {
      instanceId: pet.instanceId,
      species: pet.species,
      isSick,
      creatureGroup,
      tailGroup,
      wheelGroup,
      headGroup,
      baseY,
    },
  };
}

export function animatePetHandle(handle: AnimatedPetHandle, elapsed: number, seed: number): void {
  const speed = handle.isSick ? 0.45 : 1.0;
  // Subtle stop-motion "on twos" ~14fps cadence for claymation charm
  const t = Math.floor((elapsed * speed + seed) * 14) / 14;

  if (handle.species === 'dog') {
    const xPos = Math.sin(t * 1.1) * 0.34;
    const facing = Math.cos(t * 1.1) >= 0 ? 0 : Math.PI;
    handle.creatureGroup.position.x = xPos;
    handle.creatureGroup.position.z = 0.06 + Math.sin(t * 2.2) * 0.06;
    handle.creatureGroup.position.y = handle.baseY + (handle.isSick ? 0 : Math.abs(Math.sin(t * 6.5)) * 0.025);
    handle.creatureGroup.rotation.y = facing;
    if (handle.tailGroup) {
      handle.tailGroup.rotation.y = Math.sin(t * (handle.isSick ? 2.5 : 11.0)) * 0.42;
    }
  } else if (handle.species === 'cat') {
    const circle = t * 0.9;
    handle.creatureGroup.position.x = Math.cos(circle) * 0.12;
    handle.creatureGroup.position.z = Math.sin(circle) * 0.12;
    handle.creatureGroup.rotation.y = -circle + Math.PI / 2;
    handle.creatureGroup.position.y = handle.baseY + (handle.isSick ? 0 : Math.max(0, Math.sin(t * 2.2)) * 0.02);
    if (handle.tailGroup) {
      handle.tailGroup.rotation.z = Math.sin(t * 3.8) * 0.25;
    }
  } else if (handle.species === 'goldfish') {
    const swim = t * 1.35;
    const x = Math.sin(swim) * 0.19;
    const z = Math.sin(swim * 2) * 0.09;
    const dx = Math.cos(swim) * 0.19;
    const dz = Math.cos(swim * 2) * 0.18;
    handle.creatureGroup.position.x = x;
    handle.creatureGroup.position.z = z;
    handle.creatureGroup.position.y = handle.baseY + Math.sin(t * 2.4) * 0.035;
    handle.creatureGroup.rotation.y = Math.atan2(-dz, dx);
    if (handle.tailGroup) {
      handle.tailGroup.rotation.y = Math.sin(t * 10.5) * 0.42;
    }
  } else if (handle.species === 'snake') {
    // Gentle snake slither sway & curious head weave inside terrarium
    const sway = t * 1.15;
    handle.creatureGroup.position.x = -0.02 + Math.sin(sway) * 0.04;
    handle.creatureGroup.position.z = 0.04 + Math.cos(sway * 0.85) * 0.03;
    handle.creatureGroup.position.y = handle.baseY;
    handle.creatureGroup.rotation.y = Math.sin(sway * 0.7) * 0.18;
    if (handle.headGroup) {
      handle.headGroup.rotation.y = 0.28 + Math.sin(t * 2.1) * 0.26;
      handle.headGroup.rotation.z = (handle.isSick ? -0.18 : 0.04) + Math.sin(t * 2.6) * 0.08;
    }
  } else {
    // Hedgehog scurries inside tray & spins wheel
    const walk = t * 1.4;
    handle.creatureGroup.position.x = Math.sin(walk) * 0.16;
    handle.creatureGroup.position.z = 0.08 + Math.cos(walk * 1.3) * 0.08;
    handle.creatureGroup.rotation.y = Math.cos(walk) >= 0 ? 0.2 : Math.PI - 0.2;
    handle.creatureGroup.position.y = handle.baseY + (handle.isSick ? 0 : Math.abs(Math.sin(t * 8.0)) * 0.01);
    if (handle.wheelGroup && !handle.isSick) {
      handle.wheelGroup.rotation.z = -t * 2.8;
    }
  }
}
