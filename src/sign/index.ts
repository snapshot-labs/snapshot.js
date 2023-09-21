import fetch from 'cross-fetch';
import { Web3Provider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { getAddress } from '@ethersproject/address';
import {
  Space,
  Proposal,
  UpdateProposal,
  FlagProposal,
  CancelProposal,
  Vote,
  Follow,
  Unfollow,
  Subscribe,
  Unsubscribe,
  Profile,
  Alias,
  DeleteSpace,
  Statement,
  spaceTypes,
  proposalTypes,
  updateProposalTypes,
  flagProposalTypes,
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
  aliasTypes,
  deleteSpaceType,
  statementTypes
} from './types';
import constants from '../constants.json';

const NAME = 'snapshot';
const VERSION = '0.1.4';

export const domain = {
  name: NAME,
  version: VERSION
  // chainId: 1
};

export default class Client {
  readonly address: string;
  readonly options: any;

  constructor(address: string = constants.livenet.sequencer, options = {}) {
    address = address.replace(
      constants.livenet.hub,
      constants.livenet.sequencer
    );
    address = address.replace(
      constants.testnet.hub,
      constants.testnet.sequencer
    );
    address = address.replace(constants.local.hub, constants.local.sequencer);
    this.address = address;
    this.options = options;
  }

  async sign(web3: Web3Provider | Wallet, address: string, message, types) {
    // @ts-ignore
    const signer = web3?.getSigner ? web3.getSigner() : web3;
    const checksumAddress = getAddress(address);
    message.from = message.from ? getAddress(message.from) : checksumAddress;
    if (!message.timestamp)
      message.timestamp = parseInt((Date.now() / 1e3).toFixed());
    const data: any = { domain, types, message };
    const sig = await signer._signTypedData(domain, data.types, message);
    return await this.send({ address: checksumAddress, sig, data });
  }

  async send(envelop) {
    let address = this.address;
    if (envelop.sig === '0x' && this.options.relayerURL)
      address = this.options.relayerURL;
    const init = {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(envelop)
    };
    return new Promise((resolve, reject) => {
      fetch(address, init)
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
    if (!message.app) message.app = '';
    return await this.sign(web3, address, message, proposalTypes);
  }

  async updateProposal(
    web3: Web3Provider | Wallet,
    address: string,
    message: UpdateProposal
  ) {
    return await this.sign(web3, address, message, updateProposalTypes);
  }

  async flagProposal(
    web3: Web3Provider | Wallet,
    address: string,
    message: FlagProposal
  ) {
    return await this.sign(web3, address, message, flagProposalTypes);
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
    const isShutter = message?.privacy === 'shutter';
    if (!message.reason) message.reason = '';
    if (!message.app) message.app = '';
    if (!message.metadata) message.metadata = '{}';
    const type2 = message.proposal.startsWith('0x');
    let type = type2 ? vote2Types : voteTypes;
    if (['approval', 'ranked-choice'].includes(message.type))
      type = type2 ? voteArray2Types : voteArrayTypes;
    if (!isShutter && ['quadratic', 'weighted'].includes(message.type)) {
      type = type2 ? voteString2Types : voteStringTypes;
      message.choice = JSON.stringify(message.choice);
    }
    if (isShutter) type = type2 ? voteString2Types : voteStringTypes;
    delete message.privacy;
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

  async statement(
    web3: Web3Provider | Wallet,
    address: string,
    message: Statement
  ) {
    return await this.sign(web3, address, message, statementTypes);
  }

  async alias(web3: Web3Provider | Wallet, address: string, message: Alias) {
    return await this.sign(web3, address, message, aliasTypes);
  }

  async deleteSpace(
    web3: Web3Provider | Wallet,
    address: string,
    message: DeleteSpace
  ) {
    return await this.sign(web3, address, message, deleteSpaceType);
  }
}
