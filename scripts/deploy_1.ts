import { ethers } from 'hardhat';
import { parseEther } from 'ethers/lib/utils';

async function main() {
  const [deployer] = await ethers.getSigners();
  //------------------------- Treasury ---------------------------------------
  const Treasury = await ethers.getContractFactory('Treasury');
  const treasury = await Treasury.deploy();
  await treasury.deployed();
  console.log('Treasury contract deployed to:', treasury.address);

  //------------------------- WASA ---------------------------------------
  const WASA = await ethers.getContractFactory('WASA');
  const wasa = await WASA.deploy();
  await wasa.deployed();
  console.log('WASA contract deployed to:', wasa.address);

  //------------------------- USDT ---------------------------------------
  const USDT = await ethers.getContractFactory('MockERC20');
  const usdt = await USDT.deploy('Tether USD', 'USDT', parseEther('30000000'));
  await usdt.deployed();
  console.log('USDT contract deployed to:', usdt.address);

  //------------------------- Multicall2 ---------------------------------------
  const Multicall2 = await ethers.getContractFactory('Multicall2');
  const multicall2 = await Multicall2.deploy();
  await multicall2.deployed();
  console.log('Multicall2 contract deployed to:', multicall2.address);

  //------------------------- SolarswapFactory ---------------------------------------
  const SolarswapFactory = await ethers.getContractFactory('SolarswapFactory');
  const solarswapFactory = await SolarswapFactory.deploy(deployer.address);
  await solarswapFactory.deployed();
  console.log(
    'SolarswapFactory contract deployed to:',
    solarswapFactory.address
  );
  const INIT_CODE_PAIR_HASH = await solarswapFactory.INIT_CODE_PAIR_HASH();
  console.log('SolarswapFactory INIT_CODE_PAIR_HASH:', INIT_CODE_PAIR_HASH);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
