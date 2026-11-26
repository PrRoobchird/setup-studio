import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  PET_BREED_MAP,
  WALL_MAP,
  getOccupiedTileSet,
} from '../data/catalog';
import { AvatarBehaviorController } from '../three/avatarBehavior';
import { buildAvatarRig3D } from '../three/buildAvatar';
import { buildFurniture3D, FurnitureLampControl } from '../three/buildFurniture';
import { AnimatedPetHandle, animatePetHandle, buildPetHabitat3D } from '../three/buildPets';
import {
  createBauhausArtTexture,
  createFloorTexture,
  createFrameArtworkTexture,
  createPlasticineBumpTexture,
  createSnowflakeTexture,
  createWallTexture,
  createWindowViewTexture,
  detectSoftwareWebGL,
  disposeObject3D,
} from '../three/textures';
import {
  AvatarConfig,
  OwnedPet,
  PlacedItem,
  WallFrameArtwork,
  WallFrameType,
} from '../types/studio';

interface StudioRoom3DProps {
  wallThemeId: string;
  floorThemeId: string;
  activeWindowViewId?: string;
  placedItems: PlacedItem[];
  pets?: OwnedPet[];
  avatar: AvatarConfig;
  studioExpanded?: boolean;
  ownedWallFrames?: WallFrameType[];
  wallFrameArtworks?: {
    landscape: WallFrameArtwork | null;
    portrait: WallFrameArtwork | null;
  };
  selectedInstanceId?: string | null;
  selectedPetId?: string | null;
  pendingItemId?: string | null;
  nightMode?: boolean;
  isSnowActive?: boolean;
  isMonochrome?: boolean;
  readOnly?: boolean;
  className?: string;
  onTileClick?: (x: number, y: number) => void;
  onSelectPlaced?: (instanceId: string) => void;
  onPetClick?: (petInstanceId: string) => void;
  onAvatarClick?: () => void;
  onWallFrameClick?: (frameType: WallFrameType) => void;
  onAvatarActivityChange?: (label: string) => void;
}

const CELL_SIZE = 1.15;
const WALL_HEIGHT = 3.15;
const WALL_THICK = 0.22;
const SLAB_THICK = 0.34;

function getGridSize(expanded: boolean): number {
  return expanded ? 7 : 5;
}

function cellToWorld(x: number, y: number, gridSize: number): [number, number] {
  const centerOffset = (gridSize - 1) / 2;
  return [(x - centerOffset) * CELL_SIZE, (y - centerOffset) * CELL_SIZE];
}

function findAvatarTile(
  placedItems: PlacedItem[],
  pets: OwnedPet[],
  gridSize: number
): { x: number; y: number } {
  const occupied = getOccupiedTileSet(placedItems, pets);
  const center = Math.floor(gridSize / 2);
  const preferred: [number, number][] = [
    [center, center],
    [center, center + 1],
    [center - 1, center],
    [center + 1, center],
    [center, center - 1],
    [center + 1, center + 1],
    [center - 1, center + 1],
    [center + 1, center - 1],
    [center - 1, center - 1],
  ];
  for (const [px, py] of preferred) {
    if (px >= 0 && py >= 0 && px < gridSize && py < gridSize && !occupied.has(`${px},${py}`)) {
      return { x: px, y: py };
    }
  }
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (!occupied.has(`${x},${y}`)) return { x, y };
    }
  }
  return { x: center, y: Math.min(gridSize - 1, center + 1) };
}

export const StudioRoom3D: React.FC<StudioRoom3DProps> = ({
  wallThemeId,
  floorThemeId,
  activeWindowViewId = 'city_warm',
  placedItems,
  pets = [],
  avatar,
  studioExpanded = false,
  ownedWallFrames = [],
  wallFrameArtworks = { landscape: null, portrait: null },
  selectedInstanceId = null,
  selectedPetId = null,
  pendingItemId = null,
  nightMode = false,
  isSnowActive = false,
  isMonochrome = false,
  readOnly = false,
  className = '',
  onTileClick,
  onSelectPlaced,
  onPetClick,
  onAvatarClick,
  onWallFrameClick,
  onAvatarActivityChange,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [contextLost, setContextLost] = useState(false);

  const callbacksRef = useRef({
    onTileClick,
    onSelectPlaced,
    onPetClick,
    onAvatarClick,
    onWallFrameClick,
    onAvatarActivityChange,
    readOnly,
    pendingItemId,
    selectedInstanceId,
    selectedPetId,
    studioExpanded,
  });
  callbacksRef.current = {
    onTileClick,
    onSelectPlaced,
    onPetClick,
    onAvatarClick,
    onWallFrameClick,
    onAvatarActivityChange,
    readOnly,
    pendingItemId,
    selectedInstanceId,
    selectedPetId,
    studioExpanded,
  };

  const handlesRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.OrthographicCamera;
    controls: OrbitControls;
    shellGroup: THREE.Group;
    wallFramesGroup: THREE.Group;
    furnitureGroup: THREE.Group;
    petsGroup: THREE.Group;
    avatarHolder: THREE.Group;
    gridGroup: THREE.Group;
    exteriorGroup: THREE.Group;
    snowGroup: THREE.Group;
    snowPoints: THREE.Points;
    snowSeeds: Float32Array;
    skyBackdrop: THREE.Mesh;
    gridOverlays: THREE.Mesh[];
    sunLight: THREE.DirectionalLight;
    hemiLight: THREE.HemisphereLight;
    fillLight: THREE.DirectionalLight;
    exteriorSkyMat: THREE.MeshBasicMaterial;
    avatarController: AvatarBehaviorController | null;
    lampControls: Map<string, FurnitureLampControl>;
    lampStateOverrides: Map<string, boolean>;
    lastNightMode: boolean;
    petAnims: AnimatedPetHandle[];
    frustum: number;
    halfSpan: number;
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

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    scene.environmentIntensity = 0.34;
    pmrem.dispose();

    const initialFrustum = callbacksRef.current.studioExpanded ? 6.0 : 4.55;
    const aspect = width / height;
    const camera = new THREE.OrthographicCamera(
      -initialFrustum * aspect,
      initialFrustum * aspect,
      initialFrustum,
      -initialFrustum,
      0.1,
      70
    );
    camera.position.set(12.2, 10.4, 12.2);
    camera.lookAt(0, 1.05, 0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.05, 0);
    controls.enablePan = false;
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.08;
    controls.minZoom = 0.68;
    controls.maxZoom = 1.6;
    controls.minPolarAngle = 0.45;
    controls.maxPolarAngle = 1.24;
    controls.minAzimuthAngle = 0.25;
    controls.maxAzimuthAngle = 1.32;
    controls.update();

    const hemiLight = new THREE.HemisphereLight(0xfff4e6, 0x8f6b54, 0.9);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff1d6, 2.2);
    sunLight.position.set(2.2, 6.8, -8.5);
    sunLight.target.position.set(-0.2, 0.0, 0.6);
    scene.add(sunLight.target);
    sunLight.castShadow = !isSoftwareGl;
    if (!isSoftwareGl) {
      sunLight.shadow.mapSize.set(1024, 1024);
      sunLight.shadow.camera.near = 1;
      sunLight.shadow.camera.far = 26;
      sunLight.shadow.camera.left = -6.8;
      sunLight.shadow.camera.right = 6.8;
      sunLight.shadow.camera.top = 6.8;
      sunLight.shadow.camera.bottom = -6.8;
      sunLight.shadow.bias = -0.0006;
      sunLight.shadow.normalBias = 0.025;
    }
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0xffe6cc, 0.52);
    fillLight.position.set(-6, 5, 7);
    scene.add(fillLight);

    const shadowCatcher = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.ShadowMaterial({ opacity: 0.24 })
    );
    shadowCatcher.rotation.x = -Math.PI / 2;
    shadowCatcher.position.y = -SLAB_THICK - 0.01;
    shadowCatcher.receiveShadow = true;
    scene.add(shadowCatcher);

    const shellGroup = new THREE.Group();
    const wallFramesGroup = new THREE.Group();
    const furnitureGroup = new THREE.Group();
    const petsGroup = new THREE.Group();
    const avatarHolder = new THREE.Group();
    const gridGroup = new THREE.Group();
    const exteriorGroup = new THREE.Group();
    const snowGroup = new THREE.Group();

    scene.add(shellGroup);
    scene.add(wallFramesGroup);
    scene.add(furnitureGroup);
    scene.add(petsGroup);
    scene.add(avatarHolder);
    scene.add(gridGroup);
    scene.add(exteriorGroup);
    scene.add(snowGroup);

    const exteriorSkyMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const skyBackdrop = new THREE.Mesh(new THREE.PlaneGeometry(2.48, 1.88), exteriorSkyMat);
    exteriorGroup.add(skyBackdrop);

    // Outdoor Falling Snow Particle System (December 1-31 Holiday Atmosphere)
    const snowCount = 240;
    const snowPos = new Float32Array(snowCount * 3);
    const snowSeeds = new Float32Array(snowCount * 2);
    const initialHalfSpan = (getGridSize(callbacksRef.current.studioExpanded) * CELL_SIZE) / 2;
    const outerEdge = initialHalfSpan + 0.65;
    for (let i = 0; i < snowCount; i++) {
      // Distribute snow strictly outside the 5x5 or 7x7 studio perimeter
      const zone = i % 3;
      if (zone === 0) {
        snowPos[i * 3] = (Math.random() - 0.5) * (outerEdge * 2.4);
        snowPos[i * 3 + 2] = -outerEdge - Math.random() * 4.2;
      } else if (zone === 1) {
        snowPos[i * 3] = -outerEdge - Math.random() * 4.2;
        snowPos[i * 3 + 2] = (Math.random() - 0.5) * (outerEdge * 2.4);
      } else {
        snowPos[i * 3] = (Math.random() - 0.5) * (outerEdge * 2.6);
        snowPos[i * 3 + 2] = outerEdge + Math.random() * 2.6;
      }
      snowPos[i * 3 + 1] = Math.random() * 6.5 - 0.5;
      snowSeeds[i * 2] = 0.7 + Math.random() * 0.9;
      snowSeeds[i * 2 + 1] = Math.random() * Math.PI * 2;
    }
    const snowGeo = new THREE.BufferGeometry();
    snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
    const snowTex = createSnowflakeTexture();
    const snowMat = new THREE.PointsMaterial({
      size: 0.24,
      map: snowTex,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      color: 0xffffff,
    });
    const snowPoints = new THREE.Points(snowGeo, snowMat);
    snowGroup.add(snowPoints);
    snowGroup.visible = false;

    handlesRef.current = {
      renderer,
      scene,
      camera,
      controls,
      shellGroup,
      wallFramesGroup,
      furnitureGroup,
      petsGroup,
      avatarHolder,
      gridGroup,
      exteriorGroup,
      snowGroup,
      snowPoints,
      snowSeeds,
      skyBackdrop,
      gridOverlays: [],
      sunLight,
      hemiLight,
      fillLight,
      exteriorSkyMat,
      avatarController: null,
      lampControls: new Map(),
      lampStateOverrides: new Map(),
      lastNightMode: nightMode,
      petAnims: [],
      frustum: initialFrustum,
      halfSpan: initialHalfSpan,
      isSoftwareGl,
      needsRender: true,
    };

    const handleControlChange = () => {
      if (handlesRef.current) handlesRef.current.needsRender = true;
    };
    controls.addEventListener('change', handleControlChange);

    const resizeObserver = new ResizeObserver(() => {
      if (!container || !handlesRef.current) return;
      const w = Math.max(container.clientWidth, 260);
      const h = Math.max(container.clientHeight, 260);
      const asp = w / h;
      const f = handlesRef.current.frustum;
      camera.left = -f * asp;
      camera.right = f * asp;
      camera.top = f;
      camera.bottom = -f;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      handlesRef.current.needsRender = true;
    });
    resizeObserver.observe(container);

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
      if (callbacksRef.current.readOnly || !handlesRef.current) return;
      getPointerNdc(e);
      raycaster.setFromCamera(pointer, camera);
      const overlays = handlesRef.current.gridOverlays;
      const hits = raycaster.intersectObjects(overlays, false);
      const nextTile =
        hits.length > 0
          ? {
              x: hits[0].object.userData.tileX as number,
              y: hits[0].object.userData.tileY as number,
            }
          : null;
      if (nextTile?.x !== hoveredTile?.x || nextTile?.y !== hoveredTile?.y) {
        hoveredTile = nextTile;
        overlays.forEach((m) => {
          const mat = m.material as THREE.MeshBasicMaterial;
          const isHover =
            hoveredTile !== null &&
            m.userData.tileX === hoveredTile.x &&
            m.userData.tileY === hoveredTile.y;
          const isPending = Boolean(callbacksRef.current.pendingItemId);
          const isMoving = Boolean(
            callbacksRef.current.selectedInstanceId || callbacksRef.current.selectedPetId
          );
          if (isHover && (isPending || isMoving)) {
            mat.color.setHex(0x60a5fa);
            mat.opacity = 0.28;
          } else if (isPending) {
            mat.color.setHex(0x93c5fd);
            mat.opacity = 0.1;
          } else {
            mat.opacity = 0.0;
          }
        });
        handlesRef.current.needsRender = true;
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      const dist = Math.hypot(e.clientX - downX, e.clientY - downY);
      if (dist > 6 || !handlesRef.current) return;

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

      // 2. Check custom wall frames click
      if (callbacksRef.current.onWallFrameClick) {
        const frameHits = raycaster.intersectObjects(wallFramesGroup.children, true);
        if (frameHits.length > 0) {
          let obj: THREE.Object3D | null = frameHits[0].object;
          while (obj && !obj.userData.wallFrameType) {
            obj = obj.parent;
          }
          if (obj?.userData.wallFrameType) {
            callbacksRef.current.onWallFrameClick(obj.userData.wallFrameType as WallFrameType);
            return;
          }
        }
      }

      const overlays = handlesRef.current.gridOverlays;

      // 3. When placing or moving, clicking a tile takes priority
      if (
        callbacksRef.current.pendingItemId ||
        callbacksRef.current.selectedInstanceId ||
        callbacksRef.current.selectedPetId
      ) {
        const tileHits = raycaster.intersectObjects(overlays, false);
        if (tileHits.length > 0 && callbacksRef.current.onTileClick) {
          const tx = tileHits[0].object.userData.tileX as number;
          const ty = tileHits[0].object.userData.tileY as number;
          callbacksRef.current.onTileClick(tx, ty);
          return;
        }
      }

      // 4. Check pet habitat click
      const petHits = raycaster.intersectObjects(petsGroup.children, true);
      if (petHits.length > 0 && callbacksRef.current.onPetClick) {
        let obj: THREE.Object3D | null = petHits[0].object;
        while (obj && !obj.userData.petInstanceId) {
          obj = obj.parent;
        }
        if (obj?.userData.petInstanceId) {
          callbacksRef.current.onPetClick(obj.userData.petInstanceId as string);
          return;
        }
      }

      // 5. Check furniture click
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

      // 6. Fallback tile click
      const tileHits = raycaster.intersectObjects(overlays, false);
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

    let rafId = 0;
    let timerId: number | null = null;
    let cancelled = false;
    const startTime = performance.now();
    let lastTickTime = startTime;

    const tick = () => {
      if (cancelled) return;
      const h = handlesRef.current;
      if (!h) return;

      const now = performance.now();
      const delta = Math.min(0.08, Math.max(0.001, (now - lastTickTime) * 0.001));
      lastTickTime = now;
      const elapsed = (now - startTime) * 0.001;

      if (h.avatarController) {
        h.avatarController.update(delta, callbacksRef.current.onAvatarActivityChange);
      }

      // Animate all pets continuously
      h.petAnims.forEach((petAnim, idx) => {
        animatePetHandle(petAnim, elapsed, idx * 1.7);
      });

      // Animate falling snow outside studio during Dec 1-31
      if (h.snowGroup.visible) {
        const posAttr = h.snowPoints.geometry.getAttribute('position') as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;
        const count = arr.length / 3;
        for (let i = 0; i < count; i++) {
          const speed = h.snowSeeds[i * 2];
          const phase = h.snowSeeds[i * 2 + 1];
          arr[i * 3 + 1] -= 0.016 * speed;
          arr[i * 3] += Math.sin(elapsed * 1.4 + phase) * 0.0022;
          if (arr[i * 3 + 1] < -0.7) {
            arr[i * 3 + 1] = 6.0;
          }
        }
        posAttr.needsUpdate = true;
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

  // 2. Rebuild Room Shell + Grid Overlays + Camera Framing when theme or expansion changes
  useEffect(() => {
    const h = handlesRef.current;
    const container = mountRef.current;
    if (!h || !container) return;

    const gridSize = getGridSize(studioExpanded);
    const roomSpan = gridSize * CELL_SIZE; // 5.75 or 8.05
    const halfSpan = roomSpan / 2;

    // Update camera frustum smoothly for 5x5 vs 7x7 studio
    h.frustum = studioExpanded ? 6.0 : 4.55;
    h.halfSpan = halfSpan;
    const w = Math.max(container.clientWidth, 260);
    const ht = Math.max(container.clientHeight, 260);
    const asp = w / ht;
    h.camera.left = -h.frustum * asp;
    h.camera.right = h.frustum * asp;
    h.camera.top = h.frustum;
    h.camera.bottom = -h.frustum;
    h.camera.updateProjectionMatrix();

    // Update exterior snow bounds so snow stays strictly outside 5x5 or 7x7 studio walls
    const snowAttr = h.snowPoints.geometry.getAttribute('position') as THREE.BufferAttribute;
    const snowArr = snowAttr.array as Float32Array;
    const snowOuter = halfSpan + 0.65;
    for (let i = 0; i < snowArr.length / 3; i++) {
      const zone = i % 3;
      if (zone === 0) {
        snowArr[i * 3] = (Math.random() - 0.5) * (snowOuter * 2.4);
        snowArr[i * 3 + 2] = -snowOuter - Math.random() * 4.2;
      } else if (zone === 1) {
        snowArr[i * 3] = -snowOuter - Math.random() * 4.2;
        snowArr[i * 3 + 2] = (Math.random() - 0.5) * (snowOuter * 2.4);
      } else {
        snowArr[i * 3] = (Math.random() - 0.5) * (snowOuter * 2.6);
        snowArr[i * 3 + 2] = snowOuter + Math.random() * 2.6;
      }
    }
    snowAttr.needsUpdate = true;

    // Fit exterior window view backdrop cleanly behind the window cutout so it never protrudes outside the walls
    const winLeft = studioExpanded ? -0.35 : -0.75;
    const winRight = studioExpanded ? 2.35 : 1.45;
    const winBot = 0.95;
    const winTop = 2.55;
    const winW = winRight - winLeft;
    const winH = winTop - winBot;
    const winCx = (winLeft + winRight) / 2;
    const winCy = (winBot + winTop) / 2;
    const wz = -halfSpan - WALL_THICK / 2;
    h.skyBackdrop.geometry.dispose();
    h.skyBackdrop.geometry = new THREE.PlaneGeometry(winW + 0.28, winH + 0.28);
    h.skyBackdrop.position.set(winCx, winCy, wz - WALL_THICK / 2 - 0.05);

    // Rebuild interactive tile overlays (5x5 or 7x7)
    disposeObject3D(h.gridGroup);
    h.gridGroup.clear();
    const nextOverlays: THREE.Mesh[] = [];
    for (let gy = 0; gy < gridSize; gy++) {
      for (let gx = 0; gx < gridSize; gx++) {
        const [wx, wz] = cellToWorld(gx, gy, gridSize);
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
        h.gridGroup.add(tileMesh);
        nextOverlays.push(tileMesh);
      }
    }
    h.gridOverlays = nextOverlays;

    // Rebuild Room Shell
    disposeObject3D(h.shellGroup);
    h.shellGroup.clear();

    const maxAniso = h.renderer.capabilities.getMaxAnisotropy();
    const wallTheme = WALL_MAP[wallThemeId] ?? WALL_MAP.warm_ivory;
    const floorTex = createFloorTexture(floorThemeId, maxAniso);
    if (studioExpanded) {
      floorTex.repeat.set(3, 3);
    }
    const wallTex = createWallTexture(wallThemeId, maxAniso);

    const floorBump = createPlasticineBumpTexture(3, 3);
    const slabBump = createPlasticineBumpTexture(3, 3);
    const wallBump = createPlasticineBumpTexture(3, 3);
    const trimBump = createPlasticineBumpTexture(2, 2);
    const doorFrameBump = createPlasticineBumpTexture(2, 2);
    const doorLeafBump = createPlasticineBumpTexture(2, 2);

    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      ...(floorBump ? { bumpMap: floorBump, bumpScale: 0.008 } : {}),
      roughness: 0.84,
      metalness: 0.01,
    });
    const slabMat = new THREE.MeshStandardMaterial({
      color: wallTheme.trimColor,
      ...(slabBump ? { bumpMap: slabBump, bumpScale: 0.012 } : {}),
      roughness: 0.88,
      metalness: 0.0,
    });
    const wallMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      ...(wallBump ? { bumpMap: wallBump, bumpScale: 0.01 } : {}),
      roughness: 0.9,
      metalness: 0.0,
    });
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0xf7f2eb,
      ...(trimBump ? { bumpMap: trimBump, bumpScale: 0.008 } : {}),
      roughness: 0.82,
    });

    // Cutaway floor slab
    const floorSlab = new THREE.Mesh(
      new THREE.BoxGeometry(roomSpan + WALL_THICK, SLAB_THICK, roomSpan + WALL_THICK),
      [slabMat, slabMat, floorMat, slabMat, slabMat, slabMat]
    );
    floorSlab.position.set(-WALL_THICK / 2, -SLAB_THICK / 2, -WALL_THICK / 2);
    floorSlab.castShadow = true;
    floorSlab.receiveShadow = true;
    h.shellGroup.add(floorSlab);

    // Left Wall
    const leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(WALL_THICK, WALL_HEIGHT, roomSpan + WALL_THICK),
      wallMat
    );
    leftWall.position.set(-halfSpan - WALL_THICK / 2, WALL_HEIGHT / 2, -WALL_THICK / 2);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    h.shellGroup.add(leftWall);

    // Left Wall Cap
    const leftCap = new THREE.Mesh(
      new THREE.BoxGeometry(WALL_THICK + 0.02, 0.06, roomSpan + WALL_THICK + 0.02),
      trimMat
    );
    leftCap.position.set(-halfSpan - WALL_THICK / 2, WALL_HEIGHT + 0.03, -WALL_THICK / 2);
    h.shellGroup.add(leftCap);

    // Terracotta-red Clay Door on Left Wall
    const doorFrameMat = new THREE.MeshStandardMaterial({
      color: 0xf6f0e6,
      ...(doorFrameBump ? { bumpMap: doorFrameBump, bumpScale: 0.009 } : {}),
      roughness: 0.8,
    });
    const doorLeafMat = new THREE.MeshStandardMaterial({
      color: 0xd9482b,
      ...(doorLeafBump ? { bumpMap: doorLeafBump, bumpScale: 0.011 } : {}),
      roughness: 0.78,
    });
    const doorKnobMat = new THREE.MeshStandardMaterial({ color: 0xf3e8d6, roughness: 0.28, metalness: 0.45 });
    const doorZ = studioExpanded ? 2.45 : 1.55;

    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.25, 1.25), doorFrameMat);
    doorFrame.position.set(-halfSpan + 0.03, 1.12, doorZ);
    doorFrame.castShadow = true;
    doorFrame.receiveShadow = true;
    h.shellGroup.add(doorFrame);

    const doorLeaf = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.12, 1.08), doorLeafMat);
    doorLeaf.position.set(-halfSpan + 0.055, 1.06, doorZ);
    doorLeaf.castShadow = true;
    doorLeaf.receiveShadow = true;
    h.shellGroup.add(doorLeaf);

    const doorKnob = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 12), doorKnobMat);
    doorKnob.position.set(-halfSpan + 0.1, 1.0, doorZ - 0.4);
    h.shellGroup.add(doorKnob);

    // Starter Bauhaus Poster on Left Wall (hidden if player owns the customizable portrait frame in that spot)
    if (!ownedWallFrames.includes('portrait')) {
      const artTex = createBauhausArtTexture(maxAniso);
      const posterZ = studioExpanded ? -1.4 : -0.75;
      const frameBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 1.18, 0.92),
        new THREE.MeshStandardMaterial({ color: 0x3a322e, roughness: 0.5 })
      );
      frameBox.position.set(-halfSpan + 0.025, 1.95, posterZ);
      frameBox.castShadow = true;
      h.shellGroup.add(frameBox);

      const artPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.8, 1.06),
        new THREE.MeshStandardMaterial({ map: artTex, roughness: 0.72 })
      );
      artPlane.rotation.y = Math.PI / 2;
      artPlane.position.set(-halfSpan + 0.055, 1.95, posterZ);
      h.shellGroup.add(artPlane);
    }

    // Right Wall with Window Cutout (reusing winLeft..wz computed above)
    const addWallSeg = (x1: number, x2: number, y1: number, y2: number) => {
      const sw = x2 - x1;
      const sht = y2 - y1;
      if (sw <= 0 || sht <= 0) return;
      const seg = new THREE.Mesh(new THREE.BoxGeometry(sw, sht, WALL_THICK), wallMat);
      seg.position.set((x1 + x2) / 2, (y1 + y2) / 2, wz);
      seg.castShadow = true;
      seg.receiveShadow = true;
      h.shellGroup.add(seg);
    };

    addWallSeg(-halfSpan, winLeft, 0, WALL_HEIGHT);
    addWallSeg(winRight, halfSpan, 0, WALL_HEIGHT);
    addWallSeg(winLeft, winRight, 0, winBot);
    addWallSeg(winLeft, winRight, winTop, WALL_HEIGHT);

    // Butt-joined cleanly at corner with leftCap to prevent Z-fighting
    const rightCap = new THREE.Mesh(
      new THREE.BoxGeometry(roomSpan, 0.06, WALL_THICK + 0.02),
      trimMat
    );
    rightCap.position.set(0.01, WALL_HEIGHT + 0.03, wz);
    h.shellGroup.add(rightCap);

    const winFrameMat = new THREE.MeshStandardMaterial({ color: 0xa29d96, roughness: 0.78 });
    const mullionMat = new THREE.MeshStandardMaterial({ color: 0xfbf8f3, roughness: 0.74 });

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

    const vMullion = new THREE.Mesh(new THREE.BoxGeometry(0.06, winH, 0.08), mullionMat);
    vMullion.position.set(winCx, winCy, wz + 0.02);
    vMullion.castShadow = true;
    h.shellGroup.add(vMullion);

    const hMullion = new THREE.Mesh(new THREE.BoxGeometry(winW, 0.06, 0.08), mullionMat);
    hMullion.position.set(winCx, winCy + 0.06, wz + 0.02);
    hMullion.castShadow = true;
    h.shellGroup.add(hMullion);

    const baseL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.11, roomSpan), trimMat);
    baseL.position.set(-halfSpan + 0.02, 0.055, 0);
    h.shellGroup.add(baseL);

    // Butt-joined cleanly against baseL at corner
    const baseR = new THREE.Mesh(new THREE.BoxGeometry(roomSpan - 0.04, 0.11, 0.04), trimMat);
    baseR.position.set(0.02, 0.055, -halfSpan + 0.02);
    h.shellGroup.add(baseR);

    h.needsRender = true;
  }, [wallThemeId, floorThemeId, studioExpanded, ownedWallFrames]);

  // 3. Rebuild Custom Wall-Mounted Picture Frames (Horizontal & Vertical)
  useEffect(() => {
    const h = handlesRef.current;
    if (!h) return;

    disposeObject3D(h.wallFramesGroup);
    h.wallFramesGroup.clear();

    const gridSize = getGridSize(studioExpanded);
    const halfSpan = (gridSize * CELL_SIZE) / 2;
    const maxAniso = h.renderer.capabilities.getMaxAnisotropy();
    const requestRender = () => {
      if (handlesRef.current) handlesRef.current.needsRender = true;
    };

    // Horizontal (Landscape) Frame on Right Wall (to the left of the window)
    if (ownedWallFrames.includes('landscape')) {
      const fx = studioExpanded ? -2.25 : -1.82;
      const fz = -halfSpan + 0.03;
      const fy = 1.9;

      const frameGroup = new THREE.Group();
      frameGroup.position.set(fx, fy, fz);
      frameGroup.userData.wallFrameType = 'landscape';

      const woodMat = new THREE.MeshStandardMaterial({ color: 0xa6784b, roughness: 0.48 });
      const outer = new THREE.Mesh(new THREE.BoxGeometry(1.44, 1.0, 0.06), woodMat);
      outer.castShadow = true;
      outer.userData.wallFrameType = 'landscape';
      frameGroup.add(outer);

      const artTex = createFrameArtworkTexture(
        wallFrameArtworks.landscape?.imageDataUrl,
        'landscape',
        maxAniso,
        requestRender
      );
      const artMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1.3, 0.86),
        new THREE.MeshStandardMaterial({ map: artTex, roughness: 0.65 })
      );
      artMesh.position.z = 0.034;
      artMesh.userData.wallFrameType = 'landscape';
      frameGroup.add(artMesh);

      h.wallFramesGroup.add(frameGroup);
    }

    // Vertical (Portrait) Frame on Left Wall
    if (ownedWallFrames.includes('portrait')) {
      const fx = -halfSpan + 0.03;
      const fz = studioExpanded ? -1.4 : -0.75;
      const fy = 1.95;

      const frameGroup = new THREE.Group();
      frameGroup.position.set(fx, fy, fz);
      frameGroup.rotation.y = Math.PI / 2;
      frameGroup.userData.wallFrameType = 'portrait';

      const darkFrameMat = new THREE.MeshStandardMaterial({ color: 0x3a322e, roughness: 0.46 });
      const outer = new THREE.Mesh(new THREE.BoxGeometry(0.98, 1.28, 0.06), darkFrameMat);
      outer.castShadow = true;
      outer.userData.wallFrameType = 'portrait';
      frameGroup.add(outer);

      const artTex = createFrameArtworkTexture(
        wallFrameArtworks.portrait?.imageDataUrl,
        'portrait',
        maxAniso,
        requestRender
      );
      const artMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.84, 1.14),
        new THREE.MeshStandardMaterial({ map: artTex, roughness: 0.65 })
      );
      artMesh.position.z = 0.034;
      artMesh.userData.wallFrameType = 'portrait';
      frameGroup.add(artMesh);

      h.wallFramesGroup.add(frameGroup);
    }

    h.needsRender = true;
  }, [ownedWallFrames, wallFrameArtworks, studioExpanded]);

  // 4. Rebuild Placed Furniture + Selection Rings
  useEffect(() => {
    const h = handlesRef.current;
    if (!h) return;
    disposeObject3D(h.furnitureGroup);
    h.furnitureGroup.clear();
    h.lampControls.clear();

    if (h.lastNightMode !== nightMode) {
      h.lampStateOverrides.clear();
      h.lastNightMode = nightMode;
    }

    const gridSize = getGridSize(studioExpanded);

    for (const item of placedItems) {
      const model = buildFurniture3D(item.itemId, nightMode);
      const [wx, wz] = cellToWorld(item.x, item.y, gridSize);
      model.position.set(wx, 0, wz);
      const rotStep = item.rotationStep ?? (item.flipped ? 1 : 0);
      model.rotation.y = (rotStep * Math.PI) / 2;
      model.userData.instanceId = item.instanceId;

      const lampCtrl = model.userData.lampControl as FurnitureLampControl | undefined;
      if (lampCtrl) {
        const override = h.lampStateOverrides.get(item.instanceId);
        if (override !== undefined) {
          lampCtrl.setLit(override);
        }
        h.lampControls.set(item.instanceId, lampCtrl);
      }

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
  }, [placedItems, selectedInstanceId, nightMode, readOnly, studioExpanded]);

  // 4b. Rebuild Pets & Enclosures (occupying appropriate floor grid tiles)
  useEffect(() => {
    const h = handlesRef.current;
    if (!h) return;
    disposeObject3D(h.petsGroup);
    h.petsGroup.clear();

    const gridSize = getGridSize(studioExpanded);
    const nextAnims: AnimatedPetHandle[] = [];

    for (const pet of pets) {
      const breed = PET_BREED_MAP[pet.breedId];
      const baseW = breed?.gridW ?? 1;
      const baseH = breed?.gridH ?? 1;
      const rot = (pet.rotationStep ?? 0) % 4;
      const effW = rot % 2 === 1 ? baseH : baseW;
      const effH = rot % 2 === 1 ? baseW : baseH;

      const centerGridX = pet.x + (effW - 1) / 2;
      const centerGridY = pet.y + (effH - 1) / 2;
      const [wx, wz] = cellToWorld(centerGridX, centerGridY, gridSize);

      const { root, anim } = buildPetHabitat3D(pet, CELL_SIZE, nightMode);
      root.position.set(wx, 0, wz);
      root.rotation.y = (rot * Math.PI) / 2;
      h.petsGroup.add(root);
      nextAnims.push(anim);

      if (selectedPetId === pet.instanceId && !readOnly) {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(effW > 1 ? 0.65 : 0.48, effW > 1 ? 0.74 : 0.56, 32),
          new THREE.MeshBasicMaterial({
            color: 0x16a34a,
            side: THREE.DoubleSide,
          })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(wx, 0.024, wz);
        h.petsGroup.add(ring);
      }
    }

    h.petAnims = nextAnims;
    h.needsRender = true;
  }, [pets, selectedPetId, nightMode, readOnly, studioExpanded]);

  // 5. Rebuild 3D Chibi Student Avatar & Continuous Activity Controller
  useEffect(() => {
    const h = handlesRef.current;
    if (!h) return;
    disposeObject3D(h.avatarHolder);
    h.avatarHolder.clear();

    const gridSize = getGridSize(studioExpanded);
    const tile = findAvatarTile(placedItems, pets, gridSize);
    const rig = buildAvatarRig3D(avatar);
    h.avatarHolder.add(rig.root);

    const hasUserHandItem = Boolean(avatar.handItemId && avatar.handItemId !== 'hand_none');
    const controller = new AvatarBehaviorController(
      rig,
      placedItems,
      pets,
      ownedWallFrames,
      gridSize,
      CELL_SIZE,
      tile,
      hasUserHandItem,
      (instanceId: string) => {
        const cur = handlesRef.current;
        if (!cur) return null;
        const ctrl = cur.lampControls.get(instanceId);
        if (!ctrl) return null;
        const nextLit = !ctrl.isLit;
        ctrl.setLit(nextLit);
        cur.lampStateOverrides.set(instanceId, nextLit);
        cur.needsRender = true;
        return nextLit;
      }
    );
    h.avatarController = controller;
    callbacksRef.current.onAvatarActivityChange?.(controller.getCurrentLabel());
    h.needsRender = true;
  }, [avatar, placedItems, pets, ownedWallFrames, studioExpanded]);

  // 6. Update Window View Texture, Day/Night, Dec 1-31 Snow Atmosphere & Monochrome Penalty
  useEffect(() => {
    const h = handlesRef.current;
    if (!h) return;

    const maxAniso = h.renderer.capabilities.getMaxAnisotropy();
    if (h.exteriorSkyMat.map) {
      h.exteriorSkyMat.map.dispose();
    }
    h.exteriorSkyMat.map = createWindowViewTexture(
      activeWindowViewId,
      nightMode,
      isSnowActive,
      maxAniso
    );
    h.exteriorSkyMat.color.setHex(0xffffff);
    h.exteriorSkyMat.needsUpdate = true;

    h.snowGroup.visible = isSnowActive && !isMonochrome;

    if (isMonochrome) {
      h.sunLight.color.setHex(0xd4d4d8);
      h.sunLight.intensity = 1.45;
      h.hemiLight.color.setHex(0xd4d4d8);
      h.hemiLight.groundColor.setHex(0x52525b);
      h.hemiLight.intensity = 0.72;
      h.fillLight.intensity = 0.35;
    } else if (nightMode) {
      h.sunLight.color.setHex(isSnowActive ? 0x99c2ff : 0x88a8ff);
      h.sunLight.intensity = isSnowActive ? 0.78 : 0.65;
      h.hemiLight.color.setHex(isSnowActive ? 0x7692cc : 0x6977b5);
      h.hemiLight.groundColor.setHex(0x3a2d44);
      h.hemiLight.intensity = 0.58;
      h.fillLight.color.setHex(isSnowActive ? 0xffdfc2 : 0xffe6cc);
      h.fillLight.intensity = isSnowActive ? 0.35 : 0.25;
    } else if (isSnowActive) {
      // Crisp cool-blue outdoor winter contrast + cozy warm indoor glow
      h.sunLight.color.setHex(0xfff3de);
      h.sunLight.intensity = 2.15;
      h.hemiLight.color.setHex(0xdbeafe);
      h.hemiLight.groundColor.setHex(0xa88269);
      h.hemiLight.intensity = 0.96;
      h.fillLight.color.setHex(0xffe1b8);
      h.fillLight.intensity = 0.62;
    } else {
      h.sunLight.color.setHex(0xfff1d6);
      h.sunLight.intensity = 2.25;
      h.hemiLight.color.setHex(0xfff4e6);
      h.hemiLight.groundColor.setHex(0x8f6b54);
      h.hemiLight.intensity = 0.92;
      h.fillLight.color.setHex(0xffe6cc);
      h.fillLight.intensity = 0.52;
    }
    h.needsRender = true;
  }, [nightMode, activeWindowViewId, isSnowActive, isMonochrome]);

  // 7. Update Pending / Selection overlay visibility when state changes
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
  }, [pendingItemId, selectedInstanceId, selectedPetId, readOnly, studioExpanded]);

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
      style={isMonochrome ? { filter: 'grayscale(100%) contrast(1.06)' } : undefined}
      className={`w-full h-full select-none touch-none transition-[filter] duration-500 ${
        readOnly ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
      } ${className}`}
      aria-label="ห้องสตูดิโอ 3 มิติ"
    />
  );
};
