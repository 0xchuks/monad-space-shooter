'use client';

import { useEffect, useState } from 'react';

interface Entry {
  player: string;
  score: string;
}

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function Leaderboard({ refreshKey }: { refreshKey: number }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch('/api/leaderboard')
      .then(async (res) => {
        const data = (await res.json()) as { entries?: Entry[]; error?: string };
        if (!res.ok) throw new Error(data.error ?? 'Failed to load leaderboard');
        setEntries(data.entries ?? []);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load');
        setLoading(false);
      });
  }, [refreshKey]);

  const panel: React.CSSProperties = {
    width: 800,
    padding: '28px 32px 32px',
    background: 'rgba(17, 0, 34, 0.85)',
    backdropFilter: 'blur(8px)',
    border: '2px solid #ff00ff',
    borderRadius: 14,
    boxShadow: '0 0 30px rgba(255, 0, 255, 0.25), inset 0 0 20px rgba(255, 0, 255, 0.08)',
  };

  const heading: React.CSSProperties = {
    fontFamily: "'Press Start 2P', cursive",
    fontSize: 18,
    textAlign: 'center',
    color: '#ff00ff',
    textShadow: '0 0 10px #ff00ff, 0 0 20px #ff00ff',
    letterSpacing: '0.2em',
    marginBottom: 22,
  };

  const message: React.CSSProperties = {
    fontFamily: "'Press Start 2P', cursive",
    fontSize: 10,
    textAlign: 'center',
    letterSpacing: '0.1em',
    padding: '12px 0',
  };

  return (
    <div style={panel}>
      <h2 style={heading}>— TOP 10 —</h2>

      {loading && <p style={{ ...message, color: '#0ff' }}>LOADING…</p>}

      {error && <p style={{ ...message, color: '#ff6b9d' }}>{error}</p>}

      {!loading && !error && entries.length === 0 && (
        <p style={{ ...message, color: '#888' }}>NO SCORES YET. BE THE FIRST!</p>
      )}

      {!loading && !error && entries.length > 0 && (
        <ol
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            fontFamily: "'Press Start 2P', cursive",
            fontSize: 11,
          }}
        >
          {entries.map((e, i) => (
            <li
              key={e.player}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '14px 12px',
                borderBottom: '1px solid rgba(255, 0, 255, 0.25)',
              }}
            >
              <span
                style={{
                  width: 36,
                  textAlign: 'right',
                  color: '#ffff00',
                  textShadow: '0 0 8px #ffff00',
                  fontSize: 13,
                }}
              >
                {i + 1}.
              </span>
              <span
                style={{
                  flex: 1,
                  color: '#0ff',
                  textShadow: '0 0 5px #0ff',
                  letterSpacing: '0.1em',
                }}
              >
                {truncate(e.player)}
              </span>
              <span
                style={{
                  color: '#fff',
                  textShadow: '0 0 8px #fff',
                  letterSpacing: '0.05em',
                  fontSize: 13,
                }}
              >
                {Number(e.score).toLocaleString()}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
