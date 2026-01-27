"use client";

import React, { useEffect, useRef, useState } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export function FlameDotsAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    // Particle system
    const particles: Particle[] = [];
    const colors = ["#ff6b35", "#ff8c42", "#ffa500", "#ffcc00", "#00d4ff", "#00ff88"];
    
    // Create grid of dots (MS-DOS style)
    const dotGrid: { x: number; y: number; active: boolean; color: string }[] = [];
    const gridSize = 8;
    const cols = Math.floor(canvas.offsetWidth / gridSize);
    const rows = Math.floor(canvas.offsetHeight / gridSize);
    
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        dotGrid.push({
          x: i * gridSize + gridSize / 2,
          y: j * gridSize + gridSize / 2,
          active: Math.random() > 0.7,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    }

    // Animation variables
    let time = 0;
    const centerX = canvas.offsetWidth / 2;
    const centerY = canvas.offsetHeight / 2;

    function spawnFlameParticle() {
      const angle = Math.random() * Math.PI * 2;
      const radius = 50 + Math.random() * 100;
      
      particles.push({
        x: centerX + Math.cos(angle) * radius * 0.3,
        y: centerY + 80,
        vx: (Math.random() - 0.5) * 2,
        vy: -2 - Math.random() * 3,
        life: 1,
        maxLife: 60 + Math.random() * 40,
        size: 2 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * 3)], // Orange/yellow for flames
      });
    }

    function animate() {
      if (!ctx || !canvas) return;
      
      ctx.fillStyle = "rgba(10, 10, 10, 0.15)";
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      time += 0.02;

      // Draw MS-DOS style grid dots
      dotGrid.forEach((dot, i) => {
        const wave = Math.sin(time + dot.x * 0.01 + dot.y * 0.01) * 0.5 + 0.5;
        const distFromCenter = Math.sqrt(
          Math.pow(dot.x - centerX, 2) + Math.pow(dot.y - centerY, 2)
        );
        const pulse = Math.sin(time * 2 - distFromCenter * 0.02) * 0.5 + 0.5;
        
        if (dot.active || pulse > 0.7) {
          ctx.fillStyle = `rgba(${
            dot.color === "#ff6b35" ? "255, 107, 53" :
            dot.color === "#00d4ff" ? "0, 212, 255" :
            dot.color === "#00ff88" ? "0, 255, 136" :
            "255, 200, 0"
          }, ${wave * 0.3 + pulse * 0.4})`;
          ctx.fillRect(dot.x - 1, dot.y - 1, 2, 2);
        }
      });

      // Spawn flame particles
      if (Math.random() > 0.5) {
        spawnFlameParticle();
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.02; // Slight downward pull, but flames go up
        p.life--;

        const lifeRatio = p.life / p.maxLife;
        
        // Color transition: white -> yellow -> orange -> red -> smoke
        let r, g, b;
        if (lifeRatio > 0.8) {
          r = 255; g = 255; b = 200;
        } else if (lifeRatio > 0.5) {
          r = 255; g = 200 - (0.8 - lifeRatio) * 300; b = 50;
        } else if (lifeRatio > 0.2) {
          r = 255 - (0.5 - lifeRatio) * 200; g = 100; b = 50;
        } else {
          r = 100; g = 100; b = 100;
        }

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${lifeRatio * 0.8})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * lifeRatio, 0, Math.PI * 2);
        ctx.fill();

        if (p.life <= 0) {
          particles.splice(i, 1);
        }
      }

      // Draw glowing center (where logo would be)
      const gradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, 150
      );
      gradient.addColorStop(0, "rgba(255, 165, 0, 0.3)");
      gradient.addColorStop(0.5, "rgba(255, 100, 0, 0.1)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener("resize", resize);
    };
  }, [mounted]);

  if (!mounted) {
    return <div className="absolute inset-0 bg-[#0a0a0a]" />;
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full bg-[#0a0a0a]"
    />
  );
}
