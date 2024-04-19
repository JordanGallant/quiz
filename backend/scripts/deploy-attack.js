const hre = require("hardhat");

async function main() {
  const Attack = await hre.ethers.getContractFactory("Attack");
  const attack = await Attack.deploy("0x0E75DD59AF6298AA22a408c5caEC37b15c4ee184");
  
  console.log(`attack deployed to ${attack.target}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});