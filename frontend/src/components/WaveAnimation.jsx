import React from "react";

const WaveAnimation = () => {
  return (
    <>
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translate(0px, 0px) rotate(0deg) scale(1); }
          50% { transform: translate(-20px, 15px) rotate(-1deg) scale(1.02); }
        }
        @keyframes float-fast {
          0%, 100% { transform: translate(0px, 0px) rotate(0deg) scale(1); }
          50% { transform: translate(25px, -20px) rotate(1deg) scale(1.03); }
        }
        @keyframes flow-shift {
          0%, 100% { stop-color: #7c3aed; }
          50% { stop-color: #ec4899; }
        }
        
        .animate-wave-main {
          animation: float-slow 14s ease-in-out infinite;
          transform-origin: center;
        }
        .animate-wave-secondary {
          animation: float-fast 11s ease-in-out infinite;
          transform-origin: center;
        }
      `}</style>

      <div
        className="absolute top-0 right-0 z-[-1] pointer-events-none overflow-visible w-[800px] h-[600px] md:w-[1200px] md:h-[800px] transform origin-top-right scale-75 md:scale-100 translate-x-[10%] -translate-y-[10%]"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 1000 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            {/* Asosiy Gradient: To'q Siyohrang -> Yorqin Pushti -> Yorqin Moviy (Cyan) */}
            <linearGradient id="grad-main" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4F46E5">
                <animate
                  attributeName="stop-color"
                  values="#4F46E5;#7C3AED;#4F46E5"
                  dur="10s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="50%" stopColor="#EC4899" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>

            {/* Qo'shimcha Gradient: Olovrang -> To'q Pushti -> Siyohrang */}
            <linearGradient
              id="grad-accent"
              x1="100%"
              y1="100%"
              x2="0%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#F97316" />
              <stop offset="50%" stopColor="#E11D48" />
              <stop offset="100%" stopColor="#4338CA" />
            </linearGradient>

            {/* Glow Filter */}
            <filter id="glow-blur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="80" result="blur" />
            </filter>
          </defs>

          {/* LAYER 3: Glow Layer (Blurred duplicates) */}
          <g filter="url(#glow-blur)" className="opacity-40">
            <path
              d="M-100,250 C150,400 300,100 600,250 C900,400 1050,150 1200,150 L1200,350 C1050,350 900,500 600,350 C300,200 150,500 -100,350 Z"
              fill="url(#grad-main)"
            />
          </g>

          {/* LAYER 2: Secondary Wave (Orange/Red Accent, slightly thinner, faster) */}
          <g className="animate-wave-secondary">
            <path
              d="M-150,320 C100,450 350,180 650,300 C900,400 1100,220 1250,200 L1250,360 C1100,380 900,500 650,420 C350,300 100,550 -150,440 Z"
              fill="url(#grad-accent)"
              opacity="0.85"
            />
          </g>

          {/* LAYER 1: Main Wave (Thick ribbon, bright purple/pink/blue) */}
          <g className="animate-wave-main">
            <path
              d="M-100,250 C150,400 300,100 600,250 C900,400 1050,150 1200,150 L1200,350 C1050,350 900,500 600,350 C300,200 150,500 -100,350 Z"
              fill="url(#grad-main)"
            />
          </g>
        </svg>
      </div>
    </>
  );
};

export default WaveAnimation;
