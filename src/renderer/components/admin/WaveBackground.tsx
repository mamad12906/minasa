import React from 'react'

/** Animated SVG wave background used on the login page. */
export default function WaveBackground({ color1, color2, color3 }: { color1: string; color2: string; color3: string }) {
  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%', overflow: 'hidden', pointerEvents: 'none' }}>
      <svg viewBox="0 0 1440 400" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, width: '100%', height: '100%' }}>
        <path d="M0,200 C360,300 720,100 1080,200 C1260,250 1380,220 1440,200 L1440,400 L0,400 Z" fill={color1} opacity="0.3">
          <animate attributeName="d" dur="8s" repeatCount="indefinite"
            values="M0,200 C360,300 720,100 1080,200 C1260,250 1380,220 1440,200 L1440,400 L0,400 Z;
                    M0,220 C360,120 720,280 1080,180 C1260,210 1380,240 1440,220 L1440,400 L0,400 Z;
                    M0,200 C360,300 720,100 1080,200 C1260,250 1380,220 1440,200 L1440,400 L0,400 Z" />
        </path>
        <path d="M0,260 C480,200 960,320 1440,260 L1440,400 L0,400 Z" fill={color2} opacity="0.25">
          <animate attributeName="d" dur="6s" repeatCount="indefinite"
            values="M0,260 C480,200 960,320 1440,260 L1440,400 L0,400 Z;
                    M0,240 C480,320 960,200 1440,280 L1440,400 L0,400 Z;
                    M0,260 C480,200 960,320 1440,260 L1440,400 L0,400 Z" />
        </path>
        <path d="M0,320 C360,280 720,350 1080,310 C1260,320 1380,300 1440,320 L1440,400 L0,400 Z" fill={color3} opacity="0.2">
          <animate attributeName="d" dur="10s" repeatCount="indefinite"
            values="M0,320 C360,280 720,350 1080,310 C1260,320 1380,300 1440,320 L1440,400 L0,400 Z;
                    M0,300 C360,340 720,290 1080,330 C1260,310 1380,340 1440,300 L1440,400 L0,400 Z;
                    M0,320 C360,280 720,350 1080,310 C1260,320 1380,300 1440,320 L1440,400 L0,400 Z" />
        </path>
      </svg>
    </div>
  )
}

/** Decorative floating morphing shapes used on the login page. */
export function FloatingShapes({ accent }: { accent: string }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {[
        { w: 200, h: 200, top: '5%', left: '-5%', dur: 20, delay: 0, opacity: 0.04 },
        { w: 150, h: 150, top: '60%', right: '-3%', dur: 25, delay: 2, opacity: 0.05 },
        { w: 100, h: 100, top: '20%', right: '10%', dur: 18, delay: 4, opacity: 0.03 },
        { w: 120, h: 120, top: '70%', left: '5%', dur: 22, delay: 1, opacity: 0.04 },
        { w: 80, h: 80, top: '40%', left: '15%', dur: 15, delay: 3, opacity: 0.06 },
      ].map((s, i) => (
        <div key={i} style={{
          position: 'absolute', width: s.w, height: s.h, top: s.top, left: (s as any).left, right: (s as any).right,
          borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%', background: accent, opacity: s.opacity,
          animation: `morphFloat ${s.dur}s ease-in-out infinite`, animationDelay: `${s.delay}s`,
        }} />
      ))}
    </div>
  )
}
