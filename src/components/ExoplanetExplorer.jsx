import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const EXOPLANET_SYSTEMS = [
  {
    star: 'Proxima Centauri',
    distance_ly: 4.24,
    spectral: 'M5.5V',
    temp_K: 3042,
    planets: [
      {
        name: 'Proxima b',
        mass_earth: 1.17,
        radius_earth: 1.08,
        period_days: 11.19,
        semi_major_AU: 0.0485,
        habitable: true,
        year_discovered: 2016,
        description: 'Closest known exoplanet, in habitable zone'
      },
      {
        name: 'Proxima d',
        mass_earth: 0.26,
        radius_earth: 0.81,
        period_days: 5.12,
        semi_major_AU: 0.0291,
        habitable: false,
        year_discovered: 2022,
        description: 'One of the lightest exoplanets known'
      }
    ]
  },
  {
    star: 'TRAPPIST-1',
    distance_ly: 40.66,
    spectral: 'M8V',
    temp_K: 2566,
    planets: [
      {
        name: 'TRAPPIST-1b',
        mass_earth: 1.02,
        radius_earth: 1.12,
        period_days: 1.51,
        semi_major_AU: 0.0115,
        habitable: false,
        year_discovered: 2016,
        description: 'Innermost planet, likely tidally locked'
      },
      {
        name: 'TRAPPIST-1c',
        mass_earth: 1.38,
        radius_earth: 1.10,
        period_days: 2.42,
        semi_major_AU: 0.0158,
        habitable: false,
        year_discovered: 2016,
        description: 'Second planet, too hot for liquid water'
      },
      {
        name: 'TRAPPIST-1d',
        mass_earth: 0.39,
        radius_earth: 0.79,
        period_days: 4.05,
        semi_major_AU: 0.0223,
        habitable: true,
        year_discovered: 2016,
        description: 'In the habitable zone, could have water'
      },
      {
        name: 'TRAPPIST-1e',
        mass_earth: 0.69,
        radius_earth: 0.92,
        period_days: 6.10,
        semi_major_AU: 0.0293,
        habitable: true,
        year_discovered: 2016,
        description: 'Most Earth-like, best candidate for life'
      },
      {
        name: 'TRAPPIST-1f',
        mass_earth: 1.04,
        radius_earth: 1.05,
        period_days: 9.21,
        semi_major_AU: 0.0385,
        habitable: true,
        year_discovered: 2016,
        description: 'In habitable zone, may have water'
      },
      {
        name: 'TRAPPIST-1g',
        mass_earth: 1.32,
        radius_earth: 1.13,
        period_days: 12.35,
        semi_major_AU: 0.0469,
        habitable: false,
        year_discovered: 2016,
        description: 'Larger than Earth, at edge of habitable zone'
      },
      {
        name: 'TRAPPIST-1h',
        mass_earth: 0.33,
        radius_earth: 0.77,
        period_days: 18.77,
        semi_major_AU: 0.0619,
        habitable: false,
        year_discovered: 2017,
        description: 'Outermost planet, likely too cold'
      }
    ]
  },
  {
    star: 'Kepler-442',
    distance_ly: 1206,
    spectral: 'K4V',
    temp_K: 4402,
    planets: [
      {
        name: 'Kepler-442b',
        mass_earth: 2.36,
        radius_earth: 1.34,
        period_days: 112.3,
        semi_major_AU: 0.409,
        habitable: true,
        year_discovered: 2015,
        description: 'One of the most Earth-like planets found by Kepler'
      }
    ]
  },
  {
    star: '51 Pegasi',
    distance_ly: 50.45,
    spectral: 'G2IV',
    temp_K: 5793,
    planets: [
      {
        name: '51 Pegasi b',
        mass_earth: 150,
        radius_earth: 12.5,
        period_days: 4.23,
        semi_major_AU: 0.052,
        habitable: false,
        year_discovered: 1995,
        description: 'First exoplanet found around a Sun-like star (Nobel Prize 2019)'
      }
    ]
  },
  {
    star: 'Kepler-186',
    distance_ly: 582,
    spectral: 'M1V',
    temp_K: 3788,
    planets: [
      {
        name: 'Kepler-186f',
        mass_earth: 1.71,
        radius_earth: 1.17,
        period_days: 129.9,
        semi_major_AU: 0.432,
        habitable: true,
        year_discovered: 2014,
        description: 'First Earth-sized planet in the habitable zone'
      }
    ]
  },
  {
    star: 'TOI-700',
    distance_ly: 101.4,
    spectral: 'M2V',
    temp_K: 3480,
    planets: [
      {
        name: 'TOI-700 d',
        mass_earth: 1.72,
        radius_earth: 1.19,
        period_days: 37.43,
        semi_major_AU: 0.163,
        habitable: true,
        year_discovered: 2020,
        description: 'First habitable-zone Earth-size planet found by TESS'
      },
      {
        name: 'TOI-700 e',
        mass_earth: 0.82,
        radius_earth: 0.95,
        period_days: 28.43,
        semi_major_AU: 0.134,
        habitable: true,
        year_discovered: 2023,
        description: 'In the optimistic habitable zone'
      }
    ]
  },
  {
    star: 'Tau Ceti',
    distance_ly: 11.91,
    spectral: 'G8.5V',
    temp_K: 5344,
    planets: [
      {
        name: 'Tau Ceti e',
        mass_earth: 3.93,
        radius_earth: 1.59,
        period_days: 162.87,
        semi_major_AU: 0.538,
        habitable: true,
        year_discovered: 2012,
        description: 'Super-Earth in the habitable zone of a nearby star'
      },
      {
        name: 'Tau Ceti f',
        mass_earth: 3.93,
        radius_earth: 1.59,
        period_days: 636.13,
        semi_major_AU: 1.334,
        habitable: true,
        year_discovered: 2012,
        description: 'In the outer habitable zone'
      }
    ]
  },
  {
    star: 'HD 219134',
    distance_ly: 21.25,
    spectral: 'K3V',
    temp_K: 4699,
    planets: [
      {
        name: 'HD 219134 b',
        mass_earth: 4.74,
        radius_earth: 1.60,
        period_days: 3.09,
        semi_major_AU: 0.0388,
        habitable: false,
        year_discovered: 2015,
        description: 'First rocky super-Earth with measured transit'
      },
      {
        name: 'HD 219134 c',
        mass_earth: 4.36,
        radius_earth: 1.51,
        period_days: 6.77,
        semi_major_AU: 0.0653,
        habitable: false,
        year_discovered: 2015,
        description: 'Super-Earth with known density'
      }
    ]
  }
];

const getStarColor = (spectralType) => {
  if (spectralType.startsWith('M')) return 0xff4444;
  if (spectralType.startsWith('K')) return 0xff9944;
  if (spectralType.startsWith('G')) return 0xffff44;
  if (spectralType.startsWith('F')) return 0xffeeaa;
  return 0xffffff;
};

const getPlanetColor = (habitable, temp_K = 5000) => {
  if (habitable) return 0x22dd77;
  if (temp_K > 6000) return 0xff6b6b;
  if (temp_K > 4000) return 0xffaa44;
  return 0x6ba3ff;
};

const createStarfield = (scene) => {
  const starGeometry = new THREE.BufferGeometry();
  const starCount = 1500;
  const positions = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 500;
    positions[i + 1] = (Math.random() - 0.5) * 500;
    positions[i + 2] = (Math.random() - 0.5) * 500;
  }

  starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.5,
    sizeAttenuation: true
  });

  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);
  return stars;
};

const createHabitableZone = (innerAU, outerAU) => {
  const innerRadius = innerAU * 10;
  const outerRadius = outerAU * 10;
  const torusGeometry = new THREE.TorusGeometry(
    (innerRadius + outerRadius) / 2,
    (outerRadius - innerRadius) / 2,
    32,
    100
  );

  const torusMaterial = new THREE.MeshBasicMaterial({
    color: 0x22dd77,
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide
  });

  const torus = new THREE.Mesh(torusGeometry, torusMaterial);
  torus.rotation.x = (Math.random() - 0.5) * 0.4;
  torus.rotation.z = (Math.random() - 0.5) * 0.4;

  return torus;
};

const ExoplanetExplorer = ({ open, onClose }) => {
  if (!open) return null;

  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const planetMeshesRef = useRef([]);
  const orbitRingsRef = useRef([]);
  const animationIdRef = useRef(null);
  const currentSystemIndexRef = useRef(0);
  const elapsedTimeRef = useRef(0);

  const [selectedPlanet, setSelectedPlanet] = useState(null);
  const [isMobile] = useState(
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  );

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0c0e1c);

    // Camera
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
    camera.position.set(0, 15, 30);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(50, 50, 50);
    scene.add(pointLight);

    // Starfield
    createStarfield(scene);

    // Function to load a system
    const loadSystem = (systemIndex) => {
      // Clear old meshes
      planetMeshesRef.current.forEach((mesh) => {
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) mesh.material.dispose();
        scene.remove(mesh);
      });
      planetMeshesRef.current = [];

      orbitRingsRef.current.forEach((ring) => {
        if (ring.geometry) ring.geometry.dispose();
        if (ring.material) ring.material.dispose();
        scene.remove(ring);
      });
      orbitRingsRef.current = [];

      const system = EXOPLANET_SYSTEMS[systemIndex];

      // Create star
      const starRadius = 2;
      const starColor = getStarColor(system.spectral);
      const starGeometry = new THREE.SphereGeometry(starRadius, 32, 32);
      const starMaterial = new THREE.MeshBasicMaterial({ color: starColor });
      const star = new THREE.Mesh(starGeometry, starMaterial);

      // Star glow
      const glowGeometry = new THREE.SphereGeometry(starRadius + 2, 32, 32);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: starColor,
        transparent: true,
        opacity: 0.2
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      scene.remove(...scene.children.filter((c) => c.userData.isStar));
      scene.add(star, glow);
      star.userData.isStar = true;
      glow.userData.isStar = true;

      // Create habitable zone
      const habitableInnerAU = 0.95 * Math.sqrt(system.temp_K / 5778);
      const habitableOuterAU = 1.37 * Math.sqrt(system.temp_K / 5778);
      const habitableZone = createHabitableZone(habitableInnerAU, habitableOuterAU);
      scene.remove(...scene.children.filter((c) => c.userData.isHabitableZone));
      scene.add(habitableZone);
      habitableZone.userData.isHabitableZone = true;

      // Create planets
      system.planets.forEach((planet, idx) => {
        const planetData = {
          ...planet,
          object: null,
          angle: Math.random() * Math.PI * 2,
          orbitRadius: planet.semi_major_AU * 10
        };

        // Planet mesh
        const planetRadius = Math.max(planet.radius_earth * 0.8, 0.1);
        const planetColor = getPlanetColor(
          planet.habitable,
          system.temp_K
        );
        const geometry = new THREE.SphereGeometry(planetRadius, 16, 16);
        const material = new THREE.MeshPhongMaterial({
          color: planetColor,
          emissive: planetColor,
          emissiveIntensity: 0.3
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData.planetData = planetData;
        mesh.userData.systemIndex = systemIndex;
        mesh.userData.planetIndex = idx;

        // Orbit ring
        const orbitGeometry = new THREE.BufferGeometry();
        const orbitPoints = [];
        for (let i = 0; i <= 64; i++) {
          const angle = (i / 64) * Math.PI * 2;
          orbitPoints.push(
            Math.cos(angle) * planetData.orbitRadius,
            0,
            Math.sin(angle) * planetData.orbitRadius
          );
        }
        orbitGeometry.setAttribute(
          'position',
          new THREE.BufferAttribute(new Float32Array(orbitPoints), 3)
        );
        const orbitMaterial = new THREE.LineBasicMaterial({
          color: 0x7eb8f7,
          transparent: true,
          opacity: 0.3
        });
        const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
        scene.add(orbitLine);
        orbitRingsRef.current.push(orbitLine);

        scene.add(mesh);
        planetMeshesRef.current.push(mesh);
      });

      elapsedTimeRef.current = 0;
    };

    loadSystem(0);

    // Raycaster for picking
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseClick = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(planetMeshesRef.current);

      if (intersects.length > 0) {
        const clicked = intersects[0].object;
        setSelectedPlanet({
          ...clicked.userData.planetData,
          system: EXOPLANET_SYSTEMS[clicked.userData.systemIndex]
        });
      }
    };

    renderer.domElement.addEventListener('click', onMouseClick);

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      elapsedTimeRef.current += 0.001;

      // Rotate camera
      const cameraDistance = 40;
      camera.position.x = Math.cos(elapsedTimeRef.current * 0.1) * cameraDistance;
      camera.position.z = Math.sin(elapsedTimeRef.current * 0.1) * cameraDistance;
      camera.lookAt(0, 0, 0);

      // Update planet positions
      planetMeshesRef.current.forEach((mesh) => {
        const pData = mesh.userData.planetData;
        const system = EXOPLANET_SYSTEMS[mesh.userData.systemIndex];
        const speed = 0.5 / (pData.period_days / 365.25);
        pData.angle += speed * 0.001;

        mesh.position.x = Math.cos(pData.angle) * pData.orbitRadius;
        mesh.position.z = Math.sin(pData.angle) * pData.orbitRadius;
        mesh.rotation.x += 0.01;
        mesh.rotation.y += 0.02;
      });

      renderer.render(scene, camera);
    };

    animate();

    // System switching
    const switchSystem = (index) => {
      currentSystemIndexRef.current = index;
      loadSystem(index);
      setSelectedPlanet(null);
    };

    window.switchExoplanetSystem = switchSystem;

    // Handle window resize
    const onWindowResize = () => {
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', onWindowResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', onWindowResize);
      renderer.domElement.removeEventListener('click', onMouseClick);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      renderer.forceContextLoss();
      renderer.dispose();

      // Dispose of all geometries and materials
      scene.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });

      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  const currentSystem = EXOPLANET_SYSTEMS[currentSystemIndexRef.current];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(12,14,28,0.96)'
      }}
    >
      {/* 3D Container */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          width: '100%',
          height: '100%',
          position: 'relative'
        }}
      />

      {/* Close Button */}
      <button
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          background: 'rgba(126,184,247,0.15)',
          border: '1px solid rgba(126,184,247,0.3)',
          color: '#7eb8f7',
          width: 40,
          height: 40,
          borderRadius: 8,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          zIndex: 101
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(126,184,247,0.25)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'rgba(126,184,247,0.15)';
        }}
      >
        ✕
      </button>

      {/* System Selector - Top */}
      <div
        style={{
          position: 'fixed',
          top: 70,
          left: 16,
          right: 80,
          maxHeight: 60,
          zIndex: 100,
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingRight: 8,
          paddingBottom: 8
        }}
      >
        {EXOPLANET_SYSTEMS.map((system, idx) => (
          <button
            key={idx}
            onClick={() => window.switchExoplanetSystem(idx)}
            style={{
              padding: '8px 14px',
              background:
                currentSystemIndexRef.current === idx
                  ? 'rgba(126,184,247,0.3)'
                  : 'rgba(126,184,247,0.1)',
              border: `1px solid ${
                currentSystemIndexRef.current === idx
                  ? 'rgba(126,184,247,0.5)'
                  : 'rgba(126,184,247,0.2)'
              }`,
              color: '#7eb8f7',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 500,
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(126,184,247,0.2)';
              e.target.style.borderColor = 'rgba(126,184,247,0.4)';
            }}
            onMouseLeave={(e) => {
              if (currentSystemIndexRef.current === idx) {
                e.target.style.background = 'rgba(126,184,247,0.3)';
                e.target.style.borderColor = 'rgba(126,184,247,0.5)';
              } else {
                e.target.style.background = 'rgba(126,184,247,0.1)';
                e.target.style.borderColor = 'rgba(126,184,247,0.2)';
              }
            }}
          >
            {system.star}
          </button>
        ))}
      </div>

      {/* Info Panel - Desktop Sidebar */}
      {selectedPlanet && !isMobile && (
        <div
          style={{
            position: 'fixed',
            right: 16,
            bottom: 16,
            width: 320,
            maxHeight: 500,
            background: 'rgba(12,14,28,0.96)',
            border: '1px solid rgba(126,184,247,0.12)',
            borderRadius: 12,
            padding: 20,
            zIndex: 100,
            overflowY: 'auto',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
          }}
        >
          <h3 style={{ margin: '0 0 12px 0', color: '#7eb8f7', fontSize: 18 }}>
            {selectedPlanet.name}
          </h3>
          <p style={{ color: '#999', fontSize: 12, margin: '0 0 16px 0' }}>
            {selectedPlanet.system.star}
          </p>

          <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase' }}>
                Mass
              </div>
              <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
                {selectedPlanet.mass_earth.toFixed(2)}M⊕
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase' }}>
                Radius
              </div>
              <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
                {selectedPlanet.radius_earth.toFixed(2)}R⊕
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase' }}>
              Orbital Period
            </div>
            <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
              {selectedPlanet.period_days.toFixed(2)} days
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            {selectedPlanet.habitable ? (
              <div
                style={{
                  display: 'inline-block',
                  background: 'rgba(34,221,119,0.2)',
                  border: '1px solid #22dd77',
                  color: '#22dd77',
                  padding: '4px 8px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600
                }}
              >
                HABITABLE ZONE
              </div>
            ) : (
              <div
                style={{
                  display: 'inline-block',
                  background: 'rgba(245,158,11,0.2)',
                  border: '1px solid #f59e0b',
                  color: '#f59e0b',
                  padding: '4px 8px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600
                }}
              >
                NON-HABITABLE
              </div>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase' }}>
              Discovered
            </div>
            <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
              {selectedPlanet.year_discovered}
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(126,184,247,0.1)', paddingTop: 12 }}>
            <p style={{ color: '#aaa', fontSize: 12, lineHeight: 1.5, margin: 0 }}>
              {selectedPlanet.description}
            </p>
          </div>

          <button
            onClick={() => setSelectedPlanet(null)}
            style={{
              width: '100%',
              marginTop: 16,
              padding: '8px 12px',
              background: 'rgba(126,184,247,0.15)',
              border: '1px solid rgba(126,184,247,0.3)',
              color: '#7eb8f7',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 500
            }}
          >
            Close
          </button>
        </div>
      )}

      {/* Info Sheet - Mobile Bottom */}
      {selectedPlanet && isMobile && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            background: 'rgba(12,14,28,0.98)',
            borderTop: '1px solid rgba(126,184,247,0.12)',
            padding: 20,
            maxHeight: '60vh',
            overflowY: 'auto',
            borderRadius: '16px 16px 0 0'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', color: '#7eb8f7', fontSize: 18 }}>
                {selectedPlanet.name}
              </h3>
              <p style={{ color: '#999', fontSize: 12, margin: 0 }}>
                {selectedPlanet.system.star}
              </p>
            </div>
            <button
              onClick={() => setSelectedPlanet(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#7eb8f7',
                fontSize: 20,
                cursor: 'pointer',
                padding: 0
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase' }}>
                Mass
              </div>
              <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
                {selectedPlanet.mass_earth.toFixed(2)}M⊕
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase' }}>
                Radius
              </div>
              <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
                {selectedPlanet.radius_earth.toFixed(2)}R⊕
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase' }}>
                Orbital Period
              </div>
              <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
                {selectedPlanet.period_days.toFixed(2)} days
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase' }}>
                Discovered
              </div>
              <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
                {selectedPlanet.year_discovered}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            {selectedPlanet.habitable ? (
              <div
                style={{
                  display: 'inline-block',
                  background: 'rgba(34,221,119,0.2)',
                  border: '1px solid #22dd77',
                  color: '#22dd77',
                  padding: '4px 8px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600
                }}
              >
                HABITABLE ZONE
              </div>
            ) : (
              <div
                style={{
                  display: 'inline-block',
                  background: 'rgba(245,158,11,0.2)',
                  border: '1px solid #f59e0b',
                  color: '#f59e0b',
                  padding: '4px 8px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600
                }}
              >
                NON-HABITABLE
              </div>
            )}
          </div>

          <p style={{ color: '#aaa', fontSize: 12, lineHeight: 1.5, margin: 0 }}>
            {selectedPlanet.description}
          </p>
        </div>
      )}
    </div>
  );
};

export default ExoplanetExplorer;
