import { Web3Provider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';
import { Space, Proposal, UpdateProposal, FlagProposal, CancelProposal, Vote, Follow, Unfollow, Subscribe, Unsubscribe, Profile, Alias, DeleteSpace, Statement } from './types';
export declare const domain: {
    name: string;
    version: string;
    chainId?: number;
    verifyingContract: string;
};
export default class Client {
    readonly address: string;
    readonly options: any;
    constructor(address?: string, options?: {});
    sign(web3: Web3Provider | Wallet, address: string, message: any, types: any): Promise<unknown>;
    send(envelop: any): Promise<unknown>;
    space(web3: Web3Provider | Wallet, address: string, message: Space): Promise<unknown>;
    proposal(web3: Web3Provider | Wallet, address: string, message: Proposal): Promise<unknown>;
    updateProposal(web3: Web3Provider | Wallet, address: string, message: UpdateProposal): Promise<unknown>;
    flagProposal(web3: Web3Provider | Wallet, address: string, message: FlagProposal): Promise<unknown>;
    cancelProposal(web3: Web3Provider | Wallet, address: string, message: CancelProposal): Promise<unknown>;
    vote(web3: Web3Provider | Wallet, address: string, message: Vote): Promise<unknown>;
    follow(web3: Web3Provider | Wallet, address: string, message: Follow): Promise<unknown>;
    unfollow(web3: Web3Provider | Wallet, address: string, message: Unfollow): Promise<unknown>;
    subscribe(web3: Web3Provider | Wallet, address: string, message: Subscribe): Promise<unknown>;
    unsubscribe(web3: Web3Provider | Wallet, address: string, message: Unsubscribe): Promise<unknown>;
    profile(web3: Web3Provider | Wallet, address: string, message: Profile): Promise<unknown>;
    statement(web3: Web3Provider | Wallet, address: string, message: Statement): Promise<unknown>;
    alias(web3: Web3Provider | Wallet, address: string, message: Alias): Promise<unknown>;
    deleteSpace(web3: Web3Provider | Wallet, address: string, message: DeleteSpace): Promise<unknown>;
}
