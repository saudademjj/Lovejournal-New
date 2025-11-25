import React from "react";

type Heart = {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  rotation: number;
};

const HeartsCanvas: React.FC = () => {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const heartsRef = React.useRef<Heart[]>([]);
  const animatingRef = React.useRef(false);

  const resize = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  React.useEffect(() => {
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [resize]);

  const animate = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const hearts = heartsRef.current;
    if (hearts.length === 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      animatingRef.current = false;
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hearts.forEach((h, idx) => {
      h.x += h.speedX;
      h.y += h.speedY;
      h.speedY += 0.35;
      h.opacity -= 0.012;

      ctx.save();
      ctx.translate(h.x, h.y);
      ctx.rotate((h.rotation * Math.PI) / 180);
      ctx.fillStyle = `rgba(255,0,60,${h.opacity})`;
      ctx.font = `${h.size}px serif`;
      ctx.fillText("❤", -h.size / 2, h.size / 2);
      ctx.restore();

      if (h.opacity <= 0) hearts.splice(idx, 1);
    });
    requestAnimationFrame(animate);
  }, []);

  const trigger = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const originX = window.innerWidth / 2;
    const originY = window.innerHeight - 80;
    for (let i = 0; i < 26; i++) {
      heartsRef.current.push({
        x: originX,
        y: originY,
        size: Math.random() * 20 + 6,
        speedX: (Math.random() - 0.5) * 12,
        speedY: Math.random() * -15 - 6,
        opacity: 1,
        rotation: Math.random() * 360,
      });
    }
    if (!animatingRef.current) {
      animatingRef.current = true;
      animate();
    }
  }, [animate]);

  React.useEffect(() => {
    (window as any).triggerHearts = trigger;
  }, [trigger]);

  return (
    <canvas
      id="hearts-canvas"
      ref={canvasRef}
      style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 995 }}
    />
  );
};

export default HeartsCanvas;
