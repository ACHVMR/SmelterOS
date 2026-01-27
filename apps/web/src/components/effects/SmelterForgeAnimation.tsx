"use client";

import React, { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  type: "molten" | "spark" | "ember";
  targetX?: number;
  targetY?: number;
  forging?: boolean;
}

interface Ingot {
  x: number;
  y: number;
  width: number;
  height: number;
  glow: number;
  glowDir: number;
  formed: number;
  circuits: { x: number; y: number; w: number }[];
}

export function SmelterForgeAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const ingotsRef = useRef<Ingot[]>([]);
  const pourStreamRef = useRef({ x: 0, y: 0, active: true });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initIngots();
    };

    const initIngots = () => {
      const ingots: Ingot[] = [];
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2 + 100;
      
      // Main central ingot
      ingots.push({
        x: centerX - 120,
        y: centerY - 40,
        width: 240,
        height: 80,
        glow: 0.8,
        glowDir: 1,
        formed: 0,
        circuits: generateCircuits(240, 80),
      });

      // Side ingots
      ingots.push({
        x: centerX - 280,
        y: centerY + 60,
        width: 120,
        height: 50,
        glow: 0.5,
        glowDir: 1,
        formed: 0,
        circuits: generateCircuits(120, 50),
      });

      ingots.push({
        x: centerX + 160,
        y: centerY + 60,
        width: 120,
        height: 50,
        glow: 0.6,
        glowDir: 1,
        formed: 0,
        circuits: generateCircuits(120, 50),
      });

      ingotsRef.current = ingots;
      pourStreamRef.current = { x: centerX, y: 0, active: true };
    };

    const generateCircuits = (w: number, h: number) => {
      const circuits: { x: number; y: number; w: number }[] = [];
      for (let i = 0; i < 8; i++) {
        circuits.push({
          x: Math.random() * (w - 40) + 10,
          y: Math.random() * (h - 10) + 5,
          w: Math.random() * 40 + 20,
        });
      }
      return circuits;
    };

    const spawnParticle = (type: "molten" | "spark" | "ember", x?: number, y?: number) => {
      const canvas = canvasRef.current!;
      const ingot = ingotsRef.current[0];
      
      if (type === "molten") {
        // Molten particles flow down from top
        const streamX = pourStreamRef.current.x + (Math.random() - 0.5) * 60;
        particlesRef.current.push({
          x: x ?? streamX,
          y: y ?? -10,
          vx: (Math.random() - 0.5) * 2,
          vy: Math.random() * 3 + 4,
          size: Math.random() * 4 + 2,
          life: 1,
          maxLife: 1,
          type: "molten",
          targetX: ingot.x + ingot.width / 2,
          targetY: ingot.y + ingot.height / 2,
          forging: false,
        });
      } else if (type === "spark") {
        // Sparks fly up from ingots
        const randomIngot = ingotsRef.current[Math.floor(Math.random() * ingotsRef.current.length)];
        particlesRef.current.push({
          x: randomIngot.x + Math.random() * randomIngot.width,
          y: randomIngot.y,
          vx: (Math.random() - 0.5) * 8,
          vy: -Math.random() * 6 - 2,
          size: Math.random() * 2 + 1,
          life: 1,
          maxLife: 1,
          type: "spark",
        });
      } else {
        // Embers float around
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: canvas.height + 10,
          vx: (Math.random() - 0.5) * 2,
          vy: -Math.random() * 2 - 0.5,
          size: Math.random() * 3 + 1,
          life: 1,
          maxLife: 1,
          type: "ember",
        });
      }
    };

    const updateParticles = () => {
      const particles = particlesRef.current;
      const ingot = ingotsRef.current[0];

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        if (p.type === "molten") {
          // Gravity and flow toward ingot
          p.vy += 0.15;
          
          // When near ingot, curve toward it
          if (p.y > ingot.y - 100 && p.targetX && p.targetY) {
            const dx = p.targetX - p.x;
            p.vx += dx * 0.01;
            p.forging = true;
          }

          p.x += p.vx;
          p.y += p.vy;

          // Check if particle hits ingot
          if (p.y > ingot.y && p.x > ingot.x && p.x < ingot.x + ingot.width) {
            // Absorbed by ingot - spawn sparks
            for (let j = 0; j < 3; j++) {
              spawnParticle("spark");
            }
            ingot.formed = Math.min(1, ingot.formed + 0.002);
            particles.splice(i, 1);
            continue;
          }

          // Remove if off screen
          if (p.y > canvas.height + 50) {
            particles.splice(i, 1);
            continue;
          }
        } else if (p.type === "spark") {
          p.vy += 0.2; // Gravity
          p.vx *= 0.98;
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 0.02;

          if (p.life <= 0 || p.y > canvas.height) {
            particles.splice(i, 1);
            continue;
          }
        } else if (p.type === "ember") {
          p.x += p.vx + Math.sin(Date.now() * 0.001 + i) * 0.5;
          p.y += p.vy;
          p.life -= 0.003;

          if (p.life <= 0 || p.y < -50) {
            particles.splice(i, 1);
            continue;
          }
        }
      }
    };

    const updateIngots = () => {
      ingotsRef.current.forEach((ingot) => {
        // Pulsing glow
        ingot.glow += 0.01 * ingot.glowDir;
        if (ingot.glow > 1) ingot.glowDir = -1;
        if (ingot.glow < 0.4) ingot.glowDir = 1;
      });
    };

    const drawPourStream = (ctx: CanvasRenderingContext2D) => {
      const stream = pourStreamRef.current;
      const ingot = ingotsRef.current[0];
      
      // Pour stream gradient
      const gradient = ctx.createLinearGradient(stream.x, 0, stream.x, ingot.y);
      gradient.addColorStop(0, "rgba(255, 200, 50, 0.9)");
      gradient.addColorStop(0.3, "rgba(255, 140, 20, 0.8)");
      gradient.addColorStop(0.7, "rgba(255, 80, 10, 0.6)");
      gradient.addColorStop(1, "rgba(255, 50, 0, 0.3)");

      // Main stream
      ctx.beginPath();
      ctx.moveTo(stream.x - 15, 0);
      ctx.quadraticCurveTo(
        stream.x + (Math.sin(Date.now() * 0.003) * 10),
        ingot.y / 2,
        ingot.x + ingot.width / 2,
        ingot.y
      );
      ctx.quadraticCurveTo(
        stream.x - (Math.sin(Date.now() * 0.003) * 10),
        ingot.y / 2,
        stream.x + 15,
        0
      );
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Glow around stream
      ctx.shadowColor = "#ff6a00";
      ctx.shadowBlur = 30;
      ctx.fill();
      ctx.shadowBlur = 0;
    };

    const drawIngot = (ctx: CanvasRenderingContext2D, ingot: Ingot) => {
      const { x, y, width, height, glow, circuits } = ingot;

      // Outer glow
      ctx.shadowColor = `rgba(255, 100, 0, ${glow})`;
      ctx.shadowBlur = 40;

      // Base ingot - dark metal
      const baseGradient = ctx.createLinearGradient(x, y, x, y + height);
      baseGradient.addColorStop(0, "#2a2a2a");
      baseGradient.addColorStop(0.5, "#1a1a1a");
      baseGradient.addColorStop(1, "#0a0a0a");

      ctx.fillStyle = baseGradient;
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, 8);
      ctx.fill();

      ctx.shadowBlur = 0;

      // Hot edge glow
      const edgeGradient = ctx.createLinearGradient(x, y + height - 15, x, y + height);
      edgeGradient.addColorStop(0, "transparent");
      edgeGradient.addColorStop(1, `rgba(255, 120, 20, ${glow * 0.8})`);
      
      ctx.fillStyle = edgeGradient;
      ctx.fillRect(x, y + height - 15, width, 15);

      // Circuit patterns (glowing traces)
      ctx.strokeStyle = `rgba(255, 140, 40, ${glow * 0.6})`;
      ctx.lineWidth = 2;
      circuits.forEach((c) => {
        ctx.beginPath();
        ctx.moveTo(x + c.x, y + c.y);
        ctx.lineTo(x + c.x + c.w, y + c.y);
        ctx.stroke();

        // Nodes
        ctx.fillStyle = `rgba(255, 180, 60, ${glow})`;
        ctx.beginPath();
        ctx.arc(x + c.x, y + c.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + c.x + c.w, y + c.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Top highlight
      ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
      ctx.fillRect(x + 5, y + 5, width - 10, 3);
    };

    const drawParticle = (ctx: CanvasRenderingContext2D, p: Particle) => {
      if (p.type === "molten") {
        // Molten particle - bright orange/yellow
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
        gradient.addColorStop(0, "rgba(255, 220, 100, 1)");
        gradient.addColorStop(0.5, "rgba(255, 140, 20, 0.8)");
        gradient.addColorStop(1, "rgba(255, 60, 0, 0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === "spark") {
        // Spark - small bright point with trail
        ctx.fillStyle = `rgba(255, 200, 100, ${p.life})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Trail
        ctx.strokeStyle = `rgba(255, 150, 50, ${p.life * 0.5})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 3, p.y - p.vy * 3);
        ctx.stroke();
      } else {
        // Ember - floating glow
        ctx.fillStyle = `rgba(255, 100, 30, ${p.life * 0.5})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const draw = () => {
      if (!ctx || !canvas) return;

      // Clear with dark background
      ctx.fillStyle = "#0a0a0f";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Ambient glow at bottom
      const ambientGlow = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height,
        0,
        canvas.width / 2,
        canvas.height,
        400
      );
      ambientGlow.addColorStop(0, "rgba(255, 80, 20, 0.15)");
      ambientGlow.addColorStop(1, "transparent");
      ctx.fillStyle = ambientGlow;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw pour stream
      drawPourStream(ctx);

      // Draw ingots
      ingotsRef.current.forEach((ingot) => drawIngot(ctx, ingot));

      // Draw particles
      particlesRef.current.forEach((p) => drawParticle(ctx, p));

      // Spawn new particles
      if (Math.random() < 0.4) spawnParticle("molten");
      if (Math.random() < 0.1) spawnParticle("spark");
      if (Math.random() < 0.05) spawnParticle("ember");

      // Update
      updateParticles();
      updateIngots();

      // Limit particles
      if (particlesRef.current.length > 300) {
        particlesRef.current = particlesRef.current.slice(-300);
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    window.addEventListener("resize", resize);
    resize();
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none bg-[#0a0a0f]"
    />
  );
}

export default SmelterForgeAnimation;
