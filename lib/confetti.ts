import confetti from 'canvas-confetti';

/**
 * Trigger success confetti animation with pond0x theme colors
 */
export function triggerSuccessConfetti() {
  const colors = [
    '#4a7c59', // lily-green
    '#8bc49f', // lily-bright
    '#f0c674', // gold-light
    '#f8c8dc', // pink-soft
    '#4a8fb8', // pond-bright
  ];

  const duration = 2000;
  const animationEnd = Date.now() + duration;
  const defaults = {
    startVelocity: 30,
    spread: 360,
    ticks: 60,
    zIndex: 999,
    colors
  };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);

    // Create confetti from multiple positions
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
    });
  }, 250);
}

/**
 * Trigger a simple quick confetti burst
 */
export function triggerQuickConfetti() {
  const colors = ['#4a7c59', '#8bc49f', '#f0c674', '#f8c8dc'];

  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors,
    ticks: 200,
    gravity: 1.2,
    scalar: 1.2
  });
}

/**
 * Trigger confetti from a specific element
 */
export function triggerConfettiFrom(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;

  const colors = ['#4a7c59', '#8bc49f', '#f0c674', '#f8c8dc'];

  confetti({
    particleCount: 50,
    spread: 60,
    origin: { x, y },
    colors,
    ticks: 150,
    gravity: 1
  });
}
