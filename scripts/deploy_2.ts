import { ethers, network } from "hardhat";
import Web3 from "web3";
import {
	MasterChef,
	MockERC20,
	SolarswapFactory,
	SolarswapRouter,
	Treasury,
	WASA,
} from "../typechain-types";
import { parseEther } from "ethers/lib/utils";

const local = network.name === "test";
const url = local
	? "http://127.0.0.1:8545"
	: process.env.RPC_URL || "https://rpc.astranaut.dev";
const provider = new Web3.providers.HttpProvider(url);
const web3 = new Web3(provider);

async function delay(timeout: number) {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(null);
		}, timeout);
	});
}

// async function getNonce(from: string) {
// 	if (local) {
// 		return 0;
// 	}
// 	const astraAddress = ethToAstra(from);
// 	const response: any = await await axios(
// 		`${
// 			process.env.API_URL || "https://api.astranaut.dev"
// 		}/cosmos/auth/v1beta1/accounts/${astraAddress}`
// 	);
// 	return response.data.account.base_account.sequence;
// }

async function nativeTransfer(from: string, to: string, amount: number) {
	const nonce = local ? 0 : await web3.eth.getTransactionCount(from, "latest"); // nonce starts counting from 0
	// const nonce = await getNonce(from);

	const transaction = {
		to,
		value: parseEther(amount.toString()).toString(),
		gas: 300000,
		maxFeePerGas: 2500000000,
		nonce,
	};

	const signedTx = await web3.eth.accounts.signTransaction(
		transaction,
		process.env.KEY_TESTNET!
	);
	try {
		const result = await web3.eth.sendSignedTransaction(
			signedTx.rawTransaction!
		);
		console.log(
			`🎉 Check at https://explorer.astranaut.dev/tx/${result.transactionHash} to view the status of your transfer transaction!`
		);
	} catch (err) {
		console.log(
			"❗Something went wrong while submitting your transaction:",
			err
		);
	}
}

export async function deploy2(
	treasury: Treasury,
	wasa: WASA,
	usdt: MockERC20,
	solarswapFactory: SolarswapFactory,
	solarswapRouter: SolarswapRouter,
	masterChef: MasterChef
) {
	// Init param
	const addressForInitPool = "0x4Fb049407Aa487e0cd88E9c355C75CEe9aa26512"; // any address - _feeToSetter of factory
	const initTreasuryASA = 1;
	const initTreasuryUSDT = 10000000;
	const initPoolAsa = 1;
	const initPoolUsdt = 0.0104; // 250VND/ASA
	const initAllocPoint = 1000;
	const slippage = 0.01;
	const deadline = "0x730584a5";
	const delayTime = 6000;
	try {
		const [deployer] = await ethers.getSigners();
		// ---------------- 1. Set owner of Treasury is MasterChef ------------------
		await treasury.transferOwnership(masterChef.address);
		await delay(delayTime);
		// await wasa.transferOwnership(masterChef.address);
		console.log("Treasury owner", await treasury.owner());
		// console.log("WASA owner", await wasa.owner());

		// // ---------------- 2. Deposit cho Treasury 1 ASA + transfer 10tr USDT cho address tao liquidity ------------------
		await nativeTransfer(deployer.address, treasury.address, initTreasuryASA);
		await delay(delayTime);
		console.log(
			"Treasury ASA balance",
			Number(await ethers.provider.getBalance(treasury.address))
		);

		// addressForInitPool khác address tạo USDT token
		// await usdt.transfer(addressForInitPool, parseEther(initTreasuryUSDT.toString()));
		// await delay(6000);
		// console.log("Treasury USDT balance", Number(await usdt.balanceOf(treasury.address)));

		// // ---------------- 3. Dung MasterChef tao pool 0 voi LP la WASA. allocpoint = 0 ------------------
		await masterChef.add(0, wasa.address, false);
		await delay(delayTime);
		console.log(
			"Masterchef pool length",
			Number(await masterChef.poolLength())
		);

		// ---------------- 4. Init thanh khoan cho ASA-USDT ------------------
		let nonce = await web3.eth.getTransactionCount(deployer.address); // nonce starts counting from 0
		await usdt.approve(
			solarswapRouter.address,
			parseEther(initPoolUsdt.toString()).toString(),
			{
				from: deployer.address,
				nonce,
			}
		);
		await delay(delayTime);
		console.log(
			"usdt approve for spender solarswaprouter",
			await usdt.allowance(deployer.address, solarswapRouter.address)
		);

		nonce = await web3.eth.getTransactionCount(deployer.address); // nonce starts counting from 0

		await solarswapRouter.addLiquidityETH(
			usdt.address,
			parseEther(initPoolUsdt.toString()),
			"0",
			parseEther(initPoolAsa.toString()),
			deployer.address,
			deadline,
			{
				from: deployer.address,
				value: parseEther(initPoolAsa.toString()),
				nonce,
			}
		);
		await delay(delayTime);
		console.log("add liquidity");
		// ---------------- 5. Lay ten cua address ASA-USDT (xem thong tin token cua dia chi cap liquidity tren Explorer) ------------------

		const pair = await solarswapFactory.getPair(wasa.address, usdt.address);
		console.log("Get pair", pair);

		// ---------------- 6. Dung MasterChef tao pool 1 voi LP la ASA-USDT allopoint = 1000 ------------------
		await masterChef.add(initAllocPoint, pair, false);
		await delay(delayTime);
		console.log("Masterchef pool length", await masterChef.poolLength());
	} catch (err) {
		console.error(err);
		process.exitCode = 1;
	}
}
