import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { EarthAPI } from './voxel-earth';
import {
  buildSaturnBody,
  buildSaturnRings,
  SATURN_RINGS,
  SATURN_SHAPE,
  saturnFitDistance,
  type SaturnBiomeId,
} from './saturn-terrain';

type Callbacks = {
  onSelect: (biome: SaturnBiomeId, lat: number, lon: number) => void;
  onInteract: () => void;
};

function noise(x: number, y: number, z: number) {
  const value = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return value - Math.floor(value);
}

export async function createSaturn(
  container: HTMLElement,
  signal: AbortSignal,
  callbacks: Callbacks,
): Promise<EarthAPI> {
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

  const cells = buildSaturnBody();
  const ringCells = buildSaturnRings();
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 600);
  const initialDirection = new THREE.Vector3(0, 0.48, 1).normalize();
  let fitDistance = saturnFitDistance(1);
  camera.position.copy(initialDirection).multiplyScalar(fitDistance);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  container.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden', 'true');

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = false;
  controls.autoRotateSpeed = 0.3;
  controls.rotateSpeed = 0.6;
  controls.zoomSpeed = 0.65;
  controls.minPolarAngle = 0.12;
  controls.maxPolarAngle = Math.PI - 0.12;

  // One transform keeps the ring plane perpendicular to Saturn's spin axis.
  const planet = new THREE.Group();
  planet.rotation.z = -SATURN_SHAPE.axialTilt;
  scene.add(planet);
  const fill = new THREE.HemisphereLight('#f5e8d3', '#40362a', 2.05);
  const sun = new THREE.DirectionalLight('#fff1d3', 3.2);
  sun.position.set(-6, 8, 7);
  const rim = new THREE.DirectionalLight('#99b3d0', 1.7);
  rim.position.set(5, 1, -6);
  scene.add(fill, sun, rim);

  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = 16;
  textureCanvas.height = 16;
  const context = textureCanvas.getContext('2d')!;
  for (let x = 0; x < 16; x++)
    for (let y = 0; y < 16; y++) {
      const value = Math.round(219 + noise(x, y, 4) * 36);
      context.fillStyle = `rgb(${value},${value},${value})`;
      context.fillRect(x, y, 1, 1);
    }
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 1,
  });
  const ringMaterial = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.95,
  });
  const body = new THREE.InstancedMesh(geometry, material, cells.length);
  const rings = new THREE.InstancedMesh(
    geometry,
    ringMaterial,
    ringCells.length,
  );
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  cells.forEach((cell, index) => {
    dummy.position.set(cell.x, cell.y, cell.z);
    dummy.scale.setScalar(SATURN_SHAPE.voxelSize);
    dummy.updateMatrix();
    body.setMatrixAt(index, dummy.matrix);
    color
      .set(cell.color)
      .multiplyScalar(0.87 + noise(cell.x, cell.y, cell.z) * 0.19);
    body.setColorAt(index, color);
  });
  ringCells.forEach((cell, index) => {
    dummy.position.set(cell.x, 0, cell.z);
    dummy.scale.set(
      SATURN_RINGS.voxelSize,
      SATURN_RINGS.thickness,
      SATURN_RINGS.voxelSize,
    );
    dummy.updateMatrix();
    rings.setMatrixAt(index, dummy.matrix);
    color
      .set(cell.color)
      .multiplyScalar(0.91 + noise(cell.x, 0, cell.z) * 0.13);
    rings.setColorAt(index, color);
  });
  for (const mesh of [body, rings]) {
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
    planet.add(mesh);
  }

  const starPositions: number[] = [];
  for (let index = 0; index < 700; index++) {
    const theta = noise(index, 1, 0) * Math.PI * 2;
    const phi = Math.acos(2 * noise(index, 2, 1) - 1);
    const radius = 65 + noise(index, 0, 2) * 30;
    starPositions.push(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta),
    );
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(starPositions, 3),
  );
  const starMaterial = new THREE.PointsMaterial({
    color: '#c8cfcd',
    size: 0.065,
    transparent: true,
    opacity: 0.65,
    sizeAttenuation: true,
  });
  scene.add(new THREE.Points(starGeometry, starMaterial));

  let targetPosition: THREE.Vector3 | null = null;
  let requestedRotation = true;
  let nightTarget = false;
  let frame = 0;
  let lastTime = performance.now();
  let disposed = false;
  const motionPreference = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  );
  let reducedMotion = motionPreference.matches;
  const motionChanged = (event: MediaQueryListEvent) => {
    reducedMotion = event.matches;
  };
  motionPreference.addEventListener('change', motionChanged);

  function resize() {
    const width = container.clientWidth,
      height = container.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    const newFitDistance = saturnFitDistance(camera.aspect, camera.fov);
    const ratio = newFitDistance / fitDistance;
    camera.position.multiplyScalar(ratio);
    if (targetPosition) targetPosition.multiplyScalar(ratio);
    fitDistance = newFitDistance;
    controls.minDistance = Math.max(6.3, fitDistance * 0.48);
    controls.maxDistance = fitDistance * 1.85;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  const animate = (time: number) => {
    if (disposed) return;
    const delta = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;
    if (targetPosition) {
      const current = new THREE.Spherical().setFromVector3(camera.position);
      const target = new THREE.Spherical().setFromVector3(targetPosition);
      const ease = reducedMotion ? 1 : 1 - Math.exp(-delta * 4.5);
      const angle = Math.atan2(
        Math.sin(target.theta - current.theta),
        Math.cos(target.theta - current.theta),
      );
      current.theta += angle * ease;
      current.phi = THREE.MathUtils.lerp(current.phi, target.phi, ease);
      current.radius = THREE.MathUtils.lerp(
        current.radius,
        target.radius,
        ease,
      );
      camera.position.setFromSpherical(current);
      if (camera.position.distanceTo(targetPosition) < 0.015) {
        camera.position.copy(targetPosition);
        targetPosition = null;
      }
    }
    const blend = reducedMotion ? 1 : 1 - Math.exp(-delta * 4);
    sun.intensity = THREE.MathUtils.lerp(
      sun.intensity,
      nightTarget ? 0.16 : 3.2,
      blend,
    );
    fill.intensity = THREE.MathUtils.lerp(
      fill.intensity,
      nightTarget ? 0.4 : 2.05,
      blend,
    );
    rim.intensity = THREE.MathUtils.lerp(
      rim.intensity,
      nightTarget ? 2.5 : 1.7,
      blend,
    );
    starMaterial.opacity = THREE.MathUtils.lerp(
      starMaterial.opacity,
      nightTarget ? 1 : 0.65,
      blend,
    );
    controls.autoRotate = requestedRotation && targetPosition === null;
    controls.update(delta);
    renderer.render(scene, camera);
    frame = requestAnimationFrame(animate);
  };
  frame = requestAnimationFrame(animate);

  const pointer = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  const activePointers = new Set<number>();
  let startX = 0,
    startY = 0,
    downTime = 0;
  let multiTouch = false;
  const down = (event: PointerEvent) => {
    if (activePointers.size === 0) multiTouch = false;
    activePointers.add(event.pointerId);
    if (activePointers.size > 1) multiTouch = true;
    startX = event.clientX;
    startY = event.clientY;
    downTime = performance.now();
  };
  const up = (event: PointerEvent) => {
    if (!activePointers.delete(event.pointerId)) return;
    if (
      multiTouch ||
      Math.hypot(event.clientX - startX, event.clientY - startY) > 5 ||
      performance.now() - downTime > 550
    )
      return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(
      rings.visible ? [body, rings] : [body],
      false,
    )[0];
    if (hit?.instanceId === undefined) return;
    requestedRotation = false;
    controls.autoRotate = false;
    if (hit.object === rings) {
      const cell = ringCells[hit.instanceId];
      callbacks.onSelect(
        'saturn-rings',
        0,
        (Math.atan2(cell.x, cell.z) * 180) / Math.PI,
      );
    } else {
      const cell = cells[hit.instanceId];
      callbacks.onSelect(cell.biome, cell.lat, cell.lon);
    }
  };
  const cancel = (event: PointerEvent) => {
    activePointers.delete(event.pointerId);
    multiTouch = true;
  };
  const interact = () => {
    targetPosition = null;
    requestedRotation = false;
    controls.autoRotate = false;
    callbacks.onInteract();
  };
  controls.addEventListener('start', interact);
  renderer.domElement.addEventListener('pointerdown', down);
  renderer.domElement.addEventListener('pointerup', up);
  renderer.domElement.addEventListener('pointercancel', cancel);
  const contextLost = (event: Event) => {
    event.preventDefault();
    container.dataset.contextLost = 'true';
  };
  const contextRestored = () => {
    delete container.dataset.contextLost;
    lastTime = performance.now();
  };
  renderer.domElement.addEventListener('webglcontextlost', contextLost);
  renderer.domElement.addEventListener('webglcontextrestored', contextRestored);

  const zoom = (direction: number) => {
    targetPosition = camera.position
      .clone()
      .normalize()
      .multiplyScalar(
        THREE.MathUtils.clamp(
          camera.position.length() + direction * fitDistance * 0.075,
          controls.minDistance,
          controls.maxDistance,
        ),
      );
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    signal.removeEventListener('abort', dispose);
    motionPreference.removeEventListener('change', motionChanged);
    controls.removeEventListener('start', interact);
    controls.dispose();
    renderer.domElement.removeEventListener('pointerdown', down);
    renderer.domElement.removeEventListener('pointerup', up);
    renderer.domElement.removeEventListener('pointercancel', cancel);
    renderer.domElement.removeEventListener('webglcontextlost', contextLost);
    renderer.domElement.removeEventListener(
      'webglcontextrestored',
      contextRestored,
    );
    delete container.dataset.contextLost;
    geometry.dispose();
    material.dispose();
    ringMaterial.dispose();
    texture.dispose();
    body.dispose();
    rings.dispose();
    starGeometry.dispose();
    starMaterial.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
  signal.addEventListener('abort', dispose, { once: true });

  return {
    blockCount: cells.length + ringCells.length,
    setNight: (value) => {
      nightTarget = value;
    },
    setClouds: (value) => {
      rings.visible = value;
    },
    setRotate: (value) => {
      requestedRotation = value;
    },
    focus: (lat, lon) => {
      requestedRotation = false;
      controls.autoRotate = false;
      const latitude = (lat * Math.PI) / 180,
        longitude = (lon * Math.PI) / 180;
      targetPosition = new THREE.Vector3(
        Math.cos(latitude) * Math.sin(longitude),
        Math.sin(latitude),
        Math.cos(latitude) * Math.cos(longitude),
      )
        .applyQuaternion(planet.quaternion)
        .multiplyScalar(fitDistance);
    },
    reset: () => {
      targetPosition = initialDirection.clone().multiplyScalar(fitDistance);
    },
    zoom,
    key: (key) => {
      if (key === '+' || key === '=') {
        zoom(-1);
        return;
      }
      if (key === '-') {
        zoom(1);
        return;
      }
      const spherical = new THREE.Spherical().setFromVector3(camera.position);
      if (key === 'ArrowLeft') spherical.theta -= 0.16;
      if (key === 'ArrowRight') spherical.theta += 0.16;
      if (key === 'ArrowUp')
        spherical.phi = Math.max(0.15, spherical.phi - 0.14);
      if (key === 'ArrowDown')
        spherical.phi = Math.min(Math.PI - 0.15, spherical.phi + 0.14);
      targetPosition = new THREE.Vector3().setFromSpherical(spherical);
    },
    dispose,
  };
}
