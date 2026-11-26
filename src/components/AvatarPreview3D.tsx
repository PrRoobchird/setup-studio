import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { buildAvatarRig3D } from '../three/buildAvatar';
import { detectSoftwareWebGL, disposeObject3D } from '../three/textures';
import { AvatarConfig } from '../types/studio';

interface AvatarPreview3DProps {
  avatar: AvatarConfig;
  className?: string;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 60);
    grad.addColorStop(0, 'rgba(92, 68, 52, 0.24)');
    grad.addColorStop(0.55, 'rgba(92, 68, 52, 0.09)');
    grad.addColorStop(1, 'rgba(92, 68, 52, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export const AvatarPreview3D: React.FC<AvatarPreview3DProps> = ({
  avatar,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    holder: THREE.Group;
    bodyGroup: THREE.Group | null;
    yaw: number;
    targetYaw: number;
    pitch: number;
    targetPitch: number;
    dragging: boolean;
    lastX: number;
    lastY: number;
  } | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = Math.max(container.clientWidth, 240);
    const height = Math.max(container.clientHeight, 260);
    const probeCanvas = document.createElement('canvas');
    const probeGl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
    const isSoftwareGl = probeGl ? detectSoftwareWebGL(probeGl) : false;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: false,
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
    scene.background = new THREE.Color(0xfaf4ea);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    scene.environmentIntensity = 0.34;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 30);
    camera.position.set(0, 0.56, 2.15);
    camera.lookAt(0, 0.55, 0);

    // Warm Matte Terracotta Studio Lighting Setup
    const hemi = new THREE.HemisphereLight(0xfffaf2, 0xe8d9c8, 1.02);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xfff5e8, 1.5);
    key.position.set(1.8, 3.2, 2.8);
    key.castShadow = !isSoftwareGl;
    if (!isSoftwareGl) {
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.bias = -0.0005;
    }
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xfff0dd, 0.62);
    fill.position.set(-2.2, 1.8, 2.0);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xfff0dd, 0.72);
    rim.position.set(-1.4, 2.4, -2.6);
    scene.add(rim);

    if (!isSoftwareGl) {
      RectAreaLightUniformsLib.init();
      const leftSoftbox = new THREE.RectAreaLight(0xfff8f0, 2.6, 2.2, 2.4);
      leftSoftbox.position.set(-1.9, 1.25, 2.1);
      leftSoftbox.lookAt(0, 0.65, 0);
      scene.add(leftSoftbox);

      const rightSoftbox = new THREE.RectAreaLight(0xf2f6ff, 1.8, 2.0, 2.2);
      rightSoftbox.position.set(2.0, 1.15, 1.8);
      rightSoftbox.lookAt(0, 0.65, 0);
      scene.add(rightSoftbox);
    }

    // Subtle soft studio contact shadow under shoes (isolated on cream backdrop)
    const shadowTex = createContactShadowTexture();
    const contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.62, 0.48),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
      })
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.002;
    scene.add(contactShadow);

    const holder = new THREE.Group();
    scene.add(holder);

    stateRef.current = {
      renderer,
      scene,
      holder,
      bodyGroup: null,
      yaw: 0,
      targetYaw: 0,
      pitch: 0.04,
      targetPitch: 0.04,
      dragging: false,
      lastX: 0,
      lastY: 0,
    };

    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const w = Math.max(container.clientWidth, 200);
      const h = Math.max(container.clientHeight, 220);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    const onPointerDown = (e: PointerEvent) => {
      if (!stateRef.current) return;
      stateRef.current.dragging = true;
      stateRef.current.lastX = e.clientX;
      stateRef.current.lastY = e.clientY;
      renderer.domElement.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!stateRef.current || !stateRef.current.dragging) return;
      const dx = e.clientX - stateRef.current.lastX;
      const dy = e.clientY - stateRef.current.lastY;
      stateRef.current.lastX = e.clientX;
      stateRef.current.lastY = e.clientY;
      stateRef.current.targetYaw += dx * 0.014;
      stateRef.current.targetPitch = THREE.MathUtils.clamp(
        stateRef.current.targetPitch + dy * 0.009,
        -0.42,
        0.52
      );
    };
    const onPointerUp = (e: PointerEvent) => {
      if (!stateRef.current) return;
      stateRef.current.dragging = false;
      if (renderer.domElement.hasPointerCapture(e.pointerId)) {
        renderer.domElement.releasePointerCapture(e.pointerId);
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    let rafId = 0;
    let timerId: number | null = null;
    let cancelled = false;
    const startTime = performance.now();
    let prevNow = startTime;

    const tick = () => {
      if (cancelled || !stateRef.current) return;
      const now = performance.now();
      const dt = Math.min((now - prevNow) * 0.001, 0.1);
      prevNow = now;
      const elapsed = Math.floor(((now - startTime) * 0.001) * 14) / 14;

      const s = stateRef.current;
      s.yaw = THREE.MathUtils.damp(s.yaw, s.targetYaw, 14, dt);
      s.pitch = THREE.MathUtils.damp(s.pitch, s.targetPitch, 14, dt);

      s.holder.rotation.y = s.yaw;
      const camDist = 2.15;
      camera.position.set(
        0,
        0.56 + Math.sin(s.pitch) * camDist,
        Math.cos(s.pitch) * camDist
      );
      camera.lookAt(0, 0.56, 0);

      if (s.bodyGroup) {
        s.bodyGroup.position.y = Math.sin(elapsed * 2.2) * 0.005;
      }
      renderer.render(scene, camera);

      if (isSoftwareGl) {
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
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      disposeObject3D(scene);
      envTarget.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      stateRef.current = null;
    };
  }, []);

  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;
    disposeObject3D(s.holder);
    s.holder.clear();
    const rig = buildAvatarRig3D(avatar);
    s.holder.add(rig.root);
    s.bodyGroup = rig.bodyGroup;
  }, [avatar]);

  return (
    <div
      ref={mountRef}
      className={`w-full h-full cursor-grab active:cursor-grabbing select-none touch-none ${className}`}
      aria-label="ตัวอย่างหุ่นดินเผา 3 มิติ หมุนได้รอบทิศทาง"
    />
  );
};
