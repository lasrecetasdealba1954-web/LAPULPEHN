import { useEffect, useRef } from 'react';

export default function StarBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear existing stars
    container.innerHTML = '';

    // Create stars
    const starCount = 100;

    for (let i = 0; i < starCount; i++) {
      const star = document.createElement('div');
      star.className = 'star';

      // Random position
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;

      // Random size (1-3px)
      const size = Math.random() * 2 + 1;
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;

      // Random animation duration and delay
      star.style.setProperty('--duration', `${Math.random() * 4 + 3}s`);
      star.style.setProperty('--delay', `${Math.random() * 5}s`);

      container.appendChild(star);
    }

    // Add some larger "bright" stars
    const brightStarCount = 15;
    for (let i = 0; i < brightStarCount; i++) {
      const star = document.createElement('div');
      star.className = 'star';

      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;

      const size = Math.random() * 2 + 2;
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.boxShadow = `0 0 ${size * 2}px rgba(255, 215, 0, 0.5)`;

      star.style.setProperty('--duration', `${Math.random() * 3 + 2}s`);
      star.style.setProperty('--delay', `${Math.random() * 3}s`);

      container.appendChild(star);
    }
  }, []);

  return <div ref={containerRef} className="stars-container" />;
}
