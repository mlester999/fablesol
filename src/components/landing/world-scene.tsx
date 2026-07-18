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
 *
 * Composition: a stone plaza where two paths cross anchors the village.
 * The cottage sits northwest with drifting chimney smoke, the barn east
 * beside a fenced animal paddock, neat crop rows southeast, and a reeded
 * pond southwest. Mixed pine and oak trees ring the edges, meadow patches
 * and flowers vary the terrain, and the cat companion sits on the plaza.
 * The center stays calm so the hero text reads clearly above it.
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

  useEffect(() => {
    readyRef.current = onReady;
    failRef.current = onFail;
  }, [onReady, onFail]);

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
        scene.background = new THREE.Color('#78a26c');

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

        // Warm afternoon light: sky/ground hemisphere plus a low sun.
        scene.add(new THREE.HemisphereLight(0xfff2d0, 0x4c7a48, 0.85));
        const sun = new THREE.DirectionalLight(0xffe0a3, 1.35);
        sun.position.set(10, 15, 4);
        scene.add(sun);
        const fill = new THREE.DirectionalLight(0xcfe6ff, 0.25);
        fill.position.set(-8, 10, -6);
        scene.add(fill);

        const flat = (
          color: string,
          extra?: Partial<import('three').MeshLambertMaterialParameters>,
        ) => track(new THREE.MeshLambertMaterial({ color, ...extra }));

        // ---- Ground: instanced tile field with meadow variation ---------
        const SIZE = 46;
        const HALF = SIZE / 2;
        const tileGeometry = track(new THREE.BoxGeometry(1, 0.35, 1));
        const tileMaterial = track(new THREE.MeshLambertMaterial({ color: '#ffffff' }));
        const tiles = new THREE.InstancedMesh(tileGeometry, tileMaterial, SIZE * SIZE);
        const grassShades = ['#6d9c58', '#75a55f', '#659253', '#7cab66'];
        const meadowShades = ['#82b06a', '#8db873'];
        const pathShades = ['#c2a173', '#b6956a'];
        const plazaShades = ['#b9ab90', '#a99b80'];
        const matrix = new THREE.Matrix4();
        const color = new THREE.Color();

        const PLAZA = { x: 2, z: -1, r: 2.7 };
        const isPath = (px: number, pz: number) => {
          const horizontal = Math.abs(pz + 1) < 1 && Math.abs(px) < HALF;
          const vertical = Math.abs(px - 2) < 1 && pz > -11 && pz < 13;
          const cottageSpur = Math.abs(px + 7) < 0.9 && pz > -5.5 && pz < -1;
          return horizontal || vertical || cottageSpur;
        };
        const isPlaza = (px: number, pz: number) =>
          (px - PLAZA.x) ** 2 + (pz - PLAZA.z) ** 2 < PLAZA.r ** 2;

        let i = 0;
        for (let x = 0; x < SIZE; x += 1) {
          for (let z = 0; z < SIZE; z += 1) {
            const px = x - HALF;
            const pz = z - HALF;
            // Subtle terrain undulation away from paths and the plaza
            const onWalk = isPath(px, pz) || isPlaza(px, pz);
            const lift = onWalk ? 0 : Math.sin(px * 0.7) * Math.cos(pz * 0.6) * 0.05;
            matrix.setPosition(px, -0.18 + lift, pz);
            tiles.setMatrixAt(i, matrix);
            if (isPlaza(px, pz)) {
              color.set(plazaShades[(x + z) % 2]!);
            } else if (isPath(px, pz)) {
              color.set(pathShades[(x + z) % 2]!);
            } else {
              // Clustered meadow patches break up the base grass
              const noise = Math.sin(px * 0.32 + 1.7) + Math.cos(pz * 0.27 - 0.6);
              color.set(
                noise > 0.9
                  ? meadowShades[(x + z) % meadowShades.length]!
                  : grassShades[(x * 7 + z * 13) % grassShades.length]!,
              );
            }
            tiles.setColorAt(i, color);
            i += 1;
          }
        }
        tiles.instanceMatrix.needsUpdate = true;
        if (tiles.instanceColor) tiles.instanceColor.needsUpdate = true;
        scene.add(tiles);

        // ---- Pond with shore, lily pads, and reeds ----------------------
        const POND = { x: -8.5, z: 5.8 };
        const shore = new THREE.Mesh(
          track(new THREE.CylinderGeometry(3.8, 3.9, 0.1, 26)),
          flat('#c2a173'),
        );
        shore.position.set(POND.x, -0.02, POND.z);
        scene.add(shore);
        const pond = new THREE.Mesh(
          track(new THREE.CylinderGeometry(3.3, 3.3, 0.14, 26)),
          flat('#4a7c8c'),
        );
        pond.position.set(POND.x, 0.03, POND.z);
        scene.add(pond);
        const shimmer = new THREE.Mesh(
          track(new THREE.CylinderGeometry(1.7, 1.7, 0.02, 20)),
          track(
            new THREE.MeshLambertMaterial({ color: '#7fb2c0', transparent: true, opacity: 0.5 }),
          ),
        );
        shimmer.position.set(POND.x - 0.4, 0.13, POND.z - 0.3);
        scene.add(shimmer);

        const padGeometry = track(new THREE.CylinderGeometry(0.34, 0.34, 0.05, 8));
        const padMaterial = flat('#3a7a50');
        for (const [ox, oz] of [
          [1.1, 0.7],
          [-1.4, -0.9],
          [0.2, 1.7],
        ] as const) {
          const pad = new THREE.Mesh(padGeometry, padMaterial);
          pad.position.set(POND.x + ox, 0.12, POND.z + oz);
          scene.add(pad);
        }
        const reedStalkGeometry = track(new THREE.BoxGeometry(0.09, 0.9, 0.09));
        const reedTipGeometry = track(new THREE.CylinderGeometry(0.09, 0.09, 0.32, 6));
        const reedMaterial = flat('#4c7a3f');
        const reedTipMaterial = flat('#8a6a48');
        const reeds: { group: import('three').Group; phase: number }[] = [];
        for (const [ox, oz] of [
          [3.3, 1.4],
          [3.6, 0.4],
          [2.9, 2.2],
          [-3.4, 1.6],
          [-3.1, -2.4],
        ] as const) {
          const reed = new THREE.Group();
          const stalk = new THREE.Mesh(reedStalkGeometry, reedMaterial);
          stalk.position.y = 0.45;
          const tip = new THREE.Mesh(reedTipGeometry, reedTipMaterial);
          tip.position.y = 1;
          reed.add(stalk, tip);
          reed.position.set(POND.x + ox, 0, POND.z + oz);
          scene.add(reed);
          reeds.push({ group: reed, phase: ox * 2 + oz });
        }

        // ---- Crop field with fence (southeast) --------------------------
        const field = new THREE.Group();
        const soil = new THREE.Mesh(track(new THREE.BoxGeometry(7.4, 0.16, 5.4)), flat('#6b4f35'));
        field.add(soil);
        const cropGeometry = track(new THREE.BoxGeometry(0.4, 0.42, 0.4));
        const cropTallGeometry = track(new THREE.ConeGeometry(0.26, 0.62, 5));
        // Row crops: each row reads as one planting
        const rowMaterials = [flat('#8cc63f'), flat('#d4e27a'), flat('#e8a13c'), flat('#7cbc63')];
        for (let cz = 0; cz < 4; cz += 1) {
          for (let cx = 0; cx < 6; cx += 1) {
            const tall = cz % 2 === 1;
            const crop = new THREE.Mesh(
              tall ? cropTallGeometry : cropGeometry,
              rowMaterials[cz % rowMaterials.length]!,
            );
            crop.position.set(
              -2.7 + cx * 1.1,
              (tall ? 0.4 : 0.3) + ((cx + cz) % 3) * 0.04,
              -1.65 + cz * 1.1,
            );
            field.add(crop);
          }
        }
        const postGeometry = track(new THREE.BoxGeometry(0.16, 0.7, 0.16));
        const woodMaterial = flat('#8a6a48');
        const addFence = (
          parent: import('three').Group,
          width: number,
          depth: number,
          gap?: { side: 'north' | 'west'; from: number; to: number },
        ) => {
          const hw = width / 2;
          const hd = depth / 2;
          const railGeometryH = track(new THREE.BoxGeometry(width + 0.4, 0.09, 0.09));
          const railGeometryV = track(new THREE.BoxGeometry(0.09, 0.09, depth + 0.4));
          for (let px = -hw; px <= hw; px += 2) {
            for (const pz of [-hd, hd]) {
              if (gap && gap.side === 'north' && pz === -hd && px >= gap.from && px <= gap.to) {
                continue;
              }
              const post = new THREE.Mesh(postGeometry, woodMaterial);
              post.position.set(px, 0.32, pz);
              parent.add(post);
            }
          }
          for (const pz of [-hd, hd]) {
            if (gap && gap.side === 'north' && pz === -hd) {
              const partial = new THREE.Mesh(
                track(new THREE.BoxGeometry(hw - gap.to + 0.2, 0.09, 0.09)),
                woodMaterial,
              );
              partial.position.set((gap.to + hw) / 2 + 0.1, 0.5, pz);
              parent.add(partial);
              const partial2 = new THREE.Mesh(
                track(new THREE.BoxGeometry(gap.from + hw + 0.2, 0.09, 0.09)),
                woodMaterial,
              );
              partial2.position.set((gap.from - hw) / 2 - 0.1, 0.5, pz);
              parent.add(partial2);
              continue;
            }
            const rail = new THREE.Mesh(railGeometryH, woodMaterial);
            rail.position.set(0, 0.5, pz);
            parent.add(rail);
          }
          for (const px of [-hw, hw]) {
            for (let pz = -hd + 2; pz <= hd - 2; pz += 2) {
              const post = new THREE.Mesh(postGeometry, woodMaterial);
              post.position.set(px, 0.32, pz);
              parent.add(post);
            }
            const rail = new THREE.Mesh(railGeometryV, woodMaterial);
            rail.position.set(px, 0.5, 0);
            parent.add(rail);
          }
        };
        addFence(field, 8, 6);
        field.position.set(8.6, 0, 8.8);
        scene.add(field);

        // ---- Animal paddock (east, beside the barn) ---------------------
        const paddock = new THREE.Group();
        addFence(paddock, 7, 5, { side: 'north', from: -1.2, to: 1.2 });
        paddock.position.set(9.8, 0, 1.6);
        scene.add(paddock);

        // ---- Trees: mixed pines and oaks ringing the edges --------------
        const trunkGeometry = track(new THREE.BoxGeometry(0.34, 1, 0.34));
        const pineGeometry = track(new THREE.ConeGeometry(1.05, 1.7, 6));
        const pineGeometrySmall = track(new THREE.ConeGeometry(0.75, 1.15, 6));
        const oakGeometry = track(new THREE.SphereGeometry(1.05, 8, 6));
        const oakTopGeometry = track(new THREE.SphereGeometry(0.66, 7, 5));
        const trunkMaterial = flat('#6b4f35');
        const canopyMaterials = [flat('#2f6b45'), flat('#3a7a50'), flat('#295e3d')];
        const oakMaterials = [flat('#4c8a45'), flat('#5c9a52')];
        const trees: { group: import('three').Group; phase: number }[] = [];
        const treeSpots: readonly (readonly [number, number, number, 'pine' | 'oak'])[] = [
          [-13, -10, 1.15, 'pine'],
          [-9.5, -11, 0.9, 'oak'],
          [-12.5, 1.5, 1, 'pine'],
          [-12, 10.5, 0.9, 'oak'],
          [-4, -10.5, 1.1, 'oak'],
          [0, -12, 0.95, 'pine'],
          [6, -10.5, 1.2, 'pine'],
          [11, -10, 0.9, 'oak'],
          [13.5, -5, 1.05, 'pine'],
          [14, 5.5, 0.9, 'oak'],
          [13, 12, 1, 'pine'],
          [1.5, 13, 1.05, 'oak'],
          [-3.5, 12.5, 0.9, 'pine'],
          [-13.5, -4.5, 0.8, 'oak'],
          [-2.5, 8.5, 0.75, 'oak'],
          [5.2, 4.6, 0.7, 'oak'],
          [-11, -7.5, 0.85, 'pine'],
        ];
        for (const [tx, tz, scale, kind] of treeSpots) {
          const tree = new THREE.Group();
          const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
          trunk.position.y = 0.5 * scale;
          trunk.scale.setScalar(scale);
          if (kind === 'pine') {
            const canopy = new THREE.Mesh(
              scale > 1 ? pineGeometry : pineGeometrySmall,
              canopyMaterials[Math.abs(Math.round(tx * 3 + tz)) % canopyMaterials.length]!,
            );
            canopy.position.y = (scale > 1 ? 1.8 : 1.45) * scale;
            canopy.scale.setScalar(scale);
            tree.add(trunk, canopy);
          } else {
            const crown = new THREE.Mesh(
              oakGeometry,
              oakMaterials[Math.abs(Math.round(tx + tz * 2)) % oakMaterials.length]!,
            );
            crown.position.y = 1.6 * scale;
            crown.scale.setScalar(scale);
            const crownTop = new THREE.Mesh(oakTopGeometry, oakMaterials[0]!);
            crownTop.position.set(0.35 * scale, 2.25 * scale, 0.2 * scale);
            crownTop.scale.setScalar(scale);
            tree.add(trunk, crown, crownTop);
          }
          tree.position.set(tx, 0, tz);
          scene.add(tree);
          trees.push({ group: tree, phase: tx * 0.7 + tz * 0.3 });
        }

        // ---- Flowers scattered across open meadow -----------------------
        const flowerGeometry = track(new THREE.BoxGeometry(0.16, 0.16, 0.16));
        const flowerMaterial = track(new THREE.MeshLambertMaterial({ color: '#ffffff' }));
        const flowerShades = ['#e8b8b0', '#e6c95c', '#fdf9ee', '#c94f3d', '#d9a7e0'];
        const flowerCount = 46;
        const flowers = new THREE.InstancedMesh(flowerGeometry, flowerMaterial, flowerCount);
        let planted = 0;
        let attempt = 0;
        while (planted < flowerCount && attempt < 400) {
          attempt += 1;
          // Deterministic pseudo-random spread so every visit looks composed
          const fx = Math.sin(attempt * 12.9898) * 14.2;
          const fz = Math.cos(attempt * 78.233) * 12.6;
          const nearPond = (fx - POND.x) ** 2 + (fz - POND.z) ** 2 < 4.6 ** 2;
          const nearField = Math.abs(fx - 8.6) < 4.6 && Math.abs(fz - 8.8) < 3.6;
          const nearPaddock = Math.abs(fx - 9.8) < 4.2 && Math.abs(fz - 1.6) < 3.2;
          const nearCottage = Math.abs(fx + 7) < 2.6 && Math.abs(fz + 7) < 2.4;
          const nearBarn = Math.abs(fx - 10) < 2.8 && Math.abs(fz + 6) < 2.4;
          if (
            isPath(fx, fz) ||
            isPlaza(fx, fz) ||
            nearPond ||
            nearField ||
            nearPaddock ||
            nearCottage ||
            nearBarn
          ) {
            continue;
          }
          matrix.setPosition(fx, 0.06, fz);
          flowers.setMatrixAt(planted, matrix);
          color.set(flowerShades[planted % flowerShades.length]!);
          flowers.setColorAt(planted, color);
          planted += 1;
        }
        flowers.count = planted;
        flowers.instanceMatrix.needsUpdate = true;
        if (flowers.instanceColor) flowers.instanceColor.needsUpdate = true;
        scene.add(flowers);

        // ---- Cottage (northwest) with chimney smoke ---------------------
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
        const windowGeometry = track(new THREE.BoxGeometry(0.55, 0.5, 0.06));
        const windowMaterial = flat('#e6c95c');
        const windowLeft = new THREE.Mesh(windowGeometry, windowMaterial);
        windowLeft.position.set(-0.75, 1.15, 1.32);
        const windowRight = new THREE.Mesh(windowGeometry, windowMaterial);
        windowRight.position.set(1.15, 1.35, 1.32);
        cottage.add(cottageBody, cottageRoof, chimney, door, windowLeft, windowRight);
        cottage.position.set(-7, 0, -7);
        scene.add(cottage);

        const smokeMaterial = track(
          new THREE.MeshLambertMaterial({ color: '#fdf9ee', transparent: true, opacity: 0.7 }),
        );
        const smokeGeometry = track(new THREE.SphereGeometry(0.24, 7, 6));
        const smokePuffs: { mesh: import('three').Mesh; phase: number }[] = [];
        for (let s = 0; s < 3; s += 1) {
          const puff = new THREE.Mesh(smokeGeometry, smokeMaterial);
          puff.position.set(-6.1, 3.6 + s * 0.55, -6.6);
          puff.scale.setScalar(1 - s * 0.2);
          scene.add(puff);
          smokePuffs.push({ mesh: puff, phase: s * 1.1 });
        }

        // ---- Barn (east) facing the plaza -------------------------------
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
        const barnTrim = new THREE.Mesh(
          track(new THREE.BoxGeometry(1.3, 0.14, 0.12)),
          flat('#f3ead3'),
        );
        barnTrim.position.set(0, 1.55, 1.42);
        barn.add(barnBody, barnRoof, barnDoor, barnTrim);
        barn.position.set(9.5, 0, -6.2);
        scene.add(barn);

        // ---- The five animals inside the paddock ------------------------
        const animalBodies: { mesh: import('three').Group; phase: number }[] = [];
        const legGeometry = track(new THREE.BoxGeometry(0.16, 0.3, 0.16));
        const makeAnimal = (
          bodyColor: string,
          headColor: string,
          size: [number, number, number],
          position: [number, number],
          options?: { ears?: boolean; horns?: boolean },
        ) => {
          const animal = new THREE.Group();
          const bodyMaterial = flat(bodyColor);
          const headMaterial = flat(headColor);
          const body = new THREE.Mesh(track(new THREE.BoxGeometry(...size)), bodyMaterial);
          body.position.y = size[1] / 2 + 0.32;
          const head = new THREE.Mesh(
            track(new THREE.BoxGeometry(size[0] * 0.45, size[1] * 0.62, size[2] * 0.58)),
            headMaterial,
          );
          head.position.set(size[0] * 0.62, size[1] * 0.85 + 0.32, 0);
          animal.add(body, head);
          for (const [lx, lz] of [
            [size[0] * 0.32, size[2] * 0.26],
            [size[0] * 0.32, -size[2] * 0.26],
            [-size[0] * 0.32, size[2] * 0.26],
            [-size[0] * 0.32, -size[2] * 0.26],
          ] as const) {
            const leg = new THREE.Mesh(legGeometry, headMaterial);
            leg.position.set(lx, 0.16, lz);
            animal.add(leg);
          }
          if (options?.ears) {
            const earGeo = track(new THREE.ConeGeometry(0.07, 0.16, 4));
            for (const ez of [0.14, -0.14]) {
              const ear = new THREE.Mesh(earGeo, headMaterial);
              ear.position.set(size[0] * 0.62, size[1] * 1.25 + 0.32, ez);
              animal.add(ear);
            }
          }
          if (options?.horns) {
            const hornGeo = track(new THREE.BoxGeometry(0.07, 0.2, 0.07));
            const hornMat = flat('#e8dcc4');
            for (const hz of [0.16, -0.16]) {
              const horn = new THREE.Mesh(hornGeo, hornMat);
              horn.position.set(size[0] * 0.56, size[1] * 1.3 + 0.32, hz);
              animal.add(horn);
            }
          }
          animal.position.set(position[0], 0, position[1]);
          animal.rotation.y = (position[0] * 13 + position[1] * 7) % 2;
          scene.add(animal);
          animalBodies.push({ mesh: animal, phase: position[0] + position[1] });
          return animal;
        };
        makeAnimal('#efe6d4', '#e0d2b8', [1.1, 0.7, 0.6], [8.2, 0.6], { ears: true, horns: true }); // cow
        makeAnimal('#e7a7ad', '#dd949b', [0.8, 0.55, 0.5], [11.4, 0.4], { ears: true }); // pig
        makeAnimal('#8a6242', '#7a5638', [1.15, 0.8, 0.55], [11.6, 2.8], { ears: true }); // horse
        makeAnimal('#f6f1e4', '#e8a13c', [0.45, 0.38, 0.35], [8.3, 3], { ears: false }); // chicken
        makeAnimal('#cfc8bb', '#bfb7a8', [0.85, 0.6, 0.5], [9.9, 1.8], { ears: true, horns: true }); // goat

        // ---- The cat companion, seated on the plaza ---------------------
        const cat = new THREE.Group();
        const catBody = new THREE.Mesh(
          track(new THREE.BoxGeometry(0.55, 0.4, 0.34)),
          flat('#d9873c'),
        );
        catBody.position.y = 0.38;
        const catHead = new THREE.Mesh(
          track(new THREE.BoxGeometry(0.3, 0.28, 0.3)),
          flat('#e09a50'),
        );
        catHead.position.set(0.32, 0.62, 0);
        const earGeometry = track(new THREE.ConeGeometry(0.08, 0.14, 4));
        const earMaterial = flat('#c67a30');
        const earLeft = new THREE.Mesh(earGeometry, earMaterial);
        earLeft.position.set(0.28, 0.82, 0.09);
        const earRight = new THREE.Mesh(earGeometry, earMaterial);
        earRight.position.set(0.28, 0.82, -0.09);
        const tail = new THREE.Mesh(track(new THREE.BoxGeometry(0.36, 0.09, 0.09)), earMaterial);
        tail.position.set(-0.42, 0.5, 0);
        const catChest = new THREE.Mesh(
          track(new THREE.BoxGeometry(0.2, 0.22, 0.22)),
          flat('#fdf3e0'),
        );
        catChest.position.set(0.3, 0.42, 0);
        cat.add(catBody, catHead, earLeft, earRight, tail, catChest);
        // Beside the vertical path, below the hero copy, so the companion
        // stays visible instead of hiding behind the overlay text.
        cat.position.set(0.4, 0, 5.2);
        cat.rotation.y = -0.5;
        cat.scale.setScalar(1.35);
        scene.add(cat);

        // ---- Butterflies over the meadow --------------------------------
        const wingGeometry = track(new THREE.PlaneGeometry(0.22, 0.3));
        const butterflyMaterials = [
          track(
            new THREE.MeshBasicMaterial({
              color: '#e6c95c',
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.95,
            }),
          ),
          track(
            new THREE.MeshBasicMaterial({
              color: '#e8b8b0',
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.95,
            }),
          ),
        ];
        const butterflies: {
          group: import('three').Group;
          left: import('three').Mesh;
          right: import('three').Mesh;
          cx: number;
          cz: number;
          phase: number;
        }[] = [];
        for (const [bx, bz, materialIndex] of [
          [-4.5, 2.5, 0],
          [6.5, 6.4, 1],
        ] as const) {
          const group = new THREE.Group();
          const left = new THREE.Mesh(wingGeometry, butterflyMaterials[materialIndex]!);
          left.position.x = -0.1;
          left.rotation.z = 0.5;
          const right = new THREE.Mesh(wingGeometry, butterflyMaterials[materialIndex]!);
          right.position.x = 0.1;
          right.rotation.z = -0.5;
          group.add(left, right);
          group.rotation.x = -Math.PI / 3;
          group.position.set(bx, 1.1, bz);
          scene.add(group);
          butterflies.push({ group, left, right, cx: bx, cz: bz, phase: bx });
        }

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
          [-9, -3, 0.32],
          [2, 8, 0.24],
          [10, -7, 0.28],
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
          camera.lookAt(0.5, 0, 0.8);
        };

        const fit = () => {
          if (!renderer || !host) return;
          const { clientWidth, clientHeight } = host;
          const aspect = clientWidth / Math.max(clientHeight, 1);
          const viewSize = aspect < 0.9 ? 13.5 : 10.8;
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
          for (const { group, phase } of reeds) {
            group.rotation.z = Math.sin(t * 1.3 + phase) * 0.09;
          }
          for (const { mesh, phase } of animalBodies) {
            mesh.position.y = Math.abs(Math.sin(t * 1.1 + phase)) * 0.045;
          }
          cat.position.y = Math.abs(Math.sin(t * 1.6 + 2)) * 0.07;
          cat.children[4]!.rotation.z = Math.sin(t * 2.2) * 0.25; // tail sway
          shimmer.scale.setScalar(1 + Math.sin(t * 0.8) * 0.12);
          for (const { mesh, phase } of smokePuffs) {
            const cycle = (t * 0.4 + phase) % 2;
            mesh.position.y = 3.5 + cycle * 1.1;
            mesh.position.x = -6.1 + Math.sin(t * 0.8 + phase) * 0.18;
            const material = mesh.material as import('three').MeshLambertMaterial;
            material.opacity = Math.max(0, 0.7 - cycle * 0.35);
          }
          for (const { group, left, right, cx, cz, phase } of butterflies) {
            group.position.x = cx + Math.sin(t * 0.5 + phase) * 1.4;
            group.position.z = cz + Math.cos(t * 0.4 + phase) * 1.1;
            group.position.y = 1 + Math.sin(t * 1.7 + phase) * 0.25;
            left.rotation.z = 0.35 + Math.sin(t * 11 + phase) * 0.55;
            right.rotation.z = -0.35 - Math.sin(t * 11 + phase) * 0.55;
          }
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
