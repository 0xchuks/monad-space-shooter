export interface ShipDef {
  id: string;
  name: string;
  tagline: string;
  /** Primary accent color used for the picker chip + glow. */
  accent: string;
  /** Laser glow color. */
  laserColor: string;
  /** Laser fill color (brighter than glow). */
  laserFill: string;
  drawShip: (ctx: CanvasRenderingContext2D, x: number, y: number) => void;
}

const PLAYER_W = 44;
const PLAYER_H = 32;

function drawArrow(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.translate(x, y);
  // Engine glow
  const grd = ctx.createRadialGradient(0, 14, 1, 0, 14, 16);
  grd.addColorStop(0, 'rgba(0, 200, 255, 0.95)');
  grd.addColorStop(1, 'rgba(0, 200, 255, 0)');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.ellipse(0, 14, 10, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  // Hull
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
  // Cockpit
  ctx.beginPath();
  ctx.ellipse(0, -2, 7, 9, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#1a3a7a';
  ctx.fill();
  ctx.restore();
}

function drawRazor(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.translate(x, y);
  // Magenta engine glow
  const grd = ctx.createRadialGradient(0, 14, 1, 0, 14, 18);
  grd.addColorStop(0, 'rgba(255, 0, 255, 0.95)');
  grd.addColorStop(1, 'rgba(255, 0, 255, 0)');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.ellipse(0, 14, 8, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  // Sharp swept hull
  ctx.beginPath();
  ctx.moveTo(0, -PLAYER_H / 2 - 4);
  ctx.lineTo(PLAYER_W / 2 + 4, PLAYER_H / 2);
  ctx.lineTo(PLAYER_W / 6, PLAYER_H / 4);
  ctx.lineTo(-PLAYER_W / 6, PLAYER_H / 4);
  ctx.lineTo(-PLAYER_W / 2 - 4, PLAYER_H / 2);
  ctx.closePath();
  ctx.fillStyle = '#ff66ff';
  ctx.fill();
  ctx.strokeStyle = '#ff00ff';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Dark center stripe
  ctx.beginPath();
  ctx.moveTo(0, -PLAYER_H / 2 - 2);
  ctx.lineTo(4, PLAYER_H / 4);
  ctx.lineTo(-4, PLAYER_H / 4);
  ctx.closePath();
  ctx.fillStyle = '#2a0033';
  ctx.fill();
  // Cockpit
  ctx.beginPath();
  ctx.ellipse(0, 0, 5, 7, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#ffccff';
  ctx.fill();
  ctx.restore();
}

function drawVortex(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.translate(x, y);
  // Twin yellow engine glows
  for (const dx of [-9, 9]) {
    const grd = ctx.createRadialGradient(dx, 14, 1, dx, 14, 12);
    grd.addColorStop(0, 'rgba(255, 220, 0, 0.95)');
    grd.addColorStop(1, 'rgba(255, 220, 0, 0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.ellipse(dx, 14, 6, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Wide hull
  ctx.beginPath();
  ctx.moveTo(0, -PLAYER_H / 2);
  ctx.lineTo(PLAYER_W / 2 + 6, PLAYER_H / 4);
  ctx.lineTo(PLAYER_W / 2 + 4, PLAYER_H / 2);
  ctx.lineTo(PLAYER_W / 4, PLAYER_H / 2 - 2);
  ctx.lineTo(-PLAYER_W / 4, PLAYER_H / 2 - 2);
  ctx.lineTo(-PLAYER_W / 2 - 4, PLAYER_H / 2);
  ctx.lineTo(-PLAYER_W / 2 - 6, PLAYER_H / 4);
  ctx.closePath();
  ctx.fillStyle = '#ffe066';
  ctx.fill();
  ctx.strokeStyle = '#ffaa00';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Cockpit
  ctx.beginPath();
  ctx.ellipse(0, 2, 8, 9, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#4a3300';
  ctx.fill();
  ctx.restore();
}

export const SHIPS: ShipDef[] = [
  {
    id: 'arrow',
    name: 'ARROW',
    tagline: 'CLASSIC',
    accent: '#5599ff',
    laserColor: '#00ffff',
    laserFill: '#aaffff',
    drawShip: drawArrow,
  },
  {
    id: 'razor',
    name: 'RAZOR',
    tagline: 'NEON',
    accent: '#ff00ff',
    laserColor: '#ff00ff',
    laserFill: '#ff99ff',
    drawShip: drawRazor,
  },
  {
    id: 'vortex',
    name: 'VORTEX',
    tagline: 'HEAVY',
    accent: '#ffcc00',
    laserColor: '#ffdd00',
    laserFill: '#ffff99',
    drawShip: drawVortex,
  },
];

export const DEFAULT_SHIP_ID = 'arrow';

export function getShip(id: string): ShipDef {
  return SHIPS.find((s) => s.id === id) ?? SHIPS[0];
}
