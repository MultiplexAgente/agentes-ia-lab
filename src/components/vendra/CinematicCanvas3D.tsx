import { useEffect, useRef } from "react";
import * as THREE from "three";

export function CinematicCanvas3D() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    const container = containerRef.current;
    let width = container.clientWidth || 600;
    let height = container.clientHeight || 540;
    if (width < 280) width = 360;
    if (height < 250) height = 440;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.2);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // =========================================================================
    // 1. ESCULTURA 3D PRINCIPAL: FITA METÁLICA IRIDESCENTE FLUIDA (ESTILO NATIONFLY)
    // =========================================================================
    const torusKnotGeo = new THREE.TorusKnotGeometry(1.58, 0.48, 220, 64, 2, 3);
    const torusKnotMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x6366f1), // base índigo
      emissive: new THREE.Color(0x130a2a),
      metalness: 0.96,
      roughness: 0.12,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      reflectivity: 1.0,
      iridescence: 1.0,
      iridescenceIOR: 1.65,
      iridescenceThicknessRange: [120, 420],
      transmission: 0.04,
    });
    const mainMesh = new THREE.Mesh(torusKnotGeo, torusKnotMat);
    scene.add(mainMesh);

    // =========================================================================
    // 2. ESFERA SATÉLITE CROMADA FLUTUANTE (ORBITA A ESCULTURA)
    // =========================================================================
    const sphereGeo = new THREE.SphereGeometry(0.24, 32, 32);
    const sphereMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xffffff),
      metalness: 1.0,
      roughness: 0.06,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
    });
    const satelliteSphere = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(satelliteSphere);

    // =========================================================================
    // 3. PILARES VERTICAIS ESCUROS EM VIDRO DE ESTÚDIO (BACKGROUND NATIONFLY)
    // =========================================================================
    const pillarsGroup = new THREE.Group();
    const pillarMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x0a0c1a),
      emissive: new THREE.Color(0x050611),
      roughness: 0.45,
      metalness: 0.5,
      transmission: 0.4,
      transparent: true,
      opacity: 0.5,
    });

    const pGeo1 = new THREE.CylinderGeometry(0.38, 0.38, 5.0, 32);
    const pMesh1 = new THREE.Mesh(pGeo1, pillarMat);
    pMesh1.position.set(0.1, 0.4, -1.8);
    pillarsGroup.add(pMesh1);

    const pGeo2 = new THREE.CylinderGeometry(0.28, 0.28, 4.2, 32);
    const pMesh2 = new THREE.Mesh(pGeo2, pillarMat);
    pMesh2.position.set(-1.0, 0.1, -2.1);
    pillarsGroup.add(pMesh2);

    const pGeo3 = new THREE.CylinderGeometry(0.3, 0.3, 4.6, 32);
    const pMesh3 = new THREE.Mesh(pGeo3, pillarMat);
    pMesh3.position.set(1.15, 0.3, -2.0);
    pillarsGroup.add(pMesh3);

    scene.add(pillarsGroup);

    // =========================================================================
    // 4. ANÉIS ORBITAIS TECNOLÓGICOS ULTRA-FINOS
    // =========================================================================
    const ringGroup = new THREE.Group();

    const ringGeo1 = new THREE.TorusGeometry(2.9, 0.012, 16, 120);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x818cf8,
      transparent: true,
      opacity: 0.3,
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 2.5;
    ringGroup.add(ring1);

    const ringGeo2 = new THREE.TorusGeometry(2.5, 0.008, 16, 100);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.25,
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.y = Math.PI / 3;
    ringGroup.add(ring2);

    scene.add(ringGroup);

    // =========================================================================
    // 5. POEIRA ESTELAR ATMOSFÉRICA EM PROFUNDIDADE
    // =========================================================================
    const particlesCount = 160;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particlesCount * 3);
    const colors = new Float32Array(particlesCount * 3);

    const cCyan = new THREE.Color(0x06b6d4);
    const cViolet = new THREE.Color(0xa855f7);
    const cWhite = new THREE.Color(0xffffff);

    for (let i = 0; i < particlesCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;

      const rnd = Math.random();
      const col = rnd < 0.45 ? cCyan : rnd < 0.8 ? cViolet : cWhite;
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    particlesGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.038,
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // =========================================================================
    // 6. ILUMINAÇÃO DE ESTÚDIO CINEMATOGRÁFICA MULTICOLOR
    // =========================================================================
    const ambientLight = new THREE.AmbientLight(0x09071b, 2.2);
    scene.add(ambientLight);

    // Key Light Violeta / Roxo
    const keyLight = new THREE.DirectionalLight(0x8b5cf6, 5.0);
    keyLight.position.set(5, 5, 4.5);
    scene.add(keyLight);

    // Rim Light Ciano / Azul Elétrico
    const rimLight = new THREE.DirectionalLight(0x06b6d4, 4.5);
    rimLight.position.set(-5.5, -3, -3.5);
    scene.add(rimLight);

    // Luz de Destaque Magenta / Pink Iridescente
    const pinkFill = new THREE.PointLight(0xec4899, 3.8, 12);
    pinkFill.position.set(2, -3.5, 3.8);
    scene.add(pinkFill);

    // Luz Suave Superior de Contorno
    const topLight = new THREE.DirectionalLight(0xe0f2fe, 2.8);
    topLight.position.set(0, 6, -2);
    scene.add(topLight);

    // =========================================================================
    // 7. MOUSE TRACKING & PARALLAX SUAVE
    // =========================================================================
    let targetX = 0;
    let targetY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetX = x * 1.2;
      targetY = y * 1.2;
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });

    // Handle Resize
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 600;
      const h = container.clientHeight || 540;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    };

    window.addEventListener("resize", onResize);

    // =========================================================================
    // 8. RENDER LOOP
    // =========================================================================
    let animId: number;
    const clock = new THREE.Clock();

    const renderLoop = () => {
      animId = requestAnimationFrame(renderLoop);
      const elapsed = clock.getElapsedTime();

      // Rotação suave da escultura fluida
      mainMesh.rotation.x = elapsed * 0.22;
      mainMesh.rotation.y = elapsed * 0.3;

      // Órbita da esfera satélite
      const orbitRadius = 2.4;
      satelliteSphere.position.x = Math.cos(elapsed * 0.6) * orbitRadius;
      satelliteSphere.position.y = Math.sin(elapsed * 0.45) * 1.1 + 0.3;
      satelliteSphere.position.z = Math.sin(elapsed * 0.6) * orbitRadius * 0.8;

      // Movimento lento dos anéis e partículas
      ringGroup.rotation.z = -elapsed * 0.06;
      ringGroup.rotation.y = elapsed * 0.04;
      particles.rotation.y = elapsed * 0.025;

      // Parallax Interpolado
      mouseX += (targetX - mouseX) * 0.04;
      mouseY += (targetY - mouseY) * 0.04;

      mainMesh.position.x = mouseX * 0.7;
      mainMesh.position.y = -mouseY * 0.7;

      camera.position.x = mouseX * 0.35;
      camera.position.y = -mouseY * 0.35;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    renderLoop();

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(animId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      torusKnotGeo.dispose();
      torusKnotMat.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
      pGeo1.dispose();
      pGeo2.dispose();
      pGeo3.dispose();
      pillarMat.dispose();
      ringGeo1.dispose();
      ringMat1.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
      particlesGeometry.dispose();
      particlesMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full relative" />;
}
