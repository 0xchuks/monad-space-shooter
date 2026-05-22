import { Router, type IRouter, type Request, type Response } from "express";
import { createPublicClient, http, parseAbiItem, defineChain } from "viem";
import { promises as fs } from "node:fs";
import path from "node:path";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: ["https://testnet-rpc.monad.xyz"] } },
});

const CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`) ??
  "0xe68407B99b39113bD4038A2Fad69053A7200f297";

// Contract was deployed at block 33062470; no NewBestScore events exist before this.
const DEPLOYMENT_BLOCK = BigInt(33062470);
// Monad testnet currently caps eth_getLogs at 100 blocks per request.
const CHUNK = BigInt(100);
// Monad testnet RPC rate limit is 25 req/sec; we stay safely under that.
const CHUNK_DELAY_MS = 60;
// Persist progress so restarts don't rescan from deployment block.
const CACHE_FILE = path.join("/tmp", "space-shooter-leaderboard-cache.json");
// Background sync cadence when caught up (poll for new blocks).
const REFRESH_INTERVAL_MS = 10_000;

const NEW_BEST_SCORE_EVENT = parseAbiItem(
  "event NewBestScore(address indexed player, uint256 score)"
);

const client = createPublicClient({
  chain: monadTestnet,
  transport: http(),
});

interface PersistedCache {
  lastScannedBlock: string; // bigint serialized as string
  scores: Record<string, string>; // player -> best score
}

let scoreMap = new Map<string, bigint>();
let lastScannedBlock = DEPLOYMENT_BLOCK - BigInt(1);
let cacheLoaded = false;
let syncRunning = false;
let lastSyncError: string | null = null;

async function loadCache(): Promise<void> {
  if (cacheLoaded) return;
  cacheLoaded = true;
  try {
    const raw = await fs.readFile(CACHE_FILE, "utf8");
    const parsed = JSON.parse(raw) as PersistedCache;
    lastScannedBlock = BigInt(parsed.lastScannedBlock);
    scoreMap = new Map(
      Object.entries(parsed.scores).map(([k, v]) => [k, BigInt(v)])
    );
    logger.info(
      { entries: scoreMap.size, lastScannedBlock: lastScannedBlock.toString() },
      "Leaderboard cache loaded"
    );
  } catch (err) {
    // No cache yet, or unreadable — start from deployment block.
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      logger.warn({ err }, "Failed to read leaderboard cache");
    }
  }
}

async function saveCache(): Promise<void> {
  const data: PersistedCache = {
    lastScannedBlock: lastScannedBlock.toString(),
    scores: Object.fromEntries(
      Array.from(scoreMap.entries()).map(([k, v]) => [k, v.toString()])
    ),
  };
  try {
    await fs.writeFile(CACHE_FILE, JSON.stringify(data));
  } catch (err) {
    logger.warn({ err }, "Failed to persist leaderboard cache");
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function syncOnce(): Promise<void> {
  if (syncRunning) return;
  syncRunning = true;
  try {
    const latestBlock = await client.getBlockNumber();
    if (latestBlock <= lastScannedBlock) {
      lastSyncError = null;
      return;
    }

    let from = lastScannedBlock + BigInt(1);
    let chunksSinceSave = 0;

    while (from <= latestBlock) {
      const to = from + CHUNK - BigInt(1) <= latestBlock
        ? from + CHUNK - BigInt(1)
        : latestBlock;

      const logs = await client.getLogs({
        address: CONTRACT_ADDRESS,
        event: NEW_BEST_SCORE_EVENT,
        fromBlock: from,
        toBlock: to,
      });

      for (const log of logs) {
        const args = log.args as { player?: `0x${string}`; score?: bigint };
        if (!args.player || args.score === undefined) continue;
        const existing = scoreMap.get(args.player) ?? BigInt(0);
        if (args.score > existing) {
          scoreMap.set(args.player, args.score);
        }
      }

      lastScannedBlock = to;
      chunksSinceSave++;

      // Save periodically during long catch-ups so progress survives crashes.
      if (chunksSinceSave >= 200) {
        await saveCache();
        chunksSinceSave = 0;
      }

      from = to + BigInt(1);
      if (from <= latestBlock) {
        await sleep(CHUNK_DELAY_MS);
      }
    }

    await saveCache();
    lastSyncError = null;
  } catch (err) {
    lastSyncError = err instanceof Error ? err.message : String(err);
    logger.warn({ err }, "Leaderboard sync failed; will retry");
  } finally {
    syncRunning = false;
  }
}

function topEntries(): { player: string; score: string }[] {
  return Array.from(scoreMap.entries())
    .map(([player, score]) => ({ player, score: score.toString() }))
    .sort((a, b) => (BigInt(b.score) > BigInt(a.score) ? 1 : -1))
    .slice(0, 10);
}

// Kick off initial load + background sync loop on module init.
void (async () => {
  await loadCache();
  // Initial sync (fire and forget — endpoint serves cached data meanwhile).
  void syncOnce();
  setInterval(() => { void syncOnce(); }, REFRESH_INTERVAL_MS);
})();

router.get("/leaderboard", async (_req: Request, res: Response) => {
  await loadCache();
  // Trigger a background sync if one isn't running; never await it.
  if (!syncRunning) void syncOnce();
  res.json({
    entries: topEntries(),
    syncedThroughBlock: lastScannedBlock.toString(),
    syncing: syncRunning,
    ...(lastSyncError ? { warning: lastSyncError } : {}),
  });
});

export default router;
