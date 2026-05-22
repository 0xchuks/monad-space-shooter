'use client';

import dynamic from 'next/dynamic';
import { useCallback, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const GameCanvas = dynamic(() => import('./components/GameCanvas'), { ssr: false });
const Leaderboard = dynamic(() => import('./components/Leaderboard'), { ssr: false });

export default function Home() {
  const [leaderboardKey, setLeaderboardKey] = useState(0);
  const handleScoreSubmitted = useCallback(() => setLeaderboardKey((k) => k + 1), []);

  return (
    <>
      <div className="scanlines" />

      <div style={{ position: 'fixed', top: 20, right: 24, zIndex: 100 }}>
        <ConnectButton.Custom>
          {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
            const ready = mounted;
            const connected = ready && account && chain;
            return (
              <div
                {...(!ready && {
                  'aria-hidden': true,
                  style: { opacity: 0, pointerEvents: 'none', userSelect: 'none' },
                })}
              >
                {!connected ? (
                  <button className="neon-btn" onClick={openConnectModal} type="button">
                    Connect Wallet
                  </button>
                ) : chain.unsupported ? (
                  <button className="neon-btn" onClick={openChainModal} type="button">
                    Wrong Network
                  </button>
                ) : (
                  <button className="neon-btn neon-btn-cyan" onClick={openAccountModal} type="button">
                    {account.displayName}
                  </button>
                )}
              </div>
            );
          }}
        </ConnectButton.Custom>
      </div>

      <main
        style={{
          width: '100vw',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: '#0a0014',
          paddingTop: 90,
          paddingBottom: 60,
          gap: 32,
        }}
      >
        <GameCanvas onScoreSubmitted={handleScoreSubmitted} />
        <Leaderboard refreshKey={leaderboardKey} />
      </main>
    </>
  );
}
