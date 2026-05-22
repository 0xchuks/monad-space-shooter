import React, { useMemo } from 'react';
import { Wallet } from 'lucide-react';
import './_group.css';

const MOCK_LEADERBOARD = [
  { rank: 1, address: "0x7F...3b92", score: 142500 },
  { rank: 2, address: "0x1A...8c44", score: 98300 },
  { rank: 3, address: "0x9B...2d11", score: 87450 },
  { rank: 4, address: "0x4C...9f88", score: 76200 },
  { rank: 5, address: "0x2E...1a77", score: 65100 },
];

export function DeepSpace() {
  const stars = useMemo(() => {
    return Array.from({ length: 100 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 5,
      duration: Math.random() * 3 + 2,
    }));
  }, []);

  return (
    <div className="min-h-[100dvh] bg-[#030818] flex flex-col items-center py-12 relative overflow-hidden font-orbitron text-slate-200">
      {/* Background ambient effects */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen"
        style={{
          background: 'radial-gradient(circle at 50% 50%, #1e3a8a 0%, transparent 60%)',
          animation: 'ds-nebula-drift 20s infinite ease-in-out'
        }}
      />
      
      {/* Wallet Connect Button */}
      <div className="absolute top-6 right-6 z-20">
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0a1128]/80 border border-blue-500/30 text-sm tracking-wider hover:bg-[#111e40] hover:border-blue-400/50 transition-all backdrop-blur-md cursor-pointer">
          <Wallet size={16} className="text-blue-400" />
          <span>CONNECT WALLET</span>
        </button>
      </div>

      {/* Main Game Canvas area */}
      <div className="relative w-full max-w-[800px] h-[600px] bg-[#050b1a] rounded-lg border border-blue-900/40 shadow-2xl overflow-hidden mb-8 shadow-blue-900/20">
        {/* Starfield */}
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute bg-white rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: 0.8,
              boxShadow: star.size > 2 ? '0 0 4px 1px rgba(150, 200, 255, 0.4)' : 'none',
              animation: `ds-twinkle ${star.duration}s infinite ease-in-out ${star.delay}s`,
            }}
          />
        ))}

        {/* Title Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-gradient-to-b from-transparent via-[#030818]/60 to-transparent">
          <h1 
            className="text-6xl md:text-7xl font-black mb-6 tracking-widest text-white text-center"
            style={{ textShadow: '0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)' }}
          >
            SPACE<br/>SHOOTER
          </h1>
          <p 
            className="text-blue-200 tracking-[0.3em] uppercase text-sm md:text-base font-medium"
            style={{ animation: 'ds-pulse 2s infinite ease-in-out' }}
          >
            Press SPACE to start
          </p>
        </div>

        {/* Player Ship */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Core engine glow */}
            <circle cx="30" cy="50" r="10" fill="#3b82f6" opacity="0.6" filter="blur(4px)" />
            {/* Ship body */}
            <path d="M30 10 L50 45 L30 40 L10 45 Z" fill="url(#ship-grad)" stroke="#60a5fa" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M30 15 L40 40 L30 38 L20 40 Z" fill="#1e3a8a" opacity="0.8" />
            {/* Cockpit */}
            <path d="M30 25 L34 35 L26 35 Z" fill="#93c5fd" opacity="0.9" />
            <defs>
              <linearGradient id="ship-grad" x1="30" y1="10" x2="30" y2="45" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#1e3a8a" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="w-full max-w-[600px] z-10">
        <div className="flex justify-center items-center gap-4 mb-6">
          <div className="h-px bg-gradient-to-r from-transparent to-blue-500/50 w-16" />
          <h2 className="text-xl font-bold tracking-[0.2em] text-blue-100">TOP PILOTS</h2>
          <div className="h-px bg-gradient-to-l from-transparent to-blue-500/50 w-16" />
        </div>

        <div className="bg-[#050b1a]/80 backdrop-blur-md rounded-xl border border-blue-900/50 overflow-hidden shadow-lg shadow-blue-900/10">
          {MOCK_LEADERBOARD.map((entry, index) => (
            <div 
              key={entry.rank}
              className={`flex items-center justify-between px-6 py-4 ${index !== MOCK_LEADERBOARD.length - 1 ? 'border-b border-blue-900/30' : ''} hover:bg-[#0a1530] transition-colors`}
            >
              <div className="flex items-center gap-6">
                <span className={`text-lg font-bold w-6 ${entry.rank <= 3 ? 'text-blue-400' : 'text-slate-500'}`}>
                  #{entry.rank}
                </span>
                <span className="font-mono text-slate-300">{entry.address}</span>
              </div>
              <span className="font-mono text-blue-200 tracking-wider">
                {entry.score.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
