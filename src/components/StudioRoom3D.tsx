import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { WALL_MAP } from '../data/catalog';
import { buildAvatar3D } from '../three/buildAvatar';
import { buildFurniture3D } from '../three/buildFurniture';
import {
  createBauhausArtTexture,
  createFloorTexture,
  createWallTexture,
  detectSoftwareWebGL,
  disposeObject3D,
} from '../three/textures';
import { AvatarConfig, PlacedItem } from '../types/studio';

interface StudioRoom3DProps {
  wallThemeId: string;
  floorThemeId: string;
  placedItems: PlacedItem[];
  avatar: AvatarConfig;
  selectedInstanceId?: string | null;
  pendingItemId?: string | null;
  nightMode?: boolean;
  readOnly?: boolean;
  className?: string;
  onTileClick?: (x: number, y: number) => void;
  onSelectPlaced?: (instanceId: string) => void;
  onAvatarClick?: () => void;
}

const GRID_SIZE = 5;
const CELL_SIZE = 1.15;
const ROOM_SPAN = GRID_SIZE * CELL_SIZE; // 5.75
const HALF_SPAN = ROOM_SPAN / 2; // 2.875
const WALL_HEIGHT = 3.15;
const WALL_THICK = 0.22;
const SLAB_THICK = 0.34;

function cellToWorld(x: number, y: number): [number, number] {
  return [(x - 2) * CELL_SIZE, (y - 2) * CELL_SIZE];
}

function findAvatarTile(placedItems: PlacedItem[]): { x: number; y: number } {
  const occupied = new Set(placedItems.map((p) => `${p.x},${p.y}`));
  const preferred: [number, number][] = [
    [2, 2],
    [2, 3],
    [1, 2],
    [3, 2],
    [2, 1],
    [3, 3],
    [1, 3],
    [3, 1],
    [1, 1],
  ];
  for (const [px, py] of preferred) {
    if (!occupied.has(`${px},${py}`)) return { x: px, y: py };
  }
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (!occupied.has(`${x},${y}`)) return { x, y };
    }
  }
  return { x: 2, y: 3 };
}

export const StudioRoom3D: React.FC<StudioRoom3DProps> = ({
  wallThemeId,
  floorThemeId,
  placedItems,
  avatar,
  selectedInstanceId = null,
  pendingItemId = null,
  nightMode = false,
  readOnly = false,
  className = '',
  onTileClick,
  onSelectPlaced,
  onAvatarClick,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [contextLost, setContextLost] = useState(false);

  // Latest props in refs for raycasting & RAF loop without recreating WebGLRenderer
  const callbacksRef = useRef({
    onTileClick,
    onSelectPlaced,
    onAvatarClick,
    readOnly,
    pendingItemId,
    selectedInstanceId,
  });
  callbacksRef.current = {
    onTileClick,
    onSelectPlaced,
    onAvatarClick,
    readOnly,
    pendingItemId,
    selectedInstanceId,
  };

  // Mutable Three.js scene group handles
  const handlesRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.OrthographicCamera;
    controls: OrbitControls;
    shellGroup: THREE.Group;
    furnitureGroup: THREE.Group;
    avatarHolder: THREE.Group;
    gridOverlays: THREE.Mesh[];
    sunLight: THREE.DirectionalLight;
    hemiLight: THREE.HemisphereLight;
    fillLight: THREE.DirectionalLight;
    exteriorSkyMat: THREE.MeshBasicMaterial;
    windowGlowMat: THREE.MeshBasicMaterial;
    avatarGroup: THREE.Group | null;
    isSoftwareGl: boolean;
    needsRender: boolean;
  } | null>(null);

  // 1. Initialize WebGLRenderer, Scene, Camera, OrbitControls once
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 300);

    const probeCanvas = document.createElement('canvas');
    const probeGl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
    const isSoftwareGl = probeGl ? detectSoftwareWebGL(probeGl) : false;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    renderer.shadowMap.enabled = !isSoftwareGl;
    if (!isSoftwareGl) {
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    // Soft PBR environment bounce via RoomEnvironment
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    scene.environmentIntensity = 0.45;
    pmrem.dispose();

    // Orthographic camera tuned to Setup Dream Room isometric framing
    const aspect = width / height;
    const frustum = 4.55;
    const camera = new THREE.OrthographicCamera(
      -frustum * aspect,
      frustum * aspect,
      frustum,
      -frustum,
      0.1,
      60
    );
    camera.position.set(11.4, 9.8, 11.4);
    camera.lookAt(0, 1.05, 0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.05, 0);
    controls.enablePan = false;
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.08;
    controls.minZoom = 0.72;
    controls.maxZoom = 1.55;
    controls.minPolarAngle = 0.45;
    controls.maxPolarAngle = 1.24;
    controls.minAzimuthAngle = 0.25;
    controls.maxAzimuthAngle = 1.32;
    controls.update();

    // Lighting rig: Exterior sunlight streaming through right-wall window mullions
    const hemiLight = new THREE.HemisphereLight(0xfff4e6, 0x8f6b54, 0.9);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff1d6, 2.2);
    // Outside right wall (z = -HALF_SPAN) shining diagonally down onto wooden floor
    sunLight.position.set(1.9, 6.2, -7.8);
    sunLight.target.position.set(-0.2, 0.0, 0.6);
    scene.add(sunLight.target);
    sunLight.castShadow = !isSoftwareGl;
    if (!isSoftwareGl) {
      sunLight.shadow.mapSize.set(1024, 1024);
      sunLight.shadow.camera.near = 1;
      sunLight.shadow.camera.far = 22;
      sunLight.shadow.camera.left = -5.2;
      sunLight.shadow.camera.right = 5.2;
      sunLight.shadow.camera.top = 5.2;
      sunLight.shadow.camera.bottom = -5.2;
      sunLight.shadow.bias = -0.0006;
      sunLight.shadow.normalBias = 0.025;
    }
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0xffe6cc, 0.52);
    fillLight.position.set(-6, 5, 7);
    scene.add(fillLight);

    // Stage shadow catcher beneath the floating diorama slab (casts Setup Dream Room stage shadow)
    const shadowCatcher = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 24),
      new THREE.ShadowMaterial({ opacity: 0.24 })
    );
    shadowCatcher.rotation.x = -Math.PI / 2;
    shadowCatcher.position.y = -SLAB_THICK - 0.01;
    shadowCatcher.receiveShadow = true;
    scene.add(shadowCatcher);

    // Diorama root groups
    const shellGroup = new THREE.Group();
    const furnitureGroup = new THREE.Group();
    const avatarHolder = new THREE.Group();
    scene.add(shellGroup);
    scene.add(furnitureGroup);
    scene.add(avatarHolder);

    // Exterior pastel backdrop card visible through window
    const exteriorGroup = new THREE.Group();
    const exteriorSkyMat = new THREE.MeshBasicMaterial({ color: 0xfbe5cf });
    const skyBackdrop = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.6), exteriorSkyMat);
    skyBackdrop.position.set(0.35, 1.75, -HALF_SPAN - 1.35);
    exteriorGroup.add(skyBackdrop);

    const buildingColors = [0xebc7b1, 0xd4b6a7, 0xf2d5be];
    const windowGlowMat = new THREE.MeshBasicMaterial({ color: 0xffe4a0 });
    buildingColors.forEach((col, i) => {
      const b = new THREE.Mesh(
        new THREE.BoxGeometry(0.58, 1.3 + (i % 2) * 0.45, 0.3),
        new THREE.MeshStandardMaterial({ color: col, roughness: 0.9 })
      );
      b.position.set(-0.3 + i * 0.68, 1.25, -HALF_SPAN - 0.85);
      exteriorGroup.add(b);
    });
    scene.add(exteriorGroup);

    // 5x5 interactive tile overlays just above floor
    const gridOverlays: THREE.Mesh[] = [];
    for (let gy = 0; gy < GRID_SIZE; gy++) {
      for (let gx = 0; gx < GRID_SIZE; gx++) {
        const [wx, wz] = cellToWorld(gx, gy);
        const tileMesh = new THREE.Mesh(
          new THREE.PlaneGeometry(CELL_SIZE * 0.9, CELL_SIZE * 0.9),
          new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.0,
            depthWrite: false,
          })
        );
        tileMesh.rotation.x = -Math.PI / 2;
        tileMesh.position.set(wx, 0.012, wz);
        tileMesh.userData = { tileX: gx, tileY: gy };
        scene.add(tileMesh);
        gridOverlays.push(tileMesh);
      }
    }

    handlesRef.current = {
      renderer,
      scene,
      camera,
      controls,
      shellGroup,
      furnitureGroup,
      avatarHolder,
      gridOverlays,
      sunLight,
      hemiLight,
      fillLight,
      exteriorSkyMat,
      windowGlowMat,
      avatarGroup: null,
      isSoftwareGl,
      needsRender: true,
    };

    const handleControlChange = () => {
      if (handlesRef.current) handlesRef.current.needsRender = true;
    };
    controls.addEventListener('change', handleControlChange);

    // ResizeObserver for crisp responsive orthographic bounds
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !handlesRef.current) return;
      const w = Math.max(container.clientWidth, 260);
      const h = Math.max(container.clientHeight, 260);
      const asp = w / h;
      camera.left = -frustum * asp;
      camera.right = frustum * asp;
      camera.top = frustum;
      camera.bottom = -frustum;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      handlesRef.current.needsRender = true;
    });
    resizeObserver.observe(container);

    // Raycast click + hover detection (distinguish click from OrbitControls drag)
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downX = 0;
    let downY = 0;
    let hoveredTile: { x: number; y: number } | null = null;

    const getPointerNdc = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (callbacksRef.current.readOnly) return;
      getPointerNdc(e);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(gridOverlays, false);
      const nextTile =
        hits.length > 0
          ? {
              x: hits[0].object.userData.tileX as number,
              y: hits[0].object.userData.tileY as number,
            }
          : null;
      if (nextTile?.x !== hoveredTile?.x || nextTile?.y !== hoveredTile?.y) {
        hoveredTile = nextTile;
        gridOverlays.forEach((m) => {
          const mat = m.material as THREE.MeshBasicMaterial;
          const isHover =
            hoveredTile !== null &&
            m.userData.tileX === hoveredTile.x &&
            m.userData.tileY === hoveredTile.y;
          const isPending = Boolean(callbacksRef.current.pendingItemId);
          if (isHover && (isPending || callbacksRef.current.selectedInstanceId)) {
            mat.color.setHex(0x60a5fa);
            mat.opacity = 0.28;
          } else if (isPending) {
            mat.color.setHex(0x93c5fd);
            mat.opacity = 0.1;
          } else {
            mat.opacity = 0.0;
          }
        });
        if (handlesRef.current) handlesRef.current.needsRender = true;
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      const dist = Math.hypot(e.clientX - downX, e.clientY - downY);
      if (dist > 6) return; // Was an orbit drag

      getPointerNdc(e);
      raycaster.setFromCamera(pointer, camera);

      // 1. Check avatar click first
      if (callbacksRef.current.onAvatarClick) {
        const avHits = raycaster.intersectObjects(avatarHolder.children, true);
        if (avHits.length > 0) {
          callbacksRef.current.onAvatarClick();
          return;
        }
      }

      if (callbacksRef.current.readOnly) return;

      // 2. When placing or moving, clicking a tile takes priority if pending or moving
      if (callbacksRef.current.pendingItemId || callbacksRef.current.selectedInstanceId) {
        const tileHits = raycaster.intersectObjects(gridOverlays, false);
        if (tileHits.length > 0 && callbacksRef.current.onTileClick) {
          const tx = tileHits[0].object.userData.tileX as number;
          const ty = tileHits[0].object.userData.tileY as number;
          callbacksRef.current.onTileClick(tx, ty);
          return;
        }
      }

      // 3. Check furniture click
      const furnHits = raycaster.intersectObjects(furnitureGroup.children, true);
      if (furnHits.length > 0 && callbacksRef.current.onSelectPlaced) {
        let obj: THREE.Object3D | null = furnHits[0].object;
        while (obj && !obj.userData.instanceId) {
          obj = obj.parent;
        }
        if (obj?.userData.instanceId) {
          callbacksRef.current.onSelectPlaced(obj.userData.instanceId as string);
          return;
        }
      }

      // 4. Fallback tile click
      const tileHits = raycaster.intersectObjects(gridOverlays, false);
      if (tileHits.length > 0 && callbacksRef.current.onTileClick) {
        const tx = tileHits[0].object.userData.tileX as number;
        const ty = tileHits[0].object.userData.tileY as number;
        callbacksRef.current.onTileClick(tx, ty);
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    const onContextLost = (ev: Event) => {
      ev.preventDefault();
      setContextLost(true);
    };
    const onContextRestored = () => {
      setContextLost(false);
      if (handlesRef.current) handlesRef.current.needsRender = true;
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    // Animation loop with Software WebGL pacing guard
    let rafId = 0;
    let timerId: number | null = null;
    let cancelled = false;
    const startTime = performance.now();

    const tick = () => {
      if (cancelled) return;
      const h = handlesRef.current;
      if (!h) return;

      const elapsed = (performance.now() - startTime) * 0.001;
      if (h.avatarGroup) {
        h.avatarGroup.position.y = Math.sin(elapsed * 2.2) * 0.015;
      }

      controls.update();
      renderer.render(scene, camera);
      h.needsRender = false;

      if (isSoftwareGl) {
        const gl = renderer.getContext() as WebGL2RenderingContext;
        if (typeof gl.fenceSync === 'function') {
          const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
          gl.flush();
          if (sync) gl.deleteSync(sync);
        }
        timerId = window.setTimeout(() => {
          if (!cancelled) rafId = requestAnimationFrame(tick);
        }, 80);
      } else {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      if (timerId !== null) clearTimeout(timerId);
      resizeObserver.disconnect();
      controls.removeEventListener('change', handleControlChange);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      controls.dispose();
      disposeObject3D(scene);
      envTarget.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      handlesRef.current = null;
    };
  }, []);

  // 2. Rebuild Room Shell (Walls, Floor, Door, Bauhaus Art, Open Window with Mullions) when theme changes
  useEffect(() => {
    const h = handlesRef.current;
    if (!h) return;
    disposeObject3D(h.shellGroup);
    h.shellGroup.clear();

    const maxAniso = h.renderer.capabilities.getMaxAnisotropy();
    const wallTheme = WALL_MAP[wallThemeId] ?? WALL_MAP.warm_ivory;
    const floorTex = createFloorTexture(floorThemeId, maxAniso);
    const wallTex = createWallTexture(wallThemeId, maxAniso);

    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.72,
      metalness: 0.04,
    });
    const slabMat = new THREE.MeshStandardMaterial({
      color: wallTheme.trimColor,
      roughness: 0.85,
      metalness: 0.02,
    });
    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      roughness: 0.88,
      metalness: 0.01,
    });
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0xf7f2eb,
      roughness: 0.7,
    });

    // Cutaway floor slab
    const floorSlab = new THREE.Mesh(
      new THREE.BoxGeometry(ROOM_SPAN + WALL_THICK, SLAB_THICK, ROOM_SPAN + WALL_THICK),
      [slabMat, slabMat, floorMat, slabMat, slabMat, slabMat]
    );
    floorSlab.position.set(-WALL_THICK / 2, -SLAB_THICK / 2, -WALL_THICK / 2);
    floorSlab.castShadow = true;
    floorSlab.receiveShadow = true;
    h.shellGroup.add(floorSlab);

    // Left Wall (x = -HALF_SPAN - WALL_THICK / 2)
    const leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(WALL_THICK, WALL_HEIGHT, ROOM_SPAN + WALL_THICK),
      wallMat
    );
    leftWall.position.set(-HALF_SPAN - WALL_THICK / 2, WALL_HEIGHT / 2, -WALL_THICK / 2);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    h.shellGroup.add(leftWall);

    // Left Wall Cap
    const leftCap = new THREE.Mesh(
      new THREE.BoxGeometry(WALL_THICK + 0.02, 0.06, ROOM_SPAN + WALL_THICK + 0.02),
      trimMat
    );
    leftCap.position.set(-HALF_SPAN - WALL_THICK / 2, WALL_HEIGHT + 0.03, -WALL_THICK / 2);
    h.shellGroup.add(leftCap);

    // Terracotta-red Door on Left Wall (matching Setup Dream Room!)
    const doorFrameMat = new THREE.MeshStandardMaterial({ color: 0xf6f0e6, roughness: 0.65 });
    const doorLeafMat = new THREE.MeshStandardMaterial({ color: 0xd9482b, roughness: 0.58 });
    const doorKnobMat = new THREE.MeshStandardMaterial({ color: 0xf3e8d6, roughness: 0.28, metalness: 0.45 });

    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.25, 1.25), doorFrameMat);
    doorFrame.position.set(-HALF_SPAN + 0.03, 1.12, 1.55);
    doorFrame.castShadow = true;
    doorFrame.receiveShadow = true;
    h.shellGroup.add(doorFrame);

    const doorLeaf = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.12, 1.08), doorLeafMat);
    doorLeaf.position.set(-HALF_SPAN + 0.055, 1.06, 1.55);
    doorLeaf.castShadow = true;
    doorLeaf.receiveShadow = true;
    h.shellGroup.add(doorLeaf);

    const doorKnob = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 12), doorKnobMat);
    doorKnob.position.set(-HALF_SPAN + 0.1, 1.0, 1.15);
    h.shellGroup.add(doorKnob);

    // Framed Bauhaus Poster on Left Wall
    const artTex = createBauhausArtTexture(maxAniso);
    const frameBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 1.18, 0.92),
      new THREE.MeshStandardMaterial({ color: 0x3a322e, roughness: 0.5 })
    );
    frameBox.position.set(-HALF_SPAN + 0.025, 1.95, -0.75);
    frameBox.castShadow = true;
    h.shellGroup.add(frameBox);

    const artPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8, 1.06),
      new THREE.MeshStandardMaterial({ map: artTex, roughness: 0.72 })
    );
    artPlane.rotation.y = Math.PI / 2;
    artPlane.position.set(-HALF_SPAN + 0.055, 1.95, -0.75);
    h.shellGroup.add(artPlane);

    // Right Wall (z = -HALF_SPAN - WALL_THICK / 2) with REAL RECTANGULAR WINDOW CUTOUT
    // Window spans x in [-0.75, 1.45] (width 2.2), y in [0.95, 2.55] (height 1.6)
    const wz = -HALF_SPAN - WALL_THICK / 2;
    const winLeft = -0.75;
    const winRight = 1.45;
    const winBot = 0.95;
    const winTop = 2.55;

    const addWallSeg = (x1: number, x2: number, y1: number, y2: number) => {
      const w = x2 - x1;
      const ht = y2 - y1;
      if (w <= 0 || ht <= 0) return;
      const seg = new THREE.Mesh(new THREE.BoxGeometry(w, ht, WALL_THICK), wallMat);
      seg.position.set((x1 + x2) / 2, (y1 + y2) / 2, wz);
      seg.castShadow = true;
      seg.receiveShadow = true;
      h.shellGroup.add(seg);
    };

    addWallSeg(-HALF_SPAN, winLeft, 0, WALL_HEIGHT);
    addWallSeg(winRight, HALF_SPAN, 0, WALL_HEIGHT);
    addWallSeg(winLeft, winRight, 0, winBot);
    addWallSeg(winLeft, winRight, winTop, WALL_HEIGHT);

    // Right Wall Cap
    const rightCap = new THREE.Mesh(
      new THREE.BoxGeometry(ROOM_SPAN + 0.02, 0.06, WALL_THICK + 0.02),
      trimMat
    );
    rightCap.position.set(0, WALL_HEIGHT + 0.03, wz);
    h.shellGroup.add(rightCap);

    // Window Grey Outer Frame & White Mullions (these cast real shadows onto the floor!)
    const winFrameMat = new THREE.MeshStandardMaterial({ color: 0xa29d96, roughness: 0.65 });
    const mullionMat = new THREE.MeshStandardMaterial({ color: 0xfbf8f3, roughness: 0.55 });
    const winW = winRight - winLeft;
    const winH = winTop - winBot;
    const winCx = (winLeft + winRight) / 2;
    const winCy = (winBot + winTop) / 2;

    // Outer sill / jambs
    const sill = new THREE.Mesh(new THREE.BoxGeometry(winW + 0.16, 0.08, WALL_THICK + 0.1), winFrameMat);
    sill.position.set(winCx, winBot, wz + 0.02);
    sill.castShadow = true;
    h.shellGroup.add(sill);

    const header = new THREE.Mesh(new THREE.BoxGeometry(winW + 0.16, 0.08, WALL_THICK + 0.08), winFrameMat);
    header.position.set(winCx, winTop, wz + 0.01);
    header.castShadow = true;
    h.shellGroup.add(header);

    for (const jx of [winLeft, winRight]) {
      const jamb = new THREE.Mesh(new THREE.BoxGeometry(0.08, winH + 0.08, WALL_THICK + 0.08), winFrameMat);
      jamb.position.set(jx, winCy, wz + 0.01);
      jamb.castShadow = true;
      h.shellGroup.add(jamb);
    }

    // Center vertical & horizontal mullions casting crisp window pane shadows
    const vMullion = new THREE.Mesh(new THREE.BoxGeometry(0.06, winH, 0.08), mullionMat);
    vMullion.position.set(winCx, winCy, wz + 0.02);
    vMullion.castShadow = true;
    h.shellGroup.add(vMullion);

    const hMullion = new THREE.Mesh(new THREE.BoxGeometry(winW, 0.06, 0.08), mullionMat);
    hMullion.position.set(winCx, winCy + 0.06, wz + 0.02);
    hMullion.castShadow = true;
    h.shellGroup.add(hMullion);

    // Baseboard trims
    const baseL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.11, ROOM_SPAN), trimMat);
    baseL.position.set(-HALF_SPAN + 0.02, 0.055, 0);
    h.shellGroup.add(baseL);

    const baseR = new THREE.Mesh(new THREE.BoxGeometry(ROOM_SPAN, 0.11, 0.04), trimMat);
    baseR.position.set(0, 0.055, -HALF_SPAN + 0.02);
    h.shellGroup.add(baseR);

    h.needsRender = true;
  }, [wallThemeId, floorThemeId]);

  // 3. Rebuild Placed Furniture + Selection Rings
  useEffect(() => {
    const h = handlesRef.current;
    if (!h) return;
    disposeObject3D(h.furnitureGroup);
    h.furnitureGroup.clear();

    for (const item of placedItems) {
      const model = buildFurniture3D(item.itemId, nightMode);
      const [wx, wz] = cellToWorld(item.x, item.y);
      model.position.set(wx, 0, wz);
      const rotStep = item.rotationStep ?? (item.flipped ? 1 : 0);
      model.rotation.y = (rotStep * Math.PI) / 2;
      model.userData.instanceId = item.instanceId;
      h.furnitureGroup.add(model);

      if (selectedInstanceId === item.instanceId && !readOnly) {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.46, 0.54, 32),
          new THREE.MeshBasicMaterial({
            color: 0x2563eb,
            side: THREE.DoubleSide,
          })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(wx, 0.02, wz);
        h.furnitureGroup.add(ring);
      }
    }

    h.needsRender = true;
  }, [placedItems, selectedInstanceId, nightMode, readOnly]);

  // 4. Rebuild 3D Student Avatar at open tile
  useEffect(() => {
    const h = handlesRef.current;
    if (!h) return;
    disposeObject3D(h.avatarHolder);
    h.avatarHolder.clear();

    const tile = findAvatarTile(placedItems);
    const [ax, az] = cellToWorld(tile.x, tile.y);
    const av = buildAvatar3D(avatar);
    av.position.set(ax, 0, az);
    av.rotation.y = Math.PI * 0.25;
    h.avatarHolder.add(av);
    h.avatarGroup = av;
    h.needsRender = true;
  }, [avatar, placedItems]);

  // 5. Update Day / Cozy Night Lighting Mode
  useEffect(() => {
    const h = handlesRef.current;
    if (!h) return;
    if (nightMode) {
      h.sunLight.color.setHex(0x88a8ff);
      h.sunLight.intensity = 0.65;
      h.hemiLight.color.setHex(0x6977b5);
      h.hemiLight.groundColor.setHex(0x3a2d44);
      h.hemiLight.intensity = 0.55;
      h.fillLight.intensity = 0.25;
      h.exteriorSkyMat.color.setHex(0x283056);
    } else {
      h.sunLight.color.setHex(0xfff1d6);
      h.sunLight.intensity = 2.25;
      h.hemiLight.color.setHex(0xfff4e6);
      h.hemiLight.groundColor.setHex(0x8f6b54);
      h.hemiLight.intensity = 0.92;
      h.fillLight.intensity = 0.52;
      h.exteriorSkyMat.color.setHex(0xfbe5cf);
    }
    h.needsRender = true;
  }, [nightMode]);

  // 6. Update Pending / Selection overlay visibility when state changes
  useEffect(() => {
    const h = handlesRef.current;
    if (!h) return;
    h.gridOverlays.forEach((m) => {
      const mat = m.material as THREE.MeshBasicMaterial;
      if (pendingItemId && !readOnly) {
        mat.color.setHex(0x93c5fd);
        mat.opacity = 0.11;
      } else {
        mat.opacity = 0;
      }
    });
    h.needsRender = true;
  }, [pendingItemId, selectedInstanceId, readOnly]);

  if (contextLost) {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-2xl text-white/90 text-sm p-6 text-center ${className}`}
      >
        <p className="font-semibold">กำลังกู้คืนการแสดงผล 3D...</p>
        <p className="text-xs text-white/70 mt-1">
          หากยังไม่แสดงผลอัตโนมัติ ลองรีเฟรชหน้าเว็บสักครู่นะ
        </p>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      className={`w-full h-full select-none touch-none ${
        readOnly ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
      } ${className}`}
      aria-label="ห้องสตูดิโอ 3 มิติ"
    />
  );
};
