import { Web3Provider } from '@ethersproject/providers';
import { strategy as ethReceivedStrategy } from '../eth-received';
export const author = 'mccallofthewild';
export const version = '0.1.0';

const ethCharities = [
  ['GiveDirectly', '0xc7464dbcA260A8faF033460622B23467Df5AEA42'],
  ['Unsung.org', '0x02a13ED1805624738Cc129370Fee358ea487B0C6'],
  ['Heifer.org', '0xD3F81260a44A1df7A7269CF66Abd9c7e4f8CdcD1'],
  ['GraceAid.org.uk', '0x236dAA98f115caa9991A3894ae387CDc13eaaD1B'],
  ['SENS.org', '0x542EFf118023cfF2821b24156a507a513Fe93539'],
  ['350.org', '0x50990F09d4f0cb864b8e046e7edC749dE410916b'],
  ['EFF.org', '0xb189f76323678E094D4996d182A792E52369c005'],
  ['WikiLeaks', '0xE96E2181F6166A37EA4C04F6E6E2bD672D72Acc1'],
  ['GiveWell.org', '0x7cF2eBb5Ca55A8bd671A020F8BDbAF07f60F26C1'],
  ['CoolEarth.org', '0x3c8cB169281196737c493AfFA8F49a9d823bB9c5'],
  ['Run2Rescue.org', '0xd17bcbFa6De9E3741aa43Ed32e64696F6a9FA996'],
  ['Archive.org', '0xFA8E3920daF271daB92Be9B87d9998DDd94FEF08']
];

export async function strategy(
  ...args: [string, string, Web3Provider, string[], { coeff?: number }, number]
) {
  const [space, network, provider, addresses, options, snapshot] = args;
  const { coeff = 100 } = options;
  return ethReceivedStrategy(
    space,
    network,
    provider,
    addresses,
    {
      receivingAddresses: ethCharities.map(([, address]) => address),
      coeff
    },
    snapshot
  );
}
