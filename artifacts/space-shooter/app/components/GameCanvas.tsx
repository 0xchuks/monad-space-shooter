'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { leaderboardAbi } from '../lib/leaderboard-abi';

const W = 800;
const H = 600;
const PLAYER_W = 44;
const PLAYER_H = 32;
const PLAYER_SPEED = 5;
const LASER_SPEED = 10;
const LASER_W = 3;
const LASER_H = 18;
const ASTEROID_BASE_SPEED = 1.2;
const SPAWN_INTERVAL_MS = 1100;
const SPEED_RAMP = 0.0003;

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

type Phase = 'idle' | 'playing' | 'over';
type SubmitStatus = 'idle' | 'busy' | 'done' | 'error';

interface Laser { id: number; x: number; y: number }
interface Asteroid { id: number; x: number; y: number; r: number; pts: { x: number; y: number }[]; rot: number; rotSpeed: number }

let _id = 0;
const nextId = () => ++_id;

function makeAsteroid(_speed: number): Asteroid {
  const r = 18 + Math.random() * 22;
  const x = r + Math.random() * (W - 2 * r);
  const pts: { x: number; y: number }[] = [];
  const count = 8 + Math.floor(Math.random() * 4);
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const dist = r * (0.7 + Math.random() * 0.5);
    pts.push({ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist });
  }
  return { id: nextId(), x, y: -r, r, pts, rot: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 0.04 };
}

function drawShip(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  const grd = ctx.createRadialGradient(0, 14, 1, 0, 14, 14);
  grd.addColorStop(0, 'rgba(80,160,255,0.9)');
  grd.addColorStop(1, 'rgba(80,160,255,0)');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.ellipse(0, 14, 10, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, -PLAYER_H / 2);
  ctx.lineTo(PLAYER_W / 2, PLAYER_H / 2);
  ctx.lineTo(PLAYER_W / 4, PLAYER_H / 3);
  ctx.lineTo(-PLAYER_W / 4, PLAYER_H / 3);
  ctx.lineTo(-PLAYER_W / 2, PLAYER_H / 2);
  ctx.closePath();
  ctx.fillStyle = '#b8d4ff';
  ctx.fill();
  ctx.strokeStyle = '#5599ff';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, -2, 7, 9, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#1a3a7a';
  ctx.fill();
  ctx.restore();
}

function drawLaser(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#00ffff';
  ctx.fillStyle = '#00ffff';
  ctx.fillRect(x - LASER_W / 2, y, LASER_W, LASER_H);
  ctx.restore();
}

function drawAsteroid(ctx: CanvasRenderingContext2D, a: Asteroid) {
  ctx.save();
  ctx.translate(a.x, a.y);
  ctx.rotate(a.rot);
  ctx.beginPath();
  ctx.moveTo(a.pts[0].x, a.pts[0].y);
  for (let i = 1; i < a.pts.length; i++) ctx.lineTo(a.pts[i].x, a.pts[i].y);
  ctx.closePath();
  ctx.fillStyle = '#665544';
  ctx.fill();
  ctx.strokeStyle = '#998866';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

function drawStars(ctx: CanvasRenderingContext2D, stars: { x: number; y: number; s: number }[]) {
  ctx.fillStyle = '#fff';
  for (const st of stars) {
    ctx.globalAlpha = 0.4 + Math.random() * 0.3;
    ctx.fillRect(st.x, st.y, st.s, st.s);
  }
  ctx.globalAlpha = 1;
}

interface Props {
  onScoreSubmitted?: () => void;
}

export default function GameCanvas({ onScoreSubmitted }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef<Phase>('idle');
  const [phase, setPhase] = useState<Phase>('idle');
  const [finalScore, setFinalScore] = useState(0);

  const playerRef = useRef({ x: W / 2, y: H - 60 });
  const lasersRef = useRef<Laser[]>([]);
  const asteroidsRef = useRef<Asteroid[]>([]);
  const scoreRef = useRef(0);
  const keysRef = useRef<Record<string, boolean>>({});
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const spawnAccRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);
  const starsRef = useRef<{ x: number; y: number; s: number }[]>([]);
  const canFireRef = useRef(true);

  // Submit flow
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { isSuccess: txConfirmed, isError: txFailed, error: txError } =
    useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (txConfirmed) {
      setSubmitStatus('done');
      onScoreSubmitted?.();
    }
  }, [txConfirmed, onScoreSubmitted]);

  useEffect(() => {
    if (txFailed) {
      const msg =
        (txError as { shortMessage?: string })?.shortMessage ??
        txError?.message ??
        'Transaction failed';
      setSubmitError(msg);
      setSubmitStatus('error');
    }
  }, [txFailed, txError]);

  const handleSubmit = useCallback(async () => {
    if (!address || !isConnected || submitStatus === 'busy' || submitStatus === 'done') return;
    setSubmitStatus('busy');
    setSubmitError(null);

    try {
      const res = await fetch('/api/sign-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player: address, score: finalScore }),
      });
      const data = (await res.json()) as { signature?: `0x${string}`; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed to get signature');

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: leaderboardAbi,
        functionName: 'submitScore',
        args: [BigInt(finalScore), data.signature!],
      });
      setTxHash(hash);
    } catch (err) {
      const msg =
        (err as { shortMessage?: string })?.shortMessage ??
        (err instanceof Error ? err.message : 'Unknown error');
      setSubmitError(msg);
      setSubmitStatus('error');
    }
  }, [address, isConnected, submitStatus, finalScore, writeContractAsync]);

  // Stars init
  useEffect(() => {
    starsRef.current = Array.from({ length: 80 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      s: Math.random() < 0.2 ? 2 : 1,
    }));
  }, []);

  const endGame = useCallback(() => {
    phaseRef.current = 'over';
    setFinalScore(scoreRef.current);
    setPhase('over');
    cancelAnimationFrame(rafRef.current);
  }, []);

  const startGame = useCallback(() => {
    playerRef.current = { x: W / 2, y: H - 60 };
    lasersRef.current = [];
    asteroidsRef.current = [];
    scoreRef.current = 0;
    spawnAccRef.current = 0;
    elapsedRef.current = 0;
    lastTimeRef.current = 0;
    canFireRef.current = true;
    phaseRef.current = 'playing';
    setPhase('playing');
    setSubmitStatus('idle');
    setSubmitError(null);
    setTxHash(undefined);
  }, []);

  const loop = useCallback(
    (ts: number) => {
      if (phaseRef.current !== 'playing') return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dt = lastTimeRef.current === 0 ? 16 : Math.min(ts - lastTimeRef.current, 50);
      lastTimeRef.current = ts;
      elapsedRef.current += dt;
      spawnAccRef.current += dt;

      const speed = ASTEROID_BASE_SPEED + elapsedRef.current * SPEED_RAMP;

      const p = playerRef.current;
      if (keysRef.current['ArrowLeft'] || keysRef.current['a']) p.x = Math.max(PLAYER_W / 2, p.x - PLAYER_SPEED);
      if (keysRef.current['ArrowRight'] || keysRef.current['d']) p.x = Math.min(W - PLAYER_W / 2, p.x + PLAYER_SPEED);

      if (spawnAccRef.current >= SPAWN_INTERVAL_MS) {
        spawnAccRef.current -= SPAWN_INTERVAL_MS;
        asteroidsRef.current.push(makeAsteroid(speed));
      }

      lasersRef.current = lasersRef.current
        .map((l) => ({ ...l, y: l.y - LASER_SPEED }))
        .filter((l) => l.y + LASER_H > 0);

      asteroidsRef.current = asteroidsRef.current.map((a) => ({
        ...a, y: a.y + speed, rot: a.rot + a.rotSpeed,
      }));

      const hitLaserIds = new Set<number>();
      const hitAsteroidIds = new Set<number>();
      for (const l of lasersRef.current) {
        for (const a of asteroidsRef.current) {
          const dx = l.x - a.x;
          const dy = l.y + LASER_H / 2 - a.y;
          if (Math.sqrt(dx * dx + dy * dy) < a.r) {
            hitLaserIds.add(l.id);
            hitAsteroidIds.add(a.id);
            scoreRef.current += 10;
          }
        }
      }
      lasersRef.current = lasersRef.current.filter((l) => !hitLaserIds.has(l.id));
      asteroidsRef.current = asteroidsRef.current.filter((a) => !hitAsteroidIds.has(a.id));

      for (const a of asteroidsRef.current) {
        const dx = p.x - a.x;
        const dy = p.y - a.y;
        if (Math.sqrt(dx * dx + dy * dy) < a.r + 14) { endGame(); return; }
      }
      asteroidsRef.current = asteroidsRef.current.filter((a) => a.y - a.r <= H);

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      drawStars(ctx, starsRef.current);
      for (const l of lasersRef.current) drawLaser(ctx, l.x, l.y);
      for (const a of asteroidsRef.current) drawAsteroid(ctx, a);
      drawShip(ctx, p.x, p.y);
      ctx.fillStyle = '#fff';
      ctx.font = "16px 'Courier New', monospace";
      ctx.fillText(`SCORE  ${scoreRef.current}`, 16, 28);

      rafRef.current = requestAnimationFrame(loop);
    },
    [endGame],
  );

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true;
      if (e.key === ' ') {
        e.preventDefault();
        if (phaseRef.current === 'idle' || phaseRef.current === 'over') {
          startGame();
          lastTimeRef.current = 0;
          rafRef.current = requestAnimationFrame(loop);
          return;
        }
        if (phaseRef.current === 'playing' && canFireRef.current) {
          canFireRef.current = false;
          const p = playerRef.current;
          lasersRef.current.push({ id: nextId(), x: p.x, y: p.y - PLAYER_H / 2 });
        }
      }
    };
    const onUp = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false;
      if (e.key === ' ') canFireRef.current = true;
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, [startGame, loop]);

  useEffect(() => {
    if (phase !== 'idle') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    drawStars(ctx, starsRef.current);
    drawShip(ctx, W / 2, H - 60);
    ctx.fillStyle = '#fff';
    ctx.font = "bold 28px 'Courier New', monospace";
    ctx.textAlign = 'center';
    ctx.fillText('SPACE  SHOOTER', W / 2, H / 2 - 30);
    ctx.font = "16px 'Courier New', monospace";
    ctx.fillStyle = '#aaa';
    ctx.fillText('Press  SPACE  to  start', W / 2, H / 2 + 10);
    ctx.textAlign = 'left';
  }, [phase]);

  useEffect(() => {
    if (phase !== 'over') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ff4444';
    ctx.font = "bold 36px 'Courier New', monospace";
    ctx.textAlign = 'center';
    ctx.fillText('GAME  OVER', W / 2, H / 2 - 40);
    ctx.fillStyle = '#fff';
    ctx.font = "22px 'Courier New', monospace";
    ctx.fillText(`Score:  ${finalScore}`, W / 2, H / 2 + 4);
    ctx.font = "14px 'Courier New', monospace";
    ctx.fillStyle = '#888';
    ctx.fillText('Press  SPACE  to  play  again', W / 2, H / 2 + 38);
    ctx.textAlign = 'left';
  }, [phase, finalScore]);

  const mono = { fontFamily: "'Courier New', monospace" } as const;

  const btnStyle = (active: boolean): React.CSSProperties => ({
    marginTop: 8,
    padding: '10px 28px',
    background: active ? '#0e76fd' : '#222',
    color: active ? '#fff' : '#555',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    cursor: active ? 'pointer' : 'not-allowed',
    letterSpacing: '0.05em',
    ...mono,
  });

  const canSubmit = isConnected && submitStatus !== 'busy' && submitStatus !== 'done';

  return (
    <div style={{ position: 'relative', width: W, height: H }}>
      <canvas ref={canvasRef} width={W} height={H} style={{ display: 'block', background: '#000' }} />

      {phase === 'over' && (
        <div
          style={{
            position: 'absolute',
            top: '58%',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {submitStatus === 'done' ? (
            <span style={{ color: '#00e87a', fontSize: 15, letterSpacing: '0.08em', ...mono }}>
              ✓ Submitted!
            </span>
          ) : (
            <button
              disabled={!canSubmit}
              style={btnStyle(canSubmit)}
              onClick={handleSubmit}
            >
              {submitStatus === 'busy'
                ? 'Submitting…'
                : isConnected
                ? 'Submit to leaderboard'
                : 'Connect wallet to submit'}
            </button>
          )}

          {submitStatus === 'error' && submitError && (
            <div
              style={{
                color: '#ff6666',
                fontSize: 12,
                maxWidth: 340,
                textAlign: 'center',
                lineHeight: 1.5,
                ...mono,
              }}
            >
              {submitError}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
