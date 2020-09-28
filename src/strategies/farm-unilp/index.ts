import { formatUnits } from '@ethersproject/units';
import { multicall } from '../../utils';
import abi from './NoMintRewardPool.json';
import { Interface } from '@ethersproject/abi';
import { Contract } from '@ethersproject/contracts';
import uniLpAbi from './UniLPABI.json';

const UNISWAP_MINT_CONTRACT = '0x514906FC121c7878424a5C928cad1852CC545892';
const UNISWAP_DECIMAL = 18;

export async function strategy(network, provider, addresses, options, snapshot) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  //Get the UNI LP quantity for each addresses
  const response = await multicall(
    network,
    provider,
    abi,
    addresses.map((address: any) => [options.address, 'balanceOf', [address]]),
    { blockTag }
  );

  const contractUni = new Contract(UNISWAP_MINT_CONTRACT, uniLpAbi, provider);
  const totalSupply = await contractUni.totalSupply();
  const getReserves = await contractUni.getReserves();
  const totalSupplyFormated = parseFloat(formatUnits(totalSupply, UNISWAP_DECIMAL))
  const farmSupplyFormated = parseFloat(formatUnits(getReserves._reserve0, options.decimals))
  return Object.fromEntries(
    response.map((value, i) => [
      addresses[i],
      (parseFloat(formatUnits(value.toString(), options.decimals))/totalSupplyFormated)*farmSupplyFormated
    ])
  );
}