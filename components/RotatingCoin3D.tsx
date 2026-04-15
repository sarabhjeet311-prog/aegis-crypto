import React, { useRef, useEffect } from 'react';

interface RotatingCoin3DProps {
  size?: number;
}

const RotatingCoin3D: React.FC<RotatingCoin3DProps> = ({ size = 260 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let rotation = 0;
    let animationId: number;

    const animate = () => {
      rotation += 0.5; // Speed of rotation
      if (wrapperRef.current) {
        wrapperRef.current.style.transform = `rotateX(15deg) rotateY(${rotation}deg) translateY(${Math.sin(rotation * 0.01) * 5}px)`;
      }
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: '1000px',
        width: `${size}px`,
        height: `${size}px`
      }}
    >
      <div 
        ref={wrapperRef}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          position: 'relative',
          transformStyle: 'preserve-3d',
          willChange: 'transform'
        }}
      >
        {/* Front Face */}
        <img
          src="/coin.png"
          alt="Coin Front"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            transform: `translateZ(${size * 0.05}px)`,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            borderRadius: '50%',
            display: 'block'
          }}
        />
        
        {/* Back Face */}
        <img
          src="/coin.png"
          alt="Coin Back"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            transform: `rotateY(180deg) translateZ(${size * 0.05}px)`,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            borderRadius: '50%',
            display: 'block'
          }}
        />
        
        {/* Edge (Thickness) */}
        <div
          style={{
            width: `${size * 0.1}px`,
            height: '100%',
            position: 'absolute',
            left: '50%',
            top: '0',
            transform: 'translateX(-50%) rotateY(90deg)',
            background: '#666',
            borderRadius: '50%',
            transformOrigin: 'center',
            zIndex: -1
          }}
        />
      </div>
    </div>
  );
};

export default RotatingCoin3D;