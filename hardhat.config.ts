import { HardhatUserConfig, NetworkUserConfig } from "hardhat/types";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const asaTestnet: NetworkUserConfig = {
  url: "https://rpc.astranaut.dev/",
  chainId: 11115,
  accounts: [process.env.KEY_TESTNET!],
};

const bscTestnet: NetworkUserConfig = {
  url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
  chainId: 97,
  accounts: [process.env.KEY_TESTNET!],
};

// const asaMainnet: NetworkUserConfig = {
//   url: "https://rpc.astranaut.io/",
//   chainId: 11110,
//   accounts: [process.env.KEY_MAINNET!],
// };

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    testnet: asaTestnet,
    bsctestnet: bscTestnet,
    // mainnet: asaMainnet,
  },
  solidity: {
    compilers: [
      {
        version: "0.8.4",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.6.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.5.16",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.4.18",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  etherscan: {
    apiKey: {
      testnet: 'abc'
    },
    customChains: [
      {
        network: "testnet",
        chainId: 11115,
        urls: {
          apiURL: "https://explorer.astranaut.dev/api",
          browserURL: "https://explorer.astranaut.dev"
        }
      }
    ]
  }

};

export default config;
