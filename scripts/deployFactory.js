// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat")
const fs = require("fs")
const { address } = require("../deployment/usdt.json")
const { parseEther } = require("ethers")

async function main() {
	const usdt = await hre.ethers.getContractAt("TetherToken", address)
	const user = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
	const usdtxAddress = "0xEBd654d18a2387c6aae129005b31aC415F1204aa"
	const cfaAddress = "0x59b670e9fA9D0A427751Af201D676719a970857b"

	// approve super token contract
	const allowance = await usdt.allowance(user, usdtxAddress)
	if (!allowance) {
		await usdt.approve(usdtxAddress, hre.ethers.MaxUint256)
	}

	// upgrade to super token
	const usdtxContract = await hre.ethers.getContractAt(
		[
			"function upgrade(uint256 amount) external",
			"function balanceOf(address account) external view returns(uint256 balance)",
			"function approve(address spender, uint256 amount) returns(bool)",
			"function allowance(address owner, address spender) external view returns(uint256 balance)",
		],
		usdtxAddress
	)

	await usdtxContract.upgrade(parseEther("10000"))

	const fintechFactory = await hre.ethers.deployContract("subscriptionFactory")

	await fintechFactory.waitForDeployment()

	console.log(`Fintech Factory deployed to ${fintechFactory.target}`)

	const factoryData = {
		address: fintechFactory.target,
	}

	fs.writeFileSync(
		"./deployment/fintechfactory.json",
		JSON.stringify(factoryData)
	)

	// const cfaContract = await hre.ethers.getContractAt(
	// 	[
	// 		"function grantPermissions(address token, address flowOperator) external returns (bool)",
	// 		"function createFlow(address token, address sender, address receiver, int96 flowrate, bytes memory userData) external returns (bool)",
	// 		"function getFlowrate(address token, address sender, address receiver) external view returns(int96 flowrate)",
	// 		"function getFlowOperatorPermissions(address token, address sender, address flowOperator) external view returns (uint8 permissions, int96 flowrateAllowance)",
	// 	],
	// 	cfaAddress
	// )
	// await cfaContract.grantPermissions(usdtxAddress, cfaAddress)

	// const perm = await cfaContract.getFlowOperatorPermissions(
	// 	usdtxAddress,
	// 	user,
	// 	cfaAddress
	// )
	// console.log(perm)

	// const flow = await cfaContract.createFlow(
	// 	usdtxAddress,
	// 	user,
	// 	"0xD4eF5bFBe5925B905BD3EC0921bFe28b04ac61aE",
	// 	"100000000000000000",
	// 	"0x00"
	// )
	// console.log(flow)
	// const rc = await flow.wait()
	// console.log(rc)
	// const rate = await cfaContract.getFlowrate(
	// 	usdtxAddress,
	// 	user,
	// 	"0xD4eF5bFBe5925B905BD3EC0921bFe28b04ac61aE"
	// )
	// console.log(rate)

	// const subscriptionContract = await hre.ethers.getContractAt(
	// 	"Subscription",
	// 	"0xD4eF5bFBe5925B905BD3EC0921bFe28b04ac61aE"
	// )
	// const a = await subscriptionContract.renewalFlow(
	// 	"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
	// 	0,
	// 	0,
	// 	"0x00"
	// )
	// console.log(a)

	// const balance = await usdtxContract.balanceOf(user)
	// console.log(balance)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})
