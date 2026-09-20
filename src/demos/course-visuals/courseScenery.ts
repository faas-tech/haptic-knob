import * as THREE from "three";

type CoursePoint = { xYards: number; yYards: number };
export type CourseTheme = "parkland" | "twilight";

export function createTurfMaterial(color: number, stripes = false) {
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.95 });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader =
      `varying vec3 coursePosition;\n${shader.vertexShader}`.replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\ncoursePosition = (modelMatrix * vec4(position, 1.0)).xyz;",
      );
    shader.fragmentShader =
      `varying vec3 coursePosition;\n${shader.fragmentShader}`.replace(
        "#include <color_fragment>",
        `#include <color_fragment>
      float grain = fract(sin(dot(floor(coursePosition.xz * 18.0), vec2(12.9898, 78.233))) * 43758.5453);
      float broadGrain = sin(coursePosition.x * 0.65) * cos(coursePosition.z * 0.37);
      diffuseColor.rgb *= 0.92 + grain * 0.12 + broadGrain * 0.035;
      ${stripes ? "diffuseColor.rgb *= 0.90 + 0.10 * smoothstep(-0.12, 0.12, sin((coursePosition.z + coursePosition.x * 0.35) * 0.48));" : ""}`,
      );
  };
  material.customProgramCacheKey = () => `course-turf-${stripes}`;
  return material;
}

export function addCourseEnvironment(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  theme: CourseTheme,
  widthYards: number,
  depthYards: number,
) {
  const isTwilight = theme === "twilight";
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = isTwilight ? 1.25 : 1.1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  scene.fog = new THREE.Fog(
    isTwilight ? 0x233b58 : 0xb8d3ce,
    140,
    isTwilight ? 550 : 1000,
  );
  scene.add(
    new THREE.HemisphereLight(
      isTwilight ? 0x9caeff : 0xd6eeff,
      isTwilight ? 0x284e40 : 0x637940,
      2,
    ),
  );
  const sun = new THREE.DirectionalLight(
    isTwilight ? 0xb8ceff : 0xffe4ab,
    isTwilight ? 2 : 3,
  );
  sun.position.set(-130, 190, -80);
  sun.target.position.set(widthYards / 2, 0, depthYards / 2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -360,
    right: 360,
    top: 360,
    bottom: -360,
    near: 1,
    far: 1000,
  });
  sun.shadow.normalBias = 0.12;
  sun.shadow.bias = -0.0002;
  scene.add(sun, sun.target);

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(1300, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        zenith: { value: new THREE.Color(isTwilight ? 0x101c42 : 0x429ec8) },
        horizon: { value: new THREE.Color(isTwilight ? 0xa67e9b : 0xf5e9c8) },
      },
      vertexShader:
        "varying vec3 direction; void main() { direction = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader:
        "varying vec3 direction; uniform vec3 zenith; uniform vec3 horizon; void main() { float h = normalize(direction).y; gl_FragColor = vec4(mix(horizon, zenith, pow(max(0.0, h), 0.45)), 1.0); }",
    }),
  );
  sky.position.set(widthYards / 2, 0, depthYards / 2);
  scene.add(sky);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(2600, 2600),
    createTurfMaterial(isTwilight ? 0x19463c : 0x507447),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(widthYards / 2, -0.08, depthYards / 2);
  ground.receiveShadow = true;
  scene.add(ground);

  const glowCanvas = document.createElement("canvas");
  glowCanvas.width = glowCanvas.height = 64;
  const context = glowCanvas.getContext("2d")!;
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, isTwilight ? "#edf5ff" : "#fff9db");
  gradient.addColorStop(0.18, isTwilight ? "#d7eaff" : "#fff3c7");
  gradient.addColorStop(0.23, isTwilight ? "#b5d7ff77" : "#ffe0a677");
  gradient.addColorStop(1, "#ffffff00");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  const sunGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(glowCanvas),
      depthWrite: false,
      fog: false,
    }),
  );
  sunGlow.position.set(-270, isTwilight ? 170 : 270, 650);
  sunGlow.scale.setScalar(isTwilight ? 180 : 280);
  scene.add(sunGlow);

  const mountainGeometry = new THREE.ConeGeometry(1, 1, 7);
  const mountainMaterial = new THREE.MeshStandardMaterial({
    color: isTwilight ? 0x34495d : 0x6c9284,
    roughness: 1,
    flatShading: true,
  });
  const mountains = new THREE.InstancedMesh(
    mountainGeometry,
    mountainMaterial,
    32,
  );
  const dummy = new THREE.Object3D();
  for (let index = 0; index < 32; index++) {
    const angle = (index * Math.PI * 2) / 32;
    const height = 45 + seededFraction(index + 32) * 95;
    dummy.position.set(
      widthYards / 2 + Math.cos(angle) * 720,
      height / 2 - 16,
      depthYards / 2 + Math.sin(angle) * 760,
    );
    dummy.scale.set(
      100 + seededFraction(index) * 130,
      height,
      100 + seededFraction(index + 6) * 100,
    );
    dummy.rotation.y = angle;
    dummy.updateMatrix();
    mountains.setMatrixAt(index, dummy.matrix);
  }
  scene.add(mountains);

  // These trees sit beyond the playable rectangle; obstacle trees use the course data.
  const forest = new THREE.Group();
  const trunkGeometry = new THREE.CylinderGeometry(0.65, 1, 7, 6);
  const crownGeometry = new THREE.ConeGeometry(5.4, 17, 8);
  const trunks = new THREE.InstancedMesh(
    trunkGeometry,
    new THREE.MeshStandardMaterial({ color: 0x514337, roughness: 1 }),
    160,
  );
  const crowns = new THREE.InstancedMesh(
    crownGeometry,
    new THREE.MeshStandardMaterial({
      color: isTwilight ? 0x204e50 : 0x2f6044,
      roughness: 1,
    }),
    320,
  );
  for (let index = 0; index < 160; index++) {
    const side = index % 4;
    const distance = 28 + seededFraction(index + 80) * 130;
    const along = seededFraction(index + 9);
    const x =
      side === 0
        ? -distance
        : side === 1
          ? widthYards + distance
          : along * (widthYards + 100) - 50;
    const z =
      side === 2
        ? -distance
        : side === 3
          ? depthYards + distance
          : along * depthYards;
    const scale = 0.8 + seededFraction(index + 2) * 1.5;
    dummy.position.set(x, 3 * scale, z);
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    trunks.setMatrixAt(index, dummy.matrix);
    dummy.position.y = 12 * scale;
    dummy.updateMatrix();
    crowns.setMatrixAt(index, dummy.matrix);
    dummy.position.y = 17 * scale;
    dummy.scale.setScalar(scale * 0.75);
    dummy.updateMatrix();
    crowns.setMatrixAt(index + 160, dummy.matrix);
  }
  forest.add(trunks, crowns);
  scene.add(forest);
  const hillGeometry = new THREE.SphereGeometry(1, 20, 12);
  const hills = new THREE.InstancedMesh(
    hillGeometry,
    createTurfMaterial(isTwilight ? 0x315957 : 0x668c54),
    24,
  );
  for (let index = 0; index < 24; index++) {
    dummy.position.set(
      index % 2 ? widthYards + 115 : -115,
      -8,
      (index / 24) * (depthYards + 240) - 100,
    );
    dummy.scale.set(
      75 + seededFraction(index + 700) * 30,
      15 + seededFraction(index + 710) * 18,
      65,
    );
    dummy.updateMatrix();
    hills.setMatrixAt(index, dummy.matrix);
  }
  hills.receiveShadow = true;
  scene.add(hills);

  if (!isTwilight) {
    const cloudGeometry = new THREE.SphereGeometry(1, 12, 8);
    const clouds = new THREE.InstancedMesh(
      cloudGeometry,
      new THREE.MeshBasicMaterial({
        color: 0xfaf6e8,
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
        fog: false,
      }),
      36,
    );
    for (let index = 0; index < 36; index++) {
      const cluster = Math.floor(index / 4);
      const angle = cluster * 2.4;
      dummy.position.set(
        110 + Math.cos(angle) * 750 + (index % 4) * 24,
        240 + seededFraction(cluster) * 90,
        depthYards / 2 + Math.sin(angle) * 800,
      );
      dummy.scale.set(52, 9 + seededFraction(index) * 6, 26);
      dummy.updateMatrix();
      clouds.setMatrixAt(index, dummy.matrix);
    }
    scene.add(clouds);
  }

  if (isTwilight) {
    const positions = new Float32Array(240 * 3);
    for (let index = 0; index < 240; index++) {
      positions.set(
        [
          (seededFraction(index) - 0.5) * 900,
          200 + seededFraction(index + 500) * 700,
          (seededFraction(index + 1000) - 0.5) * 900,
        ],
        index * 3,
      );
    }
    const stars = new THREE.Points(
      new THREE.BufferGeometry().setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3),
      ),
      new THREE.PointsMaterial({
        color: 0xd5e7ff,
        size: 1.6,
        transparent: true,
        opacity: 0.7,
        fog: false,
      }),
    );
    scene.add(stars);
  }
}

export function createFairway(
  path: CoursePoint[],
  halfWidthYards: number,
  theme: CourseTheme,
) {
  const left: THREE.Vector2[] = [];
  const right: THREE.Vector2[] = [];
  path.forEach((point, index) => {
    const before = path[Math.max(0, index - 1)];
    const after = path[Math.min(path.length - 1, index + 1)];
    const heading = Math.atan2(
      after.xYards - before.xYards,
      after.yYards - before.yYards,
    );
    left.push(
      new THREE.Vector2(
        point.xYards + Math.cos(heading) * halfWidthYards,
        -point.yYards + Math.sin(heading) * halfWidthYards,
      ),
    );
    right.push(
      new THREE.Vector2(
        point.xYards - Math.cos(heading) * halfWidthYards,
        -point.yYards - Math.sin(heading) * halfWidthYards,
      ),
    );
  });
  const capPoints = (atEnd: boolean) => {
    const center = atEnd ? path[path.length - 1] : path[0];
    const before = atEnd ? path[path.length - 2] : path[0];
    const after = atEnd ? path[path.length - 1] : path[1];
    const heading = Math.atan2(
      after.xYards - before.xYards,
      after.yYards - before.yYards,
    );
    const sign = atEnd ? 1 : -1;
    return Array.from({ length: 17 }, (_, index) => {
      const angle = (index / 16) * Math.PI;
      return new THREE.Vector2(
        center.xYards +
          sign *
            halfWidthYards *
            (Math.cos(heading) * Math.cos(angle) +
              Math.sin(heading) * Math.sin(angle)),
        -center.yYards +
          sign *
            halfWidthYards *
            (Math.sin(heading) * Math.cos(angle) -
              Math.cos(heading) * Math.sin(angle)),
      );
    });
  };
  const shape = new THREE.Shape([
    ...left,
    ...capPoints(true),
    ...right.reverse(),
    ...capPoints(false),
  ]);
  const mesh = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    createTurfMaterial(theme === "twilight" ? 0x378c7d : 0x7cab54, true),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.04;
  mesh.receiveShadow = true;
  return mesh;
}

export function createFairwayFringe(
  path: CoursePoint[],
  halfWidthYards: number,
  theme: CourseTheme,
  hazards: { center: CoursePoint; radiusYards: number }[] = [],
) {
  const geometry = new THREE.ConeGeometry(0.045, 0.5, 3);
  const material = new THREE.MeshStandardMaterial({
    color: theme === "twilight" ? 0x265043 : 0x647c42,
    roughness: 1,
  });
  const grass = new THREE.InstancedMesh(geometry, material, 900);
  const dummy = new THREE.Object3D();
  for (let index = 0; index < 900; index++) {
    const pathIndex = Math.floor(
      seededFraction(index + 93) * (path.length - 1),
    );
    const start = path[pathIndex];
    const end = path[pathIndex + 1];
    const heading = Math.atan2(
      end.xYards - start.xYards,
      end.yYards - start.yYards,
    );
    const along = seededFraction(index + 27);
    const sideways =
      (index % 2 ? -1 : 1) *
      (halfWidthYards + 0.5 + seededFraction(index + 55) * 5);
    const scale = 0.3 + seededFraction(index + 78) * 0.8;
    dummy.position.set(
      start.xYards +
        (end.xYards - start.xYards) * along +
        Math.cos(heading) * sideways,
      scale * 0.3,
      start.yYards +
        (end.yYards - start.yYards) * along -
        Math.sin(heading) * sideways,
    );
    const isInsideHazard = hazards.some(
      (hazard) =>
        Math.hypot(
          dummy.position.x - hazard.center.xYards,
          dummy.position.z - hazard.center.yYards,
        ) <
        hazard.radiusYards + 1,
    );
    dummy.scale.setScalar(isInsideHazard ? 0 : scale);
    dummy.rotation.set(0.1, index, 0.15);
    dummy.updateMatrix();
    grass.setMatrixAt(index, dummy.matrix);
  }
  return grass;
}

export function createCircuitLights(
  path: CoursePoint[],
  halfWidthYards: number,
) {
  const lights = new THREE.Group();
  const posts = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.1, 0.14, 1.2, 8),
    new THREE.MeshStandardMaterial({
      color: 0x28463f,
      metalness: 0.4,
      roughness: 0.4,
    }),
    24,
  );
  const lamps = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.15, 0.15, 0.16, 12),
    new THREE.MeshBasicMaterial({ color: 0x8ffff0 }),
    24,
  );
  const halos = new THREE.InstancedMesh(
    new THREE.CircleGeometry(1.2, 24),
    new THREE.MeshBasicMaterial({
      color: 0x6affdc,
      transparent: true,
      opacity: 0.08,
      depthWrite: false,
    }),
    24,
  );
  const dummy = new THREE.Object3D();
  for (let index = 0; index < 24; index++) {
    const pathIndex = Math.floor(
      (Math.floor(index / 2) / 12) * (path.length - 2),
    );
    const point = path[pathIndex];
    const next = path[pathIndex + 1];
    const angle = Math.atan2(
      next.xYards - point.xYards,
      next.yYards - point.yYards,
    );
    const side = (index % 2 ? -1 : 1) * (halfWidthYards + 1.4);
    dummy.rotation.set(0, 0, 0);
    dummy.position.set(
      point.xYards + Math.cos(angle) * side,
      0.6,
      point.yYards - Math.sin(angle) * side,
    );
    dummy.updateMatrix();
    posts.setMatrixAt(index, dummy.matrix);
    dummy.position.y = 1.2;
    dummy.updateMatrix();
    lamps.setMatrixAt(index, dummy.matrix);
    dummy.rotation.x = -Math.PI / 2;
    dummy.position.y = 0.05;
    dummy.updateMatrix();
    halos.setMatrixAt(index, dummy.matrix);
  }
  lights.add(posts, lamps, halos);
  return lights;
}

export function createCourseTree(point: CoursePoint, theme: CourseTheme) {
  const tree = new THREE.Group();
  const variation = seededFraction(point.xYards * 3 + point.yYards);
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 1.15, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x635244, roughness: 1 }),
  );
  trunk.position.y = 4;
  tree.add(trunk);
  const pine = theme === "twilight" || variation < 0.4;
  const material = new THREE.MeshStandardMaterial({
    color:
      theme === "twilight" ? 0x287775 : variation > 0.75 ? 0x73934c : 0x427c43,
    roughness: 1,
    flatShading: true,
  });
  for (let tier = 0; tier < 3; tier++) {
    const foliage = new THREE.Mesh(
      pine
        ? new THREE.ConeGeometry(5.4 - tier * 1.1, 8.5 - tier * 0.8, 9)
        : new THREE.IcosahedronGeometry(4.5 - tier * 0.5, 1),
      material,
    );
    foliage.position.set(
      pine ? 0 : Math.sin(tier * 3) * 2.4,
      7 + tier * 3.3,
      pine ? 0 : Math.cos(tier * 3) * 1.7,
    );
    foliage.rotation.y = tier * 0.7 + variation;
    tree.add(foliage);
  }
  tree.position.set(point.xYards, 0, point.yYards);
  tree.scale.setScalar(0.85 + variation * 0.3);
  tree.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
  return tree;
}

export function createWater(
  circle: { center: CoursePoint; radiusYards: number },
  theme: CourseTheme,
) {
  const group = new THREE.Group();
  const bank = new THREE.Mesh(
    new THREE.CircleGeometry(circle.radiusYards + 0.7, 64),
    new THREE.MeshStandardMaterial({
      color: theme === "twilight" ? 0x759b9b : 0xc1c593,
      roughness: 0.85,
    }),
  );
  bank.rotation.x = -Math.PI / 2;
  bank.position.y = 0.055;
  group.add(bank);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      waterColor: {
        value: new THREE.Color(theme === "twilight" ? 0x276c91 : 0x359caa),
      },
    },
    vertexShader:
      "varying vec2 waterUv; void main() { waterUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: `varying vec2 waterUv; uniform float time; uniform vec3 waterColor;
      void main() { vec2 p = waterUv * 60.0;
        float ripple = sin(p.x + p.y * 0.6 + time) * sin(p.y * 1.4 - time * 0.6);
        float glint = pow(max(0.0, ripple), 14.0);
        float edge = smoothstep(0.36, 0.5, length(waterUv - 0.5));
        gl_FragColor = vec4(waterColor + vec3(glint * 0.2 + edge * 0.12 + ripple * 0.035), 1.0);
      }`,
  });
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(circle.radiusYards, 64),
    material,
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.065;
  water.name = "course-water";
  group.add(water);
  group.position.set(circle.center.xYards, 0, circle.center.yYards);
  return group;
}

export function createTeeFurniture(
  tee: CoursePoint,
  holeNumber: number,
  theme: CourseTheme,
) {
  const group = new THREE.Group();
  const accent = theme === "twilight" ? 0x69ffe3 : 0xf4e3a9;
  for (const side of [-1, 1]) {
    const marker = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.35, 0.7),
      new THREE.MeshStandardMaterial({
        color: accent,
        emissive: accent,
        emissiveIntensity: theme === "twilight" ? 0.7 : 0,
      }),
    );
    marker.position.set(side * 2.4, 0.2, 0.6);
    marker.castShadow = true;
    group.add(marker);
  }
  const signCanvas = document.createElement("canvas");
  signCanvas.width = 256;
  signCanvas.height = 320;
  const context = signCanvas.getContext("2d")!;
  context.fillStyle = theme === "twilight" ? "#152e3b" : "#203d31";
  context.fillRect(0, 0, 256, 320);
  context.strokeStyle = theme === "twilight" ? "#7aecd6" : "#dfd6a8";
  context.lineWidth = 4;
  context.strokeRect(14, 14, 228, 292);
  context.textAlign = "center";
  context.fillStyle = "#f5f5e7";
  context.font = "20px sans-serif";
  context.fillText("HOLE", 128, 64);
  context.font = "bold 120px sans-serif";
  context.fillText(String(holeNumber).padStart(2, "0"), 128, 200);
  context.font = "16px sans-serif";
  context.fillText(
    theme === "twilight" ? "NEON CIRCUIT" : "ENGINEER ALLEY",
    128,
    264,
  );
  const texture = new THREE.CanvasTexture(signCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2, 0.12), [
    new THREE.MeshStandardMaterial({ color: 0x33483f }),
    new THREE.MeshStandardMaterial({ color: 0x33483f }),
    new THREE.MeshStandardMaterial({ color: 0x33483f }),
    new THREE.MeshStandardMaterial({ color: 0x33483f }),
    new THREE.MeshBasicMaterial({ map: texture }),
    new THREE.MeshBasicMaterial({ map: texture }),
  ]);
  board.position.set(-5.5, 2.5, 1.5);
  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 2.5, 8),
    new THREE.MeshStandardMaterial({ color: 0x5c5146 }),
  );
  post.position.set(-5.5, 1, 1.5);
  group.add(board, post);
  group.position.set(tee.xYards, 0, tee.yYards);
  return group;
}

export function animateCourseScenery(group: THREE.Group, seconds: number) {
  group.traverse((object) => {
    if (object.name === "course-water" && object instanceof THREE.Mesh) {
      (object.material as THREE.ShaderMaterial).uniforms.time.value = seconds;
    }
  });
}

export function disposeCourseObject(object: THREE.Object3D) {
  const textures = new Set<THREE.Texture>();
  const materials = new Set<THREE.Material>();
  const geometries = new Set<THREE.BufferGeometry>();
  object.traverse((child) => {
    if (
      child instanceof THREE.Mesh ||
      child instanceof THREE.Line ||
      child instanceof THREE.Points ||
      child instanceof THREE.Sprite
    ) {
      if ("geometry" in child) geometries.add(child.geometry);
      const entries = Array.isArray(child.material)
        ? child.material
        : [child.material];
      entries.forEach((material) => {
        materials.add(material);
        Object.values(material).forEach((value) => {
          if (value instanceof THREE.Texture) textures.add(value);
        });
      });
    }
  });
  textures.forEach((texture) => texture.dispose());
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
}

function seededFraction(seed: number) {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
}
