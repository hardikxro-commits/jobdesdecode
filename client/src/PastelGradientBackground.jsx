/*
 * Copyright (c) 2026 Hardik Nishad (@hardikxro-commits)
 */

export default function PastelGradientBackground({ className = "" }) {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}
      style={{ background: 'linear-gradient(135deg, #ffe8f3, #d9f3ff)' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.2), rgba(0,0,0,0.1))',
        }}
      />
      <div
        className="pastel-layer-1"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '200%',
          height: '200%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          overflow: 'hidden',
          opacity: 0.8,
          filter: 'blur(50px)',
          background: 'conic-gradient(from 0deg, #ff9aa2, #ffb7b2, #ffdac1, #e2f0cb, #a2e4ff, #c9afff, #ffb7b2, #ff9aa2)',
          animation: 'pastel-rotate 8s linear infinite',
        }}
      />
      <div
        className="pastel-layer-2"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '180%',
          height: '180%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          overflow: 'hidden',
          opacity: 0.6,
          filter: 'blur(50px)',
          background: 'conic-gradient(from 0deg, #ff9aa2, #ffb7b2, #ffdac1, #e2f0cb, #a2e4ff, #c9afff, #ffb7b2, #ff9aa2)',
          animation: 'pastel-rotate-reverse 10s linear infinite',
        }}
      />
    </div>
  )
}
