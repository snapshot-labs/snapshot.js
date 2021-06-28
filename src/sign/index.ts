import { Web3Provider } from '@ethersproject/providers';
import { Proposal, Vote, proposalTypes, voteTypes } from './types';
import hubs from '../hubs.json';

const NAME = 'snapshot';
const VERSION = '0.1.4';

export const domain = {
  name: NAME,
  version: VERSION
  // chainId: 1
};

export default class Client {
  readonly address: string;

  constructor(address: string = hubs[0]) {
    this.address = address;
  }

  async send(envelop) {
    const url = `${this.address}/api/msg`;
    const init = {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(envelop)
    };
    return new Promise((resolve, reject) => {
      fetch(url, init)
        .then((res) => {
          if (res.ok) return resolve(res.json());
          throw res;
        })
        .catch((e) => e.json().then((json) => reject(json)));
    });
  }

  async proposal(web3: Web3Provider, address: string, message: Proposal) {
    const data: any = { domain, types: proposalTypes, message };
    console.log('Sign proposal', JSON.stringify(data));
    const signer = web3.getSigner();
    const sig = await signer._signTypedData(domain, data.types, message);
    console.log('Sig', sig);
    return await this.send({ address, sig, data });
  }

  async vote(web3: Web3Provider, address: string, message: Vote) {
    const data: any = { domain, types: voteTypes, message };
    console.log('Sign vote', JSON.stringify(data));
    const signer = web3.getSigner();
    const sig = await signer._signTypedData(domain, data.types, message);
    console.log('Sig', sig);
    return await this.send({ address, sig, data });
  }
}
