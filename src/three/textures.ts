import * as THREE from 'three';
import { FLOOR_MAP, WALL_MAP, WINDOW_VIEW_MAP } from '../data/catalog';

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

export function createFrameArtworkTexture(
  imageDataUrl: string | null | undefined,
  orientation: 'landscape' | 'portrait',
  anisotropy = 4,
  onLoaded?: () => void
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = orientation === 'landscape' ? 512 : 384;
  canvas.height = orientation === 'landscape' ? 352 : 512;
  const ctx = canvas.getContext('2d');

  const drawPlaceholder = () => {
    if (!ctx) return;
    ctx.fillStyle = '#FBF7F0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const pad = 26;
    ctx.fillStyle = '#EFE8DB';
    ctx.fillRect(pad, pad, canvas.width - pad * 2, canvas.height - pad * 2);

    ctx.strokeStyle = '#D6CBB8';
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 8]);
    ctx.strokeRect(pad + 12, pad + 12, canvas.width - (pad + 12) * 2, canvas.height - (pad + 12) * 2);
    ctx.setLineDash([]);

    ctx.fillStyle = '#8C7E6E';
    ctx.font = '600 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('แตะเพื่อใส่ผลงาน', canvas.width / 2, canvas.height / 2);
  };

  drawPlaceholder();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.max(1, Math.min(8, anisotropy));
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;

  if (imageDataUrl && ctx) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const matPad = 20;
      ctx.fillStyle = '#FAF6EE';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const innerW = canvas.width - matPad * 2;
      const innerH = canvas.height - matPad * 2;
      const scale = Math.max(innerW / img.width, innerH / img.height);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const dx = matPad + (innerW - drawW) / 2;
      const dy = matPad + (innerH - drawH) / 2;

      ctx.save();
      ctx.beginPath();
      ctx.rect(matPad, matPad, innerW, innerH);
      ctx.clip();
      ctx.drawImage(img, dx, dy, drawW, drawH);
      ctx.restore();

      ctx.strokeStyle = 'rgba(60, 45, 30, 0.14)';
      ctx.lineWidth = 3;
      ctx.strokeRect(matPad, matPad, innerW, innerH);

      tex.needsUpdate = true;
      onLoaded?.();
    };
    img.src = imageDataUrl;
  }

  return tex;
}

export function createSnowflakeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.45, 'rgba(240, 248, 255, 0.85)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function drawWindowViewScene(
  canvas: HTMLCanvasElement,
  viewId: string,
  nightMode: boolean,
  isSnowSeason: boolean
): void {
  const view = WINDOW_VIEW_MAP[viewId] ?? WINDOW_VIEW_MAP.city_warm;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  ctx.save();
  ctx.scale(w / 512, h / 360);

  const grad = ctx.createLinearGradient(0, 0, 0, 360);
  if (isSnowSeason && !nightMode && viewId === 'city_warm') {
    grad.addColorStop(0, '#C7DDF4');
    grad.addColorStop(1, '#F1F5FB');
  } else {
    grad.addColorStop(0, nightMode ? view.nightSkyTop : view.skyTop);
    grad.addColorStop(1, nightMode ? view.nightSkyBottom : view.skyBottom);
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 360);

  // Stars if night mode or starry_aurora or christmas_window
  if (nightMode || viewId === 'starry_aurora' || viewId === 'christmas_window') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    for (let i = 0; i < 48; i++) {
      const sx = (i * 97 + 23) % 500;
      const sy = (i * 53 + 17) % 190;
      const r = i % 4 === 0 ? 2 : 1.1;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Soft clouds in daytime (except night/aurora/christmas)
  if (!nightMode && viewId !== 'starry_aurora' && viewId !== 'christmas_window') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    for (const [cx, cy, rw] of [
      [115, 76, 46],
      [152, 70, 34],
      [365, 92, 54],
      [405, 86, 36],
    ]) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, rw, 16, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (viewId === 'highrise_skyline') {
    const towers = [
      { x: 30, w: 62, h: 210, c: nightMode ? '#1E293B' : '#8FA8C8' },
      { x: 102, w: 74, h: 255, c: nightMode ? '#27354F' : '#7C98BA' },
      { x: 186, w: 58, h: 185, c: nightMode ? '#1B2436' : '#A4BBD4' },
      { x: 254, w: 86, h: 278, c: nightMode ? '#2D3E5E' : '#6A89B0' },
      { x: 350, w: 68, h: 225, c: nightMode ? '#212D45' : '#96B0CD' },
      { x: 426, w: 64, h: 190, c: nightMode ? '#182235' : '#829EC0' },
    ];
    for (const t of towers) {
      const topY = 360 - t.h;
      ctx.fillStyle = t.c;
      ctx.fillRect(t.x, topY, t.w, t.h);
      ctx.fillStyle = nightMode ? 'rgba(253, 224, 71, 0.78)' : 'rgba(255, 255, 255, 0.45)';
      for (let wy = topY + 14; wy < 340; wy += 20) {
        for (let wx = t.x + 10; wx < t.x + t.w - 14; wx += 14) {
          if ((wx + wy) % 3 !== 0) {
            ctx.fillRect(wx, wy, 7, 10);
          }
        }
      }
    }
  } else if (viewId === 'beach_ocean') {
    // Sun/Moon
    ctx.fillStyle = nightMode ? '#FEF3C7' : '#FDE047';
    ctx.beginPath();
    ctx.arc(380, 92, 28, 0, Math.PI * 2);
    ctx.fill();
    // Ocean horizon
    ctx.fillStyle = nightMode ? '#1D4E6E' : '#0EA5E9';
    ctx.fillRect(0, 200, 512, 95);
    // White sea foam waves
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 3;
    for (let y = 218; y <= 278; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(140, y - 6, 320, y + 6, 512, y - 2);
      ctx.stroke();
    }
    // Golden sandy beach
    ctx.fillStyle = nightMode ? '#7C6952' : '#F6D59A';
    ctx.beginPath();
    ctx.moveTo(0, 286);
    ctx.quadraticCurveTo(240, 265, 512, 294);
    ctx.lineTo(512, 360);
    ctx.lineTo(0, 360);
    ctx.closePath();
    ctx.fill();
    // Palm tree left
    ctx.strokeStyle = nightMode ? '#3F2E21' : '#7C4F2B';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(72, 360);
    ctx.quadraticCurveTo(85, 230, 118, 165);
    ctx.stroke();
    ctx.fillStyle = nightMode ? '#1F4A38' : '#16A34A';
    for (const ang of [-2.4, -1.6, -0.7, 0.2, 0.9]) {
      ctx.beginPath();
      ctx.ellipse(
        118 + Math.cos(ang) * 32,
        165 + Math.sin(ang) * 18,
        34,
        10,
        ang,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  } else if (viewId === 'snow_mountain') {
    const drawPeak = (x1: number, xp: number, x2: number, yp: number, bodyCol: string, snowCol: string) => {
      ctx.fillStyle = bodyCol;
      ctx.beginPath();
      ctx.moveTo(x1, 360);
      ctx.lineTo(xp, yp);
      ctx.lineTo(x2, 360);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = snowCol;
      ctx.beginPath();
      ctx.moveTo(xp, yp);
      ctx.lineTo(xp - (xp - x1) * 0.34, yp + (360 - yp) * 0.34);
      ctx.lineTo(xp - 10, yp + (360 - yp) * 0.28);
      ctx.lineTo(xp + 12, yp + (360 - yp) * 0.37);
      ctx.lineTo(xp + (x2 - xp) * 0.34, yp + (360 - yp) * 0.34);
      ctx.closePath();
      ctx.fill();
    };
    drawPeak(-20, 145, 310, 120, nightMode ? '#3E5172' : '#7FA0C4', '#F8FAFC');
    drawPeak(190, 365, 530, 95, nightMode ? '#324361' : '#6A8DB5', '#FFFFFF');
    ctx.fillStyle = nightMode ? '#CBD5E1' : '#F1F5F9';
    ctx.fillRect(0, 295, 512, 65);
    for (let px = 30; px < 500; px += 48) {
      ctx.fillStyle = nightMode ? '#1E3A34' : '#2D6A4F';
      ctx.beginPath();
      ctx.moveTo(px, 265);
      ctx.lineTo(px - 18, 322);
      ctx.lineTo(px + 18, 322);
      ctx.closePath();
      ctx.fill();
    }
  } else if (viewId === 'nature_forest') {
    ctx.fillStyle = nightMode ? '#224137' : '#84B899';
    ctx.beginPath();
    ctx.moveTo(0, 240);
    ctx.quadraticCurveTo(140, 180, 290, 230);
    ctx.quadraticCurveTo(420, 265, 512, 200);
    ctx.lineTo(512, 360);
    ctx.lineTo(0, 360);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = nightMode ? '#183329' : '#4C8C68';
    ctx.beginPath();
    ctx.moveTo(0, 278);
    ctx.quadraticCurveTo(180, 235, 350, 272);
    ctx.quadraticCurveTo(445, 292, 512, 255);
    ctx.lineTo(512, 360);
    ctx.lineTo(0, 360);
    ctx.closePath();
    ctx.fill();

    for (let tx = 24; tx < 500; tx += 40) {
      const th = 48 + ((tx * 17) % 30);
      ctx.fillStyle = nightMode ? '#13281F' : '#2D6A4F';
      ctx.beginPath();
      ctx.moveTo(tx, 340 - th);
      ctx.lineTo(tx - 20, 340);
      ctx.lineTo(tx + 20, 340);
      ctx.closePath();
      ctx.fill();
    }
  } else if (viewId === 'sakura_park') {
    ctx.fillStyle = nightMode ? '#273D35' : '#B7DFBE';
    ctx.fillRect(0, 255, 512, 105);
    ctx.fillStyle = nightMode ? '#33486B' : '#93C5FD';
    ctx.fillRect(0, 288, 512, 36);
    for (const [tx, ty] of [
      [110, 180],
      [395, 168],
      [255, 202],
    ]) {
      ctx.strokeStyle = '#5C4033';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(tx, 290);
      ctx.lineTo(tx, ty + 20);
      ctx.stroke();
      for (const [ox, oy, r, col] of [
        [0, 0, 44, '#F9A8D4'],
        [-28, 12, 32, '#FBCFE8'],
        [28, 10, 34, '#F472B6'],
      ] as const) {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(tx + ox, ty + oy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.fillStyle = '#FDF2F8';
    for (let i = 0; i < 24; i++) {
      ctx.beginPath();
      ctx.ellipse((i * 71) % 500, (i * 43 + 40) % 280, 4, 2.2, i * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (viewId === 'starry_aurora') {
    const aur = ctx.createLinearGradient(0, 50, 512, 200);
    aur.addColorStop(0, 'rgba(52, 211, 153, 0.15)');
    aur.addColorStop(0.5, 'rgba(45, 212, 191, 0.55)');
    aur.addColorStop(1, 'rgba(167, 139, 250, 0.4)');
    ctx.fillStyle = aur;
    ctx.beginPath();
    ctx.moveTo(0, 140);
    ctx.bezierCurveTo(130, 55, 310, 195, 512, 95);
    ctx.lineTo(512, 175);
    ctx.bezierCurveTo(320, 235, 140, 115, 0, 195);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.moveTo(0, 360);
    ctx.lineTo(95, 225);
    ctx.lineTo(220, 285);
    ctx.lineTo(355, 210);
    ctx.lineTo(512, 275);
    ctx.lineTo(512, 360);
    ctx.closePath();
    ctx.fill();
  } else if (viewId === 'christmas_window') {
    // Glowing moon
    ctx.fillStyle = nightMode ? '#FEF3C7' : '#FFFBEB';
    ctx.beginPath();
    ctx.arc(410, 76, 26, 0, Math.PI * 2);
    ctx.fill();

    // Distant snowy hills
    ctx.fillStyle = nightMode ? '#293C61' : '#C9DDF4';
    ctx.beginPath();
    ctx.moveTo(0, 240);
    ctx.quadraticCurveTo(150, 195, 310, 232);
    ctx.quadraticCurveTo(430, 252, 512, 212);
    ctx.lineTo(512, 360);
    ctx.lineTo(0, 360);
    ctx.closePath();
    ctx.fill();

    // Foreground snowy ground
    ctx.fillStyle = nightMode ? '#CBD5E1' : '#F8FAFC';
    ctx.beginPath();
    ctx.moveTo(0, 276);
    ctx.quadraticCurveTo(220, 250, 512, 282);
    ctx.lineTo(512, 360);
    ctx.lineTo(0, 360);
    ctx.closePath();
    ctx.fill();

    // Cozy warm-lit wooden chalet on left-midground
    ctx.fillStyle = nightMode ? '#4A3123' : '#7C4D34';
    ctx.fillRect(198, 226, 88, 60);
    // Snowy gabled roof
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(186, 230);
    ctx.lineTo(242, 184);
    ctx.lineTo(298, 230);
    ctx.closePath();
    ctx.fill();
    // Chimney
    ctx.fillStyle = '#991B1B';
    ctx.fillRect(262, 190, 12, 24);
    // Warm amber cottage windows & door
    ctx.fillStyle = '#FBBF24';
    ctx.fillRect(212, 244, 20, 18);
    ctx.fillRect(252, 244, 20, 18);
    ctx.fillStyle = '#FDE68A';
    ctx.fillRect(236, 256, 12, 30);

    // Helper for decorated Christmas pine trees
    const drawXmasTree = (tx: number, baseY: number, scale: number, isHero: boolean) => {
      // Trunk
      ctx.fillStyle = '#5C3A21';
      ctx.fillRect(tx - 8 * scale, baseY - 18 * scale, 16 * scale, 22 * scale);

      const tiers = [
        { topY: baseY - 148 * scale, botY: baseY - 82 * scale, halfW: 32 * scale },
        { topY: baseY - 108 * scale, botY: baseY - 46 * scale, halfW: 46 * scale },
        { topY: baseY - 72 * scale, botY: baseY - 14 * scale, halfW: 58 * scale },
      ];
      for (const tier of tiers) {
        ctx.fillStyle = nightMode ? '#14452F' : '#1B5E3F';
        ctx.beginPath();
        ctx.moveTo(tx, tier.topY);
        ctx.lineTo(tx - tier.halfW, tier.botY);
        ctx.lineTo(tx + tier.halfW, tier.botY);
        ctx.closePath();
        ctx.fill();

        // Snow fringe on boughs
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath();
        ctx.moveTo(tx, tier.topY);
        ctx.lineTo(tx - tier.halfW * 0.36, tier.topY + (tier.botY - tier.topY) * 0.34);
        ctx.lineTo(tx + tier.halfW * 0.36, tier.topY + (tier.botY - tier.topY) * 0.34);
        ctx.closePath();
        ctx.fill();
      }

      if (isHero) {
        // Golden star topper
        ctx.fillStyle = '#FACC15';
        ctx.beginPath();
        ctx.arc(tx, baseY - 154 * scale, 8 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Colorful ornaments & warm fairy lights
        const ornaments = [
          [-14, -96, '#EF4444'],
          [12, -88, '#FACC15'],
          [-24, -60, '#FACC15'],
          [4, -56, '#EF4444'],
          [24, -52, '#38BDF8'],
          [-32, -26, '#EF4444'],
          [-8, -24, '#FDE047'],
          [18, -28, '#EF4444'],
          [34, -22, '#FACC15'],
        ] as const;
        for (const [ox, oy, col] of ornaments) {
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(tx + ox * scale, baseY + oy * scale, 4.5 * scale, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    drawXmasTree(86, 315, 1.05, true);
    drawXmasTree(416, 322, 1.15, true);
    drawXmasTree(334, 286, 0.58, false);

    // Gentle festive snowflakes always visible on Christmas view
    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    for (let i = 0; i < 42; i++) {
      ctx.beginPath();
      ctx.arc((i * 83 + 17) % 512, (i * 59 + 11) % 344, (i % 3) + 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // city_warm default Setup Dream Room skyline
    const cols = nightMode
      ? ['#3A446E', '#2F385B', '#48527D']
      : ['#EBC7B1', '#D9BBAE', '#F2D5BE'];
    for (let i = 0; i < 6; i++) {
      const bw = 72;
      const bh = 140 + (i % 3) * 42;
      const bx = 18 + i * 80;
      ctx.fillStyle = cols[i % cols.length];
      ctx.fillRect(bx, 360 - bh, bw, bh);
      if (nightMode) {
        ctx.fillStyle = 'rgba(253, 230, 138, 0.72)';
        for (let wy = 360 - bh + 18; wy < 340; wy += 24) {
          ctx.fillRect(bx + 14, wy, 14, 12);
          ctx.fillRect(bx + 42, wy, 14, 12);
        }
      }
    }
  }

  // Subtle snow overlay on ground/window in Dec 1-31
  if (isSnowSeason && viewId !== 'christmas_window') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.fillRect(0, 338, 512, 22);
    for (let i = 0; i < 32; i++) {
      ctx.beginPath();
      ctx.arc((i * 83) % 512, (i * 59) % 340, (i % 3) + 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

export function createWindowViewTexture(
  viewId: string,
  nightMode: boolean,
  isSnowSeason: boolean,
  anisotropy = 4
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 360;
  drawWindowViewScene(canvas, viewId, nightMode, isSnowSeason);
  return finalizeTexture(canvas, anisotropy, 1, 1);
}

export function sculptClayGeo<T extends THREE.BufferGeometry>(geo: T, amp = 0.0024): T {
  const pos = geo.attributes.position;
  if (!pos) return geo;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const ripple =
      Math.sin(x * 24 + y * 17) * Math.cos(z * 21 - y * 13) * amp +
      Math.sin(y * 34 + z * 27) * (amp * 0.42);
    const len = Math.hypot(x, y, z);
    if (len > 0.0005) {
      const s = (len + ripple) / len;
      pos.setXYZ(i, x * s, y * s, z * s);
    }
  }
  geo.computeVertexNormals();
  return geo;
}

let cachedClayBumpCanvas: HTMLCanvasElement | null = null;
let cachedTerracottaAlbedoCanvas: HTMLCanvasElement | null = null;
let cachedTerracottaRoughnessCanvas: HTMLCanvasElement | null = null;

function getClayBumpCanvas(): HTMLCanvasElement {
  if (cachedClayBumpCanvas) return cachedClayBumpCanvas;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 256, 256);

    // Organic hand-kneaded clay undulation
    for (let i = 0; i < 74; i++) {
      const x = (i * 97 + 19) % 256;
      const y = (i * 151 + 43) % 256;
      const r = 14 + (i % 5) * 7;
      const g = ctx.createRadialGradient(x, y, 2, x, y, r);
      const bright = i % 2 === 0 ? 'rgba(212,212,212,0.28)' : 'rgba(48,48,48,0.28)';
      g.addColorStop(0, bright);
      g.addColorStop(1, 'rgba(128,128,128,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Handcrafted earthenware finger-smoothing strokes
    ctx.lineCap = 'round';
    for (let i = 0; i < 32; i++) {
      const sx = (i * 71 + 13) % 256;
      const sy = (i * 107 + 29) % 256;
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(196,196,196,0.22)' : 'rgba(62,62,62,0.22)';
      ctx.lineWidth = 2.8 + (i % 3);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(sx + 16, sy - 6 + (i % 12), sx + 32, sy + 4);
      ctx.stroke();
    }

    // Subtle handmade thumbprint / pottery whorl impressions
    const prints = [
      { cx: 64, cy: 70, rx: 34, ry: 48, rot: -0.35 },
      { cx: 186, cy: 62, rx: 30, ry: 42, rot: 0.42 },
      { cx: 124, cy: 174, rx: 38, ry: 52, rot: 0.18 },
      { cx: 214, cy: 204, rx: 28, ry: 40, rot: -0.52 },
      { cx: 42, cy: 206, rx: 26, ry: 38, rot: 0.28 },
    ];

    for (const p of prints) {
      ctx.save();
      ctx.translate(p.cx, p.cy);
      ctx.rotate(p.rot);
      for (let ring = 6; ring <= 40; ring += 5.5) {
        ctx.strokeStyle =
          ring % 11 === 6 ? 'rgba(218, 218, 218, 0.24)' : 'rgba(46, 46, 46, 0.22)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.ellipse(
          Math.sin(ring) * 1.2,
          Math.cos(ring) * 1.2,
          (ring / 40) * p.rx,
          (ring / 40) * p.ry,
          0,
          0.15,
          Math.PI * 1.85
        );
        ctx.stroke();
      }
      ctx.restore();
    }

    // Fine unglazed terracotta pores & earthenware grog micro-pits
    for (let i = 0; i < 1200; i++) {
      const sx = (i * 67 + 11) % 256;
      const sy = (i * 113 + 29) % 256;
      const sz = i % 6 === 0 ? 2.2 : 1.3;
      ctx.fillStyle = i % 3 === 0 ? 'rgba(248,248,248,0.16)' : 'rgba(22,22,22,0.22)';
      ctx.fillRect(sx, sy, sz, sz);
    }
  }

  cachedClayBumpCanvas = canvas;
  return canvas;
}

function getTerracottaSurfaceCanvas(): HTMLCanvasElement {
  if (cachedTerracottaAlbedoCanvas) return cachedTerracottaAlbedoCanvas;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // High-value neutral-warm base so multiplying with any skin/hair/cloth color stays faithful
    ctx.fillStyle = '#FCF7F1';
    ctx.fillRect(0, 0, 256, 256);

    // Subtle kiln-baked mineral mottling
    for (let i = 0; i < 58; i++) {
      const x = (i * 89 + 23) % 256;
      const y = (i * 139 + 37) % 256;
      const r = 18 + (i % 5) * 9;
      const grad = ctx.createRadialGradient(x, y, 2, x, y, r);
      grad.addColorStop(
        0,
        i % 2 === 0 ? 'rgba(232, 198, 174, 0.14)' : 'rgba(255, 252, 246, 0.16)'
      );
      grad.addColorStop(1, 'rgba(252, 247, 241, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fine pottery-sponge & terracotta grog speckles
    for (let i = 0; i < 780; i++) {
      const sx = (i * 59 + 17) % 256;
      const sy = (i * 103 + 31) % 256;
      const sz = i % 7 === 0 ? 2 : 1.3;
      if (i % 5 === 0) {
        ctx.fillStyle = 'rgba(165, 102, 74, 0.13)';
      } else if (i % 3 === 0) {
        ctx.fillStyle = 'rgba(218, 174, 140, 0.14)';
      } else {
        ctx.fillStyle = 'rgba(116, 78, 58, 0.08)';
      }
      ctx.fillRect(sx, sy, sz, sz);
    }
  }

  cachedTerracottaAlbedoCanvas = canvas;
  return canvas;
}

function getTerracottaRoughnessCanvas(): HTMLCanvasElement {
  if (cachedTerracottaRoughnessCanvas) return cachedTerracottaRoughnessCanvas;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Earthy matte biscuit-fired clay roughness (~0.88 - 0.98)
    ctx.fillStyle = '#E8E8E8';
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 64; i++) {
      const x = (i * 83 + 11) % 256;
      const y = (i * 127 + 29) % 256;
      const r = 14 + (i % 4) * 8;
      const grad = ctx.createRadialGradient(x, y, 2, x, y, r);
      grad.addColorStop(0, i % 2 === 0 ? 'rgba(255,255,255,0.22)' : 'rgba(195,195,195,0.22)');
      grad.addColorStop(1, 'rgba(232,232,232,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < 420; i++) {
      const sx = (i * 61 + 19) % 256;
      const sy = (i * 109 + 7) % 256;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(180,180,180,0.18)';
      ctx.fillRect(sx, sy, 2, 2);
    }
  }

  cachedTerracottaRoughnessCanvas = canvas;
  return canvas;
}

export function createPlasticineBumpTexture(repeatX = 2, repeatY = 2): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const tex = new THREE.CanvasTexture(getClayBumpCanvas());
  tex.colorSpace = THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.needsUpdate = true;
  return tex;
}

export function createTerracottaSurfaceTexture(
  repeatX = 2,
  repeatY = 2
): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const tex = new THREE.CanvasTexture(getTerracottaSurfaceCanvas());
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.needsUpdate = true;
  return tex;
}

export function createTerracottaRoughnessTexture(
  repeatX = 2,
  repeatY = 2
): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const tex = new THREE.CanvasTexture(getTerracottaRoughnessCanvas());
  tex.colorSpace = THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.needsUpdate = true;
  return tex;
}

export function createClayStripedTexture(
  baseHex: string,
  stripeHex: string,
  stripePairs = 5
): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, 256, 256);

    const stripeCount = stripePairs * 2;
    const bandH = 256 / stripeCount;
    ctx.fillStyle = stripeHex;
    for (let i = 0; i < stripeCount; i += 2) {
      const y = i * bandH;
      ctx.beginPath();
      ctx.moveTo(0, y + 1.5);
      for (let x = 0; x <= 256; x += 32) {
        ctx.lineTo(x, y + Math.sin(x * 0.05 + i) * 1.4 + 1.5);
      }
      for (let x = 256; x >= 0; x -= 32) {
        ctx.lineTo(x, y + bandH * 0.96 + Math.cos(x * 0.05 + i) * 1.4);
      }
      ctx.closePath();
      ctx.fill();
    }

    // Subtle terracotta earthenware pigment mottling & mineral flecks
    for (let i = 0; i < 360; i++) {
      ctx.fillStyle =
        i % 3 === 0
          ? 'rgba(255,248,238,0.1)'
          : i % 2 === 0
          ? 'rgba(130,78,52,0.09)'
          : 'rgba(85,48,32,0.08)';
      ctx.fillRect((i * 53) % 256, (i * 89) % 256, 2.5, 2);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}




