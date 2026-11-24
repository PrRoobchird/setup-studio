import * as THREE from 'three';
import { FLOOR_MAP, WALL_MAP } from '../data/catalog';

export function detectSoftwareWebGL(gl: WebGLRenderingContext | WebGL2RenderingContext): boolean {
  try {
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return false;
    const rendererStr = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '');
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(rendererStr);
  } catch {
    return false;
  }
}

export function disposeObject3D(root: THREE.Object3D): void {
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.Points) {
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const mat of mats) {
        if (!mat) continue;
        const m = mat as THREE.MeshStandardMaterial & Record<string, unknown>;
        for (const key of ['map', 'roughnessMap', 'bumpMap', 'normalMap', 'emissiveMap']) {
          const tex = m[key];
          if (tex && tex instanceof THREE.Texture) {
            tex.dispose();
          }
        }
        mat.dispose();
      }
    }
  });
}

function finalizeTexture(
  canvas: HTMLCanvasElement,
  anisotropy: number,
  repeatX = 1,
  repeatY = 1
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.max(1, Math.min(8, anisotropy));
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.needsUpdate = true;
  return tex;
}

export function createFloorTexture(floorThemeId: string, anisotropy = 4): THREE.CanvasTexture {
  const theme = FLOOR_MAP[floorThemeId] ?? FLOOR_MAP.japanese_oak;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return finalizeTexture(canvas, anisotropy);

  ctx.fillStyle = theme.tileA;
  ctx.fillRect(0, 0, 512, 512);

  if (floorThemeId === 'studio_grid' || floorThemeId === 'concrete_atelier') {
    const step = 128;
    for (let y = 0; y < 512; y += step) {
      for (let x = 0; x < 512; x += step) {
        ctx.fillStyle = ((x / step + y / step) % 2 === 0) ? theme.tileA : theme.tileB;
        ctx.fillRect(x, y, step, step);
        ctx.strokeStyle = theme.borderColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(x + 1.5, y + 1.5, step - 3, step - 3);
      }
    }
    if (floorThemeId === 'concrete_atelier') {
      for (let i = 0; i < 650; i++) {
        ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(40,45,55,0.06)';
        ctx.fillRect((i * 73) % 512, (i * 137) % 512, 3, 3);
      }
    }
  } else {
    // Wooden plank rows matching Setup Dream Room
    const rows = 8;
    const rowH = 512 / rows;
    for (let r = 0; r < rows; r++) {
      const y = r * rowH;
      const offset = (r % 2) * 160;
      const plankW = 256;
      for (let c = -1; c < 3; c++) {
        const x = c * plankW + offset;
        ctx.fillStyle = (r + c) % 2 === 0 ? theme.tileA : theme.tileB;
        ctx.fillRect(x, y, plankW, rowH);

        // Soft wood grain streaks
        ctx.strokeStyle = 'rgba(110, 68, 32, 0.08)';
        ctx.lineWidth = 2;
        for (let g = 1; g <= 3; g++) {
          ctx.beginPath();
          const gy = y + (rowH / 4) * g;
          ctx.moveTo(x + 8, gy);
          ctx.bezierCurveTo(x + 80, gy - 3, x + 170, gy + 3, x + plankW - 8, gy);
          ctx.stroke();
        }

        ctx.strokeStyle = theme.borderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, plankW, rowH);
      }
    }
  }

  return finalizeTexture(canvas, anisotropy, 2, 2);
}

export function createWallTexture(wallThemeId: string, anisotropy = 4): THREE.CanvasTexture {
  const theme = WALL_MAP[wallThemeId] ?? WALL_MAP.warm_ivory;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return finalizeTexture(canvas, anisotropy);

  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, theme.leftWall);
  grad.addColorStop(1, theme.rightWall);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Delicate matte plaster vertical brush subtlety
  for (let i = 0; i < 420; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.09)' : 'rgba(130,105,80,0.03)';
    ctx.fillRect((i * 59) % 512, (i * 113) % 512, 18, 2);
  }

  return finalizeTexture(canvas, anisotropy, 1, 1);
}

export function createBauhausArtTexture(anisotropy = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');
  if (!ctx) return finalizeTexture(canvas, anisotropy);

  // Cream canvas ground
  ctx.fillStyle = '#FBF5EA';
  ctx.fillRect(0, 0, 256, 320);

  // Geometric modernist blocks inspired by Setup Dream Room wall art
  ctx.fillStyle = '#2B5B84';
  ctx.fillRect(18, 22, 110, 145);

  ctx.fillStyle = '#E5AE3C';
  ctx.beginPath();
  ctx.moveTo(118, 18);
  ctx.lineTo(234, 48);
  ctx.lineTo(212, 195);
  ctx.lineTo(94, 155);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#D65745';
  ctx.beginPath();
  ctx.moveTo(30, 180);
  ctx.lineTo(155, 130);
  ctx.lineTo(132, 290);
  ctx.lineTo(24, 290);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#EAB854';
  ctx.beginPath();
  ctx.arc(188, 238, 46, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#273444';
  ctx.fillRect(114, 72, 24, 185);

  return finalizeTexture(canvas, anisotropy);
}

export function createWovenRugTexture(anisotropy = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return finalizeTexture(canvas, anisotropy);

  const cx = 256;
  const cy = 256;
  const rings = [
    { r: 248, color: '#EAAC8B' },
    { r: 215, color: '#F9EEDB' },
    { r: 175, color: '#E8A587' },
    { r: 132, color: '#FBF2E3' },
    { r: 82, color: '#E59C7E' },
  ];

  for (const ring of rings) {
    ctx.fillStyle = ring.color;
    ctx.beginPath();
    ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
    ctx.fill();
  }

  return finalizeTexture(canvas, anisotropy);
}

export function createCertificateTexture(anisotropy = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');
  if (!ctx) return finalizeTexture(canvas, anisotropy);

  ctx.fillStyle = '#FFFDF7';
  ctx.fillRect(0, 0, 256, 320);

  ctx.strokeStyle = '#C9973E';
  ctx.lineWidth = 10;
  ctx.strokeRect(18, 18, 220, 284);

  ctx.fillStyle = '#1F2937';
  ctx.fillRect(46, 56, 164, 14);
  ctx.fillStyle = '#6B7280';
  ctx.fillRect(62, 92, 132, 8);
  ctx.fillRect(54, 114, 148, 8);
  ctx.fillRect(70, 136, 116, 8);

  // Gold seal
  ctx.fillStyle = '#D97706';
  ctx.beginPath();
  ctx.arc(128, 224, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FDE68A';
  ctx.beginPath();
  ctx.arc(128, 224, 18, 0, Math.PI * 2);
  ctx.fill();

  return finalizeTexture(canvas, anisotropy);
}
