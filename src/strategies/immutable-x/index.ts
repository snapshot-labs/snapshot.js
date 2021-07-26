import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { formatUnits } from '@ethersproject/units';
import 'cross-fetch';

import Multicaller from '../../utils/multicaller';

export const author = 'immutable';
export const version = '1.0.0';

export const name = 'immutable-x';

const snapshotPath = '/v1/snapshots/balances';

const networkMapping = {
    1: 'https://api.x.immutable.com',
    3: 'https://api.uat.x.immutable.com'
};

const defaultPageSize = 100;

const abi = ['function balanceOf(address account) external view returns (uint256)'];

interface Response {
    records: Score[];
    cursor: string;
}

interface Score {
    address: string;
    balance: string;
}

interface Options {
    address: string;
    decimals: number;
    pageSize?: number;
}

export async function strategy(
    _space: unknown,
    network: string,
    provider: StaticJsonRpcProvider,
    addresses: string[],
    options: Options,
    _snapshot: unknown
): Promise<Record<string, number>> {
    try {
        return combineBalanceScores([
            await getL1Balances(network, provider, options, addresses),
            await getL2Balances(network, options, addresses)
        ]);
    } catch (e) {
        throw new Error(`Strategy ${name} failed`);
    }
}

async function getL1Balances(
    network: string,
    provider: StaticJsonRpcProvider,
    options: Options,
    addresses: string[]
): Promise<Record<string, number>> {
    const multi = new Multicaller(network, provider, abi, { blockTag: 'latest' });
    addresses.forEach((address: string) => multi.call(address, options.address, 'balanceOf', [address]));
    const result: Record<string, BigNumberish> = await multi.execute();
    return mapL1Response(result, options);
}

async function getL2Balances(network: string, options: Options, addresses: string[]): Promise<Record<string, number>> {
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

function buildURL(network: string, options: Options, addresses: string[], cursor?: string): string {
    let apiUrl = networkMapping[network] + snapshotPath;
    apiUrl += '/' + options.address.toLowerCase();
    apiUrl += buildArr('addresses', addresses);
    apiUrl += `&page_size=${'pageSize' in options ? options.pageSize : defaultPageSize}`;
    apiUrl += cursor || cursor != '' ? `&cursor=${cursor}` : '';
    return apiUrl;
}

function buildArr(name: string, arr: string[]): string {
    let url = '';
    for (let i = 0; i < arr.length; i++) {
        if (i == 0) {
            url += `?`;
        } else {
            url += `&`;
        }
        url += `${name}=${arr[i]}`;
    }
    return url;
}

function mapL1Response(data: Record<string, BigNumberish>, options: Options): Record<string, number> {
    return Object.fromEntries(
        Object.entries(data).map(([address, balance]) => [address, parseFloat(formatUnits(balance, options.decimals))])
    );
}

function mapL2Response(data: Response, options: Options): Record<string, number> {
    return Object.fromEntries(
        data.records.map((value: Score) => [value.address, formatBalance(value.balance, options.decimals)])
    );
}

function formatBalance(balance: BigNumber | string, decimals: BigNumberish): number {
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
