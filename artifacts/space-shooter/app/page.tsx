'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const GameCanvas = dynamic(() => import('./components/GameCanvas'), { ssr: false });
const Leaderboard = dynamic(() => import('./components/Leaderboard'), { ssr: false });

export default function Home() {
  const [leaderboardKey, setLeaderboardKey] = useState(0);

  return (
    <>
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 100 }}>
        <ConnectButton />
      </div>

      <main
        style={{
          width: '100vw',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: '#000',
          paddingTop: 72,
          paddingBottom: 48,
          gap: 0,
        }}
      >
        <GameCanvas onScoreSubmitted={() => setLeaderboardKey((k) => k + 1)} />
        <Leaderboard refreshKey={leaderboardKey} />
      </main>
    </>
  );
}
