import React from 'react'

/**
 * Animated 3D-ish SVG avatar for the login page.
 * When `peeking` is true the character covers its eyes with its hands
 * (used while the password field is focused).
 */
export default function Avatar3D({ peeking, style }: { peeking: boolean; style?: React.CSSProperties }) {
  return (
    <div style={{ position: 'relative', width: 120, height: 120, ...style }}>
      <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.2))' }}>
        {/* Body */}
        <ellipse cx="100" cy="175" rx="45" ry="22" fill="#1B6B93" />
        {/* Neck */}
        <rect x="85" y="130" width="30" height="20" rx="5" fill="#FFD9B3" />
        {/* Head shape */}
        <ellipse cx="100" cy="80" rx="52" ry="58" fill="#FFD9B3" />
        {/* Hair */}
        <ellipse cx="100" cy="40" rx="55" ry="35" fill="#2C3E50" />
        <ellipse cx="55" cy="60" rx="12" ry="25" fill="#2C3E50" />
        <ellipse cx="145" cy="60" rx="12" ry="25" fill="#2C3E50" />
        {/* Ears */}
        <ellipse cx="48" cy="85" rx="8" ry="12" fill="#F5C7A0" />
        <ellipse cx="152" cy="85" rx="8" ry="12" fill="#F5C7A0" />
        {/* Eyes area */}
        {peeking ? (
          <>
            {/* Hands covering eyes */}
            <ellipse cx="78" cy="82" rx="22" ry="16" fill="#FFD9B3" stroke="#F5C7A0" strokeWidth="1" />
            <ellipse cx="122" cy="82" rx="22" ry="16" fill="#FFD9B3" stroke="#F5C7A0" strokeWidth="1" />
            {/* Fingers */}
            <rect x="60" y="74" width="8" height="18" rx="4" fill="#FFD9B3" />
            <rect x="70" y="72" width="8" height="20" rx="4" fill="#FFD9B3" />
            <rect x="122" y="72" width="8" height="20" rx="4" fill="#FFD9B3" />
            <rect x="132" y="74" width="8" height="18" rx="4" fill="#FFD9B3" />
            {/* Peeking eye between fingers */}
            <circle cx="100" cy="82" r="3" fill="#2C3E50" />
          </>
        ) : (
          <>
            {/* Eyebrows */}
            <path d="M 68 68 Q 78 62 88 68" stroke="#2C3E50" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M 112 68 Q 122 62 132 68" stroke="#2C3E50" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            {/* Eye whites */}
            <ellipse cx="78" cy="82" rx="14" ry="11" fill="#fff" />
            <ellipse cx="122" cy="82" rx="14" ry="11" fill="#fff" />
            {/* Iris */}
            <circle cx="78" cy="83" r="7" fill="#4A6741" />
            <circle cx="122" cy="83" r="7" fill="#4A6741" />
            {/* Pupils */}
            <circle cx="78" cy="83" r="4" fill="#1A2332" />
            <circle cx="122" cy="83" r="4" fill="#1A2332" />
            {/* Eye shine */}
            <circle cx="81" cy="80" r="2.5" fill="#fff" />
            <circle cx="125" cy="80" r="2.5" fill="#fff" />
          </>
        )}
        {/* Nose */}
        <ellipse cx="100" cy="98" rx="4" ry="3" fill="#F0B78D" />
        {/* Mouth */}
        {peeking ? (
          <ellipse cx="100" cy="112" rx="6" ry="4" fill="#E8846B" />
        ) : (
          <path d="M 88 110 Q 100 122 112 110" stroke="#E8846B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        )}
        {/* Cheeks */}
        <ellipse cx="62" cy="98" rx="8" ry="5" fill="rgba(255,150,150,0.3)" />
        <ellipse cx="138" cy="98" rx="8" ry="5" fill="rgba(255,150,150,0.3)" />
        {/* Shirt collar */}
        <path d="M 75 145 L 85 135 L 100 145 L 115 135 L 125 145" stroke="#fff" strokeWidth="2" fill="none" />
        {/* Badge */}
        <circle cx="100" cy="160" r="10" fill="#D29922" />
        <text x="100" y="164" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="bold">م</text>
      </svg>
    </div>
  )
}
