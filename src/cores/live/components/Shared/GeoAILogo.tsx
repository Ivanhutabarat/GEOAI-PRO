import React from 'react';

interface GeoAILogoProps {
  className?: string;
  size?: number;
  glow?: boolean;
}

export default function GeoAILogo({ className = '', size = 32, glow = true }: GeoAILogoProps) {
  return (
    <div 
      className={`relative flex items-center justify-center transition-all ${className}`} 
      style={{ width: size, height: size }}
      id="geo-ai-logo-emblem"
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          {/* Neon gradients for KrissCross engine glow */}
          <linearGradient id="logoGradPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF5722" />
            <stop offset="50%" stopColor="#FF8A65" />
            <stop offset="100%" stopColor="#00E5FF" />
          </linearGradient>
          <linearGradient id="logoGradSecondary" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00E5FF" />
            <stop offset="100%" stopColor="#1e3cc9" />
          </linearGradient>
          <radialGradient id="logoGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FF5722" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FF5722" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient background glow ring */}
        {glow && (
          <circle 
            cx="50" 
            cy="50" 
            r="45" 
            fill="url(#logoGlow)" 
            className="animate-pulse" 
            style={{ animationDuration: '4s' }} 
          />
        )}

        {/* Double external coordinate rings (Scientific Mapping representation) */}
        <circle 
          cx="50" 
          cy="50" 
          r="42" 
          stroke="url(#logoGradSecondary)" 
          strokeWidth="1.5" 
          strokeDasharray="6 3 14 4" 
          className="animate-spin" 
          style={{ animationDuration: '16s' }} 
        />
        <circle 
          cx="50" 
          cy="50" 
          r="36" 
          stroke="url(#logoGradPrimary)" 
          strokeWidth="0.75" 
          strokeDasharray="18 12" 
          className="animate-spin" 
          style={{ animationDuration: '10s', animationDirection: 'reverse' }} 
        />

        {/* Geological Strata layer cuts (Background Triangles) */}
        <path 
          d="M 50,22 L 78,74 L 22,74 Z" 
          stroke="#333333" 
          strokeWidth="1" 
          fill="#111112"
        />
        {/* Stratified Earth layers within the central column */}
        <path d="M 32,56 H 68 L 73,65 H 27 Z" fill="#222224" />
        <path d="M 41,40 H 59 L 63,48 H 37 Z" fill="#3a1e12" />

        {/* Master 'G' and 'A' Tech-Brutalism Monogram Lines (Intersecting KrissCross engine rails) */}
        <g stroke="url(#logoGradPrimary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          {/* Main vertical stem shared */}
          <path d="M 50,30 V 70" />
          
          {/* 'G' loop outer boundary & horizontal index bar */}
          <path d="M 50,30 C 35,30 35,50 35,50 C 35,50 35,70 50,70" />
          <path d="M 50,52 H 41" />

          {/* 'A' left angle, right angle, and cross-cut pipeline */}
          <path d="M 50,30 L 65,70" />
          <path d="M 45,60 H 58" />
        </g>

        {/* Seismic receiver station points (Focal indicators) */}
        <circle cx="50" cy="30" r="2.5" fill="#00E5FF" />
        <path d="M 50,30 L 50,25" stroke="#00E5FF" strokeWidth="1" />
        <circle cx="35" cy="50" r="1.5" fill="#FF5722" />
        <circle cx="65" cy="70" r="1.5" fill="#FF5722" />
      </svg>
    </div>
  );
}
