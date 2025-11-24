const hre = require("hardhat");

async function main() {
    console.log("Starting deployment of Unified Voting System...\n");
    
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString(), "\n");

    console.log("Step 1: Deploying ETI Token...");
    
    const initialSupply = 1000000; 
    const ETIToken = await hre.ethers.getContractFactory("ETIToken");
    const etiToken = await ETIToken.deploy(initialSupply);
    await etiToken.deployed();
    
    console.log("   ETI Token deployed to:", etiToken.address);
    console.log("   Initial Supply:", initialSupply, "ETI tokens");
    console.log("   Owner:", deployer.address, "\n");

    console.log("Step 2: Deploying Unified Voting Contract...");
    
    const candidateNames = ["Mark", "Mike", "Henry", "Rock", "Sarah"];
    const durationInMinutes = 10000; 
    
    const Voting = await hre.ethers.getContractFactory("Voting");
    const voting = await Voting.deploy(
        candidateNames,
        durationInMinutes
    );
    await voting.deployed();
    
    console.log("   Voting Contract deployed to:", voting.address);

    console.log("Step 3: Setting up ETI Token permissions...");
    
    const setVotingTx = await etiToken.setVotingContract(voting.address);
    await setVotingTx.wait();
    
    console.log("   Voting contract authorized to mint ETI tokens\n");

    console.log("Step 4: Enabling Rewards System...");
    
    const rewardAmount = hre.ethers.utils.parseEther("10");
    const enableRewardsTx = await voting.enableRewards(etiToken.address, rewardAmount);
    await enableRewardsTx.wait();
    
    console.log("   Rewards enabled with", hre.ethers.utils.formatEther(rewardAmount), "ETI per vote\n");

    const votingStart = await voting.votingStart();
    const votingEnd = await voting.votingEnd();
    const rewardPerVote = await voting.rewardPerVote();
    const merkleStatus = await voting.getMerkleStatus();
    
    const startDate = new Date(votingStart.toNumber() * 1000);
    const endDate = new Date(votingEnd.toNumber() * 1000);


    console.log("\n" + "=".repeat(70));
    console.log("Deployment Completed Successfully!");
    console.log("=".repeat(70));
    
    console.log("\nContract Addresses (SAVE THESE!):");
    console.log("┌────────────────────────────────────────────────────────────────┐");
    console.log("│ ETI Token:        ", etiToken.address.padEnd(42), "│");
    console.log("│ Voting Contract:  ", voting.address.padEnd(42), "│");
    console.log("│ Owner:            ", deployer.address.padEnd(42), "│");
    console.log("└────────────────────────────────────────────────────────────────┘");
   
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Deployment failed:");
        console.error(error);
        process.exit(1);
    });