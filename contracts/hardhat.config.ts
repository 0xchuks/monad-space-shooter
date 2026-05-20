import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY ?? "";

if (!SIGNER_PRIVATE_KEY) {
  console.warn("WARNING: SIGNER_PRIVATE_KEY is not set. Deployment will fail.");
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.27",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    monadTestnet: {
      url: "https://testnet-rpc.monad.xyz",
      chainId: 10143,
      accounts: SIGNER_PRIVATE_KEY ? [`0x${SIGNER_PRIVATE_KEY.replace(/^0x/, "")}`] : [],
    },
  },
};

export default config;
