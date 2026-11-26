import * as THREE from 'three';
import {
  createBauhausArtTexture,
  createCertificateTexture,
  createPlasticineBumpTexture,
  createWovenRugTexture,
  sculptClayGeo,
} from './textures';

function stdMat(
  color: number | string,
  roughness = 0.84,
  metalness = 0.02,
  extra?: THREE.MeshStandardMaterialParameters
): THREE.MeshStandardMaterial {
  const isGlassOrSpecial = extra?.transparent === true || roughness < 0.25;
  const bumpTex = isGlassOrSpecial ? null : createPlasticineBumpTexture(2, 2);
  return new THREE.MeshStandardMaterial({
    color,
    roughness: Math.max(0.7, roughness),
    metalness: Math.min(0.14, metalness),
    ...(bumpTex ? { bumpMap: bumpTex, bumpScale: 0.011 } : {}),
    ...extra,
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

export interface FurnitureLampControl {
  isLit: boolean;
  setLit: (lit: boolean) => void;
}

export function buildFurniture3D(itemId: string, nightMode = false): THREE.Group {
  const group = new THREE.Group();
  group.name = `furniture_${itemId}`;

  switch (itemId) {
    case 'drafting_table': {
      const woodMat = stdMat(0xd5a470, 0.58);
      const legMat = stdMat(0x524b45, 0.35, 0.25);
      const paperMat = stdMat(0xfdfaf4, 0.9);
      const ruleMat = stdMat(0x2563eb, 0.32, 0.1);
      const chairMat = stdMat(0x5c738f, 0.78);

      // 4 legs
      for (const lx of [-0.42, 0.42]) {
        for (const lz of [-0.26, 0.2]) {
          addPart(group, new THREE.CylinderGeometry(0.025, 0.022, 0.62, 10), legMat, [lx, 0.31, lz]);
        }
      }
      // Crossbar
      addPart(group, new THREE.BoxGeometry(0.84, 0.03, 0.03), legMat, [0, 0.18, -0.22]);
      // Tilted drafting board
      const topGroup = new THREE.Group();
      topGroup.position.set(0, 0.65, -0.02);
      topGroup.rotation.x = 0.18;
      addPart(topGroup, new THREE.BoxGeometry(0.98, 0.045, 0.64), woodMat, [0, 0, 0]);
      addPart(topGroup, new THREE.BoxGeometry(0.76, 0.008, 0.48), paperMat, [-0.04, 0.026, 0.02]);
      // Blueprint lines & triangle ruler
      addPart(topGroup, new THREE.BoxGeometry(0.24, 0.012, 0.03), ruleMat, [0.16, 0.032, 0.08], [0, 0.35, 0]);
      addPart(topGroup, new THREE.BoxGeometry(0.18, 0.012, 0.03), ruleMat, [0.22, 0.032, -0.02], [0, -1.2, 0]);
      // Pencil cup
      addPart(topGroup, new THREE.CylinderGeometry(0.035, 0.03, 0.09, 10), stdMat(0xe07a5f, 0.6), [0.36, 0.06, -0.2]);
      group.add(topGroup);

      // Stool in front
      addPart(group, new THREE.CylinderGeometry(0.16, 0.15, 0.05, 16), chairMat, [0, 0.42, 0.36]);
      addPart(group, new THREE.CylinderGeometry(0.025, 0.025, 0.4, 10), legMat, [0, 0.2, 0.36]);
      addPart(group, new THREE.CylinderGeometry(0.18, 0.18, 0.02, 14), legMat, [0, 0.02, 0.36]);
      break;
    }

    case 'model_workbench': {
      const oakMat = stdMat(0xb88655, 0.62);
      const frameMat = stdMat(0x47413c, 0.4, 0.2);
      const matBoard = stdMat(0x2d6a4f, 0.85);
      const modelMat = stdMat(0xf8f3eb, 0.82);

      for (const lx of [-0.44, 0.44]) {
        for (const lz of [-0.26, 0.26]) {
          addPart(group, new THREE.BoxGeometry(0.055, 0.64, 0.055), frameMat, [lx, 0.32, lz]);
        }
      }
      addPart(group, new THREE.BoxGeometry(1.02, 0.06, 0.64), oakMat, [0, 0.66, 0]);
      // Cutting mat
      addPart(group, new THREE.BoxGeometry(0.62, 0.01, 0.42), matBoard, [-0.1, 0.695, 0.02]);
      // Architectural scale model blocks
      addPart(group, new THREE.BoxGeometry(0.24, 0.03, 0.24), stdMat(0xd9cdb8, 0.8), [-0.12, 0.715, 0.02]);
      addPart(group, new THREE.BoxGeometry(0.14, 0.16, 0.12), modelMat, [-0.14, 0.81, 0]);
      addPart(group, new THREE.BoxGeometry(0.09, 0.24, 0.09), modelMat, [-0.04, 0.85, 0.06]);
      // Clay jar & tools
      addPart(group, new THREE.CylinderGeometry(0.055, 0.045, 0.13, 12), stdMat(0xc97b5d, 0.78), [0.3, 0.76, -0.14]);
      addPart(group, new THREE.SphereGeometry(0.05, 12, 10), stdMat(0xd4a373, 0.85), [0.28, 0.73, 0.14]);
      break;
    }

    case 'digital_desk': {
      const deskMat = stdMat(0xf4efe6, 0.55);
      const legMat = stdMat(0x3a3f47, 0.35, 0.25);
      const bezelMat = stdMat(0x23272e, 0.3, 0.35);
      const screenGlow = nightMode ? 1.35 : 0.45;
      const screenMat = new THREE.MeshStandardMaterial({
        color: 0x60a5fa,
        emissive: 0x3b82f6,
        emissiveIntensity: screenGlow,
        roughness: 0.2,
      });

      for (const lx of [-0.44, 0.44]) {
        for (const lz of [-0.24, 0.22]) {
          addPart(group, new THREE.CylinderGeometry(0.024, 0.024, 0.62, 10), legMat, [lx, 0.31, lz]);
        }
      }
      addPart(group, new THREE.BoxGeometry(1.0, 0.045, 0.58), deskMat, [0, 0.64, -0.02]);
      // Dual monitors (wrapped in tilted groups to eliminate coplanar Z-fighting)
      const leftMon = new THREE.Group();
      leftMon.position.set(-0.2, 0.86, -0.16);
      leftMon.rotation.set(0, 0.18, 0);
      addPart(leftMon, new THREE.BoxGeometry(0.42, 0.28, 0.025), bezelMat, [0, 0, 0]);
      addPart(leftMon, new THREE.PlaneGeometry(0.38, 0.24), screenMat, [0, 0, 0.016], undefined, false, false);
      group.add(leftMon);

      const rightMon = new THREE.Group();
      rightMon.position.set(0.22, 0.84, -0.14);
      rightMon.rotation.set(0, -0.22, 0);
      addPart(rightMon, new THREE.BoxGeometry(0.34, 0.24, 0.025), bezelMat, [0, 0, 0]);
      addPart(rightMon, new THREE.PlaneGeometry(0.3, 0.2), screenMat, [0, 0, 0.016], undefined, false, false);
      group.add(rightMon);

      // Monitor stands
      addPart(group, new THREE.CylinderGeometry(0.02, 0.025, 0.14, 8), legMat, [-0.2, 0.72, -0.18]);
      addPart(group, new THREE.CylinderGeometry(0.02, 0.025, 0.14, 8), legMat, [0.22, 0.72, -0.16]);

      // Drawing tablet lying flat with slight ergonomic tilt
      const tabletGroup = new THREE.Group();
      tabletGroup.position.set(0.02, 0.67, 0.1);
      tabletGroup.rotation.set(-0.08, 0, 0);
      addPart(tabletGroup, new THREE.BoxGeometry(0.28, 0.015, 0.18), bezelMat, [0, 0, 0]);
      addPart(tabletGroup, new THREE.BoxGeometry(0.24, 0.006, 0.14), screenMat, [0, 0.008, 0], undefined, false, false);
      group.add(tabletGroup);
      // Ergonomic chair
      addPart(group, new THREE.CylinderGeometry(0.18, 0.18, 0.05, 16), stdMat(0x475569, 0.8), [0, 0.42, 0.36]);
      addPart(group, new THREE.BoxGeometry(0.32, 0.34, 0.05), stdMat(0x475569, 0.8), [0, 0.62, 0.48]);
      addPart(group, new THREE.CylinderGeometry(0.025, 0.025, 0.38, 10), legMat, [0, 0.2, 0.36]);
      if (nightMode) {
        const pt = new THREE.PointLight(0x93c5fd, 0.8, 2.2);
        pt.position.set(0, 0.9, 0.1);
        group.add(pt);
      }
      break;
    }

    case 'bookshelf': {
      const woodMat = stdMat(0xc49566, 0.62);
      const backMat = stdMat(0xa6784b, 0.72);
      // Frame
      addPart(group, new THREE.BoxGeometry(0.86, 1.32, 0.03), backMat, [0, 0.66, -0.17]);
      addPart(group, new THREE.BoxGeometry(0.04, 1.32, 0.36), woodMat, [-0.41, 0.66, 0]);
      addPart(group, new THREE.BoxGeometry(0.04, 1.32, 0.36), woodMat, [0.41, 0.66, 0]);
      for (const sy of [0.04, 0.46, 0.88, 1.3]) {
        addPart(group, new THREE.BoxGeometry(0.86, 0.04, 0.36), woodMat, [0, sy, 0]);
      }
      // Colorful art books
      const bookColors = [0xd65a47, 0x3b6ea5, 0xe4a93b, 0x4e8c6f, 0x8d6cab, 0xe88b68];
      for (let i = 0; i < 6; i++) {
        addPart(
          group,
          new THREE.BoxGeometry(0.055, 0.24 + (i % 3) * 0.03, 0.22),
          stdMat(bookColors[i], 0.76),
          [-0.3 + i * 0.075, 1.02, 0.02]
        );
      }
      for (let i = 0; i < 4; i++) {
        addPart(
          group,
          new THREE.BoxGeometry(0.06, 0.22 + (i % 2) * 0.04, 0.22),
          stdMat(bookColors[(i + 2) % 6], 0.76),
          [0.08 + i * 0.075, 0.59, 0.02]
        );
      }
      // Blueprint rolls on bottom shelf
      for (let r = 0; r < 3; r++) {
        addPart(
          group,
          new THREE.CylinderGeometry(0.035, 0.035, 0.3, 10),
          stdMat(0xf5efe6, 0.85),
          [-0.24 + r * 0.08, 0.12, 0.02],
          [Math.PI / 2, 0, 0]
        );
      }
      // Mini plant on top
      addPart(group, new THREE.CylinderGeometry(0.07, 0.055, 0.11, 12), stdMat(0xc96f52, 0.75), [0.24, 1.37, 0]);
      addPart(group, new THREE.SphereGeometry(0.11, 12, 10), stdMat(0x528f66, 0.78), [0.24, 1.48, 0]);
      break;
    }

    case 'cozy_sofa': {
      const fabricMat = stdMat(0x9aa4b2, 0.88);
      const cushionMat = stdMat(0xe5b293, 0.86);
      const cushionMat2 = stdMat(0xf5ebd8, 0.88);
      const legMat = stdMat(0x7c583a, 0.55);

      for (const lx of [-0.4, 0.4]) {
        for (const lz of [-0.22, 0.22]) {
          addPart(group, new THREE.CylinderGeometry(0.025, 0.018, 0.12, 8), legMat, [lx, 0.06, lz]);
        }
      }
      addPart(group, new THREE.BoxGeometry(0.96, 0.22, 0.56), fabricMat, [0, 0.22, 0]);
      addPart(group, new THREE.BoxGeometry(0.96, 0.44, 0.14), fabricMat, [0, 0.46, -0.21]);
      addPart(group, new THREE.BoxGeometry(0.14, 0.34, 0.56), fabricMat, [-0.41, 0.38, 0]);
      addPart(group, new THREE.BoxGeometry(0.14, 0.34, 0.56), fabricMat, [0.41, 0.38, 0]);
      // Seat cushions + throw pillows
      addPart(group, new THREE.BoxGeometry(0.34, 0.1, 0.44), stdMat(0xaeb7c4, 0.88), [-0.18, 0.35, 0.04]);
      addPart(group, new THREE.BoxGeometry(0.34, 0.1, 0.44), stdMat(0xaeb7c4, 0.88), [0.18, 0.35, 0.04]);
      addPart(group, new THREE.BoxGeometry(0.2, 0.2, 0.09), cushionMat, [-0.22, 0.47, -0.06], [-0.2, 0.2, 0.1]);
      addPart(group, new THREE.BoxGeometry(0.18, 0.18, 0.09), cushionMat2, [0.22, 0.46, -0.06], [-0.2, -0.25, -0.08]);
      break;
    }

    case 'coffee_table': {
      // Nightstand + warm table lamp inspired directly by Setup Dream Room
      const bodyMat = stdMat(0x888179, 0.65);
      const topMat = stdMat(0xf5efe6, 0.52);
      const drawerMat = stdMat(0x756e67, 0.68);
      const knobMat = stdMat(0xe5d3b3, 0.3, 0.45);
      const shadeMat = new THREE.MeshStandardMaterial({
        color: 0xfff3d6,
        emissive: 0xffb85c,
        emissiveIntensity: nightMode ? 1.55 : 0.08,
        roughness: 0.75,
      });

      addPart(group, new THREE.BoxGeometry(0.56, 0.52, 0.48), bodyMat, [0, 0.26, 0]);
      addPart(group, new THREE.BoxGeometry(0.6, 0.04, 0.52), topMat, [0, 0.54, 0]);
      addPart(group, new THREE.BoxGeometry(0.46, 0.18, 0.03), drawerMat, [0, 0.38, 0.24]);
      addPart(group, new THREE.BoxGeometry(0.46, 0.18, 0.03), drawerMat, [0, 0.15, 0.24]);
      addPart(group, new THREE.SphereGeometry(0.025, 10, 10), knobMat, [0, 0.38, 0.265]);
      addPart(group, new THREE.SphereGeometry(0.025, 10, 10), knobMat, [0, 0.15, 0.265]);

      // Lamp base & shade
      addPart(group, new THREE.CylinderGeometry(0.065, 0.085, 0.08, 14), stdMat(0xd4a373, 0.45), [0.05, 0.6, -0.04]);
      addPart(group, new THREE.CylinderGeometry(0.018, 0.018, 0.14, 8), knobMat, [0.05, 0.69, -0.04]);
      addPart(group, new THREE.CylinderGeometry(0.11, 0.15, 0.18, 16), shadeMat, [0.05, 0.81, -0.04]);

      const pt = new THREE.PointLight(0xffbe6b, nightMode ? 1.4 : 0, 3.6);
      pt.position.set(0.05, 0.86, 0.05);
      group.add(pt);

      const lampControl: FurnitureLampControl = {
        isLit: nightMode,
        setLit: (lit: boolean) => {
          lampControl.isLit = lit;
          shadeMat.emissiveIntensity = lit ? (nightMode ? 1.6 : 1.15) : 0.06;
          pt.intensity = lit ? (nightMode ? 1.45 : 0.95) : 0;
        },
      };
      group.userData.lampControl = lampControl;
      break;
    }

    case 'copic_rack': {
      const cabinetMat = stdMat(0xf4efe6, 0.58);
      const woodTopMat = stdMat(0xd29f6c, 0.55);
      addPart(group, new THREE.BoxGeometry(0.84, 0.62, 0.44), cabinetMat, [0, 0.31, 0]);
      addPart(group, new THREE.BoxGeometry(0.88, 0.04, 0.48), woodTopMat, [0, 0.64, 0]);
      // Tiered marker rack
      addPart(group, new THREE.BoxGeometry(0.54, 0.22, 0.18), stdMat(0xffffff, 0.45), [-0.1, 0.77, -0.08]);
      const markerColors = [0xef4444, 0xf59e0b, 0x10b981, 0x3b82f6, 0x8b5cf6, 0xec4899];
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 6; col++) {
          addPart(
            group,
            new THREE.CylinderGeometry(0.018, 0.018, 0.09, 8),
            stdMat(markerColors[(col + row * 2) % 6], 0.35),
            [-0.28 + col * 0.072, 0.76 + row * 0.09, 0.03 + row * -0.05],
            [0.35, 0, 0]
          );
        }
      }
      // Palette & jar
      addPart(group, new THREE.CylinderGeometry(0.045, 0.04, 0.12, 10), stdMat(0x6fa6e8, 0.45), [0.3, 0.72, 0.06]);
      addPart(group, new THREE.CylinderGeometry(0.11, 0.11, 0.015, 16), stdMat(0xfdfaf4, 0.6), [0.24, 0.67, 0.14]);
      break;
    }

    case 'easel': {
      const woodMat = stdMat(0xc9935f, 0.62);
      const canvasMat = stdMat(0xfaf7f0, 0.88);
      const artTex = createBauhausArtTexture(4);
      const paintedMat = new THREE.MeshStandardMaterial({ map: artTex, roughness: 0.72 });

      // Tripod legs
      addPart(group, new THREE.BoxGeometry(0.045, 1.38, 0.045), woodMat, [-0.24, 0.66, 0.08], [0.16, 0, -0.14]);
      addPart(group, new THREE.BoxGeometry(0.045, 1.38, 0.045), woodMat, [0.24, 0.66, 0.08], [0.16, 0, 0.14]);
      addPart(group, new THREE.BoxGeometry(0.045, 1.32, 0.045), woodMat, [0, 0.64, -0.26], [-0.28, 0, 0]);
      // Tray
      addPart(group, new THREE.BoxGeometry(0.64, 0.04, 0.09), woodMat, [0, 0.56, 0.12], [0.15, 0, 0]);
      // Canvas in tilted sub-group so painting plane sits cleanly forward along local +Z
      const canvasGroup = new THREE.Group();
      canvasGroup.position.set(0, 0.92, 0.06);
      canvasGroup.rotation.set(-0.14, 0, 0);
      addPart(canvasGroup, new THREE.BoxGeometry(0.56, 0.68, 0.035), canvasMat, [0, 0, 0]);
      addPart(canvasGroup, new THREE.PlaneGeometry(0.5, 0.62), paintedMat, [0, 0, 0.021], undefined, false, false);
      group.add(canvasGroup);
      break;
    }

    case 'printer_3d': {
      const frameMat = stdMat(0x28323e, 0.35, 0.35);
      const bedMat = stdMat(0x94a3b8, 0.28, 0.5);
      const accentMat = stdMat(0x0f766e, 0.35);
      const modelMat = stdMat(0xf59e0b, 0.45);
      const tableMat = stdMat(0xe5dcd0, 0.65);

      // Stand table
      addPart(group, new THREE.BoxGeometry(0.68, 0.46, 0.58), tableMat, [0, 0.23, 0]);
      // Printer gantry
      addPart(group, new THREE.BoxGeometry(0.52, 0.05, 0.48), frameMat, [0, 0.485, 0]);
      addPart(group, new THREE.BoxGeometry(0.04, 0.54, 0.05), frameMat, [-0.22, 0.77, -0.02]);
      addPart(group, new THREE.BoxGeometry(0.04, 0.54, 0.05), frameMat, [0.22, 0.77, -0.02]);
      addPart(group, new THREE.BoxGeometry(0.48, 0.04, 0.05), frameMat, [0, 1.03, -0.02]);
      // Print bed + filament spool + printed mini vase
      addPart(group, new THREE.BoxGeometry(0.34, 0.025, 0.32), bedMat, [0, 0.52, 0.04]);
      addPart(group, new THREE.TorusGeometry(0.08, 0.025, 10, 18), accentMat, [0, 1.12, -0.04]);
      addPart(group, new THREE.CylinderGeometry(0.05, 0.07, 0.14, 12), modelMat, [0, 0.6, 0.04]);
      // Status glow light
      addPart(
        group,
        new THREE.BoxGeometry(0.32, 0.02, 0.02),
        new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: 0x38bdf8,
          emissiveIntensity: nightMode ? 1.5 : 0.4,
        }),
        [0, 0.99, 0.02]
      );
      if (nightMode) {
        const pt = new THREE.PointLight(0x67e8f9, 0.7, 2.0);
        pt.position.set(0, 0.8, 0.15);
        group.add(pt);
      }
      break;
    }

    case 'blueprint_basket': {
      const basketMat = stdMat(0xc5925d, 0.8);
      const rimMat = stdMat(0x9e6f40, 0.75);
      const rollMat = stdMat(0xfbf8f1, 0.88);
      const blueRollMat = stdMat(0x5282b8, 0.8);

      addPart(group, new THREE.CylinderGeometry(0.24, 0.18, 0.38, 16), basketMat, [0, 0.19, 0]);
      addPart(group, new THREE.TorusGeometry(0.24, 0.022, 8, 20), rimMat, [0, 0.38, 0], [Math.PI / 2, 0, 0]);
      const offsets: [number, number, number, number][] = [
        [-0.08, 0.02, 0.12, 0.08],
        [0.07, -0.04, -0.14, -0.1],
        [0.01, 0.08, -0.05, 0.16],
        [-0.04, -0.08, 0.16, -0.05],
      ];
      offsets.forEach(([ox, oz, rx, rz], idx) => {
        addPart(
          group,
          new THREE.CylinderGeometry(0.04, 0.04, 0.56, 12),
          idx === 1 ? blueRollMat : rollMat,
          [ox, 0.42, oz],
          [rx, 0, rz]
        );
      });
      break;
    }

    case 'sketch_mess': {
      const rugMat = stdMat(0xefe6d8, 0.9);
      const bookMat = stdMat(0xfdfbf7, 0.88);
      const coverMat = stdMat(0xd96b52, 0.72);
      const cupMat = stdMat(0x5f8ab8, 0.5);

      addPart(group, new THREE.CylinderGeometry(0.42, 0.42, 0.015, 24), rugMat, [0, 0.008, 0], undefined, false, true);
      addPart(group, new THREE.BoxGeometry(0.44, 0.02, 0.32), coverMat, [-0.04, 0.025, 0.02], [0, 0.25, 0]);
      addPart(group, new THREE.BoxGeometry(0.4, 0.025, 0.28), bookMat, [-0.04, 0.04, 0.02], [0, 0.25, 0]);
      // Palette & paint tubes
      addPart(group, new THREE.CylinderGeometry(0.13, 0.13, 0.016, 16), stdMat(0xffffff, 0.45), [0.24, 0.025, 0.08]);
      const dotColors = [0xe11d48, 0xf59e0b, 0x2563eb, 0x10b981];
      dotColors.forEach((c, i) => {
        const ang = (i / dotColors.length) * Math.PI * 1.5;
        addPart(group, new THREE.SphereGeometry(0.022, 8, 8), stdMat(c, 0.35), [0.24 + Math.cos(ang) * 0.07, 0.036, 0.08 + Math.sin(ang) * 0.07]);
      });
      addPart(group, new THREE.CylinderGeometry(0.05, 0.042, 0.11, 12), cupMat, [-0.26, 0.07, -0.18]);
      break;
    }

    case 'mannequin': {
      const woodMat = stdMat(0xd9ab7e, 0.56);
      const jointMat = stdMat(0xb68456, 0.62);
      const baseMat = stdMat(0x8d633d, 0.6);

      addPart(group, new THREE.CylinderGeometry(0.18, 0.2, 0.04, 16), baseMat, [0, 0.02, 0]);
      addPart(group, new THREE.CylinderGeometry(0.022, 0.022, 0.48, 8), jointMat, [0, 0.26, 0]);
      // Torso & head
      addPart(group, new THREE.CylinderGeometry(0.13, 0.09, 0.38, 14), woodMat, [0, 0.68, 0]);
      addPart(group, new THREE.SphereGeometry(0.085, 14, 12), woodMat, [0, 0.98, 0]);
      // Posed arms
      addPart(group, new THREE.CylinderGeometry(0.028, 0.024, 0.26, 8), woodMat, [-0.18, 0.74, 0.06], [0.4, 0, 0.45]);
      addPart(group, new THREE.CylinderGeometry(0.028, 0.024, 0.26, 8), woodMat, [0.18, 0.76, -0.04], [-0.3, 0, -0.5]);
      break;
    }

    case 'geometry_pedestal': {
      const pedMat = stdMat(0xece6dc, 0.82);
      const plasterMat = stdMat(0xfaf8f5, 0.85);
      addPart(group, new THREE.BoxGeometry(0.46, 0.64, 0.46), pedMat, [0, 0.32, 0]);
      addPart(group, new THREE.BoxGeometry(0.52, 0.05, 0.52), stdMat(0xf5efe6, 0.75), [0, 0.65, 0]);
      // Still life sphere, cube, cone
      addPart(group, new THREE.SphereGeometry(0.11, 18, 14), plasterMat, [-0.1, 0.78, 0.06]);
      addPart(group, new THREE.BoxGeometry(0.16, 0.16, 0.16), plasterMat, [0.1, 0.75, -0.05], [0, 0.45, 0]);
      addPart(group, new THREE.ConeGeometry(0.09, 0.24, 16), plasterMat, [0.02, 0.79, 0.1]);
      break;
    }

    case 'studio_cat': {
      const catMat = stdMat(0xe79853, 0.76);
      const bellyMat = stdMat(0xfbe8d3, 0.82);
      const bedMat = stdMat(0x7c97b8, 0.88);
      const noseMat = stdMat(0xe87b8b, 0.5);
      const eyeMat = stdMat(0x24201f, 0.2);

      // Cozy round pet cushion
      addPart(group, sculptClayGeo(new THREE.CylinderGeometry(0.32, 0.34, 0.09, 20), 0.002), bedMat, [0, 0.045, 0]);
      addPart(group, sculptClayGeo(new THREE.CylinderGeometry(0.24, 0.26, 0.03, 18), 0.0015), stdMat(0xf5efe6, 0.9), [0, 0.095, 0]);
      // Sitting orange terracotta cat
      addPart(group, sculptClayGeo(new THREE.SphereGeometry(0.14, 16, 14), 0.002), catMat, [0, 0.21, -0.02]);
      addPart(group, sculptClayGeo(new THREE.SphereGeometry(0.105, 16, 14), 0.0015), bellyMat, [0, 0.2, 0.03]);
      addPart(group, sculptClayGeo(new THREE.SphereGeometry(0.115, 16, 14), 0.002), catMat, [0, 0.37, 0.04]);
      // Ears
      addPart(group, new THREE.ConeGeometry(0.042, 0.09, 4), catMat, [-0.07, 0.47, 0.03], [0, 0, 0.28]);
      addPart(group, new THREE.ConeGeometry(0.042, 0.09, 4), catMat, [0.07, 0.47, 0.03], [0, 0, -0.28]);
      // Eyes & nose
      addPart(group, new THREE.SphereGeometry(0.015, 8, 8), eyeMat, [-0.045, 0.38, 0.14]);
      addPart(group, new THREE.SphereGeometry(0.015, 8, 8), eyeMat, [0.045, 0.38, 0.14]);
      addPart(group, new THREE.SphereGeometry(0.014, 8, 8), noseMat, [0, 0.355, 0.15]);
      // Tail curled around
      addPart(group, new THREE.TorusGeometry(0.13, 0.028, 8, 16, Math.PI * 1.15), catMat, [0.03, 0.14, 0.02], [Math.PI / 2, 0, 0.4]);
      break;
    }

    case 'beanbag_yellow':
    case 'beanbag_purple': {
      const mainColor = itemId === 'beanbag_yellow' ? 0xf2b949 : 0xb388eb;
      const trimColor = itemId === 'beanbag_yellow' ? 0xd99b26 : 0x9362d4;
      const beanMat = stdMat(mainColor, 0.9);
      const topMat = stdMat(trimColor, 0.88);

      const base = new THREE.Mesh(new THREE.SphereGeometry(0.36, 20, 16), beanMat);
      base.scale.set(1.08, 0.66, 1.08);
      base.position.set(0, 0.22, 0);
      base.castShadow = true;
      base.receiveShadow = true;
      group.add(base);

      const backRest = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 14), topMat);
      backRest.scale.set(1.0, 0.95, 0.72);
      backRest.position.set(0, 0.36, -0.14);
      backRest.castShadow = true;
      backRest.receiveShadow = true;
      group.add(backRest);
      break;
    }

    case 'monstera': {
      const potMat = stdMat(0xd47b59, 0.76);
      const soilMat = stdMat(0x4b382a, 0.95);
      const leafMat = stdMat(0x3a7d56, 0.64);
      const leafLight = stdMat(0x4d996c, 0.62);

      addPart(group, sculptClayGeo(new THREE.CylinderGeometry(0.18, 0.13, 0.28, 16), 0.0022), potMat, [0, 0.14, 0]);
      addPart(group, new THREE.CylinderGeometry(0.16, 0.16, 0.03, 14), soilMat, [0, 0.27, 0]);
      const leaves: [number, number, number, number, number, number][] = [
        [0, 0.56, 0, 0.2, 0, 0],
        [-0.14, 0.5, 0.08, 0.55, 0.6, 0.45],
        [0.15, 0.52, 0.06, 0.5, -0.7, -0.45],
        [-0.08, 0.48, -0.13, -0.45, 0.4, 0.35],
        [0.1, 0.46, -0.12, -0.5, -0.4, -0.35],
      ];
      leaves.forEach(([x, y, z, rx, ry, rz], idx) => {
        addPart(
          group,
          new THREE.CylinderGeometry(0.012, 0.015, 0.28, 6),
          leafMat,
          [x * 0.5, y - 0.14, z * 0.5],
          [rx * 0.6, ry, rz * 0.6]
        );
        const leaf = new THREE.Mesh(
          sculptClayGeo(new THREE.SphereGeometry(0.14, 12, 10), 0.002),
          idx % 2 === 0 ? leafMat : leafLight
        );
        leaf.scale.set(1.0, 0.18, 1.25);
        leaf.position.set(x, y, z);
        leaf.rotation.set(rx, ry, rz);
        leaf.castShadow = true;
        leaf.receiveShadow = true;
        group.add(leaf);
      });
      break;
    }

    case 'woven_rug': {
      const rugTex = createWovenRugTexture(4);
      const rugMat = new THREE.MeshStandardMaterial({
        map: rugTex,
        roughness: 0.94,
        metalness: 0.0,
      });
      // Circular rug matching Setup Dream Room
      addPart(group, new THREE.CylinderGeometry(0.72, 0.72, 0.018, 32), rugMat, [0, 0.01, 0], undefined, false, true);
      break;
    }

    case 'wall_shelf_paints': {
      const shelfMat = stdMat(0xd19f6a, 0.6);
      const legMat = stdMat(0x524c46, 0.4);
      for (const lx of [-0.3, 0.3]) {
        for (const lz of [-0.14, 0.14]) {
          addPart(group, new THREE.CylinderGeometry(0.016, 0.016, 0.88, 8), legMat, [lx, 0.44, lz]);
        }
      }
      for (const sy of [0.16, 0.48, 0.8]) {
        addPart(group, new THREE.BoxGeometry(0.68, 0.035, 0.34), shelfMat, [0, sy, 0]);
      }
      const jarColors = [0xe11d48, 0xf59e0b, 0x2563eb, 0x10b981, 0x8b5cf6];
      jarColors.forEach((c, i) => {
        addPart(group, new THREE.CylinderGeometry(0.032, 0.032, 0.11, 10), stdMat(c, 0.35), [-0.22 + i * 0.11, 0.55, 0]);
      });
      // Cactus on top
      addPart(group, new THREE.CylinderGeometry(0.06, 0.048, 0.1, 10), stdMat(0xd97b59, 0.78), [0.16, 0.87, 0]);
      addPart(group, new THREE.CapsuleGeometry(0.04, 0.1, 6, 10), stdMat(0x4b9468, 0.75), [0.16, 0.97, 0]);
      addPart(group, new THREE.BoxGeometry(0.24, 0.06, 0.18), stdMat(0x3b6ea5, 0.8), [-0.12, 0.85, 0]);
      break;
    }

    case 'studio_certificate': {
      const standMat = stdMat(0x5b4636, 0.62);
      const frameMat = stdMat(0xc5933e, 0.35, 0.35);
      const certMat = new THREE.MeshStandardMaterial({
        map: createCertificateTexture(4),
        roughness: 0.75,
      });

      addPart(group, new THREE.CylinderGeometry(0.22, 0.24, 0.04, 16), standMat, [0, 0.02, 0]);
      addPart(group, new THREE.CylinderGeometry(0.025, 0.025, 0.78, 10), standMat, [0, 0.41, -0.04]);
      const certGroup = new THREE.Group();
      certGroup.position.set(0, 0.92, 0.02);
      certGroup.rotation.set(-0.12, 0, 0);
      addPart(certGroup, new THREE.BoxGeometry(0.52, 0.62, 0.04), frameMat, [0, 0, 0]);
      addPart(certGroup, new THREE.PlaneGeometry(0.44, 0.54), certMat, [0, 0, 0.024], undefined, false, false);
      group.add(certGroup);
      break;
    }

    case 'bauhaus_poster': {
      const frameMat = stdMat(0x2e2a27, 0.76);
      const legMat = stdMat(0xb88655, 0.8);
      const artMat = new THREE.MeshStandardMaterial({
        map: createBauhausArtTexture(4),
        roughness: 0.85,
      });

      addPart(group, new THREE.BoxGeometry(0.035, 1.05, 0.035), legMat, [-0.18, 0.52, 0.06], [0.12, 0, -0.08]);
      addPart(group, new THREE.BoxGeometry(0.035, 1.05, 0.035), legMat, [0.18, 0.52, 0.06], [0.12, 0, 0.08]);
      addPart(group, new THREE.BoxGeometry(0.035, 1.02, 0.035), legMat, [0, 0.5, -0.2], [-0.24, 0, 0]);
      const posterGroup = new THREE.Group();
      posterGroup.position.set(0, 0.84, 0.04);
      posterGroup.rotation.set(-0.12, 0, 0);
      addPart(posterGroup, new THREE.BoxGeometry(0.54, 0.66, 0.035), frameMat, [0, 0, 0]);
      addPart(posterGroup, new THREE.PlaneGeometry(0.48, 0.6), artMat, [0, 0, 0.021], undefined, false, false);
      group.add(posterGroup);
      break;
    }

    case 'akari_lamp': {
      const legMat = stdMat(0x272522, 0.4, 0.3);
      const paperMat = new THREE.MeshStandardMaterial({
        color: 0xfff8eb,
        emissive: 0xffb347,
        emissiveIntensity: nightMode ? 1.65 : 0.1,
        roughness: 0.88,
      });
      const ribMat = stdMat(0xe5d6bc, 0.85);

      for (let i = 0; i < 3; i++) {
        const ang = (i / 3) * Math.PI * 2;
        addPart(
          group,
          new THREE.CylinderGeometry(0.012, 0.012, 0.44, 8),
          legMat,
          [Math.cos(ang) * 0.14, 0.21, Math.sin(ang) * 0.14],
          [Math.sin(ang) * 0.18, 0, -Math.cos(ang) * 0.18]
        );
      }
      const shade = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 16), paperMat);
      shade.scale.set(0.95, 1.48, 0.95);
      shade.position.set(0, 0.72, 0);
      shade.castShadow = true;
      group.add(shade);
      addPart(group, new THREE.TorusGeometry(0.22, 0.008, 8, 24), ribMat, [0, 0.72, 0], [Math.PI / 2, 0, 0]);

      const pt = new THREE.PointLight(0xffb85c, nightMode ? 1.45 : 0, 3.8);
      pt.position.set(0, 0.74, 0);
      group.add(pt);

      const lampControl: FurnitureLampControl = {
        isLit: nightMode,
        setLit: (lit: boolean) => {
          lampControl.isLit = lit;
          paperMat.emissiveIntensity = lit ? (nightMode ? 1.7 : 1.25) : 0.08;
          pt.intensity = lit ? (nightMode ? 1.5 : 1.0) : 0;
        },
      };
      group.userData.lampControl = lampControl;
      break;
    }

    case 'xmas_tree': {
      const potMat = stdMat(0xb45309, 0.72);
      const trunkMat = stdMat(0x6b4423, 0.85);
      const pineDark = stdMat(0x1f6b43, 0.78);
      const pineLight = stdMat(0x2d8a56, 0.76);
      const starMat = new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        emissive: 0xf59e0b,
        emissiveIntensity: nightMode ? 1.5 : 0.4,
        roughness: 0.25,
        metalness: 0.35,
      });

      addPart(group, new THREE.CylinderGeometry(0.2, 0.15, 0.22, 16), potMat, [0, 0.11, 0]);
      addPart(group, new THREE.CylinderGeometry(0.06, 0.07, 0.2, 12), trunkMat, [0, 0.28, 0]);
      addPart(group, new THREE.ConeGeometry(0.42, 0.5, 18), pineDark, [0, 0.56, 0]);
      addPart(group, new THREE.ConeGeometry(0.34, 0.44, 18), pineLight, [0, 0.82, 0]);
      addPart(group, new THREE.ConeGeometry(0.24, 0.38, 18), pineDark, [0, 1.08, 0]);
      // Golden star topper
      addPart(group, new THREE.OctahedronGeometry(0.08, 0), starMat, [0, 1.32, 0]);

      // Ornaments around tiers
      const orbColors = [0xef4444, 0xfacc15, 0xf8fafc, 0x38bdf8];
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        const tierR = i % 2 === 0 ? 0.31 : 0.22;
        const tierY = i % 2 === 0 ? 0.48 : 0.78;
        const orbMat = new THREE.MeshStandardMaterial({
          color: orbColors[i % orbColors.length],
          emissive: nightMode ? orbColors[i % orbColors.length] : 0x000000,
          emissiveIntensity: nightMode ? 0.65 : 0,
          roughness: 0.25,
          metalness: 0.2,
        });
        addPart(
          group,
          new THREE.SphereGeometry(0.042, 12, 10),
          orbMat,
          [Math.cos(ang) * tierR, tierY, Math.sin(ang) * tierR]
        );
      }
      if (nightMode) {
        const pt = new THREE.PointLight(0xfde68a, 1.25, 3.2);
        pt.position.set(0, 0.95, 0.1);
        group.add(pt);
      }
      break;
    }

    case 'xmas_wreath_stand': {
      const standMat = stdMat(0xc9935f, 0.62);
      const pineMat = stdMat(0x1f7a4c, 0.78);
      const redMat = stdMat(0xdc2626, 0.55);
      const goldMat = stdMat(0xfacc15, 0.35, 0.35);
      const boxGreen = stdMat(0x16a34a, 0.65);

      // Gift boxes stacked on base
      addPart(group, new THREE.BoxGeometry(0.38, 0.24, 0.32), redMat, [-0.12, 0.12, 0.08]);
      addPart(group, new THREE.BoxGeometry(0.39, 0.25, 0.05), goldMat, [-0.12, 0.12, 0.08]);
      addPart(group, new THREE.BoxGeometry(0.28, 0.2, 0.28), boxGreen, [0.18, 0.1, 0.12], [0, 0.25, 0]);
      addPart(group, new THREE.BoxGeometry(0.29, 0.21, 0.045), redMat, [0.18, 0.1, 0.12], [0, 0.25, 0]);
      // Wooden display easel & festive holly wreath
      addPart(group, new THREE.CylinderGeometry(0.025, 0.03, 0.92, 10), standMat, [0, 0.46, -0.14]);
      addPart(group, new THREE.CylinderGeometry(0.18, 0.2, 0.04, 16), standMat, [0, 0.02, -0.14]);
      addPart(group, new THREE.TorusGeometry(0.24, 0.068, 12, 24), pineMat, [0, 0.76, -0.08]);
      addPart(group, new THREE.SphereGeometry(0.045, 10, 10), redMat, [0, 0.54, -0.02]);
      addPart(group, new THREE.SphereGeometry(0.032, 10, 10), goldMat, [-0.18, 0.86, -0.02]);
      addPart(group, new THREE.SphereGeometry(0.032, 10, 10), goldMat, [0.18, 0.86, -0.02]);
      break;
    }

    case 'ny_countdown_lamp': {
      const baseMat = stdMat(0x28313d, 0.38, 0.3);
      const goldMat = new THREE.MeshStandardMaterial({
        color: 0xfde047,
        emissive: 0xf59e0b,
        emissiveIntensity: nightMode ? 1.55 : 0.14,
        roughness: 0.22,
        metalness: 0.45,
      });
      const ringMat = stdMat(0xf4efe6, 0.55);

      addPart(group, new THREE.CylinderGeometry(0.22, 0.26, 0.1, 20), baseMat, [0, 0.05, 0]);
      addPart(group, new THREE.CylinderGeometry(0.028, 0.028, 0.42, 12), baseMat, [0, 0.3, 0]);
      addPart(group, new THREE.TorusGeometry(0.24, 0.026, 12, 28), ringMat, [0, 0.68, 0]);
      addPart(group, new THREE.OctahedronGeometry(0.13, 0), goldMat, [0, 0.68, 0]);
      addPart(group, new THREE.SphereGeometry(0.036, 10, 10), goldMat, [-0.22, 0.82, 0.04]);
      addPart(group, new THREE.SphereGeometry(0.036, 10, 10), goldMat, [0.22, 0.82, -0.04]);

      const pt = new THREE.PointLight(0xfcd34d, nightMode ? 1.45 : 0, 3.6);
      pt.position.set(0, 0.72, 0.1);
      group.add(pt);

      const lampControl: FurnitureLampControl = {
        isLit: nightMode,
        setLit: (lit: boolean) => {
          lampControl.isLit = lit;
          goldMat.emissiveIntensity = lit ? (nightMode ? 1.65 : 1.25) : 0.1;
          pt.intensity = lit ? (nightMode ? 1.5 : 1.0) : 0;
        },
      };
      group.userData.lampControl = lampControl;
      break;
    }

    case 'xmas_snowman_plush': {
      const matRug = stdMat(0xdbeafe, 0.92);
      const snowMat = stdMat(0xf8fafc, 0.88);
      const scarfMat = stdMat(0xdc2626, 0.82);
      const hatMat = stdMat(0x1f2937, 0.68);
      const carrotMat = stdMat(0xf97316, 0.6);
      const eyeMat = stdMat(0x1e293b, 0.25);

      addPart(group, new THREE.CylinderGeometry(0.34, 0.36, 0.025, 24), matRug, [0, 0.012, 0], undefined, false, true);
      addPart(group, new THREE.SphereGeometry(0.2, 20, 16), snowMat, [0, 0.2, 0]);
      addPart(group, new THREE.SphereGeometry(0.145, 20, 16), snowMat, [0, 0.45, 0]);
      // Red knitted scarf
      addPart(group, new THREE.TorusGeometry(0.13, 0.032, 10, 22), scarfMat, [0, 0.34, 0], [Math.PI / 2, 0, 0]);
      addPart(group, new THREE.BoxGeometry(0.055, 0.15, 0.035), scarfMat, [0.08, 0.26, 0.11], [0.2, 0, -0.2]);
      // Top hat
      addPart(group, new THREE.CylinderGeometry(0.14, 0.14, 0.02, 18), hatMat, [0, 0.58, 0]);
      addPart(group, new THREE.CylinderGeometry(0.09, 0.095, 0.13, 18), hatMat, [0, 0.65, 0]);
      addPart(group, new THREE.CylinderGeometry(0.096, 0.096, 0.025, 18), scarfMat, [0, 0.6, 0]);
      // Eyes & carrot nose
      addPart(group, new THREE.SphereGeometry(0.016, 8, 8), eyeMat, [-0.045, 0.47, 0.132]);
      addPart(group, new THREE.SphereGeometry(0.016, 8, 8), eyeMat, [0.045, 0.47, 0.132]);
      addPart(group, new THREE.ConeGeometry(0.018, 0.075, 10), carrotMat, [0, 0.44, 0.16], [Math.PI / 2, 0, 0]);
      break;
    }

    case 'pet_bowl_set': {
      const woodMat = stdMat(0xc7925b, 0.65);
      const ceramicMat = stdMat(0xfaf8f4, 0.35);
      const kibbleMat = stdMat(0x7c4a26, 0.85);
      const waterMat = stdMat(0x38bdf8, 0.18);
      const bottleMat = stdMat(0xe0f2fe, 0.25);

      addPart(group, new THREE.BoxGeometry(0.62, 0.08, 0.32), woodMat, [0, 0.04, 0]);
      addPart(group, new THREE.CylinderGeometry(0.11, 0.09, 0.06, 18), ceramicMat, [-0.15, 0.09, 0]);
      addPart(group, new THREE.SphereGeometry(0.075, 12, 8), kibbleMat, [-0.15, 0.1, 0]);
      addPart(group, new THREE.CylinderGeometry(0.11, 0.09, 0.06, 18), ceramicMat, [0.15, 0.09, 0]);
      addPart(group, new THREE.CylinderGeometry(0.085, 0.085, 0.02, 16), waterMat, [0.15, 0.11, 0]);
      addPart(group, new THREE.CylinderGeometry(0.05, 0.05, 0.22, 14), bottleMat, [0, 0.18, -0.1]);
      break;
    }

    case 'pet_play_tunnel': {
      const tunnelMat = stdMat(0xf472b6, 0.86, 0.02, { side: THREE.DoubleSide });
      const stripeMat = stdMat(0xfde68a, 0.86);
      const ballMat = stdMat(0x38bdf8, 0.76);
      const matBase = stdMat(0xf5efe6, 0.9);

      addPart(group, new THREE.CylinderGeometry(0.42, 0.44, 0.02, 24), matBase, [0, 0.01, 0], undefined, false, true);
      addPart(group, new THREE.CylinderGeometry(0.2, 0.2, 0.62, 20, 1, true), tunnelMat, [0, 0.21, 0], [0, 0, Math.PI / 2]);
      addPart(group, new THREE.TorusGeometry(0.2, 0.024, 10, 22), stripeMat, [-0.31, 0.21, 0], [0, Math.PI / 2, 0]);
      addPart(group, new THREE.TorusGeometry(0.2, 0.024, 10, 22), stripeMat, [0.31, 0.21, 0], [0, Math.PI / 2, 0]);
      addPart(group, sculptClayGeo(new THREE.SphereGeometry(0.08, 14, 14), 0.0018), ballMat, [0.22, 0.08, 0.24]);
      break;
    }

    case 'pet_grooming_cart': {
      const frameMat = stdMat(0x475569, 0.45, 0.25);
      const trayMat = stdMat(0xf8fafc, 0.6);
      const towelMat = stdMat(0x7dd3fc, 0.85);
      const bottleMat = stdMat(0xec4899, 0.4);
      const brushMat = stdMat(0xd99b66, 0.65);

      for (const sx of [-0.24, 0.24]) {
        for (const sz of [-0.16, 0.16]) {
          addPart(group, new THREE.CylinderGeometry(0.018, 0.018, 0.64, 8), frameMat, [sx, 0.34, sz]);
          addPart(group, new THREE.SphereGeometry(0.032, 10, 10), frameMat, [sx, 0.032, sz]);
        }
      }
      addPart(group, new THREE.BoxGeometry(0.54, 0.04, 0.36), trayMat, [0, 0.22, 0]);
      addPart(group, new THREE.BoxGeometry(0.54, 0.04, 0.36), trayMat, [0, 0.56, 0]);
      addPart(group, new THREE.BoxGeometry(0.22, 0.08, 0.2), towelMat, [-0.12, 0.28, 0]);
      addPart(group, new THREE.CylinderGeometry(0.045, 0.045, 0.16, 12), bottleMat, [-0.14, 0.66, 0.04]);
      addPart(group, new THREE.BoxGeometry(0.16, 0.03, 0.08), brushMat, [0.12, 0.6, -0.02]);
      break;
    }

    default: {
      addPart(group, new THREE.BoxGeometry(0.5, 0.5, 0.5), stdMat(0xd4a373, 0.7), [0, 0.25, 0]);
      break;
    }
  }

  return group;
}
