import React, { useRef, useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';

const MOON_TEXTURES = {
  color4k: 'https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_poles_4k.jpg',
  color8k: 'https://www.solarsystemscope.com/textures/download/8k_moon.jpg',
  color2k: 'https://www.solarsystemscope.com/textures/download/2k_moon.jpg',
  displacement: 'https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_16_uint.jpg',
};

const LunarFlyover = ({ open, onClose }) => {
  // ALL HOOKS DECLARED FIRST - CRITICAL FOR REACT RULES
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const moonRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const animationIdRef = useRef(null);
  const texturesRef = useRef({});
  const starsRef = useRef(null);

  const [isAutopilot, setIsAutopilot] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [altitude, setAltitude] = useState(107);
  const [coordinates, setCoordinates] = useState({ lat: 0, lon: 0 });
  const [speed, setSpeed] = useState(1680);

  const controlsRef = useRef({
    manualRotation: new THREE.Euler(0, 0, 0),
    mouseDown: false,
    previousMousePosition: { x: 0, y: 0 },
    targetAltitude: 107,
  });

  const isMobileRef = useRef(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));

  const loadTexture = useCallback(
    (url, onLoad) => {
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(
        url,
        (texture) => {
          texture.anisotropy = rendererRef.current?.capabilities?.maxAnisotropy || 1;
          onLoad(texture);
        },
        undefined,
        (error) => {
          console.warn(`Failed to load texture: ${url}`, error);
        }
      );
    },
    []
  );

  const initializeScene = useCallback(() => {
    if (!containerRef.current) return;

    const _isMobile = isMobileRef.current;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    // Camera setup - positioned close to lunar surface
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
    camera.position.set(0, 0, 107);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: !_isMobile,
      precision: 'highp',
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !_isMobile;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Moon sphere
    const segments = _isMobile ? 64 : 256;
    const moonGeometry = new THREE.SphereGeometry(100, segments, segments);
    const moonMaterial = new THREE.MeshStandardMaterial({
      color: 0xaaaaaa,
      roughness: 0.95,
      metalness: 0.0,
    });
    const moon = new THREE.Mesh(moonGeometry, moonMaterial);
    moon.castShadow = true;
    moon.receiveShadow = true;
    scene.add(moon);
    moonRef.current = moon;
    texturesRef.current.moonMaterial = moonMaterial;

    // Lighting
    const sunLight = new THREE.DirectionalLight(0xffd699, 2.5);
    sunLight.position.set(150, 100, 150);
    sunLight.castShadow = !_isMobile;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.camera.left = -200;
    sunLight.shadow.camera.right = 200;
    sunLight.shadow.camera.top = 200;
    sunLight.shadow.camera.bottom = -200;
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
    scene.add(ambientLight);

    // Earthshine (subtle light from the dark side)
    const earthshineLight = new THREE.DirectionalLight(0x4488cc, 0.15);
    earthshineLight.position.set(-150, -50, -150);
    scene.add(earthshineLight);

    // Stars background
    const starCount = _isMobile ? 1000 : 3000;
    const starsGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      const radius = 500 + Math.random() * 200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      starPositions[i] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i + 1] = radius * Math.cos(phi);
      starPositions[i + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.5,
      sizeAttenuation: true,
    });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
    starsRef.current = stars;

    // Load textures progressively
    loadTexture(MOON_TEXTURES.color2k, (texture) => {
      moonMaterial.map = texture;
      moonMaterial.needsUpdate = true;
      texturesRef.current.color2k = texture;
    });

    loadTexture(MOON_TEXTURES.color4k, (texture) => {
      moonMaterial.map = texture;
      moonMaterial.needsUpdate = true;
      texturesRef.current.color4k = texture;
    });

    if (!_isMobile) {
      loadTexture(MOON_TEXTURES.color8k, (texture) => {
        moonMaterial.map = texture;
        moonMaterial.needsUpdate = true;
        texturesRef.current.color8k = texture;
      });
    }

    loadTexture(MOON_TEXTURES.displacement, (texture) => {
      moonMaterial.displacementMap = texture;
      moonMaterial.displacementScale = _isMobile ? 1.5 : 2.5;
      moonMaterial.needsUpdate = true;
      texturesRef.current.displacement = texture;
    });

    // Handle window resize
    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [loadTexture]);

  const setupControls = useCallback(() => {
    const handleMouseDown = (e) => {
      controlsRef.current.mouseDown = true;
      controlsRef.current.previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e) => {
      if (!controlsRef.current.mouseDown || isAutopilot) return;

      const deltaX = e.clientX - controlsRef.current.previousMousePosition.x;
      const deltaY = e.clientY - controlsRef.current.previousMousePosition.y;

      controlsRef.current.manualRotation.y += deltaX * 0.003;
      controlsRef.current.manualRotation.x += deltaY * 0.003;

      controlsRef.current.previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      controlsRef.current.mouseDown = false;
    };

    const handleWheel = (e) => {
      if (isAutopilot) return;
      e.preventDefault();

      const delta = e.deltaY > 0 ? 0.5 : -0.5;
      controlsRef.current.targetAltitude = Math.max(
        103,
        Math.min(115, controlsRef.current.targetAltitude + delta)
      );
    };

    const handleKeyDown = (e) => {
      const speed = 0.02;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          controlsRef.current.manualRotation.x -= speed;
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          controlsRef.current.manualRotation.x += speed;
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          controlsRef.current.manualRotation.y -= speed;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          controlsRef.current.manualRotation.y += speed;
          break;
        case ' ':
          e.preventDefault();
          setIsPaused((prev) => !prev);
          break;
        default:
          break;
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAutopilot]);

  const animate = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    animationIdRef.current = requestAnimationFrame(animate);

    const clock = clockRef.current;
    let time = clock.getElapsedTime();

    if (isPaused) {
      time = clockRef.current.elapsedTime;
    } else {
      clockRef.current.tick();
    }

    const camera = cameraRef.current;
    const orbitSpeed = 0.015;
    const angle = time * orbitSpeed;

    if (isAutopilot) {
      // Undulating altitude
      const altitudeVariation = 5 + Math.sin(time * 0.3) * 3 + Math.sin(time * 0.7) * 1.5;
      const newAltitude = 107 + altitudeVariation;
      setAltitude(Math.round((newAltitude - 100) * 100) / 100);

      // Orbit position
      camera.position.x = Math.cos(angle) * newAltitude;
      camera.position.z = Math.sin(angle) * newAltitude;
      camera.position.y = Math.sin(time * 0.2) * 8;

      // Look ahead along orbit path + slightly down
      const lookAheadAngle = angle + 0.15;
      const lookTarget = new THREE.Vector3(
        Math.cos(lookAheadAngle) * 100,
        Math.sin(time * 0.2 + 0.3) * 5,
        Math.sin(lookAheadAngle) * 100
      );
      camera.lookAt(lookTarget);

      // Gentle banking
      camera.rotation.z = Math.sin(time * 0.4) * 0.05;
    } else {
      // Manual control - smooth altitude adjustment
      const altitudeDelta = controlsRef.current.targetAltitude - altitude;
      const newAltitude = altitude + altitudeDelta * 0.05;
      setAltitude(Math.round(newAltitude * 100) / 100);

      // Position camera based on manual rotation and altitude
      const distance = newAltitude;
      const phi = Math.PI / 2 - controlsRef.current.manualRotation.x;
      const theta = controlsRef.current.manualRotation.y;

      camera.position.x = distance * Math.sin(phi) * Math.cos(theta);
      camera.position.y = distance * Math.cos(phi);
      camera.position.z = distance * Math.sin(phi) * Math.sin(theta);

      camera.lookAt(0, 0, 0);
    }

    // Update coordinates
    const camDir = camera.position.clone().normalize();
    const lat = THREE.MathUtils.radToDeg(Math.asin(camDir.y));
    const lon = THREE.MathUtils.radToDeg(Math.atan2(camDir.z, camDir.x));
    setCoordinates({ lat: Math.round(lat * 100) / 100, lon: Math.round(lon * 100) / 100 });

    // Render
    rendererRef.current.render(sceneRef.current, camera);
  }, [isAutopilot, isPaused, altitude]);

  useEffect(() => {
    if (!open) return;

    const cleanupResize = initializeScene();
    const cleanupControls = setupControls();

    animate();

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (cleanupResize) cleanupResize();
      if (cleanupControls) cleanupControls();

      if (rendererRef.current) {
        rendererRef.current.forceContextLoss();
        rendererRef.current.dispose();
      }

      if (sceneRef.current) {
        sceneRef.current.traverse((child) => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      }

      if (containerRef.current?.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }
    };
  }, [open, initializeScene, setupControls, animate]);

  if (!open) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 50,
        overflow: 'hidden',
        background: '#000000',
      }}
    >
      {/* HUD Overlay */}
      <style>{`
        @keyframes hudPulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 0.9; }
        }

        .lunar-hud-title {
          animation: hudPulse 3s ease-in-out infinite;
        }
      `}</style>

      {/* Top-left: Title */}
      <div
        className="lunar-hud-title"
        style={{
          position: 'fixed',
          top: '24px',
          left: '24px',
          fontFamily: 'monospace',
          fontSize: '12px',
          color: 'rgba(126,184,247,0.7)',
          fontWeight: 'bold',
          letterSpacing: '2px',
          zIndex: 51,
        }}
      >
        LUNAR FLYOVER
      </div>

      {/* Top-right: Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          width: '32px',
          height: '32px',
          border: 'none',
          background: 'rgba(126,184,247,0.15)',
          color: 'rgba(126,184,247,0.7)',
          fontSize: '18px',
          cursor: 'pointer',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          backdropFilter: 'blur(10px)',
          zIndex: 51,
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(126,184,247,0.25)';
          e.target.style.color = 'rgba(126,184,247,0.9)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'rgba(126,184,247,0.15)';
          e.target.style.color = 'rgba(126,184,247,0.7)';
        }}
      >
        ×
      </button>

      {/* Bottom HUD strip */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '60px',
          background: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingLeft: '24px',
          paddingRight: '24px',
          zIndex: 51,
          borderTop: '1px solid rgba(126,184,247,0.1)',
        }}
      >
        {/* Bottom-left: Altitude */}
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: '11px',
            color: 'rgba(126,184,247,0.7)',
            letterSpacing: '1px',
          }}
        >
          ALT {(altitude * 8.848).toFixed(1)} km
        </div>

        {/* Bottom-center: Coordinates */}
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: '11px',
            color: 'rgba(126,184,247,0.7)',
            letterSpacing: '1px',
          }}
        >
          LAT {coordinates.lat.toFixed(2)}° LON {coordinates.lon.toFixed(2)}°
        </div>

        {/* Bottom-right: Speed */}
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: '11px',
            color: 'rgba(126,184,247,0.7)',
            letterSpacing: '1px',
          }}
        >
          ORBITAL VEL {speed} m/s
        </div>
      </div>

      {/* Autopilot & Pause controls */}
      <div
        style={{
          position: 'fixed',
          bottom: '70px',
          right: '24px',
          display: 'flex',
          gap: '12px',
          zIndex: 51,
        }}
      >
        <button
          onClick={() => setIsPaused((prev) => !prev)}
          style={{
            fontFamily: 'monospace',
            fontSize: '11px',
            padding: '8px 12px',
            border: '1px solid rgba(126,184,247,0.3)',
            background: isPaused ? 'rgba(126,184,247,0.2)' : 'rgba(126,184,247,0.05)',
            color: 'rgba(126,184,247,0.7)',
            cursor: 'pointer',
            borderRadius: '4px',
            transition: 'all 0.2s ease',
            backdropFilter: 'blur(10px)',
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(126,184,247,0.15)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = isPaused ? 'rgba(126,184,247,0.2)' : 'rgba(126,184,247,0.05)';
          }}
        >
          {isPaused ? 'RESUME' : 'PAUSE'}
        </button>

        <button
          onClick={() => setIsAutopilot((prev) => !prev)}
          style={{
            fontFamily: 'monospace',
            fontSize: '11px',
            padding: '8px 12px',
            border: '1px solid rgba(126,184,247,0.3)',
            background: isAutopilot ? 'rgba(126,184,247,0.2)' : 'rgba(126,184,247,0.05)',
            color: 'rgba(126,184,247,0.7)',
            cursor: 'pointer',
            borderRadius: '4px',
            transition: 'all 0.2s ease',
            backdropFilter: 'blur(10px)',
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(126,184,247,0.15)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = isAutopilot ? 'rgba(126,184,247,0.2)' : 'rgba(126,184,247,0.05)';
          }}
        >
          {isAutopilot ? 'AUTO ON' : 'MANUAL'}
        </button>
      </div>
    </div>
  );
};

export default LunarFlyover;
