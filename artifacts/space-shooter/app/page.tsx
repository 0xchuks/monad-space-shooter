'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';

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
        {/* game canvas goes here */}
      </main>
    </>
  );
}
