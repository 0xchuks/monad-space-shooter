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
      <h2
        style={{
          fontSize: 13,
          letterSpacing: '0.2em',
          color: '#555',
          textTransform: 'uppercase',
          marginBottom: 16,
          textAlign: 'center',
        }}
      >
        — Leaderboard —
      </h2>

      {loading && (
        <p style={{ textAlign: 'center', color: '#444', fontSize: 13 }}>
          Loading…
        </p>
      )}

      {error && (
        <p style={{ textAlign: 'center', color: '#aa4444', fontSize: 13 }}>
          {error}
        </p>
      )}

      {!loading && !error && entries.length === 0 && (
        <p style={{ textAlign: 'center', color: '#444', fontSize: 13 }}>
          No scores yet. Be the first!
        </p>
      )}

      {!loading && !error && entries.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ color: '#555', fontSize: 11, letterSpacing: '0.12em' }}>
              <th style={{ textAlign: 'left', padding: '4px 12px', width: 40 }}>#</th>
              <th style={{ textAlign: 'left', padding: '4px 12px' }}>PLAYER</th>
              <th style={{ textAlign: 'right', padding: '4px 12px' }}>SCORE</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr
                key={e.player}
                style={{
                  borderTop: '1px solid #111',
                  color: i === 0 ? '#ffd700' : i < 3 ? '#aaa' : '#555',
                }}
              >
                <td style={{ padding: '8px 12px' }}>{i + 1}</td>
                <td style={{ padding: '8px 12px' }}>{truncate(e.player)}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                  {Number(e.score).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
