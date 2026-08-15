import { useEffect, useRef } from 'react';

export function Celebration({ title, subtitle, stats, onClose, actions }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);

    const particles = [];
    const colors = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6'];
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: canvas.offsetWidth / 2,
        y: canvas.offsetHeight / 2,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10 - 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 6 + 4,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
      });
    }

    let animationId;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;
        p.rotation += p.rotationSpeed;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="celebration-overlay">
      <canvas ref={canvasRef} className="celebration-canvas" />
      <div className="celebration-modal">
        <div className="celebration-icon">🎉</div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
        {stats && (
          <div className="celebration-stats">
            {stats.map((s, i) => (
              <div key={i} className="celebration-stat">
                <span className="celebration-stat-value">{s.value}</span>
                <span className="celebration-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        )}
        <div className="celebration-actions">
          {actions.map((a, i) => (
            <button key={i} onClick={a.onClick} className={a.primary ? 'primary' : ''}>
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
