import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const signerPrivateKey = process.env.SIGNER_PRIVATE_KEY;
  if (!signerPrivateKey) {
    throw new Error("SIGNER_PRIVATE_KEY environment variable is not set");
  }

  // Derive the signer address from the private key.
  const normalizedKey = signerPrivateKey.startsWith("0x")
    ? signerPrivateKey
    : `0x${signerPrivateKey}`;
  const signerWallet = new ethers.Wallet(normalizedKey);
  const authorizedSignerAddress = signerWallet.address;

  console.log("Deploying Leaderboard...");
  console.log("  Authorized signer:", authorizedSignerAddress);

  const [deployer] = await ethers.getSigners();
  console.log("  Deployer:         ", deployer.address);
  console.log(
    "  Deployer balance: ",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "MON"
  );

  const Leaderboard = await ethers.getContractFactory("Leaderboard");
  const leaderboard = await Leaderboard.deploy(authorizedSignerAddress);
  await leaderboard.waitForDeployment();

  const contractAddress = await leaderboard.getAddress();
  console.log("\nLeaderboard deployed to:", contractAddress);
  console.log("Network: Monad Testnet (chain 10143)");

  // Persist the address so the frontend can pick it up.
  const output = {
    network: "monadTestnet",
    chainId: 10143,
    address: contractAddress,
    authorizedSigner: authorizedSignerAddress,
    deployedAt: new Date().toISOString(),
  };

  const outPath = path.resolve(__dirname, "../deployments.json");
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log("\nDeployment info saved to contracts/deployments.json");

  // Also write it into the Next.js .env.local so NEXT_PUBLIC_CONTRACT_ADDRESS is set.
  const envPath = path.resolve(
    __dirname,
    "../../artifacts/space-shooter/.env.local"
  );
  const currentEnv = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  const updated = currentEnv
    .split("\n")
    .map((line) =>
      line.startsWith("NEXT_PUBLIC_CONTRACT_ADDRESS=")
        ? `NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`
        : line
    )
    .join("\n");
  fs.writeFileSync(envPath, updated);
  console.log("Updated artifacts/space-shooter/.env.local with contract address.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
