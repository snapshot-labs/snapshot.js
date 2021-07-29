// URLS
const API_BASE_URL = 'https://api.poap.xyz';
const APP_BASE_URL = 'https://app.poap.xyz';

export default class strategy {
  public author = 'G2 & Torch';
  public version = '1.0.0';
  public name = 'Poap Strategy';
  public options: any;

  openScanPage(address) {
    window.open(`${APP_BASE_URL}/actions/scan/` + address, '_blank');
    return { supply: 0 };
  }

  async getCurrentState(tokenId) {
    // Fetch the event
    const eventResponse = await fetch(`${API_BASE_URL}/token/${tokenId}`);
    // If the fetch fails: the user doesn't have the POAP
    if (!eventResponse.ok) {
      return { image_url: '', currentState: 'NO_POAP' };
    }
    // Get the image from the event
    const { image_url } = await eventResponse.json();

    // Check that the tokenId is not empty
    if (!tokenId) {
      return { image_url, currentState: 'NO_POAP' };
    }
  }
}
