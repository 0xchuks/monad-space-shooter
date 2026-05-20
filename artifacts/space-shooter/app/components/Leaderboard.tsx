'use client';

import { useEffect, useState } from 'react';
import { createPublicClient, http, parseAbiItem, isAddress } from 'viem';
import { monadTestnet } from '../lib/chain';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? '';

const publicClient = CONTRACT_ADDRESS
  ? createPublicClient({ chain: monadTestnet, transport: http() })
  : null;

interface Entry {
  player: `0x${string}`;
  score: number;
}

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function Leaderboard({ refreshKey }: { refreshKey: number }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicClient || !CONTRACT_ADDRESS || !isAddress(CONTRACT_ADDRESS)) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    publicClient
      .getLogs({
        address: CONTRACT_ADDRESS as `0x${string}`,
        event: parseAbiItem(
          'event NewBestScore(address indexed player, uint256 score)',
        ),
        fromBlock: 0n,
        toBlock: 'latest',
      })
      .then((logs) => {
        const map = new Map<string, number>();
        for (const log of logs) {
          const args = log.args as { player: `0x${string}`; score: bigint };
          const score = Number(args.score);
          if (score > (map.get(args.player) ?? 0)) {
            map.set(args.player, score);
          }
        }

        const sorted = Array.from(map.entries())
          .map(([player, score]) => ({ player: player as `0x${string}`, score }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 10);

        setEntries(sorted);
        setLoading(false);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Failed to load';
        setError(msg);
        setLoading(false);
      });
  }, [refreshKey]);

  const mono: React.CSSProperties = {
    fontFamily: "'Courier New', monospace",
  };

  return (
    <div
      style={{
        width: 800,
        padding: '24px 0 48px',
        ...mono,
      }}
    >
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
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 14,
          }}
        >
          <thead>
            <tr style={{ color: '#555', fontSize: 11, letterSpacing: '0.12em' }}>
              <th style={{ textAlign: 'left', padding: '4px 12px', width: 40 }}>
                #
              </th>
              <th style={{ textAlign: 'left', padding: '4px 12px' }}>
                PLAYER
              </th>
              <th style={{ textAlign: 'right', padding: '4px 12px' }}>
                SCORE
              </th>
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
                  {e.score.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
