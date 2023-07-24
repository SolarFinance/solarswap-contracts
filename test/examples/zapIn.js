const { artifacts, contract } = require("hardhat");
const Helper = require("./../helper");
const { MaxUint256 } = require("./../helper");
const BN = web3.utils.BN;
const { ecsign } = require("ethereumjs-util");

const { expectEvent } = require("@openzeppelin/test-helpers");

const ZapIn = artifacts.require("ZapIn");
const SLSRouter = artifacts.require("SolarswapRouter");
const SLSpair = artifacts.require("SolarswapPair");
const SLSFactory = artifacts.require("SolarswapFactory");
const WETH = artifacts.require("WASA");
const TestToken = artifacts.require("TestToken");

contract("ZapIn", (accounts) => {
  let token;
  let weth;
  let zapIn;
  let pair;
  let token0Addr;

  describe("ZapIn Contract Testing", async () => {
    beforeEach("basic setup", async () => {
      token = await TestToken.new("tst", "A", Helper.expandTo18Decimals(10000));
      console.log("token A address :>> ", token.address);
      weth = await WETH.new();
      console.log("weth.address :>> ", weth.address);

      let factory = await SLSFactory.new(accounts[0], accounts[2]);

      let router = await SLSRouter.new(factory.address, weth.address);
      // set up pair with 100 token and 30 eth
      await token.approve(router.address, MaxUint256);
      await router.addLiquidityETH(
        token.address,
        Helper.precisionUnits.mul(new BN(100)),
        new BN(0),
        new BN(0),
        accounts[0],
        MaxUint256,
        {
          value: Helper.expandTo18Decimals(30),
        }
      );
      pairAddress = await factory.getPair(token.address, weth.address);
      console.log("pairAddress :>> ", pairAddress);
      pair = await SLSpair.at(pairAddress);
      token0Addr = await pair.token0();
      console.log("token0Addr :>> ", token0Addr);
      // swap to change the ratio of the pair a bit
      await router.swapExactETHForTokens(
        new BN(0),
        [weth.address, token.address],
        accounts[0],
        MaxUint256,
        { value: Helper.expandTo18Decimals(7) }
      );
      zapIn = await ZapIn.new(factory.address, weth.address);
    });

    it("#zapIn", async () => {
      await token.approve(zapIn.address, MaxUint256, { from: accounts[1] });
      let userIn = Helper.expandTo18Decimals(5);
      await token.transfer(accounts[1], userIn);

      let swapAmounts = await zapIn.calculateSwapAmounts(
        token.address,
        weth.address,
        pair.address,
        userIn
      );
      let result = await zapIn.zapIn(
        token.address,
        weth.address,
        userIn,
        pair.address,
        accounts[1],
        1,
        MaxUint256,
        {
          from: accounts[1],
        }
      );

      expectEvent.inTransaction(result.tx, pair, "Swap", {
        amount0In: token0Addr === token.address ? swapAmounts[0] : new BN(0),
        amount1In: token0Addr === token.address ? new BN(0) : swapAmounts[0],
        amount0Out: token0Addr === token.address ? new BN(0) : swapAmounts[1],
        amount1Out: token0Addr === token.address ? swapAmounts[1] : new BN(0),
      });
    });

    it("#zapInEth", async () => {
      let userIn = Helper.expandTo18Decimals(3);
      await zapIn.zapInEth(
        token.address,
        pair.address,
        accounts[1],
        1,
        MaxUint256,
        {
          from: accounts[1],
          value: userIn,
        }
      );
      Helper.assertGreater(await pair.balanceOf(accounts[1]), new BN(0));
    });

    it("#zapOut", async () => {
      let userIn = Helper.expandTo18Decimals(3);
      await zapIn.zapInEth(
        token.address,
        pair.address,
        accounts[1],
        1,
        MaxUint256,
        {
          from: accounts[1],
          value: userIn,
        }
      );

      await pair.approve(zapIn.address, MaxUint256, { from: accounts[1] });

      let liquidity = await pair.balanceOf(accounts[1]);

      let zapOutAmount = await zapIn.calculateZapOutAmount(
        token.address,
        weth.address,
        pair.address,
        liquidity
      );

      let beforeBalance = await Helper.getBalancePromise(accounts[1]);
      await zapIn.zapOutEth(
        token.address,
        liquidity,
        pair.address,
        accounts[1],
        1,
        MaxUint256,
        {
          from: accounts[1],
          gasPrice: new BN(0),
        }
      );
      let afterBalance = await Helper.getBalancePromise(accounts[1]);
      Helper.assertEqual(
        afterBalance.sub(beforeBalance),
        zapOutAmount,
        "unexpected zapOut amout"
      );
    });
  });
});
