export default class Plugin {
    author: string;
    version: string;
    name: string;
    website: string;
    options: any;
    action(network: any, web3: any, spaceOptions: any, proposalOptions: any, proposalId: any, winningChoice: any): Promise<any>;
}
