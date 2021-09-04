const API_BASE_URL = 'localhost:6666';

export default class Plugin {
  public author = 'Kapp';
  public version = '1.0.0';
  public name = 'Subscribe';
  public options: any;

  async subscribe(){
    const response = await fetch(
      `${API_BASE_URL}/snapshot/subscribe`
    );
    return response
  }
}
