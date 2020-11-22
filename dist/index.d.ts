declare const _default: {
    plugins: {
        aragon: typeof import("./plugins/aragon").default;
        gnosis: typeof import("./plugins/gnosis").default;
    };
    strategies: {
        balancer: typeof import("./strategies/balancer").strategy;
        'contract-call': typeof import("./strategies/contract-call").strategy;
        'erc20-balance-of': typeof import("./strategies/erc20-balance-of").strategy;
        'erc20-balance-of-fixed-total': typeof import("./strategies/erc20-balance-of-fixed-total").strategy;
        'erc20-balance-of-cv': typeof import("./strategies/erc20-balance-of-cv").strategy;
        'erc20-balance-of-coeff': typeof import("./strategies/erc20-balance-of-coeff").strategy;
        'erc20-with-balance': typeof import("./strategies/erc20-with-balance").strategy;
        'erc20-balance-of-delegation': typeof import("./strategies/erc20-balance-of-delegation").strategy;
        'eth-balance': typeof import("./strategies/eth-balance").strategy;
        'maker-ds-chief': typeof import("./strategies/maker-ds-chief").strategy;
        uni: typeof import("./strategies/uni").strategy;
        'yearn-vault': typeof import("./strategies/yearn-vault").strategy;
        moloch: typeof import("./strategies/moloch").strategy;
        uniswap: typeof import("./strategies/uniswap").strategy;
        pancake: typeof import("./strategies/pancake").strategy;
        synthetix: typeof import("./strategies/synthetix").strategy;
        ctoken: typeof import("./strategies/ctoken").strategy;
        cream: typeof import("./strategies/cream").strategy;
    };
    schemas: {
        space: {
            title: string;
            type: string;
            properties: {
                name: {
                    type: string;
                    title: string;
                    maxLength: number;
                };
                network: {
                    type: string;
                    title: string;
                    maxLength: number;
                };
                symbol: {
                    type: string;
                    title: string;
                    maxLength: number;
                };
                skin: {
                    type: string;
                    title: string;
                    maxLength: number;
                };
                domain: {
                    type: string;
                    title: string;
                    maxLength: number;
                };
                strategies: {
                    type: string;
                    minItems: number;
                    maxItems: number;
                    items: {
                        type: string;
                        properties: {
                            name: {
                                type: string;
                                maxLength: number;
                                title: string;
                            };
                            params: {
                                type: string;
                                title: string;
                            };
                        };
                        required: string[];
                        additionalProperties: boolean;
                    };
                    title: string;
                };
                members: {
                    type: string;
                    items: {
                        type: string;
                        maxLength: number;
                    };
                    title: string;
                };
                filters: {
                    type: string;
                    properties: {
                        defaultTab: {
                            type: string;
                        };
                        minScore: {
                            type: string;
                            minimum: number;
                        };
                        onlyMembers: {
                            type: string;
                        };
                        invalids: {
                            type: string;
                            items: {
                                type: string;
                                maxLength: number;
                            };
                            title: string;
                        };
                    };
                    additionalProperties: boolean;
                };
            };
            required: string[];
            additionalProperties: boolean;
        };
    };
    utils: {
        call: typeof import("./utils").call;
        multicall: typeof import("./utils").multicall;
        subgraphRequest: typeof import("./utils").subgraphRequest;
        ipfsGet: typeof import("./utils").ipfsGet;
        sendTransaction: typeof import("./utils").sendTransaction;
        getScores: typeof import("./utils").getScores;
        validateSchema: typeof import("./utils").validateSchema;
        getProvider: typeof import("./utils/provider").default;
        decodeContenthash: typeof import("./utils/contentHash").decodeContenthash;
        validateContent: typeof import("./utils/contentHash").validateContent;
        isValidContenthash: typeof import("./utils/contentHash").isValidContenthash;
        encodeContenthash: typeof import("./utils/contentHash").encodeContenthash;
        resolveENSContentHash: typeof import("./utils/contentHash").resolveENSContentHash;
    };
};
export default _default;
