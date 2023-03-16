require("@nomicfoundation/hardhat-toolbox");
const dotenv = require('dotenv');

dotenv.config()

module.exports = {
  solidity: "0.8.18",
  networks: {
    goerli: {
      url: process.env.GOERLI_RPC || '',
      chainId: 5,
      accounts: [process.env.GOERLI_PRIVATE_KEY || ''],
    },
  }
};
