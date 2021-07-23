import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import 'cross-fetch';

import { multicall } from '../../utils';

export const author = 'immutable';
export const version = '1.0.0';

export const name = 'immutable-x';

const snapshotPath = '/snapshots/balances';

const networkMapping = {
    1: 'https://api.x.immutable.com',
    3: 'https://api.uat.x.immutable.com'
};

const defaultPageSize = 100;

const abi = ['function balanceOf(address account) external view returns (uint256)'];

type Response = {
    records: Score[];
    cursor: string;
};

type Score = {
    address: string;
    balance: string;
};

async function getL1Balances(
    network: string,
    provider: any,
    options: { address: string; decimals: string },
    addresses: string[]
): Promise<Record<string, number>> {
    const response = await multicall(
        network,
        provider,
        abi,
        addresses.map((address: string) => [options.address, 'balanceOf', [address]]),
        { blockTag: 'latest' }
    );
    return mapL1Response(response, addresses, options);
}

async function getL2Balances(
    network: string,
    options: { address: string; decimals: string; pageSize: string },
    addresses: string[]
): Promise<Record<string, number>> {
    const records: Record<string, number> = {};

    let cursor = '',
        recordsLen = addresses.length; // assume all addresses exist

    while (recordsLen != 0) {
        const apiUrl = buildURL(network, options, addresses, cursor);
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const resJson = await response.json();
        Object.assign(records, mapL2Response(resJson, options));
        cursor = resJson.cursor;
        recordsLen = (resJson as Response).records.length;
    }
    return records;
}

function buildURL(
    network: string,
    options: { address: string; pageSize: string },
    addresses: string[],
    cursor?: string
): string {
    let apiUrl = networkMapping[network] + snapshotPath;
    apiUrl += '/' + options.address.toLowerCase() + '?addresses=' + addresses.join(',');
    apiUrl += `?page_size=${options.pageSize != '' ? options.pageSize : defaultPageSize}`;
    apiUrl += cursor || cursor != '' ? `?cursor=${cursor}` : '';
    return apiUrl;
}

function mapL1Response(
    data: BigNumber[][], // itf.decodeFunctionResult('balanceOf', '0x...')
    addresses: string[],
    options: { decimals: string }
): Record<string, number> {
    return Object.fromEntries(
        data.map((value: BigNumber[], i: number) => [addresses[i], formatBalance(value[0], options.decimals)])
    );
}

function mapL2Response(data: Response, options: { decimals: string }): Record<string, number> {
    return Object.fromEntries(
        data.records.map((value: Score) => [value.address, formatBalance(value.balance, options.decimals)])
    );
}

function formatBalance(balance: BigNumber | string, decimals: string): number {
    return parseFloat(formatUnits(balance, decimals));
}

function combineBalanceScores(records: Record<string, number>[]): Record<string, number> {
    return records.reduce((aggScore, currScore) => {
        for (const [address, balance] of Object.entries(currScore)) {
            if (!aggScore[address]) {
                aggScore[address] = balance;
            } else {
                aggScore[address] += balance; // sum(L1, L2)
            }
        }
        return aggScore;
    }, {});
}

export async function strategy(
    _space,
    network,
    provider,
    addresses,
    options,
    _snapshot
): Promise<Record<string, number>> {
    try {
        return combineBalanceScores([
            await getL1Balances(network, provider, options, addresses),
            await getL2Balances(network, options, addresses)
        ]);
    } catch (e) {
        console.error(e);
        throw new Error(`Strategy ${name} failed`);
    }
}
