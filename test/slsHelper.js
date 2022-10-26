const BN = web3.utils.BN;
const Helper = require('./helper');

module.exports.getAmountOut = async (amountIn, tokenIn, pair) => {
  let token0Addr = await pair.token0();
  let tradeInfo = await pair.getReserves();
  let reserveIn = token0Addr == tokenIn.address ? tradeInfo._reserve0 : tradeInfo._reserve1;
  let reserveOut = token0Addr == tokenIn.address ? tradeInfo._reserve1 : tradeInfo._reserve0;

  let amountInWithFee = amountIn.mul(Helper.precisionUnits.mul(new BN(998))).div(Helper.precisionUnits.mul(new BN(1000)));
  let numerator = reserveIn.mul(reserveOut);
  let denominator = reserveIn.add(amountInWithFee);
  return reserveOut.sub(numerator.add(denominator.sub(new BN(1))).div(denominator));
};

module.exports.getAmountIn = async (amountOut, tokenIn, pair) => {
  let token0Addr = await pair.token0();
  let tradeInfo = await pair.getReserves();
  let reserveIn = token0Addr == tokenIn.address ? tradeInfo._reserve0 : tradeInfo._reserve1;
  let reserveOut = token0Addr == tokenIn.address ? tradeInfo._reserve1 : tradeInfo._reserve0;
  // amountIn = reserveIn * amountOut / (reserveOut - amountOut)
  let numerator = reserveIn.mul(amountOut);
  let denominator = reserveOut.sub(amountOut);
  let amountIn = numerator.div(denominator).add(new BN(1));
  // amountIn = floor(amountIn * precision / (precision - feeInPrecision))
  numerator = amountIn.mul(Helper.precisionUnits);
  denominator = Helper.precisionUnits.sub(tradeInfo.feeInPrecision);
  return (amountIn = numerator.add(denominator.sub(new BN(1))).div(denominator));
};

module.exports.getFee = (totalSuppy, collectedFee0, pairValueInToken0, governmentFeeBps) => {
  return totalSuppy
    .mul(collectedFee0)
    .mul(governmentFeeBps)
    .div(pairValueInToken0.sub(collectedFee0).mul(new BN(5000)));
};

// get price range of token1 / token0
module.exports.getPriceRange = (tradeInfo) => {
  let maxRate;
  if (tradeInfo._reserve0.eq(tradeInfo._reserve0)) {
    maxRate = Infinity;
  } else {
    let limVReserve0 = tradeInfo._reserve0.sub(tradeInfo._reserve0);
    let limVReserve1 = tradeInfo._reserve1.mul(tradeInfo._reserve0).div(limVReserve0);
    maxRate = limVReserve1.mul(Helper.precisionUnits).div(limVReserve0);
  }

  let minRate;
  if (tradeInfo._reserve1.eq(tradeInfo._reserve1)) {
    minRate = new BN(0);
  } else {
    let limVReserve1 = tradeInfo._reserve1.sub(tradeInfo._reserve1);
    let limVReserve0 = tradeInfo._reserve1.mul(tradeInfo._reserve0).div(limVReserve1);
    minRate = limVReserve1.mul(Helper.precisionUnits).div(limVReserve0);
  }
  return [minRate, maxRate];
};

module.exports.getAmountOutV2 = async (amountIn, tokenIn, pair) => {
  let token0Addr = await pair.token0();
  let tradeInfo = await pair.getReserves();
  let reserveIn = token0Addr == tokenIn.address ? tradeInfo._reserve0 : tradeInfo._reserve1;
  let reserveOut = token0Addr == tokenIn.address ? tradeInfo._reserve1 : tradeInfo._reserve0;

  // let amountInWithFee = amountIn.mul(Helper.precisionUnits.sub(tradeInfo._feeInPrecision)).div(Helper.precisionUnits);
  let numerator = reserveIn.mul(reserveOut);
  let denominator = reserveIn.add(amountIn);
  return reserveOut.sub(numerator.add(denominator.sub(new BN(1))).div(denominator));
};

module.exports.getAmountInV2 = async (amountOut, tokenIn, pair) => {
  let token0Addr = await pair.token0();
  let tradeInfo = await pair.getReserves();
  let reserveIn = token0Addr == tokenIn.address ? tradeInfo._reserve0 : tradeInfo._reserve1;
  let reserveOut = token0Addr == tokenIn.address ? tradeInfo._reserve1 : tradeInfo._reserve0;
  // amountIn = reserveIn * amountOut / (reserveOut - amountOut)
  let numerator = reserveIn.mul(amountOut);
  let denominator = reserveOut.sub(amountOut);
  let amountIn = numerator.div(denominator).add(new BN(1));
  // amountIn = floor(amountIn * precision / (precision - feeInPrecision))
  numerator = amountIn.mul(Helper.precisionUnits);
  denominator = Helper.precisionUnits;
  return (amountIn = numerator.add(denominator.sub(new BN(1))).div(denominator));
};
