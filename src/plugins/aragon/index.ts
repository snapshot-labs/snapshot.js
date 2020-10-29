import { sendTransaction } from '../../utils';
import abi from './DisputableDelay.json';

export default class Plugin {
  public author = 'Evalir';
  public version = '0.1.3';
  public name = 'Aragon Agreements';
  public website = 'https://aragon.org/blog/snapshot';
  public options: any;

  async execute(web3, options, proposalOptions, id, winningChoice) {
    try {
      return await sendTransaction(
        web3,
        abi,
        options.govern,
        'delayExecution',
        proposalOptions[`choice${winningChoice}`]
      );
    } catch (e) {
      console.error(e);
    }
  }
}
