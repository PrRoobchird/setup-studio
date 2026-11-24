import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildAvatar3D } from '../three/buildAvatar';
import { detectSoftwareWebGL, disposeObject3D } from '../three/textures';
import { AvatarConfig } from '../types/studio';

interface AvatarPreview3DProps {
  avatar: AvatarConfig;
  className?: string;
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
    yaw: number;
    dragging: boolean;
    lastX: number;
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
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    scene.environmentIntensity = 0.55;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 30);
    camera.position.set(0, 0.85, 2.25);
    camera.lookAt(0, 0.54, 0);

    const hemi = new THREE.HemisphereLight(0xfff7ed, 0x9c7c66, 1.0);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xfff4e0, 1.85);
    key.position.set(2.4, 3.6, 2.8);
    key.castShadow = !isSoftwareGl;
    scene.add(key);

    const rim = new THREE.DirectionalLight(0xbfd8ff, 0.75);
    rim.position.set(-2.5, 2.2, -2.5);
    scene.add(rim);

    // Circular display pedestal
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.46, 0.52, 0.08, 32),
      new THREE.MeshStandardMaterial({ color: 0xf4ece0, roughness: 0.78 })
    );
    pedestal.position.y = -0.04;
    pedestal.receiveShadow = true;
    scene.add(pedestal);

    const holder = new THREE.Group();
    scene.add(holder);

    stateRef.current = {
      renderer,
      scene,
      holder,
      yaw: 0.35,
      dragging: false,
      lastX: 0,
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
      renderer.domElement.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!stateRef.current || !stateRef.current.dragging) return;
      const dx = e.clientX - stateRef.current.lastX;
      stateRef.current.lastX = e.clientX;
      stateRef.current.yaw += dx * 0.014;
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

    const tick = () => {
      if (cancelled || !stateRef.current) return;
      if (!stateRef.current.dragging) {
        stateRef.current.yaw += 0.008;
      }
      stateRef.current.holder.rotation.y = stateRef.current.yaw;
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
    const avatarMesh = buildAvatar3D(avatar);
    s.holder.add(avatarMesh);
  }, [avatar]);

  return (
    <div
      ref={mountRef}
      className={`w-full h-full cursor-grab active:cursor-grabbing select-none touch-none ${className}`}
      aria-label="ตัวอย่างอวตาร 3 มิติ หมุนได้ 360 องศา"
    />
  );
};
