import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import * as Astronomy from 'astronomy-engine';

const NEO_DATABASE = [
  { name: 'Apophis', designation: '99942', diameter_m: 370, a_AU: 0.9224, e: 0.1912, i_deg: 3.34, close_date: '2029-04-13', close_dist_LD: 0.1, hazardous: true, description: 'Will pass within geostationary orbit distance in 2029' },
  { name: 'Bennu', designation: '101955', diameter_m: 490, a_AU: 1.1264, e: 0.2037, i_deg: 6.03, close_date: '2182-09-24', close_dist_LD: 0.5, hazardous: true, description: 'OSIRIS-REx sample return target' },
  { name: 'Didymos', designation: '65803', diameter_m: 780, a_AU: 1.6445, e: 0.3840, i_deg: 3.41, close_date: '2123-11-25', close_dist_LD: 16.1, hazardous: true, description: 'DART mission impact target for planetary defense test' },
  { name: 'Ryugu', designation: '162173', diameter_m: 900, a_AU: 1.1896, e: 0.1902, i_deg: 5.88, close_date: '2076-12-12', close_dist_LD: 2.4, hazardous: false, description: 'Hayabusa2 sample return mission target' },
  { name: 'Itokawa', designation: '25143', diameter_m: 330, a_AU: 1.3241, e: 0.2801, i_deg: 1.62, close_date: '2030-06-12', close_dist_LD: 18.5, hazardous: false, description: 'First asteroid from which sample was returned (Hayabusa)' },
  { name: '2024 YR4', designation: '2024 YR4', diameter_m: 60, a_AU: 1.05, e: 0.15, i_deg: 2.1, close_date: '2032-12-22', close_dist_LD: 0.8, hazardous: true, description: 'Recently discovered potentially hazardous asteroid' },
  { name: 'Toutatis', designation: '4179', diameter_m: 2450, a_AU: 2.5129, e: 0.6299, i_deg: 0.45, close_date: '2069-11-05', close_dist_LD: 7.5, hazardous: true, description: 'One of the largest known potentially hazardous asteroids' },
  { name: 'Florence', designation: '3122', diameter_m: 4900, a_AU: 1.7689, e: 0.4233, i_deg: 22.15, close_date: '2057-09-02', close_dist_LD: 18.8, hazardous: true, description: 'One of the largest near-Earth asteroids ever discovered' },
  { name: 'Eros', designation: '433', diameter_m: 16840, a_AU: 1.4583, e: 0.2229, i_deg: 10.83, close_date: '2056-01-23', close_dist_LD: 67.2, hazardous: false, description: 'First asteroid orbited by a spacecraft (NEAR Shoemaker)' },
  { name: 'Phaethon', designation: '3200', diameter_m: 5100, a_AU: 1.2713, e: 0.8899, i_deg: 22.26, close_date: '2093-12-14', close_dist_LD: 7.5, hazardous: true, description: 'Parent body of the Geminid meteor shower' },
];

const AU_TO_SCENE_UNITS = 50; // 1 AU = 50 scene units for visualization
const EARTH_RADIUS = 2;

function AsteroidTracker({ open, onClose }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const asteroidGroupRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const selectedAsteroidRef = useRef(null);
  const [selectedAsteroid, setSelectedAsteroid] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Check mobile on mount
  useEffect(() => {
    const _isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setIsMobile(_isMobile);
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    if (!open || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a0a14);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
    camera.position.set(0, 15, 20);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Stars background
    const starCount = isMobile ? 1000 : 2000;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 500;
      starPositions[i + 1] = (Math.random() - 0.5) * 500;
      starPositions[i + 2] = (Math.random() - 0.5) * 500;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Earth
    const earthGeometry = new THREE.IcosahedronGeometry(EARTH_RADIUS, 64);
    const earthMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a90ff,
      emissive: 0x003d99,
      wireframe: true,
      transparent: true,
      opacity: 0.8,
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(30, 30, 30);
    scene.add(pointLight);

    // Asteroid group for raycasting
    const asteroidGroup = new THREE.Group();
    scene.add(asteroidGroup);
    asteroidGroupRef.current = asteroidGroup;

    // Create asteroids and orbits
    const asteroidObjects = [];
    NEO_DATABASE.forEach((neo, index) => {
      // Orbit line
      const orbitPoints = [];
      const a = neo.a_AU * AU_TO_SCENE_UNITS;
      const e = neo.e;
      const i = (neo.i_deg * Math.PI) / 180;

      for (let angle = 0; angle < Math.PI * 2; angle += 0.01) {
        const r = (a * (1 - e * e)) / (1 + e * Math.cos(angle));
        const x = r * Math.cos(angle);
        const y = r * Math.sin(angle) * Math.cos(i);
        const z = r * Math.sin(angle) * Math.sin(i);
        orbitPoints.push(new THREE.Vector3(x, y, z));
      }

      const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
      const orbitMaterial = new THREE.LineBasicMaterial({
        color: neo.hazardous ? 0xef4444 : 0xf59e0b,
        transparent: true,
        opacity: 0.3,
        linewidth: 1,
      });
      const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
      scene.add(orbitLine);

      // Asteroid position (mean anomaly at t=0)
      const angle = (index * Math.PI * 2) / NEO_DATABASE.length;
      const r = (a * (1 - e * e)) / (1 + e * Math.cos(angle));
      const x = r * Math.cos(angle);
      const y = r * Math.sin(angle) * Math.cos(i);
      const z = r * Math.sin(angle) * Math.sin(i);

      // Asteroid dot
      const asteroidGeometry = new THREE.SphereGeometry(0.3, 8, 8);
      const asteroidMaterial = new THREE.MeshBasicMaterial({
        color: neo.hazardous ? 0xef4444 : 0xf59e0b,
      });
      const asteroidMesh = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
      asteroidMesh.position.set(x, y, z);
      asteroidMesh.userData.neo = neo;
      asteroidMesh.userData.angle = angle;
      asteroidMesh.userData.a = a;
      asteroidMesh.userData.e = e;
      asteroidMesh.userData.i = i;
      asteroidGroup.add(asteroidMesh);
      asteroidObjects.push({
        mesh: asteroidMesh,
        orbitLine: orbitLine,
        neo: neo,
      });
    });

    // Mouse interaction
    const onMouseMove = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(asteroidGroup.children);

      // Reset all materials
      asteroidGroup.children.forEach((child) => {
        if (child.userData.neo) {
          child.material.emissive.setHex(0x000000);
        }
      });

      // Highlight hovered
      if (intersects.length > 0) {
        intersects[0].object.material.emissive.setHex(0x7eb8f7);
      }
    };

    const onMouseClick = (event) => {
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(asteroidGroup.children);
      if (intersects.length > 0) {
        const selected = intersects[0].object;
        setSelectedAsteroid(selected.userData.neo);
        selectedAsteroidRef.current = selected;
      }
    };

    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('click', onMouseClick);

    // Handle window resize
    const onWindowResize = () => {
      const newWidth = containerRef.current?.clientWidth || width;
      const newHeight = containerRef.current?.clientHeight || height;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', onWindowResize);

    // Animation loop
    let animationId;
    let time = 0;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      time += 0.001;

      // Rotate camera around Earth
      const radius = 35;
      camera.position.x = Math.cos(time * 0.1) * radius;
      camera.position.z = Math.sin(time * 0.1) * radius;
      camera.lookAt(0, 0, 0);

      // Update asteroid positions (orbital motion)
      asteroidObjects.forEach((obj) => {
        const meanAnomaly = (time * 2 * Math.PI) / (2 * Math.PI * Math.sqrt(obj.mesh.userData.a ** 3)); // Kepler's 3rd law
        let angle = meanAnomaly;
        // Newton-Raphson for true anomaly (simplified)
        for (let j = 0; j < 5; j++) {
          angle = meanAnomaly + obj.mesh.userData.e * Math.sin(angle);
        }

        const a = obj.mesh.userData.a;
        const e = obj.mesh.userData.e;
        const i = obj.mesh.userData.i;
        const r = (a * (1 - e * e)) / (1 + e * Math.cos(angle));
        const x = r * Math.cos(angle);
        const y = r * Math.sin(angle) * Math.cos(i);
        const z = r * Math.sin(angle) * Math.sin(i);

        obj.mesh.position.set(x, y, z);
      });

      // Rotate Earth
      earth.rotation.y += 0.0001;

      renderer.render(scene, camera);
    };
    animate();

    // Cleanup function
    return () => {
      cancelAnimationFrame(animationId);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('click', onMouseClick);
      window.removeEventListener('resize', onWindowResize);

      // Dispose of geometries and materials
      scene.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      });

      renderer.forceContextLoss();
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [open, isMobile]);

  // Handle close button
  const handleClose = () => {
    setSelectedAsteroid(null);
    onClose();
  };

  if (!open) return null;

  // Calculate orbital period from semi-major axis (Kepler's 3rd law)
  const calculateOrbitalPeriod = (a_AU) => {
    const period_years = Math.sqrt(a_AU ** 3);
    const period_days = period_years * 365.25;
    return period_days.toFixed(0);
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Three.js container */}
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #1a1a2e 100%)' }}
      />

      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-6 right-6 z-10 p-2 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
        aria-label="Close asteroid tracker"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Info Panel */}
      {selectedAsteroid && (
        <>
          {/* Desktop sidebar */}
          {!isMobile && (
            <div className="absolute top-0 right-0 h-full w-80 backdrop-blur-md bg-gradient-to-br from-[rgba(12,14,28,0.96)] to-[rgba(12,14,28,0.92)] border-l border-[rgba(126,184,247,0.12)] overflow-y-auto">
              <div className="p-6 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-[#7eb8f7] mb-2">{selectedAsteroid.name}</h2>
                  <p className="text-sm text-gray-400">Designation: {selectedAsteroid.designation}</p>
                </div>

                {selectedAsteroid.hazardous && (
                  <div className="inline-block px-3 py-1 rounded-full bg-[#ef4444]/20 border border-[#ef4444]/50 text-[#ef4444] text-xs font-semibold">
                    Potentially Hazardous
                  </div>
                )}

                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Diameter</p>
                    <p className="text-white font-mono">{selectedAsteroid.diameter_m.toLocaleString()} m</p>
                  </div>

                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Semi-Major Axis</p>
                    <p className="text-white font-mono">{selectedAsteroid.a_AU.toFixed(4)} AU</p>
                  </div>

                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Orbital Period</p>
                    <p className="text-white font-mono">{calculateOrbitalPeriod(selectedAsteroid.a_AU)} days</p>
                  </div>

                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Eccentricity</p>
                    <p className="text-white font-mono">{selectedAsteroid.e.toFixed(4)}</p>
                  </div>

                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Inclination</p>
                    <p className="text-white font-mono">{selectedAsteroid.i_deg.toFixed(2)}°</p>
                  </div>

                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Next Close Approach</p>
                    <p className="text-white font-mono">{selectedAsteroid.close_date}</p>
                    <p className="text-gray-400 text-xs mt-1">{selectedAsteroid.close_dist_LD.toFixed(1)} Lunar Distances</p>
                  </div>

                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Description</p>
                    <p className="text-gray-300 text-xs leading-relaxed">{selectedAsteroid.description}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mobile bottom sheet */}
          {isMobile && (
            <div className="absolute bottom-0 left-0 right-0 max-h-[60vh] backdrop-blur-md bg-gradient-to-br from-[rgba(12,14,28,0.96)] to-[rgba(12,14,28,0.92)] border-t border-[rgba(126,184,247,0.12)] rounded-t-3xl overflow-y-auto">
              <div className="p-6 space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-[#7eb8f7] mb-2">{selectedAsteroid.name}</h2>
                    <p className="text-sm text-gray-400">Designation: {selectedAsteroid.designation}</p>
                  </div>
                  <button
                    onClick={() => setSelectedAsteroid(null)}
                    className="p-2"
                  >
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {selectedAsteroid.hazardous && (
                  <div className="inline-block px-3 py-1 rounded-full bg-[#ef4444]/20 border border-[#ef4444]/50 text-[#ef4444] text-xs font-semibold">
                    Potentially Hazardous
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Diameter</p>
                    <p className="text-white font-mono">{selectedAsteroid.diameter_m.toLocaleString()} m</p>
                  </div>

                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Semi-Major Axis</p>
                    <p className="text-white font-mono">{selectedAsteroid.a_AU.toFixed(4)} AU</p>
                  </div>

                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Orbital Period</p>
                    <p className="text-white font-mono">{calculateOrbitalPeriod(selectedAsteroid.a_AU)} days</p>
                  </div>

                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Eccentricity</p>
                    <p className="text-white font-mono">{selectedAsteroid.e.toFixed(4)}</p>
                  </div>

                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Inclination</p>
                    <p className="text-white font-mono">{selectedAsteroid.i_deg.toFixed(2)}°</p>
                  </div>

                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Next Close Approach</p>
                    <p className="text-white font-mono text-xs">{selectedAsteroid.close_date}</p>
                    <p className="text-gray-400 text-xs mt-1">{selectedAsteroid.close_dist_LD.toFixed(1)} LD</p>
                  </div>
                </div>

                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Description</p>
                  <p className="text-gray-300 text-xs leading-relaxed">{selectedAsteroid.description}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AsteroidTracker;
