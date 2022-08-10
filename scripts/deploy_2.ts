import { ethers, network } from 'hardhat';
import { parseEther } from 'ethers/lib/utils';
import config from '../config';

async function main() {
  // const [deployer] = await ethers.getSigners();
  const networkName = network.name;

  //------------------------- SolarswapRouter01 ---------------------------------------
  const SolarswapRouter01 = await ethers.getContractFactory(
    'SolarswapRouter01'
  );
  const solarswapRouter01 = await SolarswapRouter01.deploy(
    config.SolarswapFactory[
      networkName as keyof typeof config.SolarswapFactory
    ],
    config.WASA[networkName as keyof typeof config.WASA]
  );
  await solarswapRouter01.deployed();
  console.log(
    'SolarswapRouter01 contract deployed to:',
    solarswapRouter01.address
  );

  //------------------------- SolarswapRouter ---------------------------------------
  const SolarswapRouter = await ethers.getContractFactory('SolarswapRouter');
  const solarswapRouter = await SolarswapRouter.deploy(
    config.SolarswapFactory[
      networkName as keyof typeof config.SolarswapFactory
    ],
    config.WASA[networkName as keyof typeof config.WASA]
  );
  await solarswapRouter.deployed();
  console.log('SolarswapRouter contract deployed to:', solarswapRouter.address);

  //------------------------- MasterChef ---------------------------------------
  const MasterChef = await ethers.getContractFactory('MasterChef');
  const masterChef = await MasterChef.deploy(
    config.Treasury[networkName as keyof typeof config.Treasury],
    config.WASA[networkName as keyof typeof config.WASA],
    parseEther('2'),
    '800000'
  );
  await masterChef.deployed();
  console.log('MasterChef contract deployed to:', masterChef.address);

  // ---------------- Set owner of Treasury, WASA is MasterChef ------------------
  // TODO:
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
