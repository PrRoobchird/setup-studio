import * as THREE from 'three';
import { AVATAR_ITEM_MAP } from '../data/catalog';
import { AvatarConfig } from '../types/studio';

function clayMat(color: string | number, roughness = 0.76, metalness = 0.03): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
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

export function buildAvatar3D(config: AvatarConfig): THREE.Group {
  const root = new THREE.Group();
  root.name = 'student_avatar_3d';
  root.userData.isAvatar = true;

  const skinMat = clayMat(config.skinToneHex, 0.68, 0.02);
  const hairMat = clayMat(config.hairColorHex, 0.72, 0.04);
  const eyeMat = clayMat(0x221d1c, 0.22, 0.08);
  const cheekMat = clayMat(0xf497a3, 0.78);

  const outfitDef = AVATAR_ITEM_MAP[config.outfitId] ?? AVATAR_ITEM_MAP.outfit_hoodie_apron;
  const primaryMat = clayMat(outfitDef.primaryHex, 0.84);
  const secondaryMat = clayMat(outfitDef.secondaryHex, 0.86);
  const pantsMat = clayMat(
    config.outfitId === 'outfit_arch_blazer'
      ? 0x2f343c
      : config.outfitId === 'outfit_cardigan'
      ? 0x8b6e5b
      : 0x3b4963,
    0.85
  );
  const shoeMat = clayMat(0xf7f2ea, 0.7);
  const soleMat = clayMat(0xd99b66, 0.78);

  // 1. Shoes & Legs (bottom-center pivot y = 0)
  for (const side of [-1, 1]) {
    const sx = side * 0.085;
    addMesh(root, new THREE.CapsuleGeometry(0.048, 0.04, 6, 10), shoeMat, [sx, 0.048, 0.025], [Math.PI / 2, 0, 0]);
    addMesh(root, new THREE.CylinderGeometry(0.05, 0.052, 0.022, 12), soleMat, [sx, 0.012, 0.025]);
    // Legs
    addMesh(
      root,
      new THREE.CylinderGeometry(0.046, 0.04, 0.23, 12),
      config.outfitId === 'outfit_cardigan' ? skinMat : pantsMat,
      [sx, 0.18, 0]
    );
  }

  // 2. Torso & Outfit Styling
  if (config.outfitId === 'outfit_cardigan') {
    // Pleated skirt + cardigan
    addMesh(root, new THREE.CylinderGeometry(0.115, 0.17, 0.16, 16), secondaryMat, [0, 0.31, 0]);
    addMesh(root, new THREE.CylinderGeometry(0.115, 0.13, 0.24, 16), primaryMat, [0, 0.47, 0]);
    addMesh(root, new THREE.BoxGeometry(0.06, 0.22, 0.04), clayMat(0xffffff, 0.88), [0, 0.48, 0.11]);
  } else {
    // Upper pants / hip
    addMesh(root, new THREE.CylinderGeometry(0.125, 0.118, 0.12, 16), pantsMat, [0, 0.31, 0]);
    // Main shirt/jacket body
    addMesh(root, new THREE.CylinderGeometry(0.12, 0.135, 0.28, 16), primaryMat, [0, 0.47, 0]);

    if (config.outfitId === 'outfit_hoodie_apron') {
      // Painter apron front + straps + hood collar
      addMesh(root, new THREE.BoxGeometry(0.17, 0.26, 0.03), secondaryMat, [0, 0.41, 0.12]);
      addMesh(root, new THREE.BoxGeometry(0.11, 0.07, 0.02), clayMat(0xd6c3a5, 0.85), [0, 0.38, 0.135]);
      addMesh(root, new THREE.TorusGeometry(0.105, 0.034, 8, 16), primaryMat, [0, 0.6, -0.02], [Math.PI / 2 + 0.25, 0, 0]);
    } else if (config.outfitId === 'outfit_overalls' || config.outfitId === 'outfit_pastel_atelier') {
      // Inner shirt collar + overalls bib
      addMesh(root, new THREE.CylinderGeometry(0.112, 0.115, 0.09, 14), secondaryMat, [0, 0.56, 0]);
      addMesh(root, new THREE.BoxGeometry(0.16, 0.22, 0.04), primaryMat, [0, 0.44, 0.115]);
      addMesh(root, new THREE.BoxGeometry(0.032, 0.12, 0.03), primaryMat, [-0.06, 0.56, 0.1]);
      addMesh(root, new THREE.BoxGeometry(0.032, 0.12, 0.03), primaryMat, [0.06, 0.56, 0.1]);
    } else if (config.outfitId === 'outfit_varsity') {
      // Varsity cream sleeves & chest patch
      addMesh(root, new THREE.BoxGeometry(0.045, 0.24, 0.03), secondaryMat, [0, 0.47, 0.125]);
      addMesh(root, new THREE.BoxGeometry(0.055, 0.055, 0.02), secondaryMat, [0.065, 0.5, 0.125]);
    } else if (config.outfitId === 'outfit_arch_blazer') {
      // Turtleneck inner + lapel
      addMesh(root, new THREE.CylinderGeometry(0.065, 0.075, 0.08, 12), secondaryMat, [0, 0.6, 0]);
      addMesh(root, new THREE.BoxGeometry(0.06, 0.2, 0.03), secondaryMat, [0, 0.48, 0.115]);
    }
  }

  // 3. Arms & Hands
  const sleeveMat =
    config.outfitId === 'outfit_varsity' ||
    config.outfitId === 'outfit_overalls' ||
    config.outfitId === 'outfit_pastel_atelier'
      ? secondaryMat
      : primaryMat;

  // Left arm (relaxed)
  addMesh(root, new THREE.CapsuleGeometry(0.04, 0.16, 6, 10), sleeveMat, [-0.17, 0.48, 0.02], [0.15, 0, 0.28]);
  addMesh(root, new THREE.SphereGeometry(0.038, 10, 10), skinMat, [-0.21, 0.37, 0.04]);

  // Right arm (slightly raised to hold art prop)
  addMesh(root, new THREE.CapsuleGeometry(0.04, 0.16, 6, 10), sleeveMat, [0.17, 0.49, 0.06], [-0.55, 0, -0.25]);
  addMesh(root, new THREE.SphereGeometry(0.038, 10, 10), skinMat, [0.21, 0.42, 0.14]);

  // 4. Hand Item Prop (Right Hand at [0.21, 0.42, 0.14])
  const propGroup = new THREE.Group();
  propGroup.position.set(0.21, 0.42, 0.14);
  if (config.handItemId === 'hand_brush') {
    addMesh(propGroup, new THREE.CylinderGeometry(0.011, 0.008, 0.26, 8), clayMat(0xc58f5b, 0.55), [0.01, 0.06, 0.03], [0.35, 0, -0.2]);
    addMesh(propGroup, new THREE.CylinderGeometry(0.014, 0.012, 0.04, 8), clayMat(0xd1d5db, 0.3, 0.5), [0.02, 0.16, 0.06], [0.35, 0, -0.2]);
    addMesh(propGroup, new THREE.ConeGeometry(0.018, 0.055, 10), clayMat(0xe05a47, 0.4), [0.026, 0.2, 0.075], [0.35, 0, -0.2]);
  } else if (config.handItemId === 'hand_sketchbook') {
    addMesh(propGroup, new THREE.BoxGeometry(0.16, 0.2, 0.026), clayMat(0xe06453, 0.72), [0.02, 0.03, 0.04], [-0.35, -0.35, 0.1]);
    addMesh(propGroup, new THREE.BoxGeometry(0.14, 0.18, 0.018), clayMat(0xfaf8f4, 0.88), [0.024, 0.03, 0.048], [-0.35, -0.35, 0.1]);
  } else if (config.handItemId === 'hand_stylus') {
    addMesh(propGroup, new THREE.BoxGeometry(0.18, 0.13, 0.018), clayMat(0x2d333d, 0.35, 0.25), [0, 0.02, 0.05], [-0.5, -0.3, 0.1]);
    addMesh(propGroup, new THREE.BoxGeometry(0.15, 0.1, 0.006), new THREE.MeshStandardMaterial({ color: 0x93c5fd, emissive: 0x3b82f6, emissiveIntensity: 0.35, roughness: 0.2 }), [0, 0.024, 0.06], [-0.5, -0.3, 0.1]);
    addMesh(propGroup, new THREE.CylinderGeometry(0.008, 0.006, 0.14, 8), clayMat(0xf8fafc, 0.35), [0.06, 0.08, 0.08], [0.3, 0, -0.4]);
  } else if (config.handItemId === 'hand_coffee') {
    addMesh(propGroup, new THREE.CylinderGeometry(0.045, 0.036, 0.1, 14), clayMat(0xf5efe6, 0.45), [0.01, 0.04, 0.03]);
    addMesh(propGroup, new THREE.CylinderGeometry(0.047, 0.046, 0.035, 14), clayMat(0x8c5e3c, 0.8), [0.01, 0.035, 0.03]);
    addMesh(propGroup, new THREE.CylinderGeometry(0.048, 0.048, 0.02, 14), clayMat(0xffffff, 0.4), [0.01, 0.095, 0.03]);
  } else if (config.handItemId === 'hand_camera') {
    addMesh(propGroup, new THREE.BoxGeometry(0.13, 0.085, 0.065), clayMat(0x28313d, 0.4, 0.2), [0, 0.03, 0.05], [0, -0.25, 0]);
    addMesh(propGroup, new THREE.BoxGeometry(0.13, 0.025, 0.067), clayMat(0xd1d5db, 0.3, 0.55), [0, 0.065, 0.05], [0, -0.25, 0]);
    addMesh(propGroup, new THREE.CylinderGeometry(0.03, 0.03, 0.04, 14), clayMat(0x475569, 0.25, 0.5), [-0.01, 0.03, 0.085], [Math.PI / 2, 0, -0.25]);
  }
  root.add(propGroup);

  // 5. Neck & Head (Centered around y = 0.79)
  addMesh(root, new THREE.CylinderGeometry(0.045, 0.05, 0.08, 12), skinMat, [0, 0.64, 0]);
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.79, 0);
  addMesh(headGroup, new THREE.SphereGeometry(0.185, 22, 18), skinMat, [0, 0, 0], undefined, [1.03, 0.96, 0.98]);
  // Ears
  addMesh(headGroup, new THREE.SphereGeometry(0.038, 10, 10), skinMat, [-0.18, -0.01, 0]);
  addMesh(headGroup, new THREE.SphereGeometry(0.038, 10, 10), skinMat, [0.18, -0.01, 0]);

  // Facial features
  addMesh(headGroup, new THREE.SphereGeometry(0.021, 10, 10), eyeMat, [-0.065, -0.005, 0.168]);
  addMesh(headGroup, new THREE.SphereGeometry(0.021, 10, 10), eyeMat, [0.065, -0.005, 0.168]);
  // Eye sparkle highlights
  addMesh(headGroup, new THREE.SphereGeometry(0.007, 6, 6), clayMat(0xffffff, 0.2), [-0.058, 0.005, 0.184]);
  addMesh(headGroup, new THREE.SphereGeometry(0.007, 6, 6), clayMat(0xffffff, 0.2), [0.072, 0.005, 0.184]);
  // Soft blush
  addMesh(headGroup, new THREE.SphereGeometry(0.028, 10, 8), cheekMat, [-0.105, -0.04, 0.145], undefined, [1.2, 0.65, 0.5]);
  addMesh(headGroup, new THREE.SphereGeometry(0.028, 10, 8), cheekMat, [0.105, -0.04, 0.145], undefined, [1.2, 0.65, 0.5]);

  // 6. Hair Styles
  // Base crown hair cap shared across styles
  addMesh(
    headGroup,
    new THREE.SphereGeometry(0.194, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.62),
    hairMat,
    [0, 0.018, -0.015],
    [-0.18, 0, 0]
  );

  // Front bangs
  for (let b = -2; b <= 2; b++) {
    addMesh(
      headGroup,
      new THREE.CapsuleGeometry(0.034, 0.065, 6, 8),
      hairMat,
      [b * 0.044, 0.105 - Math.abs(b) * 0.008, 0.148],
      [0.25, 0, b * -0.14]
    );
  }

  if (config.hairStyleId === 'bob') {
    addMesh(headGroup, new THREE.CylinderGeometry(0.185, 0.205, 0.21, 18, 1, false, Math.PI * 0.65, Math.PI * 1.7), hairMat, [0, -0.06, -0.015]);
  } else if (config.hairStyleId === 'ponytail') {
    addMesh(headGroup, new THREE.SphereGeometry(0.05, 10, 10), clayMat(0xe87b8b, 0.6), [0, 0.07, -0.19]);
    addMesh(headGroup, new THREE.CapsuleGeometry(0.06, 0.19, 8, 12), hairMat, [0, -0.03, -0.24], [0.42, 0, 0]);
  } else if (config.hairStyleId === 'wavy') {
    addMesh(headGroup, new THREE.CapsuleGeometry(0.065, 0.28, 8, 12), hairMat, [-0.15, -0.14, -0.05], [0.05, 0, 0.14]);
    addMesh(headGroup, new THREE.CapsuleGeometry(0.065, 0.28, 8, 12), hairMat, [0.15, -0.14, -0.05], [0.05, 0, -0.14]);
    addMesh(headGroup, new THREE.BoxGeometry(0.28, 0.34, 0.11), hairMat, [0, -0.15, -0.14]);
  } else if (config.hairStyleId === 'messy_short') {
    addMesh(headGroup, new THREE.SphereGeometry(0.07, 10, 10), hairMat, [-0.07, 0.18, 0.02]);
    addMesh(headGroup, new THREE.SphereGeometry(0.065, 10, 10), hairMat, [0.08, 0.17, -0.02]);
    addMesh(headGroup, new THREE.SphereGeometry(0.16, 14, 12), hairMat, [0, -0.01, -0.07]);
  } else if (config.hairStyleId === 'twintails') {
    for (const s of [-1, 1]) {
      addMesh(headGroup, new THREE.SphereGeometry(0.036, 10, 10), clayMat(0xfbbf24, 0.5), [s * 0.18, 0.06, -0.05]);
      addMesh(headGroup, new THREE.CapsuleGeometry(0.055, 0.2, 8, 10), hairMat, [s * 0.22, -0.08, -0.07], [0.1, 0, s * -0.24]);
    }
  }

  // 7. Glasses
  if (config.glassesId !== 'glasses_none') {
    const gDef = AVATAR_ITEM_MAP[config.glassesId];
    const frameMat = clayMat(gDef?.primaryHex ?? '#2F333B', 0.3, 0.45);
    const lensMat = new THREE.MeshStandardMaterial({
      color: gDef?.secondaryHex ?? '#E0F2FE',
      transparent: true,
      opacity: config.glassesId === 'glasses_tinted_amber' ? 0.55 : 0.28,
      roughness: 0.15,
    });

    for (const s of [-1, 1]) {
      if (config.glassesId === 'glasses_square_black') {
        addMesh(headGroup, new THREE.BoxGeometry(0.09, 0.07, 0.016), frameMat, [s * 0.068, -0.005, 0.182]);
        addMesh(headGroup, new THREE.BoxGeometry(0.072, 0.052, 0.018), lensMat, [s * 0.068, -0.005, 0.183]);
      } else {
        addMesh(headGroup, new THREE.TorusGeometry(0.044, 0.007, 8, 18), frameMat, [s * 0.068, -0.005, 0.184]);
        addMesh(headGroup, new THREE.CylinderGeometry(0.04, 0.04, 0.006, 16), lensMat, [s * 0.068, -0.005, 0.184], [Math.PI / 2, 0, 0]);
      }
    }
    addMesh(headGroup, new THREE.BoxGeometry(0.045, 0.009, 0.01), frameMat, [0, 0.002, 0.185]);
  }

  // 8. Headwear
  if (config.headwearId !== 'head_none') {
    const hDef = AVATAR_ITEM_MAP[config.headwearId];
    const hatPrimary = clayMat(hDef?.primaryHex ?? '#EB8F9C', 0.84);
    const hatSecondary = clayMat(hDef?.secondaryHex ?? '#D1707E', 0.84);

    if (config.headwearId === 'head_beret_pink' || config.headwearId === 'head_beret_navy') {
      const beret = new THREE.Group();
      beret.position.set(0.02, 0.17, -0.01);
      beret.rotation.set(-0.08, 0, -0.18);
      addMesh(beret, new THREE.SphereGeometry(0.185, 18, 12), hatPrimary, [0, 0.02, 0], undefined, [1.1, 0.42, 1.05]);
      addMesh(beret, new THREE.TorusGeometry(0.14, 0.024, 8, 20), hatSecondary, [0, -0.03, 0], [Math.PI / 2, 0, 0]);
      addMesh(beret, new THREE.CylinderGeometry(0.01, 0.012, 0.04, 8), hatSecondary, [0, 0.1, 0]);
      headGroup.add(beret);
    } else if (config.headwearId === 'head_beanie_mustard') {
      addMesh(headGroup, new THREE.SphereGeometry(0.2, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), hatPrimary, [0, 0.07, -0.01]);
      addMesh(headGroup, new THREE.TorusGeometry(0.185, 0.035, 8, 22), hatSecondary, [0, 0.1, 0], [Math.PI / 2 - 0.12, 0, 0]);
      addMesh(headGroup, new THREE.SphereGeometry(0.045, 10, 10), hatSecondary, [0, 0.28, -0.02]);
    } else if (config.headwearId === 'head_cat_ears') {
      addMesh(headGroup, new THREE.TorusGeometry(0.182, 0.016, 8, 20, Math.PI), hatPrimary, [0, 0.06, 0.01]);
      for (const s of [-1, 1]) {
        addMesh(headGroup, new THREE.ConeGeometry(0.055, 0.1, 4), hatPrimary, [s * 0.11, 0.22, 0.02], [0, 0, s * -0.35]);
        addMesh(headGroup, new THREE.ConeGeometry(0.03, 0.06, 4), hatSecondary, [s * 0.11, 0.21, 0.035], [0, 0, s * -0.35]);
      }
    } else if (config.headwearId === 'head_cap_cobalt') {
      addMesh(headGroup, new THREE.SphereGeometry(0.198, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.52), hatPrimary, [0, 0.065, -0.01]);
      addMesh(headGroup, new THREE.CylinderGeometry(0.18, 0.2, 0.018, 18, 1, false, -Math.PI * 0.4, Math.PI * 0.8), hatSecondary, [0, 0.09, 0.11], [0.15, 0, 0]);
    }
  }

  root.add(headGroup);
  return root;
}
