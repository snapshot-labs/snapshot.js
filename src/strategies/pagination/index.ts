import strategies from '..';
import examplesFile from './examples.json';

export const author = 'bonustrack';
export const version = '0.1.0';
export const examples = examplesFile;

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const max = options.limit || 300;
  const pages = Math.ceil(addresses.length / max);
  const promises: any = [];
  Array.from(Array(pages)).forEach((x, i) => {
    const addressesInPage = addresses.slice(max * i, max * (i + 1));
    promises.push(
      strategies[options.strategy.name].strategy(
        space,
        network,
        provider,
        addressesInPage,
        options.strategy.params,
        snapshot
      )
    );
  });
  const results = await Promise.all(promises);
  // @ts-ignore
  return results.reduce((obj, result: any) => ({ ...obj, ...result }), {});
}
