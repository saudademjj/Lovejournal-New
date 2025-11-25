import React from "react";

const CursorGlow: React.FC = () => {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = React.useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  React.useEffect(() => {
    if (!ref.current || prefersReducedMotion) return;
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let currentX = mouseX;
    let currentY = mouseY;
    const handleMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    const animate = () => {
      currentX += (mouseX - currentX) * 0.12;
      currentY += (mouseY - currentY) * 0.12;
      if (ref.current) {
        ref.current.style.left = `${currentX}px`;
        ref.current.style.top = `${currentY}px`;
      }
      requestAnimationFrame(animate);
    };
    document.addEventListener("mousemove", handleMove);
    animate();
    return () => document.removeEventListener("mousemove", handleMove);
  }, [prefersReducedMotion]);

  return <div className="cursor-glow" id="cursor-glow" ref={ref} />;
};

export default CursorGlow;
