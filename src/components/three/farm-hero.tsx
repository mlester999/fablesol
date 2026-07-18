'use client';

import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion';

/**
 * Lazy-friendly Three.js farm diorama hero.
 * Progressive enhancement: static CSS fallback is always present.
 */
export function FarmHero() {
  const hostRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (reduced || failed) return;
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let renderer: import('three').WebGLRenderer | undefined;
    let animationId = 0;
    let resizeObserver: ResizeObserver | undefined;

    async function mount() {
      try {
        const THREE = await import('three');
        if (disposed || !host) return;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color('#3f6d55');
        scene.fog = new THREE.Fog('#3f6d55', 12, 28);

        const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
        camera.position.set(6.5, 7.2, 7.5);
        camera.lookAt(0, 0.2, 0);

        renderer = new THREE.WebGLRenderer({
          antialias: false,
          alpha: false,
          powerPreference: 'high-performance',
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
        renderer.setSize(host.clientWidth, host.clientHeight, false);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        host.appendChild(renderer.domElement);
        renderer.domElement.setAttribute('aria-hidden', 'true');
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';
        renderer.domElement.style.display = 'block';

        const ambient = new THREE.AmbientLight(0xfff2d8, 0.85);
        const sun = new THREE.DirectionalLight(0xffe2a8, 1.15);
        sun.position.set(6, 10, 4);
        scene.add(ambient, sun);

        const island = new THREE.Group();
        scene.add(island);

        const ground = new THREE.Mesh(
          new THREE.CylinderGeometry(4.2, 4.6, 0.7, 8),
          new THREE.MeshStandardMaterial({ color: '#5f8f63', roughness: 0.92, flatShading: true }),
        );
        ground.position.y = -0.45;
        island.add(ground);

        const soil = new THREE.Mesh(
          new THREE.BoxGeometry(3.4, 0.18, 2.2),
          new THREE.MeshStandardMaterial({ color: '#6b4f35', roughness: 1, flatShading: true }),
        );
        soil.position.set(-0.4, 0.05, 0.2);
        island.add(soil);

        for (let x = 0; x < 4; x += 1) {
          for (let z = 0; z < 3; z += 1) {
            const crop = new THREE.Mesh(
              new THREE.BoxGeometry(0.28, 0.25 + (x + z) * 0.03, 0.28),
              new THREE.MeshStandardMaterial({
                color: z % 2 === 0 ? '#7cbc63' : '#d4e27a',
                roughness: 0.9,
                flatShading: true,
              }),
            );
            crop.position.set(-1.5 + x * 0.7, 0.22, -0.4 + z * 0.55);
            island.add(crop);
          }
        }

        const water = new THREE.Mesh(
          new THREE.CylinderGeometry(1.1, 1.1, 0.12, 10),
          new THREE.MeshStandardMaterial({
            color: '#4a7c8c',
            roughness: 0.35,
            metalness: 0.05,
            flatShading: true,
          }),
        );
        water.position.set(2.1, 0.02, -1.3);
        island.add(water);

        function addTree(x: number, z: number, scale = 1) {
          const trunk = new THREE.Mesh(
            new THREE.BoxGeometry(0.18 * scale, 0.55 * scale, 0.18 * scale),
            new THREE.MeshStandardMaterial({ color: '#6b4f35', flatShading: true }),
          );
          trunk.position.set(x, 0.3 * scale, z);
          const leaves = new THREE.Mesh(
            new THREE.ConeGeometry(0.55 * scale, 0.9 * scale, 5),
            new THREE.MeshStandardMaterial({ color: '#2f6b45', flatShading: true }),
          );
          leaves.position.set(x, 0.85 * scale, z);
          island.add(trunk, leaves);
        }
        addTree(2.4, 1.4, 1.1);
        addTree(1.7, 1.9, 0.85);
        addTree(-2.5, -1.6, 1);

        const house = new THREE.Group();
        const body = new THREE.Mesh(
          new THREE.BoxGeometry(1.3, 0.9, 1.1),
          new THREE.MeshStandardMaterial({ color: '#f3ead3', flatShading: true }),
        );
        body.position.y = 0.5;
        const roof = new THREE.Mesh(
          new THREE.ConeGeometry(1.05, 0.7, 4),
          new THREE.MeshStandardMaterial({ color: '#8b3a2a', flatShading: true }),
        );
        roof.position.y = 1.2;
        roof.rotation.y = Math.PI / 4;
        house.add(body, roof);
        house.position.set(-2.1, 0, 1.3);
        island.add(house);

        const animalMat = new THREE.MeshStandardMaterial({ color: '#efe6d4', flatShading: true });
        const cow = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.35, 0.3), animalMat);
        cow.position.set(0.3, 0.28, 1.5);
        const pig = new THREE.Mesh(
          new THREE.BoxGeometry(0.4, 0.28, 0.28),
          new THREE.MeshStandardMaterial({ color: '#e7a7ad', flatShading: true }),
        );
        pig.position.set(1.1, 0.24, 1.2);
        island.add(cow, pig);

        const cat = new THREE.Mesh(
          new THREE.BoxGeometry(0.28, 0.22, 0.18),
          new THREE.MeshStandardMaterial({ color: '#d9a15c', flatShading: true }),
        );
        cat.position.set(-1.2, 0.22, 0.9);
        island.add(cat);

        const copper = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.18, 0.05, 10),
          new THREE.MeshStandardMaterial({
            color: '#b87333',
            metalness: 0.4,
            roughness: 0.35,
            flatShading: true,
          }),
        );
        copper.position.set(0.8, 1.5, -0.2);
        const fable = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.18, 0.05, 10),
          new THREE.MeshStandardMaterial({
            color: '#c9a227',
            metalness: 0.45,
            roughness: 0.3,
            flatShading: true,
          }),
        );
        fable.position.set(-0.5, 1.7, 0.5);
        island.add(copper, fable);

        const cloudMat = new THREE.MeshStandardMaterial({
          color: '#fff8e8',
          transparent: true,
          opacity: 0.7,
          flatShading: true,
        });
        const cloud = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 8), cloudMat);
        cloud.position.set(-2.5, 3.2, -1.5);
        const cloud2 = cloud.clone();
        cloud2.position.set(2.8, 3.5, 0.5);
        scene.add(cloud, cloud2);

        let pointerX = 0;
        let pointerY = 0;
        const onPointer = (event: PointerEvent) => {
          const rect = host.getBoundingClientRect();
          pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
          pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
        };
        host.addEventListener('pointermove', onPointer, { passive: true });

        const onResize = () => {
          if (!renderer || !host) return;
          const { clientWidth, clientHeight } = host;
          camera.aspect = clientWidth / Math.max(clientHeight, 1);
          camera.updateProjectionMatrix();
          renderer.setSize(clientWidth, clientHeight, false);
        };
        resizeObserver = new ResizeObserver(onResize);
        resizeObserver.observe(host);
        onResize();

        let visible = true;
        const io = new IntersectionObserver(
          ([entry]) => {
            visible = entry?.isIntersecting ?? true;
          },
          { threshold: 0.05 },
        );
        io.observe(host);

        const onVisibility = () => {
          // tab hidden handled in loop via document.hidden
        };
        document.addEventListener('visibilitychange', onVisibility);

        const clock = new THREE.Clock();
        const tick = () => {
          if (disposed) return;
          animationId = window.requestAnimationFrame(tick);
          if (!visible || document.hidden || !renderer) return;
          const t = clock.getElapsedTime();
          island.rotation.y = t * 0.12 + pointerX * 0.12;
          island.position.y = Math.sin(t * 0.8) * 0.05;
          camera.position.x = 6.5 + pointerX * 0.35;
          camera.position.y = 7.2 - pointerY * 0.25;
          camera.lookAt(0, 0.2, 0);
          copper.position.y = 1.5 + Math.sin(t * 1.4) * 0.08;
          fable.position.y = 1.7 + Math.cos(t * 1.2) * 0.08;
          cloud.position.x = -2.5 + Math.sin(t * 0.2) * 0.4;
          cloud2.position.x = 2.8 + Math.cos(t * 0.18) * 0.35;
          renderer.render(scene, camera);
        };
        tick();
        setLoaded(true);

        return () => {
          host.removeEventListener('pointermove', onPointer);
          document.removeEventListener('visibilitychange', onVisibility);
          io.disconnect();
        };
      } catch {
        setFailed(true);
      }
    }

    let extraCleanup: (() => void) | undefined;
    mount().then((cleanup) => {
      extraCleanup = cleanup;
    });

    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationId);
      resizeObserver?.disconnect();
      extraCleanup?.();
      if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
        renderer.domElement.remove();
      }
    };
  }, [reduced, failed]);

  return (
    <div className="hero-3d" ref={hostRef} aria-label="Stylized floating farm diorama">
      <div
        className="hero-3d__fallback"
        data-hidden={loaded && !failed && !reduced ? 'true' : 'false'}
        style={{
          opacity: loaded && !failed && !reduced ? 0 : 1,
          pointerEvents: loaded && !failed && !reduced ? 'none' : 'auto',
          transition: 'opacity 0.4s ease',
        }}
      >
        <div className="hero-3d__fallback-card">
          <strong>Cozy farm diorama</strong>
          <p style={{ margin: '0.35rem 0 0' }}>
            A stylized floating farm with crops, water, a cottage, animals, and a cat companion.
            {reduced
              ? ' Motion is reduced on this device.'
              : failed
                ? ' Showing static art while 3D is unavailable.'
                : ' Loading enhanced 3D…'}
          </p>
        </div>
      </div>
    </div>
  );
}
