import { Router, type IRouter, type Request, type Response } from "express";
import {
  createPublicClient,
  http,
  parseAbiItem,
  defineChain,
} from "viem";

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

const DEPLOYMENT_BLOCK = BigInt(33062470);
const CHUNK = BigInt(100);

const NEW_BEST_SCORE_EVENT = parseAbiItem(
  "event NewBestScore(address indexed player, uint256 score)"
);

const client = createPublicClient({
  chain: monadTestnet,
  transport: http(),
});

router.get("/leaderboard", async (_req: Request, res: Response) => {
  try {
    const latestBlock = await client.getBlockNumber();

    const scoreMap = new Map<string, bigint>();

    for (let from = DEPLOYMENT_BLOCK; from <= latestBlock; from += CHUNK) {
      const to = from + CHUNK - BigInt(1) < latestBlock
        ? from + CHUNK - BigInt(1)
        : latestBlock;

      const logs = await client.getLogs({
        address: CONTRACT_ADDRESS,
        event: NEW_BEST_SCORE_EVENT,
        fromBlock: from,
        toBlock: to,
      });

      for (const log of logs) {
        const args = log.args as { player: `0x${string}`; score: bigint };
        const existing = scoreMap.get(args.player) ?? BigInt(0);
        if (args.score > existing) {
          scoreMap.set(args.player, args.score);
        }
      }
    }

    const entries = Array.from(scoreMap.entries())
      .map(([player, score]) => ({ player, score: score.toString() }))
      .sort((a, b) => (BigInt(b.score) > BigInt(a.score) ? 1 : -1))
      .slice(0, 10);

    res.json({ entries });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch leaderboard";
    res.status(500).json({ error: msg });
  }
});

export default router;
