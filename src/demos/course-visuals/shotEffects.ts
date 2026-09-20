import * as THREE from "three";

export function createShotEffects(scene: THREE.Scene, color: number) {
  const trailPositions = new Float32Array(72 * 3);
  const trailGeometry = new THREE.BufferGeometry().setAttribute(
    "position",
    new THREE.BufferAttribute(trailPositions, 3),
  );
  trailGeometry.setDrawRange(0, 0);
  const trailMaterial = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
  });
  const trail = new THREE.Line(trailGeometry, trailMaterial);
  trail.frustumCulled = false;
  const markerMaterial = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.65,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const marker = new THREE.Mesh(
    new THREE.RingGeometry(0.65, 0.8, 48),
    markerMaterial,
  );
  marker.rotation.x = -Math.PI / 2;
  const landingRing = new THREE.Mesh(
    new THREE.RingGeometry(0.8, 1, 48),
    markerMaterial.clone(),
  );
  landingRing.rotation.x = -Math.PI / 2;
  landingRing.visible = false;
  const particlePositions = new Float32Array(40 * 3);
  const particles = new THREE.Points(
    new THREE.BufferGeometry().setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3),
    ),
    new THREE.PointsMaterial({
      color,
      size: 0.28,
      transparent: true,
      depthWrite: false,
    }),
  );
  particles.frustumCulled = false;
  particles.visible = false;
  scene.add(trail, marker, landingRing, particles);
  let trailCount = 0;
  let wasFlying = false;
  let wasCelebrating = false;
  let impactStartedAtSeconds = -10;
  let celebrationStartedAtSeconds = -10;
  const impactPosition = new THREE.Vector3();
  const previousPosition = new THREE.Vector3();
  const celebrationPosition = new THREE.Vector3();

  return {
    reset() {
      trailCount = 0;
      wasFlying = false;
      wasCelebrating = false;
      impactStartedAtSeconds = -10;
      celebrationStartedAtSeconds = -10;
      trailGeometry.setDrawRange(0, 0);
    },
    update(
      position: THREE.Vector3,
      groundHeightYards: number,
      isFlying: boolean,
      isCelebrating: boolean,
      seconds: number,
      reducedMotion: boolean,
    ) {
      if (isFlying && !wasFlying) {
        trailCount = 0;
        trailGeometry.setDrawRange(0, 0);
      }
      if (
        isFlying &&
        (!trailCount || previousPosition.distanceToSquared(position) > 0.16)
      ) {
        if (trailCount === 72) trailPositions.copyWithin(0, 3);
        else trailCount++;
        position.toArray(trailPositions, (trailCount - 1) * 3);
        previousPosition.copy(position);
        trailGeometry.attributes.position.needsUpdate = true;
        trailGeometry.setDrawRange(0, trailCount);
      }
      if (!isFlying && wasFlying) {
        impactStartedAtSeconds = seconds;
        impactPosition.set(position.x, groundHeightYards + 0.15, position.z);
      }
      if (isCelebrating && !wasCelebrating) {
        celebrationStartedAtSeconds = seconds;
        celebrationPosition.copy(position);
      }
      wasFlying = isFlying;
      wasCelebrating = isCelebrating;
      const impactAgeSeconds = seconds - impactStartedAtSeconds;
      const celebrationAgeSeconds = seconds - celebrationStartedAtSeconds;
      trailMaterial.opacity = isFlying
        ? 0.72
        : Math.max(0, 0.72 - impactAgeSeconds * 0.45);
      marker.visible = !isFlying && !isCelebrating;
      marker.position.set(position.x, groundHeightYards + 0.14, position.z);
      marker.scale.setScalar(
        reducedMotion ? 1 : 1 + Math.sin(seconds * 2.5) * 0.08,
      );
      landingRing.visible =
        !reducedMotion && impactAgeSeconds < 1.2 && impactAgeSeconds >= 0;
      landingRing.position.copy(impactPosition);
      landingRing.scale.setScalar(1 + impactAgeSeconds * 6);
      landingRing.material.opacity = Math.max(
        0,
        0.7 * (1 - impactAgeSeconds / 1.2),
      );
      particles.visible =
        !reducedMotion &&
        celebrationAgeSeconds >= 0 &&
        celebrationAgeSeconds < 2.4;
      if (particles.visible) {
        for (let index = 0; index < 40; index++) {
          const angle = index * 2.39996;
          const speed = 1.8 + (index % 5);
          particlePositions.set(
            [
              celebrationPosition.x +
                Math.cos(angle) * celebrationAgeSeconds * speed,
              celebrationPosition.y +
                1 +
                celebrationAgeSeconds * (6 + (index % 4)) -
                3.3 * celebrationAgeSeconds ** 2,
              celebrationPosition.z +
                Math.sin(angle) * celebrationAgeSeconds * speed,
            ],
            index * 3,
          );
        }
        particles.geometry.attributes.position.needsUpdate = true;
        particles.material.opacity = Math.max(
          0,
          1 - celebrationAgeSeconds / 2.4,
        );
      }
    },
  };
}

export function createCameraSmoothing(camera: THREE.PerspectiveCamera) {
  const previousPosition = new THREE.Vector3();
  const previousRotation = new THREE.Quaternion();
  let initialized = false;
  let previousTimeMs = performance.now();
  return {
    reset() {
      initialized = false;
    },
    update(reducedMotion: boolean) {
      const nowMs = performance.now();
      const blend =
        reducedMotion || !initialized
          ? 1
          : 1 - Math.exp(-Math.min(0.1, (nowMs - previousTimeMs) / 1000) * 8);
      if (!initialized) {
        previousPosition.copy(camera.position);
        previousRotation.copy(camera.quaternion);
      }
      previousPosition.lerp(camera.position, blend);
      previousRotation.slerp(camera.quaternion, blend);
      camera.position.copy(previousPosition);
      camera.quaternion.copy(previousRotation);
      initialized = true;
      previousTimeMs = nowMs;
    },
  };
}
