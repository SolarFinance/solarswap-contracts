import fs from "fs";
import { ethers, network } from "hardhat";
import { parseEther } from "ethers/lib/utils";
import { deploy2 } from "./deploy_2";
import { deploy3 } from "./deploy_3";
import { DeployedResult } from "../declare";

const OUTPUT = process.cwd() + "/deployed.json";

function writeResult(result: any) {
	fs.writeFileSync(OUTPUT, JSON.stringify(result));
}

async function main() {
	let result: DeployedResult | any = {};
	const networkName = network.name;

	const [deployer] = await ethers.getSigners();
	//------------------------- Treasury ---------------------------------------
	const Treasury = await ethers.getContractFactory("Treasury");
	const treasury = await Treasury.deploy();
	await treasury.deployed();
	result["Treasury"] = {
		...(result["Treasury"] || {}),
		[networkName]: {
			address: treasury.address,
			arguments: [],
		},
	};
	console.log("Treasury contract deployed to:", treasury.address);

	//------------------------- WASA ---------------------------------------
	const WASA = await ethers.getContractFactory("WASA");
	const wasa = await WASA.deploy();
	await wasa.deployed();
	result["WASA"] = {
		...(result["WASA"] || {}),
		[networkName]: {
			address: wasa.address,
			arguments: [],
		},
	};
	console.log("WASA contract deployed to:", wasa.address);

	//------------------------- USDT ---------------------------------------
	const USDT = await ethers.getContractFactory("MockERC20");
	const usdt = await USDT.deploy("Tether USD", "USDT", parseEther("30000000"));
	await usdt.deployed();
	result["USDT"] = {
		...(result["USDT"] || {}),
		[networkName]: {
			address: usdt.address,
			arguments: ["Tether USD", "USDT", parseEther("30000000").toString()],
		},
	};
	console.log("USDT contract deployed to:", usdt.address);

	//------------------------- Multicall2 ---------------------------------------
	const Multicall2 = await ethers.getContractFactory("Multicall2");
	const multicall2 = await Multicall2.deploy();
	await multicall2.deployed();
	result["multicall2"] = {
		...(result["multicall2"] || {}),
		[networkName]: {
			address: multicall2.address,
			arguments: [],
		},
	};
	console.log("Multicall2 contract deployed to:", multicall2.address);

	//------------------------- SolarswapFactory ---------------------------------------
	const SolarswapFactory = await ethers.getContractFactory("SolarswapFactory");
	const solarswapFactory = await SolarswapFactory.deploy(deployer.address);
	await solarswapFactory.deployed();
	result["SolarswapFactory"] = {
		...(result["SolarswapFactory"] || {}),
		[networkName]: {
			address: solarswapFactory.address,
			arguments: [deployer.address],
		},
	};

	console.log("SolarswapFactory contract deployed to:", solarswapFactory.address);
	const INIT_CODE_PAIR_HASH = await solarswapFactory.INIT_CODE_PAIR_HASH();
	result["INIT_CODE_PAIR_HASH"] = {
		...(result["INIT_CODE_PAIR_HASH"] || {}),
		[networkName]: {
			address: INIT_CODE_PAIR_HASH,
			arguments: [],
		},
	};
	console.log("SolarswapFactory INIT_CODE_PAIR_HASH:", INIT_CODE_PAIR_HASH);

	//------------------------- SolarswapRouter01 ---------------------------------------
	const SolarswapRouter01 = await ethers.getContractFactory("SolarswapRouter01");
	const solarswapRouter01 = await SolarswapRouter01.deploy(
		solarswapFactory.address,
		wasa.address
	);
	await solarswapRouter01.deployed();
	result["SolarswapRouter01"] = {
		...(result["SolarswapRouter01"] || {}),
		[networkName]: {
			address: solarswapRouter01.address,
			arguments: [solarswapFactory.address, wasa.address],
		},
	};

	console.log("SolarswapRouter01 contract deployed to:", solarswapRouter01.address);

	//------------------------- SolarswapRouter ---------------------------------------
	const SolarswapRouter = await ethers.getContractFactory("SolarswapRouter");
	const solarswapRouter = await SolarswapRouter.deploy(solarswapFactory.address, wasa.address);
	await solarswapRouter.deployed();
	result["SolarswapRouter"] = {
		...(result["SolarswapRouter"] || {}),
		[networkName]: {
			address: solarswapRouter.address,
			arguments: [solarswapFactory.address, wasa.address],
		},
	};
	console.log("SolarswapRouter contract deployed to:", solarswapRouter.address);

	//------------------------- MasterChef ---------------------------------------
	const MasterChef = await ethers.getContractFactory("MasterChef");
	const masterChef = await MasterChef.deploy(
		treasury.address,
		wasa.address,
		parseEther("2"),
		"800000"
	);

	await masterChef.deployed();
	result["MasterChef"] = {
		...(result["MasterChef"] || {}),
		[networkName]: {
			address: masterChef.address,
			arguments: [treasury.address, wasa.address, parseEther("2").toString(), "800000"],
		},
	};
	console.log("MasterChef contract deployed to:", masterChef.address);

	// Save data
	writeResult(result);

	// Continue deploy another smartcontract
	await deploy2(treasury, wasa, usdt, solarswapFactory, solarswapRouter, masterChef);
	// // Verify smartcontract
	await deploy3(result);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
