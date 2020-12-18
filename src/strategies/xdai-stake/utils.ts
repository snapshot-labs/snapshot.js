import { BigNumber } from '@ethersproject/bignumber';

const ZERO = BigNumber.from(0);
const ONE = BigNumber.from(1);
const TWO = BigNumber.from(2);
const THREE = BigNumber.from(3);

export const squareRoot = (y) => {
  let z = ZERO;
  if (y.gt(THREE)) {
    z = y;
    let x = y.div(TWO).add(ONE);
    while (x.lt(z)) {
      z = x;
      x = y.div(x).add(x).div(TWO);
    }
  } else if (!y.isZero()) {
    z = ONE;
  }
  return z;
};

const YEAR = BigNumber.from(31536000); // year in seconds
const ONE_ETHER = BigNumber.from('1000000000000000000');
const MAX_EMISSION_RATE = BigNumber.from('150000000000000000'); // 15%

export const calculateEmission = (
  deposit,
  timePassed,
  sigmoidParams,
  totalSupplyFactor,
  totalSupply,
  totalStaked
) => {
  const d = timePassed.sub(sigmoidParams.b);
  let personalEmissionRate = ZERO;
  if (d.gt(ZERO)) {
    personalEmissionRate = sigmoidParams.a
      .mul(d)
      .div(squareRoot(d.pow(TWO).add(sigmoidParams.c)));
  }
  const targetTotalStaked = totalSupply.mul(totalSupplyFactor).div(ONE_ETHER);
  let generalEmissionRate = MAX_EMISSION_RATE.div(TWO);
  if (totalStaked.lt(targetTotalStaked)) {
    generalEmissionRate = generalEmissionRate
      .mul(totalStaked)
      .div(targetTotalStaked);
  }
  if (personalEmissionRate.isZero()) {
    generalEmissionRate = ZERO;
  }
  const emissionRate = personalEmissionRate.add(generalEmissionRate);
  const emission = deposit
    .mul(emissionRate)
    .mul(timePassed)
    .div(YEAR.mul(ONE_ETHER));
  return emission;
};
