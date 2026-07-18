'use client';

import { useEffect, useRef } from 'react';

interface WorldSceneProps {
  /** Render one static frame instead of animating. */
  readonly staticScene: boolean;
  readonly onReady: () => void;
  readonly onFail: () => void;
}

/**
 * Original isometric farm-village diorama that fills the landing hero.
 * Built from simple flat-shaded primitives so it stays lightweight:
 * instanced ground tiles, swaying trees, a pond, crop rows, cottage and
 * barn, the five farm animals, the cat companion, and drifting clouds.
 *
 * Performance/cleanup contract:
 * - device pixel ratio capped
 * - animation pauses when offscreen or the tab is hidden
 * - reduced motion renders a single stable frame
 * - all geometries, materials, renderer, and observers are disposed
 */
export function WorldScene({ staticScene, onReady, onFail }: WorldSceneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const readyRef = useRef(onReady);
  const failRef = useRef(onFail);
  readyRef.current = onReady;
  failRef.current = onFail;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let renderer: import('three').WebGLRenderer | undefined;
    let animationId = 0;
    let resizeObserver: ResizeObserver | undefined;
    let intersectionObserver: IntersectionObserver | undefined;
    let removeListeners: (() => void) | undefined;
    const disposables: { dispose: () => void }[] = [];

    async function mount() {
      try {
        const THREE = await import('three');
        if (disposed || !host) return;

        const track = <T extends { dispose: () => void }>(resource: T): T => {
          disposables.push(resource);
          return resource;
        };

        const scene = new THREE.Scene();
        scene.background = new THREE.Color('#77a06b');

        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -50, 100);

        renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        host.appendChild(renderer.domElement);
        renderer.domElement.setAttribute('aria-hidden', 'true');
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';
        renderer.domElement.style.display = 'block';

        scene.add(new THREE.AmbientLight(0xfff4dc, 0.95));
        const sun = new THREE.DirectionalLight(0xffe7b0, 1.25);
        sun.position.set(8, 14, 6);
        scene.add(sun);

        const flat = (
          color: string,
          extra?: Partial<import('three').MeshLambertMaterialParameters>,
        ) => track(new THREE.MeshLambertMaterial({ color, ...extra }));

        // ---- Ground: instanced tile field -------------------------------
        const SIZE = 46;
        const HALF = SIZE / 2;
        const tileGeometry = track(new THREE.BoxGeometry(1, 0.35, 1));
        const tileMaterial = track(new THREE.MeshLambertMaterial({ color: '#ffffff' }));
        const tiles = new THREE.InstancedMesh(tileGeometry, tileMaterial, SIZE * SIZE);
        const grassShades = ['#6d9c58', '#75a55f', '#659253', '#7cab66'];
        const pathShade = '#c2a173';
        const pathShade2 = '#b6956a';
        const matrix = new THREE.Matrix4();
        const color = new THREE.Color();

        const isPath = (x: number, z: number) => {
          const px = x - HALF;
          const pz = z - HALF;
          const horizontal = Math.abs(pz + 2) < 1.1 && px > -HALF + 2;
          const vertical = Math.abs(px - 3) < 1.1 && pz > -9;
          const plaza = Math.abs(px - 3) < 2.4 && Math.abs(pz + 2) < 2.4;
          return horizontal || vertical || plaza;
        };

        let i = 0;
        for (let x = 0; x < SIZE; x += 1) {
          for (let z = 0; z < SIZE; z += 1) {
            matrix.setPosition(x - HALF, -0.18, z - HALF);
            tiles.setMatrixAt(i, matrix);
            if (isPath(x, z)) {
              color.set((x + z) % 2 === 0 ? pathShade : pathShade2);
            } else {
              color.set(grassShades[(x * 7 + z * 13) % grassShades.length]!);
            }
            tiles.setColorAt(i, color);
            i += 1;
          }
        }
        tiles.instanceMatrix.needsUpdate = true;
        if (tiles.instanceColor) tiles.instanceColor.needsUpdate = true;
        scene.add(tiles);

        // ---- Pond -------------------------------------------------------
        const pond = new THREE.Mesh(
          track(new THREE.CylinderGeometry(3.1, 3.1, 0.14, 22)),
          flat('#4a7c8c'),
        );
        pond.position.set(-7.5, 0.02, 5.5);
        scene.add(pond);
        const shore = new THREE.Mesh(
          track(new THREE.CylinderGeometry(3.55, 3.65, 0.1, 22)),
          flat('#c2a173'),
        );
        shore.position.set(-7.5, -0.02, 5.5);
        scene.add(shore);
        const shimmer = new THREE.Mesh(
          track(new THREE.CylinderGeometry(1.6, 1.6, 0.02, 18)),
          track(
            new THREE.MeshLambertMaterial({ color: '#7fb2c0', transparent: true, opacity: 0.5 }),
          ),
        );
        shimmer.position.set(-7.9, 0.12, 5.2);
        scene.add(shimmer);

        // ---- Crop field with fence -------------------------------------
        const field = new THREE.Group();
        const soil = new THREE.Mesh(track(new THREE.BoxGeometry(7.4, 0.16, 5.4)), flat('#6b4f35'));
        field.add(soil);
        const cropGeometry = track(new THREE.BoxGeometry(0.42, 0.4, 0.42));
        const cropMaterials = [flat('#8cc63f'), flat('#d4e27a'), flat('#7cbc63')];
        for (let cx = 0; cx < 6; cx += 1) {
          for (let cz = 0; cz < 4; cz += 1) {
            const crop = new THREE.Mesh(
              cropGeometry,
              cropMaterials[(cx + cz) % cropMaterials.length]!,
            );
            crop.position.set(-2.7 + cx * 1.1, 0.28 + ((cx + cz) % 3) * 0.05, -1.65 + cz * 1.1);
            field.add(crop);
          }
        }
        const postGeometry = track(new THREE.BoxGeometry(0.16, 0.7, 0.16));
        const railGeometryH = track(new THREE.BoxGeometry(8.2, 0.09, 0.09));
        const railGeometryV = track(new THREE.BoxGeometry(0.09, 0.09, 6.2));
        const woodMaterial = flat('#8a6a48');
        for (let px = -4; px <= 4; px += 2) {
          for (const pz of [-3, 3]) {
            const post = new THREE.Mesh(postGeometry, woodMaterial);
            post.position.set(px, 0.32, pz);
            field.add(post);
          }
        }
        for (const pz of [-3, 3]) {
          const rail = new THREE.Mesh(railGeometryH, woodMaterial);
          rail.position.set(0, 0.5, pz);
          field.add(rail);
        }
        for (const px of [-4, 4]) {
          for (let pz = -1; pz <= 1; pz += 2) {
            const post = new THREE.Mesh(postGeometry, woodMaterial);
            post.position.set(px, 0.32, pz);
            field.add(post);
          }
          const rail = new THREE.Mesh(railGeometryV, woodMaterial);
          rail.position.set(px, 0.5, 0);
          field.add(rail);
        }
        field.position.set(8.5, 0, 6.5);
        scene.add(field);

        // ---- Trees ------------------------------------------------------
        const trunkGeometry = track(new THREE.BoxGeometry(0.34, 1, 0.34));
        const canopyGeometry = track(new THREE.ConeGeometry(1.05, 1.6, 6));
        const canopyGeometrySmall = track(new THREE.ConeGeometry(0.75, 1.1, 6));
        const trunkMaterial = flat('#6b4f35');
        const canopyMaterials = [flat('#2f6b45'), flat('#3a7a50'), flat('#295e3d')];
        const trees: { group: import('three').Group; phase: number }[] = [];
        const treeSpots: readonly (readonly [number, number, number])[] = [
          [-11, -8, 1.15],
          [-8, -10, 0.9],
          [-12, 2, 1],
          [-11.5, 9, 0.85],
          [-4, -9, 1.1],
          [0, -11, 0.95],
          [6, -10, 1.2],
          [11, -7, 0.9],
          [12.5, -2, 1.05],
          [12.5, 11, 0.95],
          [1, 11.5, 1.1],
          [-3, 12, 0.9],
          [5, 12.5, 1],
          [-12.5, -3, 0.8],
          [9, 1.5, 0.75],
        ];
        for (const [tx, tz, scale] of treeSpots) {
          const tree = new THREE.Group();
          const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
          trunk.position.y = 0.5 * scale;
          trunk.scale.setScalar(scale);
          const canopy = new THREE.Mesh(
            scale > 1 ? canopyGeometry : canopyGeometrySmall,
            canopyMaterials[Math.abs(Math.round(tx * 3 + tz)) % canopyMaterials.length]!,
          );
          canopy.position.y = (scale > 1 ? 1.75 : 1.4) * scale;
          canopy.scale.setScalar(scale);
          tree.add(trunk, canopy);
          tree.position.set(tx, 0, tz);
          scene.add(tree);
          trees.push({ group: tree, phase: tx * 0.7 + tz * 0.3 });
        }

        // ---- Cottage and barn ------------------------------------------
        const cottage = new THREE.Group();
        const cottageBody = new THREE.Mesh(
          track(new THREE.BoxGeometry(3.2, 2, 2.6)),
          flat('#f3ead3'),
        );
        cottageBody.position.y = 1;
        const cottageRoof = new THREE.Mesh(
          track(new THREE.ConeGeometry(2.6, 1.5, 4)),
          flat('#8b3a2a'),
        );
        cottageRoof.position.y = 2.75;
        cottageRoof.rotation.y = Math.PI / 4;
        const chimney = new THREE.Mesh(
          track(new THREE.BoxGeometry(0.4, 0.9, 0.4)),
          flat('#9c8a74'),
        );
        chimney.position.set(0.9, 3, 0.4);
        const door = new THREE.Mesh(track(new THREE.BoxGeometry(0.7, 1.1, 0.1)), woodMaterial);
        door.position.set(0.4, 0.55, 1.32);
        cottage.add(cottageBody, cottageRoof, chimney, door);
        cottage.position.set(-6.5, 0, -6.5);
        scene.add(cottage);

        const barn = new THREE.Group();
        const barnBody = new THREE.Mesh(
          track(new THREE.BoxGeometry(3.6, 2.2, 2.8)),
          flat('#a34a32'),
        );
        barnBody.position.y = 1.1;
        const barnRoof = new THREE.Mesh(
          track(new THREE.CylinderGeometry(1.55, 1.55, 3.7, 3, 1)),
          flat('#5f3d2a'),
        );
        barnRoof.rotation.z = Math.PI / 2;
        barnRoof.position.y = 2.7;
        const barnDoor = new THREE.Mesh(
          track(new THREE.BoxGeometry(1.1, 1.4, 0.1)),
          flat('#f3ead3'),
        );
        barnDoor.position.set(0, 0.7, 1.42);
        barn.add(barnBody, barnRoof, barnDoor);
        barn.position.set(8.5, 0, -1.5);
        scene.add(barn);

        // ---- Animals in the pen + cat ----------------------------------
        const animalBodies: { mesh: import('three').Group; phase: number }[] = [];
        const makeAnimal = (
          bodyColor: string,
          headColor: string,
          size: [number, number, number],
          position: [number, number],
        ) => {
          const animal = new THREE.Group();
          const body = new THREE.Mesh(track(new THREE.BoxGeometry(...size)), flat(bodyColor));
          body.position.y = size[1] / 2 + 0.18;
          const head = new THREE.Mesh(
            track(new THREE.BoxGeometry(size[0] * 0.45, size[1] * 0.6, size[2] * 0.55)),
            flat(headColor),
          );
          head.position.set(size[0] * 0.62, size[1] * 0.75 + 0.18, 0);
          animal.add(body, head);
          animal.position.set(position[0], 0, position[1]);
          animal.rotation.y = (position[0] * 13 + position[1] * 7) % 2;
          scene.add(animal);
          animalBodies.push({ mesh: animal, phase: position[0] + position[1] });
          return animal;
        };
        makeAnimal('#efe6d4', '#e0d2b8', [1.1, 0.7, 0.6], [6.8, 3.4]); // cow
        makeAnimal('#e7a7ad', '#dd949b', [0.8, 0.55, 0.5], [9.6, 4.6]); // pig
        makeAnimal('#8a6242', '#7a5638', [1.15, 0.8, 0.55], [10.6, 8.4]); // horse
        makeAnimal('#f6f1e4', '#e8b04b', [0.45, 0.38, 0.35], [7.4, 8.9]); // chicken
        makeAnimal('#cfc8bb', '#bfb7a8', [0.85, 0.6, 0.5], [6.2, 6.2]); // goat

        const cat = new THREE.Group();
        const catBody = new THREE.Mesh(
          track(new THREE.BoxGeometry(0.5, 0.34, 0.3)),
          flat('#d9873c'),
        );
        catBody.position.y = 0.35;
        const catHead = new THREE.Mesh(
          track(new THREE.BoxGeometry(0.26, 0.24, 0.26)),
          flat('#e09a50'),
        );
        catHead.position.set(0.3, 0.52, 0);
        const earGeometry = track(new THREE.ConeGeometry(0.07, 0.12, 4));
        const earMaterial = flat('#c67a30');
        const earLeft = new THREE.Mesh(earGeometry, earMaterial);
        earLeft.position.set(0.26, 0.68, 0.08);
        const earRight = new THREE.Mesh(earGeometry, earMaterial);
        earRight.position.set(0.26, 0.68, -0.08);
        const tail = new THREE.Mesh(track(new THREE.BoxGeometry(0.3, 0.08, 0.08)), earMaterial);
        tail.position.set(-0.35, 0.45, 0);
        cat.add(catBody, catHead, earLeft, earRight, tail);
        cat.position.set(-4.2, 0, -4.6);
        cat.rotation.y = 0.6;
        scene.add(cat);

        // ---- Clouds and their ground shadows ---------------------------
        const cloudMaterial = track(
          new THREE.MeshLambertMaterial({ color: '#fff8e8', transparent: true, opacity: 0.85 }),
        );
        const shadowMaterial = track(
          new THREE.MeshBasicMaterial({ color: '#1a3a2c', transparent: true, opacity: 0.08 }),
        );
        const clouds: {
          cloud: import('three').Group;
          shadow: import('three').Mesh;
          speed: number;
          z: number;
        }[] = [];
        const puffGeometry = track(new THREE.SphereGeometry(1, 7, 7));
        const shadowGeometry = track(new THREE.CircleGeometry(2.2, 14));
        for (const [cx, cz, speed] of [
          [-9, -2, 0.32],
          [2, 7, 0.24],
          [10, -6, 0.28],
        ] as const) {
          const cloud = new THREE.Group();
          for (const [ox, oy, oscale] of [
            [0, 0, 1],
            [1.2, 0.15, 0.72],
            [-1.1, 0.1, 0.6],
          ] as const) {
            const puff = new THREE.Mesh(puffGeometry, cloudMaterial);
            puff.position.set(ox, oy, 0);
            puff.scale.setScalar(oscale);
            cloud.add(puff);
          }
          cloud.scale.set(1.4, 0.55, 0.9);
          cloud.position.set(cx, 9, cz);
          scene.add(cloud);
          const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
          shadow.rotation.x = -Math.PI / 2;
          shadow.position.set(cx, 0.02, cz + 2);
          shadow.scale.set(1.4, 0.9, 1);
          scene.add(shadow);
          clouds.push({ cloud, shadow, speed, z: cz });
        }

        // ---- Isometric camera fit --------------------------------------
        const ISO_DISTANCE = 26;
        const baseAzimuth = Math.PI / 4;
        const elevation = Math.atan(1 / Math.SQRT2);
        const positionCamera = (azimuthOffset: number, lift: number) => {
          const azimuth = baseAzimuth + azimuthOffset;
          camera.position.set(
            Math.cos(azimuth) * ISO_DISTANCE,
            Math.sin(elevation) * ISO_DISTANCE + lift,
            Math.sin(azimuth) * ISO_DISTANCE,
          );
          camera.lookAt(0.5, 0, 0.5);
        };

        const fit = () => {
          if (!renderer || !host) return;
          const { clientWidth, clientHeight } = host;
          const aspect = clientWidth / Math.max(clientHeight, 1);
          const viewSize = aspect < 0.9 ? 13.5 : 10.5;
          camera.left = -viewSize * aspect;
          camera.right = viewSize * aspect;
          camera.top = viewSize;
          camera.bottom = -viewSize;
          camera.updateProjectionMatrix();
          renderer.setSize(clientWidth, clientHeight, false);
        };
        resizeObserver = new ResizeObserver(() => {
          fit();
          if (staticScene) {
            positionCamera(0, 0);
            renderer?.render(scene, camera);
          }
        });
        resizeObserver.observe(host);
        fit();
        positionCamera(0, 0);

        if (staticScene) {
          renderer.render(scene, camera);
          readyRef.current();
          return;
        }

        // ---- Pointer parallax (fine pointers only) ---------------------
        let pointerX = 0;
        let pointerY = 0;
        const finePointer = window.matchMedia('(pointer: fine)').matches;
        const onPointer = (event: PointerEvent) => {
          pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
          pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
        };
        if (finePointer) window.addEventListener('pointermove', onPointer, { passive: true });

        let visible = true;
        intersectionObserver = new IntersectionObserver(
          ([entry]) => {
            visible = entry?.isIntersecting ?? true;
          },
          { threshold: 0.02 },
        );
        intersectionObserver.observe(host);

        removeListeners = () => {
          if (finePointer) window.removeEventListener('pointermove', onPointer);
        };

        const clock = new THREE.Clock();
        const tick = () => {
          if (disposed) return;
          animationId = window.requestAnimationFrame(tick);
          if (!visible || document.hidden || !renderer) return;
          const t = clock.getElapsedTime();

          positionCamera(Math.sin(t * 0.05) * 0.045 + pointerX * 0.035, pointerY * -0.6);

          for (const { group, phase } of trees) {
            group.rotation.z = Math.sin(t * 0.9 + phase) * 0.018;
          }
          for (const { mesh, phase } of animalBodies) {
            mesh.position.y = Math.abs(Math.sin(t * 1.1 + phase)) * 0.045;
          }
          cat.position.y = Math.abs(Math.sin(t * 1.6 + 2)) * 0.08;
          shimmer.scale.setScalar(1 + Math.sin(t * 0.8) * 0.12);
          for (const { cloud, shadow, speed, z } of clouds) {
            const drift = ((t * speed + 20) % 40) - 20;
            cloud.position.x = drift;
            shadow.position.x = drift;
            cloud.position.z = z + Math.sin(t * 0.05 + z) * 0.6;
            shadow.position.z = cloud.position.z + 2;
          }
          renderer.render(scene, camera);
        };
        tick();
        readyRef.current();
      } catch {
        if (!disposed) failRef.current();
      }
    }

    void mount();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationId);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      removeListeners?.();
      for (const resource of disposables) resource.dispose();
      if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
        renderer.domElement.remove();
      }
    };
  }, [staticScene]);

  return <div className="world-scene__canvas" ref={hostRef} aria-hidden="true" />;
}

export default WorldScene;
