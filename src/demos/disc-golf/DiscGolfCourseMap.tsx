import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  addCourseEnvironment,
  animateCourseScenery,
  createCourseTree,
  createCircuitLights,
  createFairway,
  createFairwayFringe,
  createTeeFurniture,
  createTurfMaterial,
  createWater,
  disposeCourseObject,
} from "../course-visuals/courseScenery";
import {
  createCameraSmoothing,
  createShotEffects,
} from "../course-visuals/shotEffects";
import {
  COURSE_WORLD_DEPTH_YARDS,
  COURSE_WORLD_WIDTH_YARDS,
  sampledFairwayPath,
  type CourseHole,
  type CoursePointYards,
} from "./discGolfCourse";
import type { FlightPointYards } from "./discGolfThrow";

const BLACK = 0x050508;
const WHITE = 0xffffff;
const LIME = 0xb6ff3b;
const FAIRWAY = 0x378c7d;
const PLAY_CAMERA_BACK_YARDS = 13;
const PLAY_CAMERA_SIDE_YARDS = 1.2;
const PLAY_CAMERA_EYE_HEIGHT_YARDS = 7;
const PLAY_CAMERA_LOOK_AHEAD_YARDS = 18;
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
  isShotInFlight: boolean;
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
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(canvas);
    let frame = 0;
    const tick = () => {
      discGolfScene.syncView(viewRef.current);
      discGolfScene.renderer.render(discGolfScene.scene, discGolfScene.camera);
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
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
    isShotInFlight: boolean;
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
  const camera = new THREE.PerspectiveCamera(56, 1, 0.05, 2200);
  addCourseEnvironment(
    scene,
    renderer,
    "twilight",
    COURSE_WORLD_WIDTH_YARDS,
    COURSE_WORLD_DEPTH_YARDS,
  );
  const cameraSmoothing = createCameraSmoothing(camera);
  const shotEffects = createShotEffects(scene, 0x79ffe5);
  const motionPreference = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );

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
  const discStripe = new THREE.Mesh(
    new THREE.RingGeometry(0.16, 0.22, 32, 1, 0, Math.PI * 1.45),
    new THREE.MeshBasicMaterial({ color: 0x153c45, side: THREE.DoubleSide }),
  );
  discStripe.rotation.x = -Math.PI / 2;
  discStripe.position.y = 0.032;
  discMesh.add(discStripe);
  scene.add(discMesh);

  const aimDotDummy = new THREE.Object3D();
  const hyzerAimDots = createAimDotCloud(0xff8ad6, 0.28);
  const anhyzerAimDots = createAimDotCloud(0x9ef6f8, 0.28);
  scene.add(hyzerAimDots, anhyzerAimDots);

  const basketGroup = new THREE.Group();
  scene.add(basketGroup);

  const drawHole = (courseHole: CourseHole) => {
    shotEffects.reset();
    cameraSmoothing.reset();
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

    const path = sampledFairwayPath(courseHole, 48);
    holeGroup.add(
      createFairway(path, courseHole.fairwayHalfWidthYards, "twilight"),
    );
    holeGroup.add(
      createFairwayFringe(
        path,
        courseHole.fairwayHalfWidthYards,
        "twilight",
        courseHole.waters,
      ),
    );
    holeGroup.add(createCircuitLights(path, courseHole.fairwayHalfWidthYards));
    holeGroup.add(
      surfaceDisc(
        {
          center: courseHole.basket,
          radiusYards: courseHole.basketPadRadiusYards,
        },
        FAIRWAY,
        0.07,
        1,
      ),
    );
    const targetRing = new THREE.Mesh(
      new THREE.RingGeometry(
        courseHole.basketPadRadiusYards - 0.08,
        courseHole.basketPadRadiusYards,
        80,
      ),
      new THREE.MeshBasicMaterial({
        color: LIME,
        transparent: true,
        opacity: 0.55,
      }),
    );
    targetRing.rotation.x = -Math.PI / 2;
    targetRing.position.set(
      courseHole.basket.xYards,
      0.08,
      courseHole.basket.yYards,
    );
    holeGroup.add(targetRing);
    for (const water of courseHole.waters)
      holeGroup.add(createWater(water, "twilight"));
    const teeBox = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 2.2),
      new THREE.MeshBasicMaterial({ color: WHITE }),
    );
    teeBox.rotation.x = -Math.PI / 2;
    teeBox.position.set(courseHole.tee.xYards, 0.1, courseHole.tee.yYards);
    holeGroup.add(teeBox);

    holeGroup.add(
      createTeeFurniture(courseHole.tee, courseHole.holeNumber, "twilight"),
    );
    for (const treePoint of courseHole.treePoints) {
      holeGroup.add(createCourseTree(treePoint, "twilight"));
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
    isShotInFlight: boolean;
  }) => {
    const seconds = performance.now() / 1000;
    animateCourseScenery(holeGroup, motionPreference.matches ? 0 : seconds);
    const sink01 = Math.min(1, Math.max(0, view.discSink01));
    discMesh.position.set(
      view.disc.xYards,
      Math.max(0.08, view.discHeightYards) - sink01 * 1.1,
      view.disc.yYards,
    );
    discMesh.rotation.y = motionPreference.matches
      ? 0
      : seconds * (view.isShotInFlight ? 14 : 0.5);
    discMesh.rotation.z = view.isShotInFlight
      ? Math.sin(seconds * 2) * 0.12
      : 0;
    discMesh.scale.setScalar(Math.max(0.12, 1 - sink01 * 0.8));
    discMesh.visible = sink01 < 0.98;
    const showAim =
      view.cameraMode === "play" && sink01 === 0 && !view.isShotInFlight;
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

    shotEffects.update(
      discMesh.position,
      0,
      view.isShotInFlight,
      sink01 > 0.95,
      seconds,
      motionPreference.matches,
    );
    if (view.cameraMode === "play" && view.isShotInFlight) {
      const heading = (view.aimHeadingDegrees * Math.PI) / 180;
      const backYards = 12;
      camera.position.set(
        view.disc.xYards -
          Math.sin(heading) * backYards +
          Math.cos(heading) * 5,
        Math.max(5, discMesh.position.y + 5),
        view.disc.yYards -
          Math.cos(heading) * backYards -
          Math.sin(heading) * 5,
      );
      camera.lookAt(
        discMesh.position.x,
        discMesh.position.y + 0.4,
        discMesh.position.z,
      );
      camera.fov = 56;
    } else if (view.cameraMode === "play" && sink01 > 0) {
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
    cameraSmoothing.update(motionPreference.matches);
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

function surfaceDisc(
  circle: { center: CoursePointYards; radiusYards: number },
  color: number,
  y: number,
  opacity: number,
) {
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(circle.radiusYards, 36),
    Object.assign(createTurfMaterial(color), {
      transparent: opacity < 1,
      opacity,
    }),
  );
  disc.receiveShadow = true;
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
  const steel = new THREE.MeshStandardMaterial({
    color: 0xd2dee1,
    metalness: 0.75,
    roughness: 0.24,
  });
  const chainSteel = new THREE.MeshStandardMaterial({
    color: 0xcbdadb,
    metalness: 0.7,
    roughness: 0.3,
  });
  const band = new THREE.MeshStandardMaterial({
    color: 0xddfb9a,
    emissive: 0xa7ef6e,
    emissiveIntensity: 0.45,
    metalness: 0.4,
    roughness: 0.3,
  });
  const trayFloor = new THREE.MeshBasicMaterial({ color: 0xd4de46 });

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.085, 5.95, 12),
    steel,
  );
  pole.position.y = 2.98;
  target.add(pole);

  const topRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.08, 0.07, 10, 28),
    band,
  );
  topRing.rotation.x = Math.PI / 2;
  topRing.position.y = 5.18;
  target.add(topRing);

  const trayRim = new THREE.Mesh(
    new THREE.TorusGeometry(1.12, 0.075, 10, 28),
    band,
  );
  trayRim.rotation.x = Math.PI / 2;
  trayRim.position.y = 2.9;
  target.add(trayRim);

  const trayWall = new THREE.Mesh(
    new THREE.CylinderGeometry(1.12, 1.0, 0.42, 24, 1, true),
    band,
  );
  trayWall.position.y = 2.68;
  target.add(trayWall);

  const trayBottom = new THREE.Mesh(
    new THREE.CircleGeometry(1.0, 24),
    trayFloor,
  );
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

  const topBand = new THREE.Mesh(
    new THREE.CylinderGeometry(1.09, 1.09, 0.3, 48, 1, true),
    band,
  );
  topBand.position.y = 5.17;
  target.add(topBand);
  target.traverse((object) => {
    if (object instanceof THREE.Mesh) object.castShadow = true;
  });
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
    courseHole.basket.xYards + 8,
    6,
    courseHole.basket.yYards - 11,
  );
  camera.lookAt(courseHole.basket.xYards, 3.5, courseHole.basket.yYards);
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
    disc.xYards -
      alongX * PLAY_CAMERA_BACK_YARDS +
      alongZ * PLAY_CAMERA_SIDE_YARDS,
    PLAY_CAMERA_EYE_HEIGHT_YARDS,
    disc.yYards -
      alongZ * PLAY_CAMERA_BACK_YARDS -
      alongX * PLAY_CAMERA_SIDE_YARDS,
  );
  camera.lookAt(
    disc.xYards + alongX * PLAY_CAMERA_LOOK_AHEAD_YARDS,
    0.6,
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
    24,
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

const disposeObject = disposeCourseObject;
