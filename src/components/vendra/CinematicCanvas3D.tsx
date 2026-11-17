import { useEffect, useRef } from "react";
import * as THREE from "three";

export function CinematicCanvas3D() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Geometria 3D Fluida & Iridescente (Torus Knot Escultural como NationFly)
    const geometry = new THREE.TorusKnotGeometry(1.6, 0.42, 160, 48, 2, 3);
    const material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x0ed7b5),
      emissive: new THREE.Color(0x062035),
      metalness: 0.85,
      roughness: 0.18,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      reflectivity: 0.95,
      iridescence: 0.95,
      iridescenceIOR: 1.5,
      transmission: 0.05,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Anel Orbital Externo Sutil de Precisão
    const ringGeometry = new THREE.TorusGeometry(3.1, 0.015, 16, 120);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.25,
    });
    const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
    ringMesh.rotation.x = Math.PI / 2.8;
    scene.add(ringMesh);

    // Partículas Atmosféricas Flutuantes em Profundidade 3D
    const particlesCount = 180;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particlesCount * 3);
    const colors = new Float32Array(particlesCount * 3);

    const c1 = new THREE.Color(0x22d3ee);
    const c2 = new THREE.Color(0x2dd4bf);
    const c3 = new THREE.Color(0x818cf8);

    for (let i = 0; i < particlesCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;

      const choice = Math.random();
      const col = choice < 0.4 ? c1 : choice < 0.7 ? c2 : c3;
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    particlesGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Iluminação Cinematográfica de Estúdio
    const ambientLight = new THREE.AmbientLight(0x081528, 2.0);
    scene.add(ambientLight);

    // Key Light Ciano/Teal Superior
    const keyLight = new THREE.DirectionalLight(0x22d3ee, 4.0);
    keyLight.position.set(5, 6, 4);
    scene.add(keyLight);

    // Rim Light Violeta/Índigo Inferior (Gera os reflexos metálicos iridescentes)
    const rimLight = new THREE.DirectionalLight(0x818cf8, 3.5);
    rimLight.position.set(-6, -4, -3);
    scene.add(rimLight);

    // Luz de Destaque Esmeralda
    const pointLight = new THREE.PointLight(0x10b981, 2.5, 12);
    pointLight.position.set(0, 0, 3);
    scene.add(pointLight);

    // Mouse Tracking Parallax Interativo
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetX = x * 1.2;
      targetY = y * 1.2;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // Handle Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // Render Loop com Física Suave
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Rotação contínua e suave do objeto 3D
      mesh.rotation.x = elapsedTime * 0.22;
      mesh.rotation.y = elapsedTime * 0.32;

      ringMesh.rotation.z = -elapsedTime * 0.08;
      particles.rotation.y = elapsedTime * 0.04;

      // Interpolação suave em direção ao mouse
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      mesh.position.x = mouseX * 0.8;
      mesh.position.y = -mouseY * 0.8;

      camera.position.x = mouseX * 0.4;
      camera.position.y = -mouseY * 0.4;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      ringGeometry.dispose();
      ringMaterial.dispose();
      particlesGeometry.dispose();
      particlesMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[460px] md:min-h-[580px] relative pointer-events-none"
    />
  );
}
