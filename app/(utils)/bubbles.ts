"use client";

// Dark outer space animation with stars and nebula
export function mountBubbles() {
  const canvas = document.getElementById('bubble-canvas') as HTMLCanvasElement | null;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const cvs: HTMLCanvasElement = canvas;

  // Stars array
  let stars: Array<{
    x: number;
    y: number;
    r: number;
    a: number;
    twinkle: number;
    twinkleSpeed: number;
  }> = [];

  // Nebula clouds
  let nebulae: Array<{
    x: number;
    y: number;
    r: number;
    colorType: number;
    a: number;
    pulse: number;
    pulseSpeed: number;
  }> = [];

  function resize() {
    const { innerWidth: w, innerHeight: h } = window;
    cvs.width = w * dpr;
    cvs.height = h * dpr;
    cvs.style.width = w + "px";
    cvs.style.height = h + "px";

    // Recreate stars on resize
    stars = Array.from({ length: 200 }).map(() => ({
      x: Math.random() * cvs.width,
      y: Math.random() * cvs.height,
      r: (0.5 + Math.random() * 1.5) * dpr,
      a: 0.3 + Math.random() * 0.7,
      twinkle: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.01 + Math.random() * 0.03
    }));

    // Recreate nebulae on resize
    nebulae = Array.from({ length: 8 }).map(() => ({
      x: Math.random() * cvs.width,
      y: Math.random() * cvs.height,
      r: (100 + Math.random() * 200) * dpr,
      colorType: Math.floor(Math.random() * 4),
      a: 0.03 + Math.random() * 0.05,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.005 + Math.random() * 0.01
    }));
  }

  resize();
  window.addEventListener('resize', resize);

  let time = 0;

  function loop() {
    const { width, height } = cvs;
    const ctx2 = ctx as CanvasRenderingContext2D;

    // Deep space background gradient
    const bgGrad = ctx2.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#000005');
    bgGrad.addColorStop(0.3, '#020108');
    bgGrad.addColorStop(0.6, '#050210');
    bgGrad.addColorStop(1, '#020005');
    ctx2.fillStyle = bgGrad;
    ctx2.fillRect(0, 0, width, height);

    time += 0.01;

    // Draw nebula clouds (behind stars)
    for (const n of nebulae) {
      n.pulse += n.pulseSpeed;
      const pulseScale = 1 + Math.sin(n.pulse) * 0.1;
      const currentR = n.r * pulseScale;

      let color1, color2;
      switch (n.colorType) {
        case 0: // Purple nebula
          color1 = `rgba(100, 50, 150, ${n.a})`;
          color2 = 'rgba(100, 50, 150, 0)';
          break;
        case 1: // Blue nebula
          color1 = `rgba(30, 80, 150, ${n.a})`;
          color2 = 'rgba(30, 80, 150, 0)';
          break;
        case 2: // Cyan nebula
          color1 = `rgba(20, 100, 120, ${n.a})`;
          color2 = 'rgba(20, 100, 120, 0)';
          break;
        default: // Deep red nebula
          color1 = `rgba(80, 20, 40, ${n.a})`;
          color2 = 'rgba(80, 20, 40, 0)';
      }

      const grad = ctx2.createRadialGradient(n.x, n.y, 0, n.x, n.y, currentR);
      grad.addColorStop(0, color1);
      grad.addColorStop(0.5, color2);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx2.fillStyle = grad;
      ctx2.fillRect(n.x - currentR, n.y - currentR, currentR * 2, currentR * 2);
    }

    // Draw twinkling stars
    for (const s of stars) {
      s.twinkle += s.twinkleSpeed;
      const twinkleAlpha = s.a * (0.5 + Math.sin(s.twinkle) * 0.5);

      ctx2.beginPath();
      ctx2.arc(s.x, s.y, s.r, 0, Math.PI * 2);

      // Star glow
      const starGrad = ctx2.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 3);
      starGrad.addColorStop(0, `rgba(255, 255, 255, ${twinkleAlpha})`);
      starGrad.addColorStop(0.3, `rgba(200, 220, 255, ${twinkleAlpha * 0.5})`);
      starGrad.addColorStop(1, 'rgba(200, 220, 255, 0)');

      ctx2.fillStyle = starGrad;
      ctx2.fill();

      // Bright center
      ctx2.beginPath();
      ctx2.arc(s.x, s.y, s.r * 0.5, 0, Math.PI * 2);
      ctx2.fillStyle = `rgba(255, 255, 255, ${twinkleAlpha})`;
      ctx2.fill();
    }

    // Occasional shooting star
    if (Math.random() < 0.002) {
      const shootX = Math.random() * width;
      const shootY = Math.random() * height * 0.5;
      const shootLength = (50 + Math.random() * 100) * dpr;

      const shootGrad = ctx2.createLinearGradient(shootX, shootY, shootX + shootLength, shootY + shootLength * 0.5);
      shootGrad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      shootGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx2.strokeStyle = shootGrad;
      ctx2.lineWidth = 2 * dpr;
      ctx2.beginPath();
      ctx2.moveTo(shootX, shootY);
      ctx2.lineTo(shootX + shootLength, shootY + shootLength * 0.5);
      ctx2.stroke();
    }

    requestAnimationFrame(loop);
  }

  loop();
}
