// This url is just a demo api which should be updated in future.
const API_BASE_URL = 'https://snapshot-subscribe.herokuapp.com';

export default class Plugin {
  public author = 'Kapp';
  public version = '1.0.0';
  public name = 'Subscribe';
  public options: any;

  async subscribe(proposalId: string, email: string){
    const response = await fetch(
      `${API_BASE_URL}/snapshot/subscribe`,
      {
        method: 'POST',
    　　headers: {
      　  'Content-Type': 'application/json'
      　},　　
        body:JSON.stringify({
          proposalId: proposalId,
        　email: email
        })
      }
    );
    return response
  }
}
