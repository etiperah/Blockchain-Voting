require('dotenv').config();
require("@nomiclabs/hardhat-ethers");

const { API_URL, PRIVATE_KEY } = process.env;

module.exports = {
    solidity: "0.8.11",
    defaultNetwork: "sepolia",
    networks: {
        hardhat: {},
        localhost: {
            url: "http://127.0.0.1:8545"
        },
        sepolia: {
            url: API_URL,
            accounts: [`0x${PRIVATE_KEY}`],
            gas: "auto",
            gasPrice: "auto"
        }
    },
};
