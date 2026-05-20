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

  const mono: React.CSSProperties = { fontFamily: "'Courier New', monospace" };

  return (
    <div style={{ width: 800, padding: '24px 0 48px', ...mono }}>
      <p
        style={{
          fontSize: 12,
          letterSpacing: '0.18em',
          color: '#444',
          textTransform: 'uppercase',
          marginBottom: 12,
          textAlign: 'center',
        }}
      >
        — Top 10 —
      </p>

      {loading && (
        <p style={{ color: '#555', fontSize: 13, textAlign: 'center' }}>Loading…</p>
      )}

      {error && (
        <p style={{ color: '#884444', fontSize: 13, textAlign: 'center' }}>{error}</p>
      )}

      {!loading && !error && entries.length === 0 && (
        <p style={{ color: '#444', fontSize: 13, textAlign: 'center' }}>
          No scores yet. Be the first!
        </p>
      )}

      {!loading && !error && entries.length > 0 && (
        <ol
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {entries.map((e, i) => (
            <li
              key={e.player}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 8,
                fontSize: 14,
                color: i === 0 ? '#ffd700' : i < 3 ? '#bbb' : '#555',
                borderTop: i === 0 ? 'none' : '1px solid #111',
                paddingTop: i === 0 ? 0 : 6,
              }}
            >
              <span style={{ width: 20, textAlign: 'right', flexShrink: 0 }}>
                {i + 1}.
              </span>
              <span style={{ flex: 1 }}>{truncate(e.player)}</span>
              <span>{Number(e.score).toLocaleString()}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
