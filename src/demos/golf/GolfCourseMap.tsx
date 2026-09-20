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
} from "./golfCourse";
import { greenHeightYards } from "./golfGreen";
import { aimFlightArcPoints } from "./golfShot";

const NAVY = 0x0a1628;
const WHITE = 0xf4f7fb;
const FAIRWAY = 0x1a8a64;
const GREEN = 0x4ad07a;
const COLLAR = 0x237a4c;
const SAND = 0xe8c57a;
const WATER = 0x2aa3c7;
const WATER_RIM = 0x176f86;
const ROUGH = 0x0c3d32;
const TREE_LEAF = 0x145c3a;
const TREE_TRUNK = 0x4a3422;
const FLAG = 0xe11d2e;
const ECM_BLUE = 0x0073cf;
const FEET_PER_YARD = 3;
const PLAY_CAMERA_BACK_YARDS = 10 / FEET_PER_YARD;
const PLAY_CAMERA_SIDE_YARDS = 1.35;
const PLAY_CAMERA_EYE_HEIGHT_YARDS = 5.8 / FEET_PER_YARD;
const PLAY_CAMERA_LOOK_AHEAD_YARDS = 36;
const PUTT_CAMERA_BACK_YARDS = 4.2;
const PUTT_CAMERA_SIDE_YARDS = 0.7;
const PUTT_CAMERA_EYE_HEIGHT_YARDS = 3.1;
const PUTT_CAMERA_LOOK_AHEAD_YARDS = 12;
const BALL_RADIUS_YARDS = 0.045;
const AIM_ARC_DOT_COUNT = 32;
const AIM_ARC_DOT_RADIUS_YARDS = 0.18;

export type GolfCameraMode = "preview" | "flyover" | "play" | "results";

export function GolfCourseMap(props: {
  courseHole: CourseHole;
  ball: CoursePointYards;
  aimHeadingDegrees: number;
  aimLoftDegrees: number;
  aimCarryYards: number;
  aimIsPutt: boolean;
  ballSink01: number;
  cameraMode: GolfCameraMode;
  flyoverProgress01: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<GolfScene | null>(null);
  const viewRef = useRef(props);
  viewRef.current = props;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const golfScene = createGolfScene(canvas);
    sceneRef.current = golfScene;
    golfScene.drawHole(viewRef.current.courseHole);

    const onResize = () => golfScene.resize();
    window.addEventListener("resize", onResize);

    let frame = 0;
    const tick = () => {
      golfScene.syncView(viewRef.current);
      golfScene.renderer.render(golfScene.scene, golfScene.camera);
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      golfScene.dispose();
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
      aria-label={`Hole ${props.courseHole.holeNumber} three.js course map`}
    />
  );
}

type GolfScene = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  ballMesh: THREE.Mesh;
  aimArcDots: THREE.InstancedMesh;
  flagGroup: THREE.Group;
  holeGroup: THREE.Group;
  drawHole: (courseHole: CourseHole) => void;
  syncView: (view: {
    courseHole: CourseHole;
    ball: CoursePointYards;
    aimHeadingDegrees: number;
    aimLoftDegrees: number;
    aimCarryYards: number;
    aimIsPutt: boolean;
    ballSink01: number;
    cameraMode: GolfCameraMode;
    flyoverProgress01: number;
  }) => void;
  resize: () => void;
  dispose: () => void;
};

function createGolfScene(canvas: HTMLCanvasElement): GolfScene {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(NAVY, 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(NAVY, 260, 920);

  const camera = new THREE.PerspectiveCamera(62, 1, 0.08, 2000);

  scene.add(new THREE.AmbientLight(0xb8d4ff, 0.62));
  const sun = new THREE.DirectionalLight(0xffffff, 1.15);
  sun.position.set(90, 180, -50);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(ECM_BLUE, 0.4);
  fill.position.set(-70, 50, 90);
  scene.add(fill);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(
      COURSE_WORLD_WIDTH_YARDS + 80,
      COURSE_WORLD_DEPTH_YARDS + 80,
    ),
    new THREE.MeshLambertMaterial({ color: ROUGH }),
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
    56,
    WHITE,
    0x6f93b8,
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
      material.opacity = 0.18;
    });
  } else {
    gridMaterial.transparent = true;
    gridMaterial.opacity = 0.18;
  }
  scene.add(grid);

  const holeGroup = new THREE.Group();
  scene.add(holeGroup);

  const ballMesh = new THREE.Mesh(
    new THREE.SphereGeometry(BALL_RADIUS_YARDS, 24, 16),
    new THREE.MeshStandardMaterial({
      color: WHITE,
      roughness: 0.32,
      metalness: 0.06,
    }),
  );
  scene.add(ballMesh);

  const aimDotDummy = new THREE.Object3D();
  const aimArcDots = new THREE.InstancedMesh(
    new THREE.SphereGeometry(AIM_ARC_DOT_RADIUS_YARDS, 10, 8),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.56,
      depthWrite: false,
    }),
    AIM_ARC_DOT_COUNT,
  );
  aimArcDots.frustumCulled = false;
  aimArcDots.renderOrder = 3;
  scene.add(aimArcDots);

  const flagGroup = new THREE.Group();
  scene.add(flagGroup);

  const drawHole = (courseHole: CourseHole) => {
    while (holeGroup.children.length > 0) {
      const child = holeGroup.children[0];
      holeGroup.remove(child);
      disposeObject(child);
    }
    while (flagGroup.children.length > 0) {
      const child = flagGroup.children[0];
      flagGroup.remove(child);
      disposeObject(child);
    }

    const path = sampledFairwayPath(courseHole, 16);
    for (let index = 0; index < path.length - 1; index += 1) {
      holeGroup.add(
        fairwaySegment(
          path[index],
          path[index + 1],
          courseHole.fairwayHalfWidthYards,
        ),
      );
      holeGroup.add(
        surfaceDisc(
          {
            center: path[index],
            radiusYards: courseHole.fairwayHalfWidthYards,
          },
          FAIRWAY,
          0.04,
          0.88,
        ),
      );
    }
    holeGroup.add(
      surfaceDisc(
        {
          center: courseHole.cup,
          radiusYards: courseHole.fairwayHalfWidthYards,
        },
        FAIRWAY,
        0.04,
        0.88,
      ),
    );

    for (const water of courseHole.waters) {
      holeGroup.add(
        surfaceDisc(
          {
            center: water.center,
            radiusYards: water.radiusYards + 2.2,
          },
          WATER_RIM,
          0.05,
          1,
        ),
      );
      holeGroup.add(surfaceDisc(water, WATER, 0.07, 0.96));
    }
    for (const sand of courseHole.sands) {
      holeGroup.add(surfaceDisc(sand, SAND, 0.08, 1));
    }

    holeGroup.add(undulatingGreenMesh(courseHole, COLLAR, courseHole.greenRadiusYards + 3.5, 36));
    holeGroup.add(undulatingGreenMesh(courseHole, GREEN, courseHole.greenRadiusYards, 48));
    holeGroup.add(greenSlopeGrid(courseHole));

    const cupHeightYards = greenHeightYards(courseHole, courseHole.cup);
    const cup = new THREE.Mesh(
      new THREE.CircleGeometry(0.7, 20),
      new THREE.MeshLambertMaterial({ color: 0x111111 }),
    );
    cup.rotation.x = -Math.PI / 2;
    cup.position.set(
      courseHole.cup.xYards,
      cupHeightYards + 0.03,
      courseHole.cup.yYards,
    );
    holeGroup.add(cup);

    const teeBox = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 4.5),
      new THREE.MeshLambertMaterial({ color: 0x2f6b3a }),
    );
    teeBox.rotation.x = -Math.PI / 2;
    teeBox.position.set(courseHole.tee.xYards, 0.12, courseHole.tee.yYards);
    holeGroup.add(teeBox);

    const teeMarker = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.08, 10),
      new THREE.MeshLambertMaterial({ color: WHITE }),
    );
    teeMarker.position.set(courseHole.tee.xYards, 0.14, courseHole.tee.yYards);
    holeGroup.add(teeMarker);

    for (const treePoint of courseHole.treePoints) {
      holeGroup.add(treeAt(treePoint));
    }

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.13, 16, 8),
      new THREE.MeshLambertMaterial({ color: WHITE }),
    );
    pole.position.set(0, 8, 0);
    flagGroup.add(pole);

    const flag = new THREE.Mesh(
      new THREE.PlaneGeometry(6.2, 3.4),
      new THREE.MeshLambertMaterial({
        color: FLAG,
        side: THREE.DoubleSide,
      }),
    );
    flag.position.set(3.1, 13.4, 0);
    flag.name = "flag-cloth";
    flagGroup.add(flag);
    flagGroup.position.set(
      courseHole.cup.xYards,
      greenHeightYards(courseHole, courseHole.cup),
      courseHole.cup.yYards,
    );
  };

  const syncView = (view: {
    courseHole: CourseHole;
    ball: CoursePointYards;
    aimHeadingDegrees: number;
    aimLoftDegrees: number;
    aimCarryYards: number;
    aimIsPutt: boolean;
    ballSink01: number;
    cameraMode: GolfCameraMode;
    flyoverProgress01: number;
  }) => {
    const ballHeightYards = greenHeightYards(view.courseHole, view.ball);
    const sink01 = Math.min(1, Math.max(0, view.ballSink01));
    ballMesh.position.set(
      view.ball.xYards,
      ballHeightYards + BALL_RADIUS_YARDS - sink01 * 0.55,
      view.ball.yYards,
    );
    const ballScale = 1 - sink01 * 0.85;
    ballMesh.scale.setScalar(Math.max(0.08, ballScale));
    ballMesh.visible = sink01 < 0.98;
    writeAimArcDotTransforms({
      instancedDots: aimArcDots,
      dummy: aimDotDummy,
      courseHole: view.courseHole,
      ball: view.ball,
      headingDegrees: view.aimHeadingDegrees,
      loftDegrees: view.aimLoftDegrees,
      carryYards: view.aimCarryYards,
      isPutt: view.aimIsPutt,
    });
    aimArcDots.visible = view.cameraMode === "play" && sink01 === 0;

    const flagCloth = flagGroup.getObjectByName("flag-cloth");
    if (flagCloth) {
      flagCloth.lookAt(camera.position);
    }

    if (view.cameraMode === "play" && sink01 > 0) {
      applyHoleOutCamera(camera, view.courseHole);
      camera.fov = 50;
    } else if (view.cameraMode === "play") {
      applyPlayCamera(
        camera,
        view.ball,
        view.aimHeadingDegrees,
        view.aimIsPutt,
        view.courseHole,
      );
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
    ballMesh,
    aimArcDots,
    flagGroup,
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
      opacity: 0.92,
    }),
  );
  ribbon.rotation.x = -Math.PI / 2;
  ribbon.rotation.z = -heading;
  ribbon.position.set(
    (start.xYards + end.xYards) / 2,
    0.045,
    (start.yYards + end.yYards) / 2,
  );
  return ribbon;
}

function undulatingGreenMesh(
  courseHole: CourseHole,
  color: number,
  radiusYards: number,
  segments: number,
) {
  const geometry = new THREE.CircleGeometry(radiusYards, segments);
  geometry.rotateX(-Math.PI / 2);
  const positions = geometry.attributes.position;
  const shades = new Float32Array(positions.count * 3);
  const base = new THREE.Color(color);
  for (let index = 0; index < positions.count; index += 1) {
    const localX = positions.getX(index);
    const localZ = positions.getZ(index);
    const heightYards = greenHeightYards(courseHole, {
      xYards: courseHole.cup.xYards + localX,
      yYards: courseHole.cup.yYards + localZ,
    });
    positions.setY(index, heightYards);
    const tint = 0.88 + heightYards * 1.6;
    shades[index * 3] = Math.min(1, base.r * tint);
    shades[index * 3 + 1] = Math.min(1, base.g * tint);
    shades[index * 3 + 2] = Math.min(1, base.b * tint);
  }
  positions.needsUpdate = true;
  geometry.setAttribute("color", new THREE.BufferAttribute(shades, 3));
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshLambertMaterial({
      color: 0xffffff,
      vertexColors: true,
      side: THREE.DoubleSide,
    }),
  );
  mesh.position.set(courseHole.cup.xYards, 0.1, courseHole.cup.yYards);
  return mesh;
}

function greenSlopeGrid(courseHole: CourseHole) {
  const points: THREE.Vector3[] = [];
  const spacingYards = 2;
  const radiusYards = courseHole.greenRadiusYards;
  for (let x = -radiusYards; x <= radiusYards; x += spacingYards) {
    const column: THREE.Vector3[] = [];
    for (let z = -radiusYards; z <= radiusYards; z += spacingYards * 0.5) {
      if (Math.hypot(x, z) > radiusYards - 0.2) {
        continue;
      }
      const point = {
        xYards: courseHole.cup.xYards + x,
        yYards: courseHole.cup.yYards + z,
      };
      column.push(
        new THREE.Vector3(x, greenHeightYards(courseHole, point) + 0.02, z),
      );
    }
    for (let index = 0; index < column.length - 1; index += 1) {
      points.push(column[index], column[index + 1]);
    }
  }
  for (let z = -radiusYards; z <= radiusYards; z += spacingYards) {
    const row: THREE.Vector3[] = [];
    for (let x = -radiusYards; x <= radiusYards; x += spacingYards * 0.5) {
      if (Math.hypot(x, z) > radiusYards - 0.2) {
        continue;
      }
      const point = {
        xYards: courseHole.cup.xYards + x,
        yYards: courseHole.cup.yYards + z,
      };
      row.push(
        new THREE.Vector3(x, greenHeightYards(courseHole, point) + 0.02, z),
      );
    }
    for (let index = 0; index < row.length - 1; index += 1) {
      points.push(row[index], row[index + 1]);
    }
  }
  const grid = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.16,
    }),
  );
  grid.position.set(courseHole.cup.xYards, 0.11, courseHole.cup.yYards);
  return grid;
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

function writeAimArcDotTransforms(args: {
  instancedDots: THREE.InstancedMesh;
  dummy: THREE.Object3D;
  courseHole: CourseHole;
  ball: CoursePointYards;
  headingDegrees: number;
  loftDegrees: number;
  carryYards: number;
  isPutt: boolean;
}) {
  const headingRadians = (args.headingDegrees * Math.PI) / 180;
  const alongX = Math.sin(headingRadians);
  const alongZ = Math.cos(headingRadians);
  const carryYards = Math.max(args.carryYards, 1);
  if (args.isPutt) {
    for (let index = 0; index < AIM_ARC_DOT_COUNT; index += 1) {
      const alongYards = (carryYards * (index + 1)) / AIM_ARC_DOT_COUNT;
      const point = {
        xYards: args.ball.xYards + alongX * alongYards,
        yYards: args.ball.yYards + alongZ * alongYards,
      };
      args.dummy.position.set(
        point.xYards,
        greenHeightYards(args.courseHole, point) + 0.06,
        point.yYards,
      );
      args.dummy.scale.setScalar(0.42);
      args.dummy.updateMatrix();
      args.instancedDots.setMatrixAt(index, args.dummy.matrix);
    }
    args.instancedDots.instanceMatrix.needsUpdate = true;
    return;
  }
  const arcPoints = aimFlightArcPoints({
    loftDegrees: args.loftDegrees,
    carryYards: args.carryYards,
    pointCount: AIM_ARC_DOT_COUNT + 1,
  });
  for (let index = 0; index < AIM_ARC_DOT_COUNT; index += 1) {
    const point = arcPoints[index + 1];
    const distance01 = point.alongYards / carryYards;
    const dotScale = 0.72 + 0.28 * distance01;
    args.dummy.position.set(
      args.ball.xYards + alongX * point.alongYards,
      point.heightYards + 0.12,
      args.ball.yYards + alongZ * point.alongYards,
    );
    args.dummy.scale.setScalar(dotScale);
    args.dummy.updateMatrix();
    args.instancedDots.setMatrixAt(index, args.dummy.matrix);
  }
  args.instancedDots.instanceMatrix.needsUpdate = true;
}

function applyHoleOutCamera(
  camera: THREE.PerspectiveCamera,
  courseHole: CourseHole,
) {
  const cupHeightYards = greenHeightYards(courseHole, courseHole.cup);
  camera.position.set(
    courseHole.cup.xYards + 3.8,
    cupHeightYards + 2.8,
    courseHole.cup.yYards - 5.4,
  );
  camera.lookAt(
    courseHole.cup.xYards,
    cupHeightYards - 0.1,
    courseHole.cup.yYards,
  );
}

function applyPlayCamera(
  camera: THREE.PerspectiveCamera,
  ball: CoursePointYards,
  aimHeadingDegrees: number,
  isPutt: boolean,
  courseHole: CourseHole,
) {
  const headingRadians = (aimHeadingDegrees * Math.PI) / 180;
  const alongX = Math.sin(headingRadians);
  const alongZ = Math.cos(headingRadians);
  const rightX = alongZ;
  const rightZ = -alongX;
  const backYards = isPutt ? PUTT_CAMERA_BACK_YARDS : PLAY_CAMERA_BACK_YARDS;
  const sideYards = isPutt ? PUTT_CAMERA_SIDE_YARDS : PLAY_CAMERA_SIDE_YARDS;
  const eyeHeightYards = isPutt
    ? PUTT_CAMERA_EYE_HEIGHT_YARDS
    : PLAY_CAMERA_EYE_HEIGHT_YARDS;
  const lookAheadYards = isPutt
    ? PUTT_CAMERA_LOOK_AHEAD_YARDS
    : PLAY_CAMERA_LOOK_AHEAD_YARDS;
  const lookPoint = {
    xYards: ball.xYards + alongX * lookAheadYards,
    yYards: ball.yYards + alongZ * lookAheadYards,
  };
  camera.position.set(
    ball.xYards - alongX * backYards + rightX * sideYards,
    eyeHeightYards + greenHeightYards(courseHole, ball),
    ball.yYards - alongZ * backYards + rightZ * sideYards,
  );
  camera.lookAt(
    lookPoint.xYards,
    isPutt ? greenHeightYards(courseHole, lookPoint) + 0.15 : 2.8,
    lookPoint.yYards,
  );
}

function applyFlyoverCamera(
  camera: THREE.PerspectiveCamera,
  courseHole: CourseHole,
  progress01: number,
  settleHeadingDegrees: number,
) {
  const path = sampledFairwayPath(courseHole, 18);
  const mid = path[Math.floor(path.length * 0.55)] ?? courseHole.cup;
  const side = sideOffsetForHole(courseHole);
  const along = {
    x: -side.z,
    z: side.x,
  };
  const holdT = smoothstep01(Math.min(1, progress01 / 0.58));
  const settleT = smoothstep01(Math.max(0, (progress01 - 0.58) / 0.42));

  const startPosition = new THREE.Vector3(
    courseHole.tee.xYards - along.x * 28 + side.x * 54,
    118,
    courseHole.tee.yYards - along.z * 28 + side.z * 54,
  );
  const startLook = new THREE.Vector3(mid.xYards, 1, mid.yYards);
  const cruisePosition = new THREE.Vector3(
    mid.xYards + side.x * 36,
    62,
    mid.yYards + side.z * 36,
  );
  const cruiseLook = new THREE.Vector3(
    courseHole.cup.xYards,
    2,
    courseHole.cup.yYards,
  );
  const airPosition = startPosition.clone().lerp(cruisePosition, holdT);
  const airLook = startLook.clone().lerp(cruiseLook, holdT);

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
  const path = sampledFairwayPath(courseHole, 40);
  const mid = path[Math.floor(path.length / 2)];
  camera.position.set(
    courseHole.tee.xYards + side.x * 36 - 8,
    72,
    courseHole.tee.yYards + side.z * 36 - 18,
  );
  camera.lookAt(mid.xYards, 0, mid.yYards);
}

function applyResultsCamera(
  camera: THREE.PerspectiveCamera,
  courseHole: CourseHole,
) {
  const side = sideOffsetForHole(courseHole);
  camera.position.set(
    courseHole.cup.xYards + side.x * 28,
    22,
    courseHole.cup.yYards - 34,
  );
  camera.lookAt(courseHole.cup.xYards, 1, courseHole.cup.yYards);
}

function sideOffsetForHole(courseHole: CourseHole): { x: number; z: number } {
  const toCupX = courseHole.cup.xYards - courseHole.tee.xYards;
  const toCupZ = courseHole.cup.yYards - courseHole.tee.yYards;
  const length = Math.hypot(toCupX, toCupZ) || 1;
  return { x: toCupZ / length, z: -toCupX / length };
}

function smoothstep01(value: number): number {
  const t = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
}

function treeAt(point: CoursePointYards) {
  const scale =
    0.82 +
    (Math.abs(Math.sin(point.xYards * 0.37 + point.yYards * 0.19)) * 0.45);
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.75, 5.5, 6),
    new THREE.MeshLambertMaterial({ color: TREE_TRUNK }),
  );
  trunk.position.y = 2.75;
  const foliage = new THREE.Mesh(
    new THREE.ConeGeometry(4.2, 11, 7),
    new THREE.MeshLambertMaterial({ color: TREE_LEAF }),
  );
  foliage.position.y = 10.2;
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
