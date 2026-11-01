import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeEyeballProps {
  size?: number;
  className?: string;
  onPoke?: () => void;
}

export function ThreeEyeball({ size = 260, className = '', onPoke }: ThreeEyeballProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isPokedRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || size;
    let height = container.clientHeight || size;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 5.5);

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 3. Eyeball Custom Shader Material
    const eyeUniforms = {
      uTime: { value: 0 },
      uOpacity: { value: 1.0 },
      uPupil: { value: 0.16 },
    };

    const eyeMaterial = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: eyeUniforms,
      vertexShader: `
        varying vec3 vP;
        varying vec3 vN;
        varying vec3 vV;

        void main() {
          vP = normalize(position);
          vN = normalize(normalMatrix * normal);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vV = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uOpacity;
        uniform float uPupil;
        varying vec3 vP;
        varying vec3 vN;
        varying vec3 vV;

        vec3 hue(float h) {
          return clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
        }

        void main() {
          float r = length(vP.xy);
          float front = step(0.0, vP.z);
          float a = atan(vP.y, vP.x);

          // Sclera with procedural pulsating veins
          vec3 col = vec3(0.42, 0.36, 0.42);
          float vein = pow(abs(sin(a * 7.0 + sin(r * 14.0 + uTime * 0.6) * 1.5)), 40.0) * smoothstep(0.55, 0.95, r);
          col = mix(col, vec3(1.0, 0.1, 0.45), vein * 0.8 + (1.0 - front) * 0.3);

          // Iris
          float iris = 0.46;
          if (front > 0.5 && r < iris) {
            float stri = 0.5 + 0.5 * sin(a * 38.0 + sin(r * 30.0 - uTime * 2.0) * 2.0);
            vec3 ic = hue(fract(a / 6.2831 + uTime * 0.08 + r * 0.8));
            ic = mix(ic * 0.6, ic, stri);
            float ring = smoothstep(iris - 0.05, iris, r);
            col = mix(ic * 0.75, vec3(0.05, 0.0, 0.1), ring);
            float pupil = 1.0 - smoothstep(uPupil - 0.02, uPupil, r);
            col = mix(col, vec3(0.0), pupil);

            // Specular glint
            float gl = 1.0 - smoothstep(0.0, 0.07, length(vP.xy - vec2(-0.12, 0.14)));
            col += vec3(2.5) * gl;
          }

          // Cyberpunk neon fresnel glow on edges
          float fres = pow(1.0 - max(dot(vN, vV), 0.0), 3.0);
          col += vec3(1.0, 0.2, 0.9) * fres * 1.3;
          gl_FragColor = vec4(col, uOpacity);
        }
      `,
    });

    const eyeGeometry = new THREE.SphereGeometry(1.6, 64, 64);
    const eyeMesh = new THREE.Mesh(eyeGeometry, eyeMaterial);
    scene.add(eyeMesh);

    // 4. Mouse Tracking & Target Rotation
    const targetRotation = { x: 0, y: 0 };
    let pokeTime = 0;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const ndcX = (e.clientX - centerX) / (window.innerWidth * 0.5);
      const ndcY = (e.clientY - centerY) / (window.innerHeight * 0.5);

      // Clamped look angles
      targetRotation.y = Math.max(-0.85, Math.min(0.85, ndcX * 0.8));
      targetRotation.x = Math.max(-0.65, Math.min(0.65, ndcY * 0.6));
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // Click to poke
    const onContainerClick = () => {
      pokeTime = performance.now() + 350;
      isPokedRef.current = true;
      if (onPoke) onPoke();
    };

    container.addEventListener('click', onContainerClick);

    // 5. Animation Loop with Lerp & Blinking
    let rafId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();
      eyeUniforms.uTime.value = elapsedTime;

      // Dilate pupil slightly over time
      eyeUniforms.uPupil.value = 0.15 + 0.04 * Math.sin(elapsedTime * 1.8);

      // Smooth rotation towards target
      eyeMesh.rotation.y += (targetRotation.y - eyeMesh.rotation.y) * 0.12;
      eyeMesh.rotation.x += (targetRotation.x - eyeMesh.rotation.x) * 0.12;

      // Gentle floating bob
      eyeMesh.position.y = Math.sin(elapsedTime * 1.4) * 0.12;

      // Natural blink every ~4 seconds or on click/poke
      const isBlinkingTime = (elapsedTime % 4.2) < 0.14 || performance.now() < pokeTime;
      const targetScaleY = isBlinkingTime ? 0.08 : 1.0;
      eyeMesh.scale.y += (targetScaleY - eyeMesh.scale.y) * 0.45;

      // Slight scale pulse on poke
      const pokeScale = performance.now() < pokeTime ? 1.15 : 1.0;
      eyeMesh.scale.x += (pokeScale - eyeMesh.scale.x) * 0.2;
      eyeMesh.scale.z += (pokeScale - eyeMesh.scale.z) * 0.2;

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    // Resize handler
    const onResize = () => {
      if (!container) return;
      width = container.clientWidth || size;
      height = container.clientHeight || size;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('click', onContainerClick);
      renderer.dispose();
      eyeGeometry.dispose();
      eyeMaterial.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [size, onPoke]);

  return (
    <div
      ref={containerRef}
      className={`eyeball-wrapper ${className}`}
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'inline-block',
        cursor: 'pointer',
      }}
      data-yolo="eyeball"
      title="Click to poke the eyeball!"
    >
      <div className="eyeball-bracket-tag" aria-hidden="true">
        <span>eyeball 0.99</span>
        <small>click to poke</small>
      </div>
    </div>
  );
}

