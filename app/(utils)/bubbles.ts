"use client";

// Cyberpunk neon bubble animation
export function mountBubbles() {
  const canvas = document.getElementById('bubble-canvas') as HTMLCanvasElement | null;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const cvs: HTMLCanvasElement = canvas;

  function resize() {
    const { innerWidth: w, innerHeight: h } = window;
    cvs.width = w * dpr;
    cvs.height = h * dpr;
    cvs.style.width = w + "px";
    cvs.style.height = h + "px";
  }

  resize();
  window.addEventListener('resize', resize);

  // Cyberpunk neon particles - smaller, more numerous, glowing
  const particles = Array.from({ length: 40 }).map(() => ({
    x: Math.random() * cvs.width,
    y: Math.random() * cvs.height,
    r: (8 + Math.random() * 20) * dpr, // Smaller particles
    a: 0.3 + Math.random() * 0.4, // Moderate transparency
    dx: (-0.3 + Math.random() * 0.6) * dpr, // Slow drift
    dy: (-0.4 + Math.random() * 0.4) * dpr,
    colorType: Math.floor(Math.random() * 4), // 0: pink, 1: red, 2: rose, 3: light pink
    pulse: Math.random() * Math.PI * 2,
    pulseSpeed: 0.02 + Math.random() * 0.03
  }));

  let time = 0;

  function loop() {
    const { width, height } = cvs;
    const ctx2 = ctx as CanvasRenderingContext2D;

    // Clear with slight trail effect for smoother motion
    ctx2.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx2.fillRect(0, 0, width, height);

    time += 0.01;

    for (const p of particles) {
      // Pulsing size effect
      p.pulse += p.pulseSpeed;
      const pulseScale = 1 + Math.sin(p.pulse) * 0.15;
      const currentR = p.r * pulseScale;

      // Choose neon color based on type
      let color1, color2, shadowColor;
      switch (p.colorType) {
        case 0: // Deep Pink
          color1 = 'rgba(255, 20, 147, 0.8)';
          color2 = 'rgba(255, 20, 147, 0.1)';
          shadowColor = 'rgba(255, 20, 147, 0.5)';
          break;
        case 1: // Red
          color1 = 'rgba(255, 0, 0, 0.8)';
          color2 = 'rgba(255, 0, 0, 0.1)';
          shadowColor = 'rgba(255, 0, 0, 0.5)';
          break;
        case 2: // Rose
          color1 = 'rgba(255, 0, 110, 0.8)';
          color2 = 'rgba(255, 0, 110, 0.1)';
          shadowColor = 'rgba(255, 0, 110, 0.5)';
          break;
        default: // Hot Pink
          color1 = 'rgba(255, 105, 180, 0.8)';
          color2 = 'rgba(255, 105, 180, 0.1)';
          shadowColor = 'rgba(255, 105, 180, 0.5)';
      }

      ctx2.beginPath();
      ctx2.arc(p.x, p.y, currentR, 0, Math.PI * 2);

      // Neon gradient from center
      const grad = ctx2.createRadialGradient(
        p.x,
        p.y,
        0,
        p.x,
        p.y,
        currentR
      );

      grad.addColorStop(0, color1);
      grad.addColorStop(0.5, color2);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx2.fillStyle = grad;
      (ctx2 as any).globalAlpha = p.a;

      // Subtle glow effect
      ctx2.shadowBlur = 20 * dpr;
      ctx2.shadowColor = shadowColor;

      ctx2.fill();

      // Reset shadow
      ctx2.shadowBlur = 0;
      (ctx2 as any).globalAlpha = 1;

      // Gentle floating movement
      p.x += p.dx + Math.sin(time + p.pulse) * 0.2 * dpr;
      p.y += p.dy + Math.cos(time * 0.7 + p.pulse) * 0.2 * dpr;

      // Wrap around screen
      if (p.x < -currentR) p.x = width + currentR;
      if (p.x > width + currentR) p.x = -currentR;
      if (p.y < -currentR) p.y = height + currentR;
      if (p.y > height + currentR) p.y = -currentR;
    }

    requestAnimationFrame(loop);
  }

  loop();
}
