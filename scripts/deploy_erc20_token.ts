import fs from "fs";
import { ethers, network } from "hardhat";
import { parseEther } from "ethers/lib/utils";
import { DeployedResult } from "../declare";

const OUTPUT = process.cwd() + "/deployed.json";

function writeResult(result: any) {
	fs.writeFileSync(OUTPUT, JSON.stringify(result));
}

function readResult() {
	return JSON.parse(fs.readFileSync(OUTPUT, "utf8"));
}

async function main() {
    let result: DeployedResult | any = {};
    const networkName = network.name;

	//------------------------- ERC20 ---------------------------------------
    const tokenName = "BUSD";
    const tokenSymbol = "BUSD";
    const tokenTotalSupply = parseEther("30000000");
	const TOKEN = await ethers.getContractFactory("MockERC20");
	const token = await TOKEN.deploy(tokenName, tokenSymbol, tokenTotalSupply);
	await token.deployed();
	// result[tokenSymbol] = {
	// 	...(result[tokenSymbol] || {}),
	// 	[networkName]: {
	// 		address: token.address,
	// 		arguments: [tokenName, tokenSymbol, parseEther("30000000").toString()],
	// 	},
	// };
	console.log(`TOKEN ${tokenName} deployed to: `, token.address);

	// Save data
	// writeResult(result);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
