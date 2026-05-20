'use client';

import dynamic from 'next/dynamic';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const GameCanvas = dynamic(() => import('./components/GameCanvas'), { ssr: false });

export default function Home() {
  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 100,
        }}
      >
        <ConnectButton />
      </div>

      <main
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000',
        }}
      >
        <GameCanvas />
      </main>
    </>
  );
}
