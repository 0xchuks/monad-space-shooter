import { Router, type IRouter, type Request, type Response } from "express";
import { encodePacked, isAddress, keccak256 } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const router: IRouter = Router();

const SCORE_CAP = 100_000;

router.post("/sign-score", async (req: Request, res: Response) => {
  const { player, score: rawScore } = req.body as {
    player?: unknown;
    score?: unknown;
  };

  // Validate player address
  if (typeof player !== "string" || !isAddress(player)) {
    res.status(400).json({
      error: "Invalid player: must be a 0x Ethereum address",
    });
    return;
  }

  // Accept number or numeric string
  const score =
    typeof rawScore === "string" ? parseInt(rawScore, 10) : rawScore;
  if (
    typeof score !== "number" ||
    !Number.isInteger(score) ||
    score <= 0 ||
    score >= SCORE_CAP
  ) {
    res.status(400).json({
      error: `Invalid score: must be a positive integer less than ${SCORE_CAP}`,
    });
    return;
  }

  // Load private key — server-only, never forwarded to the client
  const rawKey = process.env.SIGNER_PRIVATE_KEY;
  if (!rawKey) {
    req.log.error("SIGNER_PRIVATE_KEY is not set");
    res.status(500).json({ error: "Signing service not configured" });
    return;
  }

  const privateKey: `0x${string}` = rawKey.startsWith("0x")
    ? (rawKey as `0x${string}`)
    : `0x${rawKey}`;

  const account = privateKeyToAccount(privateKey);

  // keccak256(abi.encodePacked(player, score)) — matches the contract's msgHash
  const msgHash = keccak256(
    encodePacked(["address", "uint256"], [player, BigInt(score)])
  );

  // signMessage with { raw } adds the \x19Ethereum Signed Message:\n32 prefix,
  // matching OpenZeppelin MessageHashUtils.toEthSignedMessageHash used on-chain.
  const signature = await account.signMessage({ message: { raw: msgHash } });

  res.json({ signature });
});

export default router;
