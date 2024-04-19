const hre = require("hardhat");

async function main() {
    const quiz = await hre.ethers.deployContract("Quiz");
  
    console.log(`quiz deployed to ${quiz.target}`);
  }
  
  // We recommend this pattern to be able to use async/await everywhere
  // and properly handle errors.
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
  