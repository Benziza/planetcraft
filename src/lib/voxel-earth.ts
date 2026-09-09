import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { venusPalette, sampleVenus, type VenusBiomeId } from './venus-terrain';
import { marsPalette, sampleMars, type MarsBiomeId } from './mars-terrain';
import { createSaturn } from './voxel-saturn';
import type { SaturnBiomeId } from './saturn-terrain';

type SurfaceBiomeId = 'forest' | 'desert' | 'ocean' | 'snow' | 'mountain' | MarsBiomeId | VenusBiomeId;
export type BiomeId = SurfaceBiomeId | SaturnBiomeId;
export type EarthAPI = {
  blockCount: number;
  setNight: (value: boolean) => void;
  setClouds: (value: boolean) => void;
  setRotate: (value: boolean) => void;
  focus: (lat: number, lon: number) => void;
  reset: () => void;
  zoom: (direction: number) => void;
  key: (key: string) => void;
  dispose: () => void;
};
type Cell = { x: number; y: number; z: number; biome: SurfaceBiomeId; lat: number; lon: number };
type Callbacks = { onSelect: (biome: BiomeId, lat: number, lon: number) => void; onInteract: () => void };
type Land = { features: { geometry: { type: string; coordinates: number[][][] | number[][][][] } }[] };

const palette = { ocean: '#2675a6', forest: '#629441', desert: '#d3b879', snow: '#d7e6e5', mountain: '#8f9181', ...marsPalette, ...venusPalette };
const radians = Math.PI / 180;
function noise(x: number, y: number, z: number) { const value = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return value - Math.floor(value); }

export async function createEarth(container: HTMLElement, signal: AbortSignal, callbacks: Callbacks, planetId: 'earth' | 'mars' | 'saturn' | 'venus' = 'earth'): Promise<EarthAPI> {
  if (planetId === 'saturn') return createSaturn(container, signal, callbacks);
  const isMars = planetId === 'mars';
  const isVenus = planetId === 'venus';
  const isRocky = isMars || isVenus;
  const sampleTerrain = isVenus ? sampleVenus : sampleMars;
  let getBiome: (lat: number, lon: number) => SurfaceBiomeId;
  if (isRocky) {
    getBiome = (lat, lon) => sampleTerrain(lat, lon).biome;
  } else {
  const response = await fetch(`${import.meta.env.BASE_URL}land.geojson`, { signal });
  if (!response.ok) throw new Error('Land data unavailable');
  const land = await response.json() as Land;
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
  const map = document.createElement('canvas');
  map.width = 1024; map.height = 512;
  const ctx = map.getContext('2d', { willReadFrequently: true })!;
  ctx.fillStyle = '#fff';
  for (const feature of land.features) {
    const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates as number[][][]] : feature.geometry.coordinates as number[][][][];
    for (const polygon of polygons) {
      ctx.beginPath();
      for (const ring of polygon) {
        ring.forEach(([lon, lat], i) => { const x = (lon + 180) / 360 * 1024; const y = (90 - lat) / 180 * 512; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
        ctx.closePath();
      }
      ctx.fill('evenodd');
    }
  }
  const pixels = ctx.getImageData(0, 0, 1024, 512).data;
  const isLand = (lat: number, lon: number) => pixels[(Math.min(511, Math.max(0, Math.floor((90 - lat) / 180 * 512))) * 1024 + Math.min(1023, Math.max(0, Math.floor((lon + 180) / 360 * 1024)))) * 4 + 3] > 128;
  getBiome = (lat: number, lon: number): SurfaceBiomeId => {
    if (!isLand(lat, lon)) return 'ocean';
    if (lat > 69 || lat < -62 || (lon > -65 && lon < -22 && lat > 59)) return 'snow';
    if ((lat > 15 && lat < 33 && lon > -18 && lon < 61) || (lat < -19 && lat > -32 && lon > 116 && lon < 142) || (lat < -16 && lat > -29 && lon > 12 && lon < 23)) return 'desert';
    if ((lat > 27 && lat < 38 && lon > 70 && lon < 105) || (lat > -49 && lat < 0 && lon > -77 && lon < -67) || (lat > 36 && lat < 58 && lon > -125 && lon < -110)) return 'mountain';
    return 'forest';
  };
  }
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 120);
  const initial = new THREE.Vector3(0, 1.5, 11.5);
  camera.position.copy(initial);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  container.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.06;
  controls.enablePan = false; controls.minDistance = 6.6; controls.maxDistance = 18;
  controls.autoRotate = true; controls.autoRotateSpeed = 0.32;
  controls.rotateSpeed = 0.6; controls.zoomSpeed = 0.65;
  controls.minPolarAngle = 0.12; controls.maxPolarAngle = Math.PI - 0.12;

  const planet = new THREE.Group();
  scene.add(planet);
  const fill = new THREE.HemisphereLight(isVenus ? '#ffebbf' : isMars ? '#ffe0c4' : '#c8e5ff', isVenus ? '#352719' : isMars ? '#351b18' : '#132b36', 2.35);
  scene.add(fill);
  const sun = new THREE.DirectionalLight('#fff3d3', 3.7);
  sun.position.set(-5, 7, 6); scene.add(sun);
  const rim = new THREE.DirectionalLight(isVenus ? '#e8c576' : isMars ? '#e89972' : '#74bafa', 2.0);
  rim.position.set(4, 0, -5); scene.add(rim);

  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = 16; textureCanvas.height = 16;
  const textureCtx = textureCanvas.getContext('2d')!;
  for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) {
    const c = Math.round(207 + noise(x, y, 4) * 48);
    textureCtx.fillStyle = `rgb(${c},${c},${c})`; textureCtx.fillRect(x, y, 1, 1);
  }
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.magFilter = THREE.NearestFilter; texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({ map: texture, roughness: 1, metalness: 0 });
  const radius = 25, size = 0.119, bound = radius + (isRocky ? 4 : 3), width = bound * 2 + 1;
  const filled = new Uint8Array(width ** 3);
  const address = (x: number, y: number, z: number) => (x + bound) * width * width + (y + bound) * width + z + bound;
  for (let x = -bound + 1; x < bound; x++) for (let y = -bound + 1; y < bound; y++) for (let z = -bound + 1; z < bound; z++) {
    const d = Math.hypot(x, y, z);
    if (d < radius - (isRocky ? 2 : 1)) { filled[address(x, y, z)] = 1; continue; }
    if (d > radius + (isRocky ? 2.8 : 1.6)) continue;
    const lat = Math.asin(y / d) / radians, lon = Math.atan2(x, z) / radians;
    const biome = getBiome(lat, lon);
    const elevation = isRocky ? sampleTerrain(lat, lon).elevation : biome === 'ocean' ? 0 : biome === 'mountain' ? 1.1 + noise(x, y, z) * 0.4 : 0.6;
    if (d <= radius + elevation) filled[address(x, y, z)] = 1;
  }
  const cells: Cell[] = [];
  const neighbors = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  for (let x = -bound + 1; x < bound; x++) for (let y = -bound + 1; y < bound; y++) for (let z = -bound + 1; z < bound; z++) {
    if (!filled[address(x, y, z)] || neighbors.every(([a, b, c]) => filled[address(x + a, y + b, z + c)])) continue;
    const d = Math.hypot(x, y, z), lat = Math.asin(y / d) / radians, lon = Math.atan2(x, z) / radians;
    cells.push({ x, y, z, lat, lon, biome: getBiome(lat, lon) });
  }
  const earth = new THREE.InstancedMesh(geometry, material, cells.length);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  cells.forEach((cell, i) => {
    dummy.position.set(cell.x * size, cell.y * size, cell.z * size);
    dummy.scale.setScalar(size); dummy.updateMatrix(); earth.setMatrixAt(i, dummy.matrix);
    color.set(palette[cell.biome]);
    color.multiplyScalar(0.81 + noise(cell.x, cell.y, cell.z) * 0.31);
    if (cell.biome === 'forest' && Math.abs(cell.lat) < 10) color.multiplyScalar(0.88);
    earth.setColorAt(i, color);
  });
  earth.instanceMatrix.needsUpdate = true; earth.instanceColor!.needsUpdate = true; earth.computeBoundingSphere(); planet.add(earth);

  type Block = { position: THREE.Vector3; scale: THREE.Vector3; color: string };
  const foliage: Block[] = [];
  for (const cell of cells) {
    if (cell.biome !== 'forest' || noise(cell.z, cell.x, cell.y) > 0.017) continue;
    const normal = new THREE.Vector3(cell.x, cell.y, cell.z).normalize();
    const base = new THREE.Vector3(cell.x, cell.y, cell.z).multiplyScalar(size);
    for (let t = 1; t <= 2; t++) foliage.push({ position: base.clone().addScaledVector(normal, size * t * .75), scale: new THREE.Vector3(.057, .057, .057), color: '#705637' });
    foliage.push({ position: base.clone().addScaledVector(normal, size * 2), scale: new THREE.Vector3(.19, .18, .19), color: '#3c6b32' });
    foliage.push({ position: base.clone().addScaledVector(normal, size * 2.8), scale: new THREE.Vector3(.12, .12, .12), color: '#54843b' });
  }
  const trees = new THREE.InstancedMesh(geometry, material, foliage.length);
  foliage.forEach((block, i) => { dummy.position.copy(block.position); dummy.scale.copy(block.scale); dummy.updateMatrix(); trees.setMatrixAt(i, dummy.matrix); trees.setColorAt(i, color.set(block.color)); });
  trees.instanceMatrix.needsUpdate = true; if (trees.instanceColor) trees.instanceColor.needsUpdate = true; trees.computeBoundingSphere(); planet.add(trees);

  const cloudBlocks: Block[] = [];
  const cloudCenters = [[44, -30], [-14, -8], [18, 75], [-35, 60], [53, 111], [6, -94], [-30, -123], [61, -110], [-4, 138], [26, -174], [-48, 160], [8, 31]];
  if (isVenus) {
    cloudCenters.length = 0;
    for (let lat = -70; lat <= 70; lat += 20)
      for (let lon = -180; lon < 180; lon += 25) cloudCenters.push([lat, lon + 8 * Math.sin(lat * radians)]);
  }
  for (const [lat, lon] of cloudCenters) {
    const normal = new THREE.Vector3(Math.cos(lat * radians) * Math.sin(lon * radians), Math.sin(lat * radians), Math.cos(lat * radians) * Math.cos(lon * radians));
    const tangent = new THREE.Vector3().crossVectors(normal, new THREE.Vector3(0, 1, 0)).normalize();
    const vertical = new THREE.Vector3().crossVectors(tangent, normal).normalize();
    for (let a = -3; a <= 3; a++) for (let b = -1; b <= 1; b++) {
      if (noise(a, b, lon) > .73 || (Math.abs(a) === 3 && b !== 0)) continue;
      const p = normal.clone().multiplyScalar(3.33 + noise(a, b, lat) * .055).addScaledVector(tangent, a * .16).addScaledVector(vertical, b * .15);
      p.set(Math.round(p.x / .1) * .1, Math.round(p.y / .1) * .1, Math.round(p.z / .1) * .1);
      cloudBlocks.push({ position: p, scale: new THREE.Vector3(.24, .14, .22), color: '#f3f4e9' });
    }
  }
  const cloudMaterial = new THREE.MeshStandardMaterial({ roughness: 1, color: isVenus ? '#edcf86' : isMars ? '#cc9873' : '#edf4ef', transparent: isRocky, opacity: isVenus ? 0.55 : isMars ? 0.22 : 1, depthWrite: !isRocky });
  const clouds = new THREE.InstancedMesh(geometry, cloudMaterial, cloudBlocks.length);
  cloudBlocks.forEach((block, i) => { dummy.position.copy(block.position); dummy.scale.copy(block.scale); dummy.updateMatrix(); clouds.setMatrixAt(i, dummy.matrix); });
  clouds.instanceMatrix.needsUpdate = true; clouds.computeBoundingSphere(); planet.add(clouds);

  const starPositions: number[] = [];
  for (let i = 0; i < 650; i++) {
    const theta = noise(i, 1, 0) * Math.PI * 2, phi = Math.acos(2 * noise(i, 2, 1) - 1), r = 35 + noise(i, 0, 2) * 20;
    starPositions.push(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
  }
  const starGeometry = new THREE.BufferGeometry(); starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
  const starMaterial = new THREE.PointsMaterial({ color: '#aac4c3', size: .035, transparent: true, opacity: .65, sizeAttenuation: true });
  scene.add(new THREE.Points(starGeometry, starMaterial));

  const orbitGeometry = new THREE.BufferGeometry().setFromPoints(Array.from({ length: 161 }, (_, i) => { const a = i / 160 * Math.PI * 2; return new THREE.Vector3(Math.cos(a) * 4.15, 0, Math.sin(a) * 4.15); }));
  const orbitMaterial = new THREE.LineDashedMaterial({ color: isVenus ? '#b19a60' : isMars ? '#99705b' : '#55756e', transparent: true, opacity: .24, dashSize: .07, gapSize: .08 });
  const orbit = new THREE.Line(orbitGeometry, orbitMaterial); orbit.computeLineDistances(); orbit.rotation.z = -.19; scene.add(orbit);

  let targetPosition: THREE.Vector3 | null = null;
  let requestedRotation = true;
  let nightTarget = false;
  let frame = 0;
  let lastTime = performance.now();
  let disposed = false;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function resize() { const width = container.clientWidth, height = container.clientHeight; if (!width || !height) return; camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.setSize(width, height); }
  const observer = new ResizeObserver(resize); observer.observe(container); resize();
  const animate = (time: number) => {
    if (disposed) return;
    const delta = Math.min((time - lastTime) / 1000, .05); lastTime = time;
    if (targetPosition) {
      const current = new THREE.Spherical().setFromVector3(camera.position);
      const target = new THREE.Spherical().setFromVector3(targetPosition);
      const ease = reducedMotion ? 1 : 1 - Math.exp(-delta * 4.5);
      const angle = Math.atan2(Math.sin(target.theta - current.theta), Math.cos(target.theta - current.theta));
      current.theta += angle * ease;
      current.phi = THREE.MathUtils.lerp(current.phi, target.phi, ease);
      current.radius = THREE.MathUtils.lerp(current.radius, target.radius, ease);
      camera.position.setFromSpherical(current);
      if (camera.position.distanceTo(targetPosition) < .015) { camera.position.copy(targetPosition); targetPosition = null; }
    }
    const blend = 1 - Math.exp(-delta * 4);
    sun.intensity = THREE.MathUtils.lerp(sun.intensity, nightTarget ? .14 : 3.7, blend);
    fill.intensity = THREE.MathUtils.lerp(fill.intensity, nightTarget ? .52 : 2.35, blend);
    rim.intensity = THREE.MathUtils.lerp(rim.intensity, nightTarget ? 2.8 : 2, blend);
    starMaterial.opacity = THREE.MathUtils.lerp(starMaterial.opacity, nightTarget ? 1 : .65, blend);
    controls.autoRotate = requestedRotation && targetPosition === null;
    controls.update(delta);
    renderer.render(scene, camera);
    frame = requestAnimationFrame(animate);
  };
  frame = requestAnimationFrame(animate);
  const pointer = new THREE.Vector2(); const raycaster = new THREE.Raycaster();
  let startX = 0, startY = 0, downTime = 0;
  const activePointers = new Set<number>();
  let multiTouch = false;
  const down = (event: PointerEvent) => {
    if (activePointers.size === 0) multiTouch = false;
    activePointers.add(event.pointerId);
    if (activePointers.size > 1) multiTouch = true;
    startX = event.clientX; startY = event.clientY; downTime = performance.now();
  };
  const up = (event: PointerEvent) => {
    activePointers.delete(event.pointerId);
    if (multiTouch) return;
    if (Math.hypot(event.clientX - startX, event.clientY - startY) > 5 || performance.now() - downTime > 550) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObject(earth)[0];
    if (hit?.instanceId !== undefined) { const cell = cells[hit.instanceId]; callbacks.onSelect(cell.biome, cell.lat, cell.lon); requestedRotation = false; controls.autoRotate = false; }
  };
  const cancel = (event: PointerEvent) => { activePointers.delete(event.pointerId); multiTouch = true; };
  const interact = () => { targetPosition = null; requestedRotation = false; controls.autoRotate = false; callbacks.onInteract(); };
  controls.addEventListener('start', interact);
  renderer.domElement.addEventListener('pointerdown', down);
  renderer.domElement.addEventListener('pointerup', up);
  renderer.domElement.addEventListener('pointercancel', cancel);
  const contextLost = (event: Event) => { event.preventDefault(); container.dataset.contextLost = 'true'; };
  const contextRestored = () => { delete container.dataset.contextLost; lastTime = performance.now(); };
  renderer.domElement.addEventListener('webglcontextlost', contextLost);
  renderer.domElement.addEventListener('webglcontextrestored', contextRestored);

  const zoom = (direction: number) => { targetPosition = camera.position.clone().normalize().multiplyScalar(THREE.MathUtils.clamp(camera.position.length() + direction * 1.1, controls.minDistance, controls.maxDistance)); };
  return {
    blockCount: cells.length + foliage.length + cloudBlocks.length,
    setNight: value => { nightTarget = value; },
    setClouds: value => { clouds.visible = value; },
    setRotate: value => { requestedRotation = value; },
    focus: (lat, lon) => {
      requestedRotation = false;
      controls.autoRotate = false;
      targetPosition = new THREE.Vector3(Math.cos(lat * radians) * Math.sin(lon * radians), Math.sin(lat * radians), Math.cos(lat * radians) * Math.cos(lon * radians)).multiplyScalar(9.4);
    },
    reset: () => { targetPosition = initial.clone(); },
    zoom,
    key: key => {
      if (key === '+' || key === '=') { zoom(-1); return; } if (key === '-') { zoom(1); return; }
      const spherical = new THREE.Spherical().setFromVector3(camera.position);
      if (key === 'ArrowLeft') spherical.theta -= .16;
      if (key === 'ArrowRight') spherical.theta += .16;
      if (key === 'ArrowUp') spherical.phi = Math.max(.15, spherical.phi - .14);
      if (key === 'ArrowDown') spherical.phi = Math.min(Math.PI - .15, spherical.phi + .14);
      targetPosition = new THREE.Vector3().setFromSpherical(spherical);
    },
    dispose: () => {
      if (disposed) return; disposed = true; cancelAnimationFrame(frame); observer.disconnect();
      controls.removeEventListener('start', interact); controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', down); renderer.domElement.removeEventListener('pointerup', up); renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      renderer.domElement.removeEventListener('pointercancel', cancel); renderer.domElement.removeEventListener('webglcontextrestored', contextRestored);
      delete container.dataset.contextLost;
      geometry.dispose(); material.dispose(); texture.dispose(); cloudMaterial.dispose(); starGeometry.dispose(); starMaterial.dispose(); orbitGeometry.dispose(); orbitMaterial.dispose(); earth.dispose(); trees.dispose(); clouds.dispose(); renderer.dispose(); renderer.domElement.remove();
    },
  };
}
