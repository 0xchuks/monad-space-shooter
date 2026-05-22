import React, { useMemo } from 'react';
import './_group.css';

const LEADERBOARD_DATA = [
  { rank: 1, address: "0x7F...3B92", score: 999990 },
  { rank: 2, address: "0x1A...8F21", score: 854320 },
  { rank: 3, address: "0x9C...4E10", score: 712050 },
  { rank: 4, address: "0x4D...1A99", score: 680400 },
  { rank: 5, address: "0x2B...5C44", score: 550120 },
];

export function NeonArcade() {
  const stars = useMemo(() => {
    return Array.from({ length: 150 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.8 + 0.2
    }));
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0014] text-white flex flex-col items-center py-12 relative overflow-hidden font-cyber">
      {/* Global Scanlines */}
      <div className="absolute inset-0 scanlines z-50 opacity-30 pointer-events-none mix-blend-overlay"></div>

      {/* Wallet Button */}
      <div className="absolute top-6 right-8 z-40">
        <button className="px-6 py-3 bg-[#110022]/80 backdrop-blur-sm border-2 border-[#ff00ff] text-[#ff00ff] font-bold rounded-full uppercase tracking-wider shadow-[0_0_15px_#ff00ff,inset_0_0_10px_#ff00ff] hover:bg-[#ff00ff]/20 hover:scale-105 transition-all font-arcade text-xs">
          Connect Wallet
        </button>
      </div>

      {/* Game Canvas */}
      <div className="w-[800px] h-[600px] bg-[#02000a] relative border-4 neon-border rounded-lg overflow-hidden flex flex-col items-center justify-center mt-8 mb-10 shadow-[0_0_60px_rgba(0,255,255,0.15)]">
        {/* Stars */}
        {stars.map(star => (
          <div
            key={star.id}
            className="star"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity
            }}
          />
        ))}

        {/* Title */}
        <div className="z-10 flex flex-col items-center transform -translate-y-12">
          <h1 className="text-7xl font-arcade neon-title mb-16 text-center leading-[1.3]">
            SPACE<br />SHOOTER
          </h1>
          <p className="text-xl font-arcade text-[#0ff] pulse-text tracking-[0.2em] mt-8">
            PRESS SPACE TO START
          </p>
        </div>

        {/* Player Ship */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 drop-shadow-[0_0_20px_#0ff]">
          <svg width="80" height="80" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M30 0L60 60H0L30 0Z" fill="url(#paint0_linear)"/>
            <path d="M30 15L45 50H15L30 15Z" fill="#0ff"/>
            <rect x="26" y="55" width="8" height="15" fill="#ff00ff" className="pulse-text" />
            <defs>
              <linearGradient id="paint0_linear" x1="30" y1="0" x2="30" y2="60" gradientUnits="userSpaceOnUse">
                <stop stopColor="#0ff" />
                <stop offset="1" stopColor="#8a2be2" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="w-[800px] bg-[#110022]/90 backdrop-blur-md border-2 border-[#ff00ff] rounded-xl p-8 shadow-[0_0_30px_rgba(255,0,255,0.15)] z-10">
        <h2 className="text-3xl font-arcade text-center text-[#ff00ff] mb-10 drop-shadow-[0_0_10px_#ff00ff] tracking-widest">
          — TOP 10 —
        </h2>

        <div className="flex flex-col gap-4 font-arcade text-sm">
          {LEADERBOARD_DATA.map((entry, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center py-4 border-b border-[#ff00ff]/30 px-6 hover:bg-[#ff00ff]/10 hover:border-[#ff00ff]/60 transition-all cursor-default"
            >
              <div className="flex items-center gap-8">
                <span className="text-[#ffff00] drop-shadow-[0_0_8px_#ffff00] w-8 text-right text-lg">
                  {entry.rank}.
                </span>
                <span className="text-[#0ff] drop-shadow-[0_0_5px_#0ff] tracking-widest">
                  {entry.address}
                </span>
              </div>
              <span className="text-white drop-shadow-[0_0_8px_#fff] text-xl tracking-wider font-bold">
                {entry.score.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
