import { exec } from "child_process";
import { network } from "hardhat";
import { DeployedResult, Contract } from "../declare";
import deployed from "../deployed.json";

export async function deploy3(result: DeployedResult) {
	// ---------------- 8. Verify contract da deploy (lay contract address trong file o buoc 7) ------------------
	result = result ? result : JSON.parse(JSON.stringify(deployed));
	const addresses = Object.keys(result);
	addresses.forEach((key: string) => {
		if (key == "INIT_CODE_PAIR_HASH") return;
		const networkName = network.name;
		const data: Contract = result[key][networkName];
		const args: string[] = data.arguments.map((argument: any) => `'${argument}'`);
		exec(
			`npx hardhat verify --network ${network.name} ${data.address} ${args.join(" ")}`,
			(error, stdout, stderr) => {
				if (error) {
					console.error(`exec error: ${error}`);
					return;
				}
				console.log(`stdout verify: ${data.address} ${stdout}`);
				console.error(`stderr: ${stderr}`);
			}
		);
	});
}
