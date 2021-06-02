let state = {
  NOTPOAP: {
    header: "A POAP hasn't been setup for this proposal yet :'(",
    headerImage:
      'https://img-test-rlajous.s3.amazonaws.com/Property 1=nopoap.png',
    mainImage: 'https://img-test-rlajous.s3.amazonaws.com/Group+1229.png'
  },
  NOTVOTED: {
    headerImage:
      'https://img-test-rlajous.s3.amazonaws.com/Property 1=unavaliable.png',
    header: 'Vote to get this POAP',
    buttonText: 'Claim'
  },
  UNCLAIMED: {
    headerImage:
      'https://img-test-rlajous.s3.amazonaws.com/Property 1=Voted.png',
    header: 'Thanks for voting Claim your I VOTED POAP',
    buttonText: 'Claim'
  },
  CLAIMED: {
    headerImage:
      'https://img-test-rlajous.s3.amazonaws.com/Property 1=Claimed.png',
    header: 'Congratulations! You got a new POAP in your account',
    buttonText: 'Show me my badges'
  }
};

export default class Plugin {
  public author = 'Poap';
  public version = '1.0.0';
  public name = 'Poap Module';
  public website = 'https://poap.xyz';
  public options: any;

  async getCurrentStates() {
    return state;
  }
  async getCurrentState(
    snapshot: string,
    address: string
  ) {
    try {
      const res = await fetch(`https://run.mocky.io/v3/${address}`);

      if (res.status >= 400) {
        throw new Error("Bad response from server");
      }

      const user = await res.json();

      return {poapImg: 'https://img-test-rlajous.s3.amazonaws.com/Group+1229.png', currentState: 'CLAIMED'};

    } catch (err) {
      console.error(err);
    }
  }

  async claim(
    snapshot: string,
    address: string
  ) {
    try {
      const currentState = {poapImg: 'https://img-test-rlajous.s3.amazonaws.com/Group+1229.png'};
      return ''
    } catch (e) {
      throw new Error(e);
    }
  }
}
