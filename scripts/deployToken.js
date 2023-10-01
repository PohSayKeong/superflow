// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat")
const fs = require("fs")

async function main() {
	const usdt = await hre.ethers.deployContract("TetherToken", [
		hre.ethers.parseEther("1000"),
		"Tether USD",
		"USDT",
		6,
	])

	await usdt.waitForDeployment()

	console.log(`USDT deployed to ${usdt.target}`)

	const usdtData = {
		address: usdt.target,
	}

	fs.writeFileSync("./deployment/usdt.json", JSON.stringify(usdtData))
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})
