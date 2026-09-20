import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  COURSE_WORLD_DEPTH_YARDS,
  COURSE_WORLD_WIDTH_YARDS,
  distanceYards,
  sampledFairwayPath,
  type CourseCircle,
  type CourseHole,
  type CoursePointYards,
} from "./discGolfCourse";
import type { FlightPointYards } from "./discGolfThrow";

const BLACK = 0x050508;
const WHITE = 0xffffff;
const CYAN = 0x2de2e6;
const MAGENTA = 0xff2bd6;
const LIME = 0xb6ff3b;
const WATER = 0x3d5cff;
const FAIRWAY = 0x1a9a9c;
const FEET_PER_YARD = 3;
const PLAY_CAMERA_BACK_YARDS = 10 / FEET_PER_YARD;
const PLAY_CAMERA_SIDE_YARDS = 1.2;
const PLAY_CAMERA_EYE_HEIGHT_YARDS = 5.8 / FEET_PER_YARD;
const PLAY_CAMERA_LOOK_AHEAD_YARDS = 32;
const DISC_RADIUS_YARDS = 0.32;
const AIM_ARC_DOT_COUNT = 22;
const AIM_DOT_RADIUS_YARDS = 0.07;

export type DiscGolfCameraMode = "preview" | "flyover" | "play" | "results";

export function DiscGolfCourseMap(props: {
  courseHole: CourseHole;
  disc: CoursePointYards;
  discHeightYards: number;
  hyzerAimPath: FlightPointYards[];
  anhyzerAimPath: FlightPointYards[];
  visibleAimSide: "both" | "hyzer" | "anhyzer" | "none";
  aimHeadingDegrees: number;
  discSink01: number;
  cameraMode: DiscGolfCameraMode;
  flyoverProgress01: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<DiscGolfScene | null>(null);
  const viewRef = useRef(props);
  viewRef.current = props;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const discGolfScene = createDiscGolfScene(canvas);
    sceneRef.current = discGolfScene;
    discGolfScene.drawHole(viewRef.current.courseHole);
    const onResize = () => discGolfScene.resize();
    window.addEventListener("resize", onResize);
    let frame = 0;
    const tick = () => {
      discGolfScene.syncView(viewRef.current);
      discGolfScene.renderer.render(discGolfScene.scene, discGolfScene.camera);
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      discGolfScene.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    sceneRef.current?.drawHole(props.courseHole);
  }, [props.courseHole]);

  return (
    <canvas
      ref={canvasRef}
      className="golf-canvas"
      aria-label={`Hole ${props.courseHole.holeNumber} neon disc golf course`}
    />
  );
}

type DiscGolfScene = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  discMesh: THREE.Mesh;
  hyzerAimDots: THREE.InstancedMesh;
  anhyzerAimDots: THREE.InstancedMesh;
  basketGroup: THREE.Group;
  holeGroup: THREE.Group;
  drawHole: (courseHole: CourseHole) => void;
  syncView: (view: {
    courseHole: CourseHole;
    disc: CoursePointYards;
    discHeightYards: number;
    hyzerAimPath: FlightPointYards[];
    anhyzerAimPath: FlightPointYards[];
    visibleAimSide: "both" | "hyzer" | "anhyzer" | "none";
    aimHeadingDegrees: number;
    discSink01: number;
    cameraMode: DiscGolfCameraMode;
    flyoverProgress01: number;
  }) => void;
  resize: () => void;
  dispose: () => void;
};

function createDiscGolfScene(canvas: HTMLCanvasElement): DiscGolfScene {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(BLACK, 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(BLACK, 160, 520);

  const camera = new THREE.PerspectiveCamera(62, 1, 0.08, 2000);
  scene.add(new THREE.AmbientLight(0x6a7cff, 0.55));
  const key = new THREE.DirectionalLight(CYAN, 0.85);
  key.position.set(40, 120, -30);
  scene.add(key);
  const fill = new THREE.DirectionalLight(MAGENTA, 0.45);
  fill.position.set(-80, 40, 70);
  scene.add(fill);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(
      COURSE_WORLD_WIDTH_YARDS + 80,
      COURSE_WORLD_DEPTH_YARDS + 80,
    ),
    new THREE.MeshLambertMaterial({ color: 0x101018 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(
    COURSE_WORLD_WIDTH_YARDS / 2,
    -0.05,
    COURSE_WORLD_DEPTH_YARDS / 2,
  );
  scene.add(ground);

  const grid = new THREE.GridHelper(
    COURSE_WORLD_DEPTH_YARDS,
    40,
    CYAN,
    0x2a2a55,
  );
  grid.position.set(
    COURSE_WORLD_WIDTH_YARDS / 2,
    0.02,
    COURSE_WORLD_DEPTH_YARDS / 2,
  );
  const gridMaterial = grid.material;
  if (Array.isArray(gridMaterial)) {
    gridMaterial.forEach((material) => {
      material.transparent = true;
      material.opacity = 0.38;
    });
  } else {
    gridMaterial.transparent = true;
    gridMaterial.opacity = 0.38;
  }
  scene.add(grid);

  const holeGroup = new THREE.Group();
  scene.add(holeGroup);

  const discMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(DISC_RADIUS_YARDS, DISC_RADIUS_YARDS, 0.06, 24),
    new THREE.MeshStandardMaterial({
      color: WHITE,
      emissive: 0x88aacc,
      roughness: 0.22,
      metalness: 0.28,
    }),
  );
  scene.add(discMesh);

  const aimDotDummy = new THREE.Object3D();
  const hyzerAimDots = createAimDotCloud(0xff8ad6, 0.28);
  const anhyzerAimDots = createAimDotCloud(0x9ef6f8, 0.28);
  scene.add(hyzerAimDots, anhyzerAimDots);

  const basketGroup = new THREE.Group();
  scene.add(basketGroup);

  const drawHole = (courseHole: CourseHole) => {
    while (holeGroup.children.length > 0) {
      const child = holeGroup.children[0];
      holeGroup.remove(child);
      disposeObject(child);
    }
    while (basketGroup.children.length > 0) {
      const child = basketGroup.children[0];
      basketGroup.remove(child);
      disposeObject(child);
    }

    const path = sampledFairwayPath(courseHole, 14);
    for (let index = 0; index < path.length - 1; index += 1) {
      holeGroup.add(
        fairwaySegment(
          path[index],
          path[index + 1],
          courseHole.fairwayHalfWidthYards,
        ),
      );
    }
    holeGroup.add(
      surfaceDisc(
        {
          center: courseHole.basket,
          radiusYards: courseHole.basketPadRadiusYards,
        },
        FAIRWAY,
        0.06,
        0.95,
      ),
    );
    holeGroup.add(
      surfaceDisc(
        {
          center: courseHole.basket,
          radiusYards: courseHole.basketPadRadiusYards,
        },
        LIME,
        0.07,
        0.18,
      ),
    );

    for (const water of courseHole.waters) {
      holeGroup.add(surfaceDisc(water, WATER, 0.05, 0.72));
    }

    const teeBox = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 2.2),
      new THREE.MeshBasicMaterial({ color: WHITE }),
    );
    teeBox.rotation.x = -Math.PI / 2;
    teeBox.position.set(courseHole.tee.xYards, 0.1, courseHole.tee.yYards);
    holeGroup.add(teeBox);

    for (const treePoint of courseHole.treePoints) {
      holeGroup.add(neonTreeAt(treePoint));
    }

    basketGroup.add(buildDiscGolfTarget());
    basketGroup.position.set(
      courseHole.basket.xYards,
      0,
      courseHole.basket.yYards,
    );
  };

  const syncView = (view: {
    courseHole: CourseHole;
    disc: CoursePointYards;
    discHeightYards: number;
    hyzerAimPath: FlightPointYards[];
    anhyzerAimPath: FlightPointYards[];
    visibleAimSide: "both" | "hyzer" | "anhyzer" | "none";
    aimHeadingDegrees: number;
    discSink01: number;
    cameraMode: DiscGolfCameraMode;
    flyoverProgress01: number;
  }) => {
    const sink01 = Math.min(1, Math.max(0, view.discSink01));
    discMesh.position.set(
      view.disc.xYards,
      Math.max(0.08, view.discHeightYards) - sink01 * 1.4,
      view.disc.yYards,
    );
    discMesh.rotation.y += 0.08;
    discMesh.scale.setScalar(Math.max(0.12, 1 - sink01 * 0.8));
    discMesh.visible = sink01 < 0.98;
    const showAim = view.cameraMode === "play" && sink01 === 0;
    const showHyzer =
      showAim &&
      (view.visibleAimSide === "both" || view.visibleAimSide === "hyzer");
    const showAnhyzer =
      showAim &&
      (view.visibleAimSide === "both" || view.visibleAimSide === "anhyzer");
    writeAimPathDots(
      hyzerAimDots,
      aimDotDummy,
      showHyzer ? view.hyzerAimPath : [],
    );
    writeAimPathDots(
      anhyzerAimDots,
      aimDotDummy,
      showAnhyzer ? view.anhyzerAimPath : [],
    );
    hyzerAimDots.visible = showHyzer;
    anhyzerAimDots.visible = showAnhyzer;

    if (view.cameraMode === "play" && sink01 > 0) {
      applyBasketCamera(camera, view.courseHole);
      camera.fov = 50;
    } else if (view.cameraMode === "play") {
      applyPlayCamera(camera, view.disc, view.aimHeadingDegrees);
      camera.fov = 62;
    } else if (view.cameraMode === "flyover") {
      applyFlyoverCamera(
        camera,
        view.courseHole,
        view.flyoverProgress01,
        view.aimHeadingDegrees,
      );
      camera.fov = 52;
    } else if (view.cameraMode === "results") {
      applyResultsCamera(camera, view.courseHole);
      camera.fov = 48;
    } else {
      applyPreviewCamera(camera, view.courseHole);
      camera.fov = 50;
    }
    camera.updateProjectionMatrix();
  };

  const resize = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width === 0 || height === 0) {
      return;
    }
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  resize();

  return {
    renderer,
    scene,
    camera,
    discMesh,
    hyzerAimDots,
    anhyzerAimDots,
    basketGroup,
    holeGroup,
    drawHole,
    syncView,
    resize,
    dispose: () => {
      disposeObject(scene);
      renderer.dispose();
    },
  };
}

function fairwaySegment(
  start: CoursePointYards,
  end: CoursePointYards,
  halfWidthYards: number,
) {
  const lengthYards = distanceYards(start, end);
  const heading = Math.atan2(
    end.xYards - start.xYards,
    end.yYards - start.yYards,
  );
  const ribbon = new THREE.Mesh(
    new THREE.PlaneGeometry(halfWidthYards * 2, lengthYards),
    new THREE.MeshLambertMaterial({
      color: FAIRWAY,
      transparent: true,
      opacity: 0.94,
    }),
  );
  ribbon.rotation.x = -Math.PI / 2;
  ribbon.rotation.z = -heading;
  ribbon.position.set(
    (start.xYards + end.xYards) / 2,
    0.045,
    (start.yYards + end.yYards) / 2,
  );
  const edge = new THREE.Mesh(
    new THREE.PlaneGeometry(halfWidthYards * 2 + 0.7, lengthYards),
    new THREE.MeshBasicMaterial({
      color: CYAN,
      transparent: true,
      opacity: 0.28,
    }),
  );
  edge.rotation.x = -Math.PI / 2;
  edge.rotation.z = -heading;
  edge.position.set(
    (start.xYards + end.xYards) / 2,
    0.03,
    (start.yYards + end.yYards) / 2,
  );
  const group = new THREE.Group();
  group.add(edge, ribbon);
  return group;
}

function surfaceDisc(
  circle: CourseCircle,
  color: number,
  y: number,
  opacity: number,
) {
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(circle.radiusYards, 36),
    new THREE.MeshLambertMaterial({
      color,
      transparent: opacity < 1,
      opacity,
    }),
  );
  disc.rotation.x = -Math.PI / 2;
  disc.position.set(circle.center.xYards, y, circle.center.yYards);
  return disc;
}

function createAimDotCloud(color: number, opacity: number) {
  const dots = new THREE.InstancedMesh(
    new THREE.SphereGeometry(AIM_DOT_RADIUS_YARDS, 8, 6),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
    }),
    AIM_ARC_DOT_COUNT,
  );
  dots.frustumCulled = false;
  return dots;
}

function writeAimPathDots(
  instancedDots: THREE.InstancedMesh,
  dummy: THREE.Object3D,
  aimPath: FlightPointYards[],
) {
  const usable = aimPath.slice(1);
  for (let index = 0; index < AIM_ARC_DOT_COUNT; index += 1) {
    if (usable.length === 0) {
      dummy.position.set(0, -20, 0);
      dummy.scale.setScalar(0.01);
    } else {
      const sourceIndex = Math.min(
        usable.length - 1,
        Math.round((index / (AIM_ARC_DOT_COUNT - 1)) * (usable.length - 1)),
      );
      const point = usable[sourceIndex];
      dummy.position.set(point.xYards, point.heightYards + 0.08, point.yYards);
      dummy.scale.setScalar(0.85);
    }
    dummy.updateMatrix();
    instancedDots.setMatrixAt(index, dummy.matrix);
  }
  instancedDots.instanceMatrix.needsUpdate = true;
}

function buildDiscGolfTarget() {
  const target = new THREE.Group();
  const steel = new THREE.MeshLambertMaterial({ color: 0xc8cfd6 });
  const chainSteel = new THREE.MeshLambertMaterial({ color: 0xd8dde3 });
  const band = new THREE.MeshBasicMaterial({ color: 0xe8f25c });
  const trayFloor = new THREE.MeshBasicMaterial({ color: 0xd4de46 });

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.085, 5.95, 12),
    steel,
  );
  pole.position.y = 2.98;
  target.add(pole);

  const topRing = new THREE.Mesh(new THREE.TorusGeometry(1.08, 0.07, 10, 28), band);
  topRing.rotation.x = Math.PI / 2;
  topRing.position.y = 5.18;
  target.add(topRing);

  const trayRim = new THREE.Mesh(new THREE.TorusGeometry(1.12, 0.075, 10, 28), band);
  trayRim.rotation.x = Math.PI / 2;
  trayRim.position.y = 2.9;
  target.add(trayRim);

  const trayWall = new THREE.Mesh(
    new THREE.CylinderGeometry(1.12, 1.0, 0.42, 24, 1, true),
    band,
  );
  trayWall.position.y = 2.68;
  target.add(trayWall);

  const trayBottom = new THREE.Mesh(new THREE.CircleGeometry(1.0, 24), trayFloor);
  trayBottom.rotation.x = -Math.PI / 2;
  trayBottom.position.y = 2.47;
  target.add(trayBottom);

  const gatherRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.28, 0.04, 8, 16),
    steel,
  );
  gatherRing.rotation.x = Math.PI / 2;
  gatherRing.position.y = 3.38;
  target.add(gatherRing);

  const outerChainCount = 16;
  for (let index = 0; index < outerChainCount; index += 1) {
    const angle = (index / outerChainCount) * Math.PI * 2;
    addChainRod(
      target,
      new THREE.Vector3(Math.cos(angle) * 1.04, 5.14, Math.sin(angle) * 1.04),
      new THREE.Vector3(Math.cos(angle) * 0.26, 3.4, Math.sin(angle) * 0.26),
      chainSteel,
    );
  }
  const innerChainCount = 8;
  for (let index = 0; index < innerChainCount; index += 1) {
    const angle = (index / innerChainCount) * Math.PI * 2 + 0.2;
    addChainRod(
      target,
      new THREE.Vector3(Math.cos(angle) * 0.26, 3.36, Math.sin(angle) * 0.26),
      new THREE.Vector3(Math.cos(angle) * 0.78, 2.92, Math.sin(angle) * 0.78),
      chainSteel,
    );
  }

  const flagPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.7, 6),
    steel,
  );
  flagPole.position.y = 6.3;
  target.add(flagPole);
  const flag = new THREE.Mesh(
    new THREE.PlaneGeometry(0.55, 0.32),
    new THREE.MeshLambertMaterial({
      color: 0xff2bd6,
      side: THREE.DoubleSide,
    }),
  );
  flag.position.set(0.28, 6.48, 0);
  target.add(flag);

  target.scale.setScalar(1.25);
  return target;
}

function addChainRod(
  target: THREE.Group,
  start: THREE.Vector3,
  end: THREE.Vector3,
  material: THREE.Material,
) {
  const direction = end.clone().sub(start);
  const lengthYards = direction.length();
  const rod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, lengthYards, 5),
    material,
  );
  rod.position.copy(start).add(end).multiplyScalar(0.5);
  rod.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.normalize(),
  );
  target.add(rod);
}

function applyBasketCamera(
  camera: THREE.PerspectiveCamera,
  courseHole: CourseHole,
) {
  camera.position.set(
    courseHole.basket.xYards + 3.6,
    3.2,
    courseHole.basket.yYards - 5.2,
  );
  camera.lookAt(courseHole.basket.xYards, 1.2, courseHole.basket.yYards);
}

function applyPlayCamera(
  camera: THREE.PerspectiveCamera,
  disc: CoursePointYards,
  aimHeadingDegrees: number,
) {
  const headingRadians = (aimHeadingDegrees * Math.PI) / 180;
  const alongX = Math.sin(headingRadians);
  const alongZ = Math.cos(headingRadians);
  camera.position.set(
    disc.xYards - alongX * PLAY_CAMERA_BACK_YARDS + alongZ * PLAY_CAMERA_SIDE_YARDS,
    PLAY_CAMERA_EYE_HEIGHT_YARDS,
    disc.yYards - alongZ * PLAY_CAMERA_BACK_YARDS - alongX * PLAY_CAMERA_SIDE_YARDS,
  );
  camera.lookAt(
    disc.xYards + alongX * PLAY_CAMERA_LOOK_AHEAD_YARDS,
    2.4,
    disc.yYards + alongZ * PLAY_CAMERA_LOOK_AHEAD_YARDS,
  );
}

function applyFlyoverCamera(
  camera: THREE.PerspectiveCamera,
  courseHole: CourseHole,
  progress01: number,
  settleHeadingDegrees: number,
) {
  const path = sampledFairwayPath(courseHole, 16);
  const mid = path[Math.floor(path.length * 0.55)] ?? courseHole.basket;
  const side = sideOffsetForHole(courseHole);
  const holdT = smoothstep01(Math.min(1, progress01 / 0.58));
  const settleT = smoothstep01(Math.max(0, (progress01 - 0.58) / 0.42));
  const startPosition = new THREE.Vector3(
    courseHole.tee.xYards + side.x * 48,
    92,
    courseHole.tee.yYards + side.z * 48 - 20,
  );
  const cruisePosition = new THREE.Vector3(
    mid.xYards + side.x * 28,
    48,
    mid.yYards + side.z * 28,
  );
  const airPosition = startPosition.clone().lerp(cruisePosition, holdT);
  const airLook = new THREE.Vector3(mid.xYards, 1, mid.yYards).lerp(
    new THREE.Vector3(courseHole.basket.xYards, 2, courseHole.basket.yYards),
    holdT,
  );
  const headingRadians = (settleHeadingDegrees * Math.PI) / 180;
  const dirX = Math.sin(headingRadians);
  const dirZ = Math.cos(headingRadians);
  const playPosition = new THREE.Vector3(
    courseHole.tee.xYards - dirX * PLAY_CAMERA_BACK_YARDS,
    PLAY_CAMERA_EYE_HEIGHT_YARDS,
    courseHole.tee.yYards - dirZ * PLAY_CAMERA_BACK_YARDS,
  );
  const playLook = new THREE.Vector3(
    courseHole.tee.xYards + dirX * PLAY_CAMERA_LOOK_AHEAD_YARDS,
    0.9,
    courseHole.tee.yYards + dirZ * PLAY_CAMERA_LOOK_AHEAD_YARDS,
  );
  camera.position.lerpVectors(airPosition, playPosition, settleT);
  camera.lookAt(airLook.clone().lerp(playLook, settleT));
}

function applyPreviewCamera(
  camera: THREE.PerspectiveCamera,
  courseHole: CourseHole,
) {
  const side = sideOffsetForHole(courseHole);
  camera.position.set(
    courseHole.tee.xYards + side.x * 32,
    58,
    courseHole.tee.yYards + side.z * 32 - 16,
  );
  camera.lookAt(courseHole.basket.xYards, 0, courseHole.basket.yYards);
}

function applyResultsCamera(
  camera: THREE.PerspectiveCamera,
  courseHole: CourseHole,
) {
  const side = sideOffsetForHole(courseHole);
  camera.position.set(
    courseHole.basket.xYards + side.x * 22,
    18,
    courseHole.basket.yYards - 28,
  );
  camera.lookAt(courseHole.basket.xYards, 1, courseHole.basket.yYards);
}

function sideOffsetForHole(courseHole: CourseHole): { x: number; z: number } {
  const toBasketX = courseHole.basket.xYards - courseHole.tee.xYards;
  const toBasketZ = courseHole.basket.yYards - courseHole.tee.yYards;
  const length = Math.hypot(toBasketX, toBasketZ) || 1;
  return { x: toBasketZ / length, z: -toBasketX / length };
}

function smoothstep01(value: number): number {
  const t = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
}

function neonTreeAt(point: CoursePointYards) {
  const scale =
    0.82 +
    Math.abs(Math.sin(point.xYards * 0.37 + point.yYards * 0.19)) * 0.4;
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.5, 4.4, 6),
    new THREE.MeshBasicMaterial({ color: 0x1a1024 }),
  );
  trunk.position.y = 2.2;
  const foliage = new THREE.Mesh(
    new THREE.ConeGeometry(3.4, 9, 6),
    new THREE.MeshBasicMaterial({ color: MAGENTA }),
  );
  foliage.position.y = 8.2;
  tree.add(trunk, foliage);
  tree.position.set(point.xYards, 0, point.yYards);
  tree.scale.set(scale, scale, scale);
  return tree;
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    const material = mesh.material;
    if (Array.isArray(material)) {
      material.forEach((entry) => entry.dispose());
    } else if (material) {
      material.dispose();
    }
  });
}
