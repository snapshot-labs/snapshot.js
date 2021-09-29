import publicNetworks from '../networks.json';

function loadNetworks() {
  const customNetworks =
    process.env['npm_config_networks_file'] ||
    process.argv
      .find((arg) => arg.includes('--networks-file'))
      ?.split('--networks-file')
      ?.pop();

  if (customNetworks === undefined) {
    return publicNetworks;
  } else {
    try {
      return require(customNetworks);
    } catch (e) {
      throw new Error('Cannot find custom networks file: ' + customNetworks);
    }
  }
}

export const networks = loadNetworks();
