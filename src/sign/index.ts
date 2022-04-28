import fetch from 'cross-fetch';
import { Web3Provider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import {
  Space,
  Proposal,
  CancelProposal,
  Vote,
  Follow,
  Unfollow,
  Subscribe,
  Unsubscribe,
  Profile,
  Alias,
  spaceTypes,
  proposalTypes,
  cancelProposalTypes,
  cancelProposal2Types,
  voteTypes,
  voteArrayTypes,
  voteStringTypes,
  vote2Types,
  voteArray2Types,
  voteString2Types,
  followTypes,
  subscribeTypes,
  unfollowTypes,
  unsubscribeTypes,
  profileTypes,
  aliasTypes
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

  async sign(web3: Web3Provider | Wallet, address: string, message, types) {
    // @ts-ignore
    const signer = web3?.getSigner ? web3.getSigner() : web3;
    if (!message.from) message.from = address;
    if (!message.timestamp)
      message.timestamp = parseInt((Date.now() / 1e3).toFixed());
    const data: any = { domain, types, message };
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

  async space(web3: Web3Provider | Wallet, address: string, message: Space) {
    return await this.sign(web3, address, message, spaceTypes);
  }

  async proposal(
    web3: Web3Provider | Wallet,
    address: string,
    message: Proposal
  ) {
    if (!message.discussion) message.discussion = '';
    return await this.sign(web3, address, message, proposalTypes);
  }

  async cancelProposal(
    web3: Web3Provider | Wallet,
    address: string,
    message: CancelProposal
  ) {
    const type2 = message.proposal.startsWith('0x');
    return await this.sign(
      web3,
      address,
      message,
      type2 ? cancelProposal2Types : cancelProposalTypes
    );
  }

  async vote(web3: Web3Provider | Wallet, address: string, message: Vote) {
    const type2 = message.proposal.startsWith('0x');
    let type = type2 ? vote2Types : voteTypes;
    if (['approval', 'ranked-choice'].includes(message.type))
      type = type2 ? voteArray2Types : voteArrayTypes;
    if (['quadratic', 'weighted'].includes(message.type)) {
      type = type2 ? voteString2Types : voteStringTypes;
      message.choice = JSON.stringify(message.choice);
    }
    // @ts-ignore
    delete message.type;
    return await this.sign(web3, address, message, type);
  }

  async follow(web3: Web3Provider | Wallet, address: string, message: Follow) {
    return await this.sign(web3, address, message, followTypes);
  }

  async unfollow(
    web3: Web3Provider | Wallet,
    address: string,
    message: Unfollow
  ) {
    return await this.sign(web3, address, message, unfollowTypes);
  }

  async subscribe(
    web3: Web3Provider | Wallet,
    address: string,
    message: Subscribe
  ) {
    return await this.sign(web3, address, message, subscribeTypes);
  }

  async unsubscribe(
    web3: Web3Provider | Wallet,
    address: string,
    message: Unsubscribe
  ) {
    return await this.sign(web3, address, message, unsubscribeTypes);
  }

  async profile(
    web3: Web3Provider | Wallet,
    address: string,
    message: Profile
  ) {
    return await this.sign(web3, address, message, profileTypes);
  }

  async alias(web3: Web3Provider | Wallet, address: string, message: Alias) {
    return await this.sign(web3, address, message, aliasTypes);
  }
}
