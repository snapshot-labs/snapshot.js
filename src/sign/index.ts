import fetch from 'cross-fetch';
import { Web3Provider } from '@ethersproject/providers';
import {
  Space,
  Proposal,
  CancelProposal,
  Vote,
  spaceTypes,
  proposalTypes,
  cancelProposalTypes,
  voteTypes,
  voteArrayTypes,
  voteStringTypes
} from './types';
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

  async sign(web3: Web3Provider, address: string, message, types) {
    const data: any = { domain, types, message };
    const signer = web3.getSigner();
    const sig = await signer._signTypedData(domain, data.types, message);
    console.log('Sign', { address, sig, data });
    return await this.send({ address, sig, data });
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

  async space(web3: Web3Provider, address: string, message: Space) {
    return await this.sign(web3, address, message, spaceTypes);
  }

  async proposal(web3: Web3Provider, address: string, message: Proposal) {
    return await this.sign(web3, address, message, proposalTypes);
  }

  async cancelProposal(
    web3: Web3Provider,
    address: string,
    message: CancelProposal
  ) {
    return await this.sign(web3, address, message, cancelProposalTypes);
  }

  async vote(web3: Web3Provider, address: string, message: Vote) {
    let type = voteTypes;
    if (['approval', 'ranked-choice'].includes(message.type))
      type = voteArrayTypes;
    if (['quadratic', 'weighted'].includes(message.type)) {
      type = voteStringTypes;
      message.choice = JSON.stringify(message.choice);
    }
    // @ts-ignore
    delete message.type;
    return await this.sign(web3, address, message, type);
  }
}
