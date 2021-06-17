import { Web3Provider } from '@ethersproject/providers';
import { signMessage } from './utils/web3';
import hubs from './hubs.json';
import { version } from './constants.json';

export default class Client {
  readonly address: string;

  constructor(address: string = hubs[0]) {
    this.address = address;
  }

  request(command: string, body?: any) {
    const url = `${this.address}/api/${command}`;
    let init;
    if (body) {
      init = {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      };
    }
    return new Promise((resolve, reject) => {
      fetch(url, init)
        .then((res) => {
          if (res.ok) return resolve(res.json());
          throw res;
        })
        .catch((e) => e.json().then((json) => reject(json)));
    });
  }

  async send(msg: any) {
    return this.request('message', msg);
  }

  async getSpaces() {
    return this.request('spaces');
  }
  async getProposals(space: string) {
    return this.request(`${space}/proposals`);
  }

  async getVotes(space: string, proposalId: string) {
    return this.request(`${space}/proposal/${proposalId}`);
  }

  async broadcast(
    web3: Web3Provider,
    account: string,
    space: string,
    type: string,
    payload: any
  ) {
    const msg: any = {
      address: account,
      msg: JSON.stringify({
        version,
        timestamp: (Date.now() / 1e3).toFixed(),
        space,
        type,
        payload
      })
    };
    msg.sig = await signMessage(web3, msg.msg, account);
    return await this.send(msg);
  }
}
