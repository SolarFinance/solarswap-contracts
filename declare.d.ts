export interface Contract {
	address: string!;
	arguments: string[];
}

interface ContractMultiEnv {
	test: Contract!;
	testnet: Contract!;
	mainnet: Contract!;
	bsctestnet: Contract!;
	[key: string]: Contract!;
}

export interface DeployedResult {
	Treasury: ContractMultiEnv;
	WASA: ContractMultiEnv;
	USDT: ContractMultiEnv;
	Multicall2: ContractMultiEnv;
	SolarswapFactory: ContractMultiEnv;
	INIT_CODE_PAIR_HASH: ContractMultiEnv;
	SolarswapRouter01: ContractMultiEnv;
	SolarswapRouter: ContractMultiEnv;
	MasterChef: ContractMultiEnv;
	USDT_ASA: ContractMultiEnv;
	[key: string]: ContractMultiEnv;
}
