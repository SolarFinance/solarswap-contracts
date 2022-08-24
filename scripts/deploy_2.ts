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
const url = local ? "http://127.0.0.1:8545" : process.env.RPC_URL || "https://rpc.astranaut.dev";
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
		gas: 30000,
		maxFeePerGas: 2500000000,
		nonce,
	};

	const signedTx = await web3.eth.accounts.signTransaction(transaction, process.env.KEY_TESTNET!);
	try {
		const result = await web3.eth.sendSignedTransaction(signedTx.rawTransaction!);
		console.log(
			`🎉 Check at https://explorer.astranaut.dev/tx/${result.transactionHash} to view the status of your transfer transaction!`
		);
	} catch (err) {
		console.log("❗Something went wrong while submitting your transaction:", err);
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
	const addressForInitPool = "0xc72a12090127B7E02A7544036b3D5872d9BAAD6C";
	const initTreasuryASA = 10;
	const initTreasuryUSDT = 10000000;
	const initPoolAsa = 1;
	const initPoolUsdt = 0.031;
	const initAllocPoint = 1000;
	const slippage = 0.01;
	const deadline = "0x730584a5";
	try {
		const [deployer] = await ethers.getSigners();
		// ---------------- 1. Set owner of Treasury, WASA is MasterChef ------------------
		await treasury.transferOwnership(masterChef.address);
		await wasa.transferOwnership(masterChef.address);
		console.log("Treasury owner", await treasury.owner());
		console.log("WASA owner", await wasa.owner());

		// // ---------------- 2. Deposit cho Treasury 1 ASA + transfer 10tr USDT cho address tao liquidity ------------------
		await delay(2000);
		await nativeTransfer(deployer.address, treasury.address, initTreasuryASA);
		console.log("Treasury ASA balance", await treasury.getBalance());

		await usdt.transfer(addressForInitPool, parseEther(initTreasuryUSDT.toString()));
		console.log("Treasury USDT balance", await usdt.balanceOf(treasury.address));

		// // ---------------- 3. Dung MasterChef tao pool 0 voi LP la WASA. allocpoint = 0 ------------------
		await masterChef.add(0, wasa.address, false);
		console.log("Masterchef pool length", await masterChef.poolLength());

		// ---------------- 4. Init thanh khoan cho ASA-USDT ------------------
		await delay(4000);
		let nonce = await web3.eth.getTransactionCount(deployer.address); // nonce starts counting from 0
		await usdt.approve(
			solarswapRouter.address,
			parseEther(initPoolUsdt.toString()).toString(),
			{
				from: deployer.address,
				nonce,
			}
		);
		console.log(
			"usdt approve for spender solarswaprouter",
			await usdt.allowance(deployer.address, solarswapRouter.address)
		);

		await delay(4000);
		nonce = await web3.eth.getTransactionCount(deployer.address); // nonce starts counting from 0
		await solarswapRouter.addLiquidityETH(
			usdt.address,
			parseEther(initPoolUsdt.toString()),
			parseEther((initPoolUsdt * (1 - slippage)).toString()),
			parseEther(initPoolAsa.toString()),
			deployer.address,
			deadline,
			{ from: deployer.address, value: parseEther(initPoolAsa.toString()), nonce }
		);
		console.log("add liquidity");
		// ---------------- 5. Lay ten cua address ASA-USDT (xem thong tin token cua dia chi cap liquidity tren Explorer) ------------------
		await solarswapFactory.createPair(wasa.address, usdt.address, {
			from: deployer.address,
			gasLimit: 2500000000,
			gasPrice: 30000,
		});
		console.log("Create pair WASA-USDT");

		const pair = await solarswapFactory.getPair(wasa.address, usdt.address);
		console.log("Get pair", pair);

		// ---------------- 6. Dung MasterChef tao pool 1 voi LP la ASA-USDT allopoint = 1000 ------------------
		await masterChef.add(initAllocPoint, pair, false);
		console.log("Masterchef pool length", await masterChef.poolLength());
	} catch (err) {
		console.error(err);
		process.exitCode = 1;
	}
}
