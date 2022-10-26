const TestToken = artifacts.require('TestToken');
const SolarswapFactory = artifacts.require('SolarswapFactory');

const Helper = require('./helper');

const {expectRevert, constants} = require('@openzeppelin/test-helpers');
const {assert} = require('chai');
const BN = web3.utils.BN;

let tokenA;
let tokenB;
let factory;
let feeToSetter;
let feeTo;

contract('SolarswapFactory', function (accounts) {
  before('init', async () => {
    feeToSetter = accounts[1];
    feeTo = accounts[2];
    factory = await SolarswapFactory.new(feeToSetter);

    tokenA = await TestToken.new('test token A', 'A', Helper.expandTo18Decimals(10000));
    tokenB = await TestToken.new('test token B', 'B', Helper.expandTo18Decimals(10000));
  });

  it('create pair', async () => {
    await expectRevert(factory.createPair(tokenA.address, constants.ZERO_ADDRESS), 'Solarswap: ZERO_ADDRESS');

    await expectRevert(factory.createPair(tokenA.address, tokenA.address), 'Solarswap: IDENTICAL_ADDRESSES');

    /// create pair
    await factory.createPair(tokenA.address, tokenB.address);
    await expectRevert(factory.createPair(tokenA.address, tokenB.address), 'Solarswap: PAIR_EXISTS');
    Helper.assertEqual(await factory.allPairsLength(), 1);

    let pair0 = await factory.allPairs(new BN(0));
    let pairToCheck = await factory.getPair(tokenA.address, tokenB.address);
    assert(pairToCheck == pair0, 'pair is not asserted');
  });

  it('set feeToSetter', async () => {
    let newFeeToSetter = accounts[3];
    await expectRevert(factory.setFeeToSetter(newFeeToSetter), 'Solarswap: FORBIDDEN');
    await factory.setFeeToSetter(newFeeToSetter, {from: feeToSetter});

    assert((await factory.feeToSetter()) == newFeeToSetter, 'unexpected feeToSetter');
  });
});
