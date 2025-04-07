import fetch from 'cross-fetch';
import { getAddress, isAddress } from '@ethersproject/address';
import { AbiCoder, Interface } from '@ethersproject/abi';
import { Contract as Contract$1 } from '@ethersproject/contracts';
import { parseUnits } from '@ethersproject/units';
import { _TypedDataEncoder, namehash, ensNormalize } from '@ethersproject/hash';
import { jsonToGraphQLQuery } from 'json-to-graphql-query';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import addErrors from 'ajv-errors';
import set from 'lodash.set';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { hexlify, concat, arrayify } from '@ethersproject/bytes';
import { Contract, RpcProvider, typedData, validateAndParseAddress } from 'starknet';
import { BigNumber } from '@ethersproject/bignumber';
import { verifyTypedData } from '@ethersproject/wallet';

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
}

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

const spaceTypes = {
    Space: [
        { name: 'from', type: 'address' },
        { name: 'space', type: 'string' },
        { name: 'timestamp', type: 'uint64' },
        { name: 'settings', type: 'string' }
    ]
};
const proposalTypes = {
    Proposal: [
        { name: 'from', type: 'address' },
        { name: 'space', type: 'string' },
        { name: 'timestamp', type: 'uint64' },
        { name: 'type', type: 'string' },
        { name: 'title', type: 'string' },
        { name: 'body', type: 'string' },
        { name: 'discussion', type: 'string' },
        { name: 'choices', type: 'string[]' },
        { name: 'labels', type: 'string[]' },
        { name: 'start', type: 'uint64' },
        { name: 'end', type: 'uint64' },
        { name: 'snapshot', type: 'uint64' },
        { name: 'plugins', type: 'string' },
        { name: 'privacy', type: 'string' },
        { name: 'app', type: 'string' }
    ]
};
const updateProposalTypes = {
    UpdateProposal: [
        { name: 'proposal', type: 'string' },
        { name: 'from', type: 'address' },
        { name: 'space', type: 'string' },
        { name: 'timestamp', type: 'uint64' },
        { name: 'type', type: 'string' },
        { name: 'title', type: 'string' },
        { name: 'body', type: 'string' },
        { name: 'discussion', type: 'string' },
        { name: 'choices', type: 'string[]' },
        { name: 'labels', type: 'string[]' },
        { name: 'plugins', type: 'string' },
        { name: 'privacy', type: 'string' }
    ]
};
const flagProposalTypes = {
    FlagProposal: [
        { name: 'from', type: 'address' },
        { name: 'space', type: 'string' },
        { name: 'proposal', type: 'string' },
        { name: 'timestamp', type: 'uint64' }
    ]
};
const cancelProposalTypes = {
    CancelProposal: [
        { name: 'from', type: 'address' },
        { name: 'space', type: 'string' },
        { name: 'timestamp', type: 'uint64' },
        { name: 'proposal', type: 'string' }
    ]
};
const cancelProposal2Types = {
    CancelProposal: [
        { name: 'from', type: 'address' },
        { name: 'space', type: 'string' },
        { name: 'timestamp', type: 'uint64' },
        { name: 'proposal', type: 'bytes32' }
    ]
};
const voteTypes = {
    Vote: [
        { name: 'from', type: 'address' },
        { name: 'space', type: 'string' },
        { name: 'timestamp', type: 'uint64' },
        { name: 'proposal', type: 'string' },
        { name: 'choice', type: 'uint32' },
        { name: 'reason', type: 'string' },
        { name: 'app', type: 'string' },
        { name: 'metadata', type: 'string' }
    ]
};
const voteArrayTypes = {
    Vote: [
        { name: 'from', type: 'address' },
        { name: 'space', type: 'string' },
        { name: 'timestamp', type: 'uint64' },
        { name: 'proposal', type: 'string' },
        { name: 'choice', type: 'uint32[]' },
        { name: 'reason', type: 'string' },
        { name: 'app', type: 'string' },
        { name: 'metadata', type: 'string' }
    ]
};
const voteStringTypes = {
    Vote: [
        { name: 'from', type: 'address' },
        { name: 'space', type: 'string' },
        { name: 'timestamp', type: 'uint64' },
        { name: 'proposal', type: 'string' },
        { name: 'choice', type: 'string' },
        { name: 'reason', type: 'string' },
        { name: 'app', type: 'string' },
        { name: 'metadata', type: 'string' }
    ]
};
const vote2Types = {
    Vote: [
        { name: 'from', type: 'address' },
        { name: 'space', type: 'string' },
        { name: 'timestamp', type: 'uint64' },
        { name: 'proposal', type: 'bytes32' },
        { name: 'choice', type: 'uint32' },
        { name: 'reason', type: 'string' },
        { name: 'app', type: 'string' },
        { name: 'metadata', type: 'string' }
    ]
};
const voteArray2Types = {
    Vote: [
        { name: 'from', type: 'address' },
        { name: 'space', type: 'string' },
        { name: 'timestamp', type: 'uint64' },
        { name: 'proposal', type: 'bytes32' },
        { name: 'choice', type: 'uint32[]' },
        { name: 'reason', type: 'string' },
        { name: 'app', type: 'string' },
        { name: 'metadata', type: 'string' }
    ]
};
const voteString2Types = {
    Vote: [
        { name: 'from', type: 'address' },
        { name: 'space', type: 'string' },
        { name: 'timestamp', type: 'uint64' },
        { name: 'proposal', type: 'bytes32' },
        { name: 'choice', type: 'string' },
        { name: 'reason', type: 'string' },
        { name: 'app', type: 'string' },
        { name: 'metadata', type: 'string' }
    ]
};
const followTypes = {
    Follow: [
        { name: 'from', type: 'address' },
        { name: 'network', type: 'string' },
        { name: 'space', type: 'string' },
        { name: 'timestamp', type: 'uint64' }
    ]
};
const unfollowTypes = {
    Unfollow: [
        { name: 'from', type: 'address' },
        { name: 'network', type: 'string' },
        { name: 'space', type: 'string' },
        { name: 'timestamp', type: 'uint64' }
    ]
};
const subscribeTypes = {
    Subscribe: [
        { name: 'from', type: 'address' },
        { name: 'space', type: 'string' },
        { name: 'timestamp', type: 'uint64' }
    ]
};
const unsubscribeTypes = {
    Unsubscribe: [
        { name: 'from', type: 'address' },
        { name: 'space', type: 'string' },
        { name: 'timestamp', type: 'uint64' }
    ]
};
const profileTypes = {
    Profile: [
        { name: 'from', type: 'address' },
        { name: 'timestamp', type: 'uint64' },
        { name: 'profile', type: 'string' }
    ]
};
const statementTypes = {
    Statement: [
        { name: 'from', type: 'address' },
        { name: 'timestamp', type: 'uint64' },
        { name: 'space', type: 'string' },
        { name: 'about', type: 'string' },
        { name: 'statement', type: 'string' },
        { name: 'discourse', type: 'string' },
        { name: 'status', type: 'string' },
        { name: 'network', type: 'string' }
    ]
};
const aliasTypes = {
    Alias: [
        { name: 'from', type: 'address' },
        { name: 'alias', type: 'address' },
        { name: 'timestamp', type: 'uint64' }
    ]
};
const deleteSpaceType = {
    DeleteSpace: [
        { name: 'from', type: 'address' },
        { name: 'space', type: 'string' },
        { name: 'timestamp', type: 'uint64' }
    ]
};

var mainnet = {
	hub: "https://hub.snapshot.org",
	sequencer: "https://seq.snapshot.org"
};
var testnet = {
	hub: "https://testnet.hub.snapshot.org",
	sequencer: "https://testnet.seq.snapshot.org"
};
var local = {
	hub: "http://localhost:3000",
	sequencer: "http://localhost:3001"
};
var constants = {
	mainnet: mainnet,
	testnet: testnet,
	local: local
};

const NAME = 'snapshot';
const VERSION = '0.1.4';
const domain = {
    name: NAME,
    version: VERSION,
    // chainId: 1
    verifyingContract: '0x0000000000000000000000000000000000000000'
};
class Client {
    constructor(address = constants.mainnet.sequencer, options = {}) {
        address = address.replace(constants.mainnet.hub, constants.mainnet.sequencer);
        address = address.replace(constants.testnet.hub, constants.testnet.sequencer);
        address = address.replace(constants.local.hub, constants.local.sequencer);
        this.address = address;
        this.options = options;
    }
    sign(web3, address, message, types) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            // @ts-ignore
            const signer = (web3 === null || web3 === void 0 ? void 0 : web3.getSigner) ? web3.getSigner() : web3;
            const checksumAddress = getAddress(address);
            message.from = message.from ? getAddress(message.from) : checksumAddress;
            if (!message.timestamp)
                message.timestamp = parseInt((Date.now() / 1e3).toFixed());
            const domainData = Object.assign({}, domain);
            // @ts-ignore
            if (typeof window !== 'undefined' && ((_a = window.ethereum) === null || _a === void 0 ? void 0 : _a.isTrust)) {
                domainData.chainId = (yield signer.provider.getNetwork()).chainId;
            }
            const data = { domain: domainData, types, message };
            const sig = yield signer._signTypedData(domainData, data.types, message);
            return yield this.send({ address: checksumAddress, sig, data });
        });
    }
    send(envelop) {
        return __awaiter(this, void 0, void 0, function* () {
            let address = this.address;
            if (envelop.sig === '0x' && this.options.relayerURL)
                address = this.options.relayerURL;
            const init = {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(envelop)
            };
            return new Promise((resolve, reject) => {
                fetch(address, init)
                    .then((res) => {
                    var _a;
                    if (res.ok)
                        return resolve(res.json());
                    if ((_a = res.headers.get('content-type')) === null || _a === void 0 ? void 0 : _a.includes('application/json'))
                        return res.json().then(reject).catch(reject);
                    throw res;
                })
                    .catch(reject);
            });
        });
    }
    space(web3, address, message) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.sign(web3, address, message, spaceTypes);
        });
    }
    proposal(web3, address, message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!message.labels)
                message.labels = [];
            if (!message.discussion)
                message.discussion = '';
            if (!message.app)
                message.app = '';
            if (!message.privacy)
                message.privacy = '';
            return yield this.sign(web3, address, message, proposalTypes);
        });
    }
    updateProposal(web3, address, message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!message.privacy)
                message.privacy = '';
            return yield this.sign(web3, address, message, updateProposalTypes);
        });
    }
    flagProposal(web3, address, message) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.sign(web3, address, message, flagProposalTypes);
        });
    }
    cancelProposal(web3, address, message) {
        return __awaiter(this, void 0, void 0, function* () {
            const type2 = message.proposal.startsWith('0x');
            return yield this.sign(web3, address, message, type2 ? cancelProposal2Types : cancelProposalTypes);
        });
    }
    vote(web3, address, message) {
        return __awaiter(this, void 0, void 0, function* () {
            const isShutter = (message === null || message === void 0 ? void 0 : message.privacy) === 'shutter';
            if (!message.reason)
                message.reason = '';
            if (!message.app)
                message.app = '';
            if (!message.metadata)
                message.metadata = '{}';
            const type2 = message.proposal.startsWith('0x');
            let type = type2 ? vote2Types : voteTypes;
            if (['approval', 'ranked-choice'].includes(message.type))
                type = type2 ? voteArray2Types : voteArrayTypes;
            if (!isShutter && ['quadratic', 'weighted'].includes(message.type)) {
                type = type2 ? voteString2Types : voteStringTypes;
                message.choice = JSON.stringify(message.choice);
            }
            if (isShutter)
                type = type2 ? voteString2Types : voteStringTypes;
            delete message.privacy;
            // @ts-ignore
            delete message.type;
            return yield this.sign(web3, address, message, type);
        });
    }
    follow(web3, address, message) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.sign(web3, address, message, followTypes);
        });
    }
    unfollow(web3, address, message) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.sign(web3, address, message, unfollowTypes);
        });
    }
    subscribe(web3, address, message) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.sign(web3, address, message, subscribeTypes);
        });
    }
    unsubscribe(web3, address, message) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.sign(web3, address, message, unsubscribeTypes);
        });
    }
    profile(web3, address, message) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.sign(web3, address, message, profileTypes);
        });
    }
    statement(web3, address, message) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.sign(web3, address, message, statementTypes);
        });
    }
    alias(web3, address, message) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.sign(web3, address, message, aliasTypes);
        });
    }
    deleteSpace(web3, address, message) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.sign(web3, address, message, deleteSpaceType);
        });
    }
}

var $schema = "http://json-schema.org/draft-07/schema#";
var $ref = "#/definitions/Space";
var definitions = {
	Space: {
		title: "Space",
		type: "object",
		properties: {
			name: {
				type: "string",
				title: "name",
				minLength: 1,
				maxLength: 32
			},
			"private": {
				type: "boolean"
			},
			about: {
				type: "string",
				title: "about",
				maxLength: 160
			},
			guidelines: {
				type: "string",
				format: "customUrl",
				title: "guidelines",
				maxLength: 256
			},
			template: {
				type: "string",
				title: "template",
				maxLength: 1024
			},
			terms: {
				type: "string",
				title: "terms",
				format: "customUrl",
				maxLength: 256
			},
			avatar: {
				type: "string",
				title: "avatar",
				format: "customUrl",
				maxLength: 256
			},
			cover: {
				type: "string",
				title: "avatar",
				format: "customUrl",
				maxLength: 256
			},
			location: {
				type: "string",
				title: "location",
				maxLength: 24
			},
			website: {
				type: "string",
				title: "website",
				format: "customUrl",
				maxLength: 256
			},
			twitter: {
				type: "string",
				title: "twitter",
				pattern: "^[A-Za-z0-9_]*$",
				maxLength: 15
			},
			coingecko: {
				type: "string",
				title: "coingecko",
				pattern: "^[a-z0-9-]*$",
				maxLength: 32
			},
			github: {
				type: "string",
				title: "github",
				pattern: "^[A-Za-z0-9_-]*$",
				maxLength: 39
			},
			email: {
				type: "string",
				title: "email",
				maxLength: 32
			},
			network: {
				type: "string",
				snapshotNetwork: true,
				title: "network",
				minLength: 1,
				maxLength: 32
			},
			symbol: {
				type: "string",
				title: "symbol",
				maxLength: 16
			},
			skin: {
				type: "string",
				title: "skin",
				maxLength: 32
			},
			domain: {
				type: "string",
				title: "domain",
				maxLength: 64,
				format: "domain"
			},
			discussions: {
				type: "string",
				format: "uri",
				title: "Discussions link",
				maxLength: 256
			},
			discourseCategory: {
				type: "integer",
				minimum: 1,
				title: "Discourse category"
			},
			strategies: {
				type: "array",
				minItems: 1,
				uniqueItems: true,
				items: {
					type: "object",
					properties: {
						name: {
							type: "string",
							maxLength: 64,
							title: "name"
						},
						network: {
							type: "string",
							maxLength: 12,
							title: "network",
							snapshotNetwork: true
						},
						params: {
							type: "object",
							title: "params"
						}
					},
					required: [
						"name"
					],
					additionalProperties: false
				},
				title: "strategies"
			},
			members: {
				type: "array",
				maxItems: 100,
				items: {
					type: "string",
					format: "evmAddress"
				},
				title: "members",
				uniqueItems: true
			},
			admins: {
				type: "array",
				maxItems: 100,
				items: {
					type: "string",
					format: "evmAddress"
				},
				title: "admins",
				uniqueItems: true
			},
			moderators: {
				type: "array",
				maxItems: 100,
				items: {
					type: "string",
					format: "evmAddress"
				},
				title: "moderators",
				uniqueItems: true
			},
			filters: {
				type: "object",
				properties: {
					defaultTab: {
						type: "string"
					},
					minScore: {
						type: "number",
						minimum: 0
					},
					onlyMembers: {
						type: "boolean"
					},
					invalids: {
						type: "array",
						items: {
							type: "string",
							maxLength: 64
						},
						title: "invalids"
					}
				},
				additionalProperties: false
			},
			validation: {
				type: "object",
				properties: {
					name: {
						type: "string",
						maxLength: 64,
						title: "name"
					},
					params: {
						type: "object",
						title: "params"
					}
				},
				required: [
					"name"
				],
				additionalProperties: false
			},
			voteValidation: {
				type: "object",
				properties: {
					name: {
						type: "string",
						maxLength: 32,
						title: "name"
					},
					params: {
						type: "object",
						title: "params"
					}
				},
				required: [
					"name"
				],
				additionalProperties: false
			},
			followValidation: {
				type: "object",
				properties: {
					name: {
						type: "string",
						maxLength: 32,
						title: "name"
					},
					params: {
						type: "object",
						title: "params"
					}
				},
				required: [
					"name"
				],
				additionalProperties: false
			},
			delegationPortal: {
				type: "object",
				properties: {
					delegationType: {
						type: "string",
						title: "Delegation type",
						description: "Specify the type of delegation that you are using",
						anyOf: [
							{
								"const": "compound-governor",
								title: "Compound governor"
							},
							{
								"const": "split-delegation",
								title: "Split Delegation"
							}
						]
					},
					delegationContract: {
						type: "string",
						title: "Contract address",
						description: "The address of your delegation contract",
						examples: [
							"0x3901D0fDe202aF1427216b79f5243f8A022d68cf"
						],
						anyOf: [
							{
								format: "evmAddress"
							},
							{
								format: "starknetAddress"
							}
						],
						errorMessage: "Must be a valid EVM of Starknet address"
					},
					delegationNetwork: {
						type: "string",
						title: "Delegation network",
						description: "The network of your delegation contract",
						anyOf: [
							{
								snapshotNetwork: true
							},
							{
								starknetNetwork: true
							}
						],
						errorMessage: "Must be a valid network"
					},
					delegationApi: {
						type: "string",
						format: "uri",
						title: "Delegation API",
						description: "The URL of your delegation API (e.g a subgraph)",
						examples: [
							"https://subgrapher.snapshot.org/subgraph/arbitrum/FTzC6VrZd8JhJgWfTJnwWgH1Z1dS3GxaosKkRbCqkZAZ"
						]
					}
				},
				required: [
					"delegationType",
					"delegationApi",
					"delegationContract"
				],
				additionalProperties: false
			},
			allowAlias: {
				type: "boolean"
			},
			plugins: {
				type: "object"
			},
			voting: {
				type: "object",
				properties: {
					delay: {
						type: "integer",
						minimum: 0,
						maximum: 2592000,
						errorMessage: {
							maximum: "Delay must be less than 30 days"
						}
					},
					period: {
						type: "integer",
						minimum: 0,
						maximum: 15552000,
						errorMessage: {
							maximum: "Delay must be less than 180 days"
						}
					},
					type: {
						type: "string",
						title: "type"
					},
					quorum: {
						type: "number",
						minimum: 0
					},
					quorumType: {
						type: "string",
						"enum": [
							"rejection"
						]
					},
					blind: {
						type: "boolean"
					},
					hideAbstain: {
						type: "boolean"
					},
					aliased: {
						type: "boolean"
					},
					privacy: {
						type: "string",
						"enum": [
							"",
							"shutter",
							"any"
						]
					}
				},
				additionalProperties: false
			},
			categories: {
				type: "array",
				maxItems: 2,
				items: {
					type: "string",
					"enum": [
						"protocol",
						"social",
						"investment",
						"grant",
						"service",
						"media",
						"creator",
						"collector",
						"ai-agent",
						"gaming",
						"wallet",
						"music",
						"layer-2",
						"defai",
						"defi",
						"rwa",
						"depin",
						"meme"
					]
				}
			},
			treasuries: {
				type: "array",
				maxItems: 10,
				uniqueItems: true,
				items: {
					type: "object",
					properties: {
						name: {
							type: "string",
							title: "Name",
							examples: [
								"e.g. Balancer DAO 1"
							],
							minLength: 1,
							maxLength: 64
						},
						address: {
							type: "string",
							title: "Contract address",
							examples: [
								"e.g. 0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"
							],
							anyOf: [
								{
									format: "evmAddress"
								},
								{
									format: "starknetAddress"
								}
							],
							errorMessage: "Must be a valid EVM of Starknet address"
						},
						network: {
							type: "string",
							title: "Network",
							anyOf: [
								{
									snapshotNetwork: true
								},
								{
									starknetNetwork: true
								}
							],
							errorMessage: "Must be a valid network"
						}
					},
					required: [
						"name",
						"address",
						"network"
					],
					additionalProperties: false
				}
			},
			labels: {
				type: "array",
				maxItems: 10,
				uniqueItems: true,
				items: {
					type: "object",
					properties: {
						id: {
							type: "string",
							title: "Id",
							minLength: 1,
							maxLength: 8
						},
						name: {
							type: "string",
							title: "Name",
							minLength: 1,
							maxLength: 32
						},
						description: {
							type: "string",
							title: "Description",
							maxLength: 100
						},
						color: {
							type: "string",
							title: "Color",
							format: "color"
						}
					},
					required: [
						"id",
						"name",
						"color"
					],
					additionalProperties: false
				}
			},
			parent: {
				type: "string",
				title: "parent"
			},
			children: {
				type: "array",
				maxItems: 16,
				title: "children",
				items: {
					type: "string"
				},
				uniqueItems: true
			},
			boost: {
				type: "object",
				properties: {
					enabled: {
						type: "boolean"
					},
					bribeEnabled: {
						type: "boolean"
					}
				},
				required: [
					"enabled",
					"bribeEnabled"
				],
				additionalProperties: false
			},
			skinSettings: {
				type: "object",
				properties: {
					bg_color: {
						type: "string",
						format: "color"
					},
					link_color: {
						type: "string",
						format: "color"
					},
					text_color: {
						type: "string",
						format: "color"
					},
					content_color: {
						type: "string",
						format: "color"
					},
					border_color: {
						type: "string",
						format: "color"
					},
					heading_color: {
						type: "string",
						format: "color"
					},
					primary_color: {
						type: "string",
						format: "color"
					},
					header_color: {
						type: "string",
						format: "color"
					},
					theme: {
						type: "string",
						"enum": [
							"light",
							"dark"
						]
					},
					logo: {
						type: "string",
						title: "logo",
						format: "customUrl",
						maxLength: 256
					}
				},
				additionalProperties: false
			}
		},
		required: [
			"name",
			"network",
			"strategies"
		],
		additionalProperties: false
	}
};
var space = {
	$schema: $schema,
	$ref: $ref,
	definitions: definitions
};

var $schema$1 = "http://json-schema.org/draft-07/schema#";
var $ref$1 = "#/definitions/Proposal";
var definitions$1 = {
	Proposal: {
		title: "Proposal",
		type: "object",
		properties: {
			name: {
				type: "string",
				title: "name",
				minLength: 1,
				maxLength: 256
			},
			body: {
				type: "string",
				title: "body",
				minLength: 0
			},
			discussion: {
				type: "string",
				format: "customUrl",
				title: "discussion",
				maxLength: 256
			},
			choices: {
				type: "array",
				title: "choices",
				minItems: 1
			},
			labels: {
				type: "array",
				title: "labels",
				maxItems: 10,
				uniqueItems: true,
				items: {
					type: "string",
					minLength: 1,
					maxLength: 8,
					pattern: "^[a-zA-Z0-9]+$"
				}
			},
			type: {
				type: "string",
				"enum": [
					"single-choice",
					"approval",
					"ranked-choice",
					"quadratic",
					"copeland",
					"weighted",
					"custom",
					"basic"
				]
			},
			snapshot: {
				type: "number",
				title: "snapshot"
			},
			start: {
				type: "number",
				title: "start",
				minimum: 1000000000,
				maximum: 2000000000
			},
			end: {
				type: "number",
				title: "end",
				minimum: 1000000000,
				maximum: 2000000000
			},
			metadata: {
				type: "object",
				title: "metadata"
			},
			app: {
				type: "string",
				title: "app",
				maxLength: 24
			},
			privacy: {
				type: "string",
				"enum": [
					"",
					"shutter"
				]
			}
		},
		required: [
			"name",
			"body",
			"choices",
			"snapshot",
			"start",
			"end"
		],
		additionalProperties: false
	}
};
var proposal = {
	$schema: $schema$1,
	$ref: $ref$1,
	definitions: definitions$1
};

var $schema$2 = "http://json-schema.org/draft-07/schema#";
var $ref$2 = "#/definitions/UpdateProposal";
var definitions$2 = {
	UpdateProposal: {
		title: "Update Proposal",
		type: "object",
		properties: {
			proposal: {
				type: "string",
				title: "proposal id"
			},
			name: {
				type: "string",
				title: "name",
				minLength: 1,
				maxLength: 256
			},
			body: {
				type: "string",
				title: "body",
				minLength: 0
			},
			discussion: {
				type: "string",
				format: "customUrl",
				title: "discussion",
				maxLength: 256
			},
			choices: {
				type: "array",
				title: "choices",
				minItems: 1
			},
			labels: {
				type: "array",
				title: "labels",
				maxItems: 10,
				uniqueItems: true,
				items: {
					type: "string",
					minLength: 1,
					maxLength: 8,
					pattern: "^[a-zA-Z0-9]+$"
				}
			},
			type: {
				"enum": [
					"single-choice",
					"approval",
					"ranked-choice",
					"quadratic",
					"weighted",
					"custom",
					"basic"
				]
			},
			metadata: {
				type: "object",
				title: "metadata"
			},
			privacy: {
				type: "string",
				"enum": [
					"",
					"shutter"
				]
			}
		},
		required: [
			"proposal",
			"name",
			"body",
			"discussion",
			"choices",
			"type",
			"metadata"
		],
		additionalProperties: false
	}
};
var updateProposal = {
	$schema: $schema$2,
	$ref: $ref$2,
	definitions: definitions$2
};

var $schema$3 = "http://json-schema.org/draft-07/schema#";
var $ref$3 = "#/definitions/Vote";
var definitions$3 = {
	Vote: {
		title: "Vote",
		type: "object",
		properties: {
			proposal: {
				type: "string",
				title: "proposal"
			},
			choice: {
				type: [
					"number",
					"array",
					"object",
					"boolean",
					"string"
				],
				title: "choice"
			},
			metadata: {
				type: "object",
				title: "metadata"
			},
			reason: {
				type: "string",
				title: "reason",
				maxLength: 5000
			},
			app: {
				type: "string",
				title: "app",
				maxLength: 24
			}
		},
		required: [
			"proposal",
			"choice"
		],
		additionalProperties: false
	}
};
var vote = {
	$schema: $schema$3,
	$ref: $ref$3,
	definitions: definitions$3
};

var $schema$4 = "http://json-schema.org/draft-07/schema#";
var $ref$4 = "#/definitions/Profile";
var definitions$4 = {
	Profile: {
		title: "Profile",
		type: "object",
		properties: {
			name: {
				type: "string",
				title: "name",
				maxLength: 32
			},
			about: {
				type: "string",
				title: "about",
				maxLength: 256
			},
			avatar: {
				type: "string",
				title: "avatar",
				format: "customUrl",
				maxLength: 256
			},
			cover: {
				type: "string",
				title: "avatar",
				format: "customUrl",
				maxLength: 256
			},
			twitter: {
				type: "string",
				title: "twitter",
				pattern: "^[A-Za-z0-9_]*$",
				maxLength: 15
			},
			github: {
				type: "string",
				title: "github",
				pattern: "^[A-Za-z0-9_-]*$",
				maxLength: 39
			},
			lens: {
				type: "string",
				title: "lens",
				pattern: "^[A-Za-z0-9_]*$",
				maxLength: 26
			},
			farcaster: {
				type: "string",
				title: "farcaster",
				pattern: "^[a-z0-9-]*$",
				maxLength: 17
			}
		},
		required: [
		],
		additionalProperties: false
	}
};
var profile = {
	$schema: $schema$4,
	$ref: $ref$4,
	definitions: definitions$4
};

var $schema$5 = "http://json-schema.org/draft-07/schema#";
var $ref$5 = "#/definitions/Statement";
var definitions$5 = {
	Statement: {
		title: "Statement",
		type: "object",
		properties: {
			about: {
				type: "string",
				format: "long",
				title: "About",
				maxLength: 140
			},
			statement: {
				type: "string",
				format: "long",
				title: "Statement",
				maxLength: 10000
			},
			discourse: {
				type: "string",
				title: "discourse",
				pattern: "^[A-Za-z0-9-_.]*$",
				maxLength: 30
			},
			network: {
				type: "string",
				title: "network",
				pattern: "^[a-z0-9-]*$",
				maxLength: 24
			},
			status: {
				"enum": [
					"ACTIVE",
					"INACTIVE"
				],
				title: "status"
			}
		},
		required: [
		],
		additionalProperties: false
	}
};
var statement = {
	$schema: $schema$5,
	$ref: $ref$5,
	definitions: definitions$5
};

var $schema$6 = "http://json-schema.org/draft-07/schema#";
var $ref$6 = "#/definitions/Zodiac";
var definitions$6 = {
	Zodiac: {
		title: "Zodiac",
		type: "object",
		properties: {
			safes: {
				title: "Safe(s)",
				type: "array",
				maxItems: 8,
				items: {
					type: "object",
					properties: {
						network: {
							title: "Network",
							type: "string",
							snapshotNetwork: true
						},
						multisend: {
							title: "Multisend contract address",
							type: "string"
						},
						realityAddress: {
							title: "Reality module address",
							type: "string"
						},
						umaAddress: {
							title: "UMA module address",
							type: "string"
						}
					},
					additionalProperties: false
				}
			},
			additionalProperties: false
		}
	}
};
var zodiac = {
	$schema: $schema$6,
	$ref: $ref$6,
	definitions: definitions$6
};

var $schema$7 = "http://json-schema.org/draft-07/schema#";
var $ref$7 = "#/definitions/Alias";
var definitions$7 = {
	Alias: {
		title: "Alias",
		type: "object",
		properties: {
			alias: {
				type: "string",
				format: "address"
			}
		},
		required: [
			"alias"
		],
		additionalProperties: false
	}
};
var alias = {
	$schema: $schema$7,
	$ref: $ref$7,
	definitions: definitions$7
};

var schemas = {
    space: space.definitions.Space,
    proposal: proposal.definitions.Proposal,
    updateProposal: updateProposal.definitions.UpdateProposal,
    vote: vote.definitions.Vote,
    profile: profile.definitions.Profile,
    statement: statement.definitions.Statement,
    zodiac: zodiac.definitions.Zodiac,
    alias: alias.definitions.Alias
};

class Multicaller {
    constructor(network, provider, abi, options) {
        this.options = {};
        this.calls = [];
        this.paths = [];
        this.network = network;
        this.provider = provider;
        this.abi = abi;
        this.options = options || {};
    }
    call(path, address, fn, params) {
        this.calls.push([address, fn, params]);
        this.paths.push(path);
        return this;
    }
    execute(from) {
        return __awaiter(this, void 0, void 0, function* () {
            const obj = from || {};
            const result = yield multicall(this.network, this.provider, this.abi, this.calls, this.options);
            result.forEach((r, i) => set(obj, this.paths[i], r.length > 1 ? r : r[0]));
            this.calls = [];
            this.paths = [];
            return obj;
        });
    }
}

let cache = {};
let expirationTime = 0;
function getSnapshots(network_1, snapshot_1, provider_1, networks_1) {
    return __awaiter(this, arguments, void 0, function* (network, snapshot, provider, networks, options = {}) {
        // If snapshot is latest, return all latest
        const snapshots = {};
        networks.forEach((n) => (snapshots[n] = 'latest'));
        if (snapshot === 'latest')
            return snapshots;
        // Check if cache is valid
        const cacheKey = `${network}-${snapshot}-${networks.join('-')}`;
        const cachedEntry = cache[cacheKey];
        const now = Date.now();
        if (cachedEntry && expirationTime > now) {
            return cachedEntry;
        }
        // Reset cache every hour
        if (expirationTime < now) {
            cache = {};
            // Set expiration time to next hour
            expirationTime = now + 60 * 60 * 1000 - (now % (60 * 60 * 1000));
        }
        snapshots[network] = snapshot;
        const networkIn = Object.keys(snapshots).filter((s) => network !== s);
        if (networkIn.length === 0)
            return snapshots;
        const block = yield provider.getBlock(snapshot);
        const query = {
            blocks: {
                __args: {
                    where: {
                        ts: block.timestamp,
                        network_in: networkIn
                    }
                },
                network: true,
                number: true
            }
        };
        const url = options.blockFinderUrl || 'https://blockfinder.snapshot.org';
        const data = yield subgraphRequest(url, query);
        data.blocks.forEach((block) => (snapshots[block.network] = block.number));
        cache[cacheKey] = snapshots;
        return snapshots;
    });
}

const providers = {};
const DEFAULT_BROVIDER_URL = 'https://rpc.snapshot.org';
const DEFAULT_TIMEOUT = 25000;
function getProvider(network, { broviderUrl = DEFAULT_BROVIDER_URL, timeout = DEFAULT_TIMEOUT } = {}) {
    const url = `${broviderUrl}/${network}`;
    if (!providers[network])
        providers[network] = new StaticJsonRpcProvider({
            url,
            timeout,
            allowGzip: true
        }, Number(network));
    return providers[network];
}

function signMessage(web3, msg, address) {
    return __awaiter(this, void 0, void 0, function* () {
        msg = hexlify(new Buffer(msg, 'utf8'));
        return yield web3.send('personal_sign', [msg, address]);
    });
}
function getBlockNumber(provider) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const blockNumber = yield provider.getBlockNumber();
            return parseInt(blockNumber);
        }
        catch (e) {
            return Promise.reject();
        }
    });
}

const RPC_URLS = {
    SN_MAIN: 'https://starknet-mainnet.public.blastapi.io',
    SN_SEPOLIA: 'https://starknet-sepolia.public.blastapi.io'
};
const ABI = [
    {
        name: 'argent::common::account::IAccount',
        type: 'interface',
        items: [
            {
                name: 'is_valid_signature',
                type: 'function',
                inputs: [
                    {
                        name: 'hash',
                        type: 'core::felt252'
                    },
                    {
                        name: 'signature',
                        type: 'core::array::Array::<core::felt252>'
                    }
                ],
                outputs: [
                    {
                        type: 'core::felt252'
                    }
                ],
                state_mutability: 'view'
            }
        ]
    }
];
function getProvider$1(network, options) {
    var _a;
    if (!RPC_URLS[network])
        throw new Error('Invalid network');
    return new RpcProvider({
        nodeUrl: (_a = options === null || options === void 0 ? void 0 : options.broviderUrl) !== null && _a !== void 0 ? _a : RPC_URLS[network]
    });
}
function isStarknetMessage(data) {
    return !!data.primaryType && !!data.types.StarkNetDomain;
}
function getHash(data, address) {
    const { domain, types, primaryType, message } = data;
    return typedData.getMessageHash({ types, primaryType, domain, message }, address);
}
function verify(address_1, sig_1, data_1) {
    return __awaiter(this, arguments, void 0, function* (address, sig, data, network = 'SN_MAIN', options = {}) {
        try {
            const contractAccount = new Contract(ABI, address, getProvider$1(network, options));
            if (sig.length < 2) {
                throw new Error('Invalid signature format');
            }
            const result = yield contractAccount.is_valid_signature(getHash(data, address), sig.slice(-2));
            return BigNumber.from(result).eq(BigNumber.from('370462705988'));
        }
        catch (e) {
            if (e.message.includes('Contract not found')) {
                throw new Error('Contract not deployed');
            }
            throw e;
        }
    });
}

var starknet = /*#__PURE__*/Object.freeze({
    __proto__: null,
    isStarknetMessage: isStarknetMessage,
    getHash: getHash,
    'default': verify
});

const ERC6492_DETECTION_SUFFIX = '6492649264926492649264926492649264926492649264926492649264926492';
function isEqual(a, b) {
    return a.toLowerCase() === b.toLowerCase();
}
function getHash$1(data) {
    const { domain, types, message } = data;
    return _TypedDataEncoder.hash(domain, types, message);
}
function verify$1(address_1, sig_1, data_1) {
    return __awaiter(this, arguments, void 0, function* (address, sig, data, network = '1', options = {}) {
        const { domain, types, message } = data;
        try {
            const recoverAddress = verifyTypedData(domain, types, message, sig);
            if (isEqual(address, recoverAddress))
                return true;
        }
        catch (e) { }
        const provider = getProvider(network, options);
        const hash = getHash$1(data);
        // Handle EIP-6492
        // https://eips.ethereum.org/EIPS/eip-6492
        //
        // We can actually replace verifyTypedData and verifyDefault with the following code,
        // but https://github.com/AmbireTech/signature-validator/blob/main/contracts/DeploylessUniversalSigValidator.sol
        // also can send an extra network request to the provider. (with verifyTypedData we don't send any extra request)
        //
        if (sig.endsWith(ERC6492_DETECTION_SUFFIX)) {
            try {
                return ('0x01' ===
                    (yield provider.call({
                        data: concat([
                            '0x60806040523480156200001157600080fd5b50604051620007003803806200070083398101604081905262000034916200056f565b6000620000438484846200004f565b9050806000526001601ff35b600080846001600160a01b0316803b806020016040519081016040528181526000908060200190933c90507f6492649264926492649264926492649264926492649264926492649264926492620000a68462000451565b036200021f57600060608085806020019051810190620000c79190620005ce565b8651929550909350915060000362000192576000836001600160a01b031683604051620000f5919062000643565b6000604051808303816000865af19150503d806000811462000134576040519150601f19603f3d011682016040523d82523d6000602084013e62000139565b606091505b5050905080620001905760405162461bcd60e51b815260206004820152601e60248201527f5369676e617475726556616c696461746f723a206465706c6f796d656e74000060448201526064015b60405180910390fd5b505b604051630b135d3f60e11b808252906001600160a01b038a1690631626ba7e90620001c4908b90869060040162000661565b602060405180830381865afa158015620001e2573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906200020891906200069d565b6001600160e01b031916149450505050506200044a565b805115620002b157604051630b135d3f60e11b808252906001600160a01b03871690631626ba7e9062000259908890889060040162000661565b602060405180830381865afa15801562000277573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906200029d91906200069d565b6001600160e01b031916149150506200044a565b8251604114620003195760405162461bcd60e51b815260206004820152603a6024820152600080516020620006e083398151915260448201527f3a20696e76616c6964207369676e6174757265206c656e677468000000000000606482015260840162000187565b620003236200046b565b506020830151604080850151855186939260009185919081106200034b576200034b620006c9565b016020015160f81c9050601b81148015906200036b57508060ff16601c14155b15620003cf5760405162461bcd60e51b815260206004820152603b6024820152600080516020620006e083398151915260448201527f3a20696e76616c6964207369676e617475726520762076616c75650000000000606482015260840162000187565b6040805160008152602081018083528a905260ff83169181019190915260608101849052608081018390526001600160a01b038a169060019060a0016020604051602081039080840390855afa1580156200042e573d6000803e3d6000fd5b505050602060405103516001600160a01b031614955050505050505b9392505050565b60006020825110156200046357600080fd5b508051015190565b60405180606001604052806003906020820280368337509192915050565b6001600160a01b03811681146200049f57600080fd5b50565b634e487b7160e01b600052604160045260246000fd5b60005b83811015620004d5578181015183820152602001620004bb565b50506000910152565b600082601f830112620004f057600080fd5b81516001600160401b03808211156200050d576200050d620004a2565b604051601f8301601f19908116603f01168101908282118183101715620005385762000538620004a2565b816040528381528660208588010111156200055257600080fd5b62000565846020830160208901620004b8565b9695505050505050565b6000806000606084860312156200058557600080fd5b8351620005928162000489565b6020850151604086015191945092506001600160401b03811115620005b657600080fd5b620005c486828701620004de565b9150509250925092565b600080600060608486031215620005e457600080fd5b8351620005f18162000489565b60208501519093506001600160401b03808211156200060f57600080fd5b6200061d87838801620004de565b935060408601519150808211156200063457600080fd5b50620005c486828701620004de565b6000825162000657818460208701620004b8565b9190910192915050565b828152604060208201526000825180604084015262000688816060850160208701620004b8565b601f01601f1916919091016060019392505050565b600060208284031215620006b057600080fd5b81516001600160e01b0319811681146200044a57600080fd5b634e487b7160e01b600052603260045260246000fdfe5369676e617475726556616c696461746f72237265636f7665725369676e6572',
                            new AbiCoder().encode(['address', 'bytes32', 'bytes'], [address, arrayify(hash), sig])
                        ])
                    })));
            }
            catch (error) {
                return false;
            }
        }
        // Handle EIP-1271
        if (yield verifyDefault(address, sig, hash, provider))
            return true;
        return yield verifyOldVersion(address, sig, hash, provider);
    });
}
function verifyDefault(address, sig, hash, provider) {
    return __awaiter(this, void 0, void 0, function* () {
        let returnValue;
        const magicValue = '0x1626ba7e';
        const abi = 'function isValidSignature(bytes32 _hash, bytes memory _signature) public view returns (bytes4 magicValue)';
        try {
            returnValue = yield call(provider, [abi], [address, 'isValidSignature', [arrayify(hash), sig]]);
        }
        catch (e) {
            if (e.message.startsWith('missing revert data in call exception')) {
                return false;
            }
            throw e;
        }
        return isEqual(returnValue, magicValue);
    });
}
function verifyOldVersion(address, sig, hash, provider) {
    return __awaiter(this, void 0, void 0, function* () {
        const magicValue = '0x20c13b0b';
        const abi = 'function isValidSignature(bytes _hash, bytes memory _signature) public view returns (bytes4 magicValue)';
        const returnValue = yield call(provider, [abi], [address, 'isValidSignature', [arrayify(hash), sig]]);
        return isEqual(returnValue, magicValue);
    });
}

var evm = /*#__PURE__*/Object.freeze({
    __proto__: null,
    getHash: getHash$1,
    'default': verify$1
});

function getHash$2(data, address) {
    const networkType = isStarknetMessage(data) ? starknet : evm;
    return networkType.getHash(data, address);
}
function verify$2(address_1, sig_1, data_1) {
    return __awaiter(this, arguments, void 0, function* (address, sig, data, network = '1', options = {}) {
        if (!isStarknetAddress(address) && !isEvmAddress(address)) {
            throw new Error('Invalid address');
        }
        const networkType = isStarknetMessage(data) ? starknet : evm;
        return yield networkType.default(address, sig, data, network, options);
    });
}

var gateways = [
	"ipfs.snapshot.box",
	"snapshot.4everland.link",
	"ipfs.io",
	"ipfs.fleek.co",
	"gateway.pinata.cloud",
	"dweb.link",
	"ipfs.infura.io"
];

var networks = {
	"1": {
	key: "1",
	name: "Ethereum",
	chainId: 1,
	network: "homestead",
	multicall: "0xeefba1e63905ef1d7acba5a8513c70307c1ce441",
	ensResolvers: [
		"0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63",
		"0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41"
	],
	ensNameWrapper: "0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401",
	ensSubgraph: "https://subgrapher.snapshot.org/subgraph/arbitrum/5XqPmWe6gjyrJtFn9cLy237i4cWw2j9HcUJEXsP5qGtH",
	rpc: [
		"https://rpc.ankr.com/eth",
		{
			url: "https://api-geth-archive.ankr.com",
			user: "balancer_user",
			password: "balancerAnkr20201015"
		},
		"https://speedy-nodes-nyc.moralis.io/b9aed21e7bb7bdeb35972c9a/eth/mainnet/archive",
		"https://apis.ankr.com/e62bc219f9c9462b8749defe472d2dc5/6106d4a3ec1d1bcc87ec72158f8fd089/eth/archive/main",
		"https://eth-archival.gateway.pokt.network/v1/5f76124fb90218002e9ce985",
		"https://eth-mainnet.alchemyapi.io/v2/4bdDVB5QAaorY2UE-GBUbM2yQB3QJqzv"
	],
	light: [
		"https://cloudflare-eth.com"
	],
	ws: [
		"wss://eth-mainnet.ws.alchemyapi.io/v2/4bdDVB5QAaorY2UE-GBUbM2yQB3QJqzv"
	],
	explorer: {
		url: "https://etherscan.io",
		apiUrl: "https://api.etherscan.io"
	},
	start: 7929876,
	logo: "ipfs://bafkreid7ndxh6y2ljw2jhbisodiyrhcy2udvnwqgon5wgells3kh4si5z4"
},
	"8": {
	key: "8",
	name: "Ubiq",
	chainId: 8,
	network: "Ubiq",
	multicall: "0x6668750957e4083725926B71C41bDF1434C73262",
	rpc: [
		"https://rpc.octano.dev"
	],
	ws: [
		"wss://ws.octano.dev"
	],
	explorer: {
		url: "https://ubiqscan.io"
	},
	start: 1,
	logo: "ipfs://Qmec3HLoN4QhwZAhw4XTi2aN8Wwmcko5hHN22sHARzb9tw"
},
	"10": {
	key: "10",
	name: "OP Mainnet",
	chainId: 10,
	network: "OP Mainnet",
	multicall: "0x35A6Cdb2C9AD4a45112df4a04147EB07dFA01aB7",
	rpc: [
		"https://opt-mainnet.g.alchemy.com/v2/JzmIL4Q3jBj7it2duxLFeuCa9Wobmm7D"
	],
	explorer: {
		url: "https://optimistic.etherscan.io",
		apiUrl: "https://api-optimistic.etherscan.io"
	},
	start: 657806,
	logo: "ipfs://bafkreifu2remiqfpsb4hgisbwb3qxedrzpwsea7ik4el45znjcf56xf2ku"
},
	"19": {
	key: "19",
	name: "Songbird Canary-Network",
	shortName: "Songbird",
	chainId: 19,
	network: "songbird",
	multicall: "0x17032Ea9c3a13Ed337665145364c0d2aD1108c91",
	rpc: [
		"https://songbird-api.flare.network/ext/C/rpc"
	],
	explorer: {
		url: "https://songbird-explorer.flare.network"
	},
	start: 21807126,
	logo: "ipfs://QmXyvnrZY8FUxSULfnKKA99sAEkjAHtvhRx5WeHixgaEdu"
},
	"24": {
	key: "24",
	name: "KardiaChain Mainnet",
	shortName: "KAI",
	chainId: 24,
	network: "mainnet",
	multicall: "0xd9c92F2287B7802A37eC9BEce96Aa65fb5f31E1b",
	rpc: [
		"https://kai-internal.kardiachain.io"
	],
	explorer: {
		url: "https://explorer.kardiachain.io"
	},
	start: 8260245,
	logo: "ipfs://bafkreig73yfyqzbxydv6e3dbj5nks3f57px2iez7tywayey4rilfhhrr34"
},
	"25": {
	key: "25",
	name: "Cronos",
	shortName: "Cronos",
	chainId: 25,
	network: "mainnet",
	multicall: "0x6F522a3982e8F9A50A2EDc9E46ed1A3aE2B3FD3a",
	rpc: [
		"https://evm-cronos.crypto.org"
	],
	explorer: {
		url: "https://cronos.crypto.org/explorer"
	},
	start: 4067,
	logo: "ipfs://QmfSJbtirJoa3Pt7o5Fdm85wbyw9V1hpzqLr5PQbdnfsAj"
},
	"30": {
	key: "30",
	name: "RSK",
	chainId: 30,
	network: "rsk mainnet",
	multicall: "0x4eeebb5580769ba6d26bfd07be636300076d1831",
	rpc: [
		"https://public-node.rsk.co"
	],
	explorer: {
		url: "https://explorer.rsk.co"
	},
	start: 2516442,
	logo: "ipfs://QmXTwpE1SqoNZmyY4c3fYWy6qUgQELsyWKbgJo2Pg6K6V9"
},
	"46": {
	key: "46",
	name: "Darwinia Network",
	shortName: "Darwinia",
	chainId: 46,
	network: "mainnet",
	multicall: "0x67f9ae42EaA9a8aBf065D60ec6Ab3C1A11370607",
	rpc: [
		"https://rpc.darwinia.network"
	],
	explorer: {
		url: "https://darwinia.subscan.io"
	},
	start: 141853,
	logo: "ipfs://bafkreicf55maidhx46pyu3mwsshlr43xbewr6tkckkonh4nesbkp7krwkm"
},
	"56": {
	key: "56",
	name: "BNB Smart Chain",
	shortName: "BSC",
	chainId: 56,
	network: "mainnet",
	multicall: "0x1ee38d535d541c55c9dae27b12edf090c608e6fb",
	rpc: [
		"https://speedy-nodes-nyc.moralis.io/b9aed21e7bb7bdeb35972c9a/bsc/mainnet/archive",
		"https://rpc.ankr.com/bsc",
		"https://bsc.getblock.io/mainnet/?api_key=91f8195f-bf46-488f-846a-73d6853790e7",
		"https://bsc-private-dataseed1.nariox.org",
		"https://bsc-dataseed1.ninicoin.io",
		"https://bsc-dataseed1.binance.org"
	],
	explorer: {
		url: "https://bscscan.com"
	},
	start: 461230,
	logo: "ipfs://bafkreibll4la7wqerzs7zwxjne2j7ayynbg2wlenemssoahxxj5rbt6c64"
},
	"61": {
	key: "61",
	name: "Ethereum Classic",
	shortName: "Ethereum Classic",
	chainId: 61,
	network: "mainnet",
	multicall: "0x51be3a92C56ae7E207C5b5Fd87F7798Ce82C1AC2",
	rpc: [
		"https://www.ethercluster.com/etc"
	],
	explorer: {
		url: "https://blockscout.com/etc/mainnet"
	},
	start: 13307544,
	logo: "ipfs://QmVegc28DvA7LjKUFysab81c9BSuN4wQVDQkRXyAtuEBis"
},
	"66": {
	key: "66",
	name: "OKExChain",
	shortName: "OEC Mainnet",
	chainId: 66,
	network: "oec mainnet",
	multicall: "0x6EB187d8197Ac265c945b69f3c3064A6f3831866",
	rpc: [
		"https://exchainrpc.okex.org"
	],
	ws: [
		"wss://exchainws.okex.org:8443"
	],
	explorer: {
		url: "https://www.oklink.com/okexchain"
	},
	start: 5076543,
	logo: "ipfs://Qmd7dKnNwHRZ4HRCbCXUbkNV7gP28fGqPdjbHtjRtT9sQF"
},
	"75": {
	key: "75",
	name: "Decimal",
	shortName: "mainnet",
	chainId: 75,
	network: "mainnet",
	multicall: "0x949d1A0757803C51F2EfFFEb5472C861A898B8E8",
	rpc: [
	],
	explorer: {
		url: "https://explorer.decimalchain.com"
	},
	start: 16031065,
	logo: "ipfs://bafkreihkdhbce5rkogl63xegaarlirjrvbfarxbtbf5mqme3s5grvbjyxm"
},
	"81": {
	key: "81",
	name: "Shibuya Network",
	shortName: "Shibuya",
	chainId: 81,
	network: "testnet",
	testnet: true,
	multicall: "0x3E90A35839ff0Aa32992d33d861f24dC95BBf74d",
	rpc: [
		"https://rpc.shibuya.astar.network:8545"
	],
	explorer: {
		url: "https://blockscout.com/shibuya"
	},
	start: 856303,
	logo: "ipfs://QmZLQVsUqHBDXutu6ywTvcYXDZG2xBstMfHkfJSzUNpZsc"
},
	"82": {
	key: "82",
	name: "Meter",
	shortName: "Meter",
	chainId: 82,
	network: "mainnet",
	multicall: "0x579De77CAEd0614e3b158cb738fcD5131B9719Ae",
	rpc: [
		"https://rpc.meter.io"
	],
	explorer: {
		url: "https://scan.meter.io"
	},
	start: 4992871,
	logo: "ipfs://QmSZvT9w9eUDvV1YVaq3BKKEbubtNVqu1Rin44FuN4wz11"
},
	"97": {
	key: "97",
	name: "BNB Smart Chain Testnet",
	shortName: "BSC Testnet",
	chainId: 97,
	network: "testnet",
	testnet: true,
	multicall: "0x8b54247c6BAe96A6ccAFa468ebae96c4D7445e46",
	rpc: [
		"https://data-seed-prebsc-1-s1.binance.org:8545",
		"https://speedy-nodes-nyc.moralis.io/f2963e29bec0de5787da3164/bsc/testnet/archive"
	],
	explorer: {
		url: "https://testnet.bscscan.com"
	},
	start: 3599656,
	logo: "ipfs://bafkreibll4la7wqerzs7zwxjne2j7ayynbg2wlenemssoahxxj5rbt6c64"
},
	"100": {
	key: "100",
	name: "Gnosis Chain",
	shortName: "xDAI",
	chainId: 100,
	network: "mainnet",
	multicall: "0xb5b692a88bdfc81ca69dcb1d924f59f0413a602a",
	rpc: [
		"https://gno.getblock.io/mainnet/6c1d1e6e-75d9-452f-a863-a694bff93d5c/",
		"https://xdai-archive.blockscout.com",
		"https://poa-xdai.gateway.pokt.network/v1/5f76124fb90218002e9ce985",
		"https://rpc.gnosischain.com"
	],
	light: [
		"https://rpc.gnosischain.com"
	],
	ws: [
		"wss://rpc.xdaichain.com/wss"
	],
	explorer: {
		url: "https://gnosis.blockscout.com"
	},
	start: 4108192,
	logo: "ipfs://QmZeiy8Ax4133wzxUQM9ky8z5XFVf6YLFjJMmTWbWVniZR"
},
	"108": {
	key: "108",
	name: "Thundercore",
	chainId: 108,
	network: "mainnet",
	multicall: "0x3017086deef56679e267f67f66c4415109b7a97f",
	rpc: [
		"https://mainnet-rpc.thundercore.com/archived/SNAPSHOTEuR82a75fLYA"
	],
	explorer: {
		url: "https://viewblock.io/thundercore"
	},
	start: 94425385,
	logo: "ipfs://bafkreifc5z5vtvqx2luzgateyvoocwpd2ifv2hwufxdnyl2a767wa6icli"
},
	"109": {
	key: "109",
	name: "Shibarium",
	shortName: "mainnet",
	chainId: 109,
	network: "mainnet",
	multicall: "0xcA11bde05977b3631167028862bE2a173976CA11",
	rpc: [
	],
	explorer: {
		url: "https://shibariumscan.io"
	},
	start: 3485946,
	logo: "ipfs://bafkreig57igai5phg4icywc5yoockd52jo3hlvbkyi6wiufrmu4p2lmenm"
},
	"122": {
	key: "122",
	name: "Fuse",
	shortName: "Fuse",
	chainId: 122,
	network: "mainnet",
	multicall: "0x7a59441fb06666F6d2D766393d876945D06a169c",
	rpc: [
		"https://explorer-node.fuse.io/",
		"https://oefusefull1.liquify.info/"
	],
	explorer: {
		url: "https://explorer.fuse.io"
	},
	start: 11923459,
	logo: "ipfs://QmXjWb64nako7voaVEifgdjAbDbswpTY8bghsiHpv8yWtb"
},
	"137": {
	key: "137",
	name: "Polygon PoS",
	shortName: "Polygon",
	chainId: 137,
	network: "mainnet",
	multicall: "0xCBca837161be50EfA5925bB9Cc77406468e76751",
	rpc: [
		"https://rpc.ankr.com/polygon",
		"https://speedy-nodes-nyc.moralis.io/b9aed21e7bb7bdeb35972c9a/polygon/mainnet/archive",
		"https://speedy-nodes-nyc.moralis.io/f2963e29bec0de5787da3164/polygon/mainnet/archive",
		"https://rpc-mainnet.maticvigil.com/v1/1cfd7598e5ba6dcf0b4db58e8be484badc6ea08e"
	],
	ws: [
		"wss://ws-mainnet.matic.network"
	],
	explorer: {
		url: "https://polygonscan.com",
		apiUrl: "https://api.polygonscan.com"
	},
	start: 9834491,
	logo: "ipfs://bafkreihgr7zy7vi5kqddybfaezwuhvssg57qluwmyan4qq7l57nr7w7wey"
},
	"144": {
	key: "144",
	name: "PHI Network",
	shortName: "PHI",
	chainId: 144,
	network: "mainnet",
	multicall: "0xc2f41B404a6757863AAeF49ff93039421acCd630",
	rpc: [
		"https://connect.phi.network"
	],
	explorer: {
		url: "https://phiscan.com"
	},
	start: 360030,
	logo: "ipfs://bafkreid6pm3mic7izp3a6zlfwhhe7etd276bjfsq2xash6a4s2vmcdf65a"
},
	"146": {
	key: "146",
	name: "Sonic",
	shortName: "mainnet",
	chainId: 146,
	network: "mainnet",
	multicall: "0xcA11bde05977b3631167028862bE2a173976CA11",
	rpc: [
	],
	explorer: {
		url: "https://explorer.soniclabs.com"
	},
	start: 60,
	logo: "ipfs://bafkreic5fffatwy2gzf6y5iymje6ijii43tz4wlxl35da36guurhibjx44"
},
	"148": {
	key: "148",
	name: "ShimmerEVM",
	shortName: "ShimmerEVM",
	chainId: 148,
	network: "mainnet",
	multicall: "0xcA11bde05977b3631167028862bE2a173976CA11",
	rpc: [
	],
	explorer: {
		url: "https://explorer.evm.shimmer.network"
	},
	start: 1290,
	logo: "ipfs://bafkreib4xhbgbhrwkmizp4d4nz3wzbpyhdm6wpz2v2pbkk7jxsgg3hdt74"
},
	"157": {
	key: "157",
	name: "Shibarium Puppynet Testnet",
	shortName: "testnet",
	chainId: 157,
	network: "testnet",
	multicall: "0xA4029b74FBA366c926eDFA7Dd10B21C621170a4c",
	rpc: [
	],
	explorer: {
		url: "https://puppyscan.shib.io"
	},
	start: 3035769,
	logo: "ipfs://bafkreig57igai5phg4icywc5yoockd52jo3hlvbkyi6wiufrmu4p2lmenm",
	testnet: true
},
	"169": {
	key: "169",
	name: "Manta Pacific",
	shortName: "Manta",
	chainId: 169,
	network: "mainnet",
	multicall: "0xcA11bde05977b3631167028862bE2a173976CA11",
	rpc: [
	],
	explorer: {
		url: "https://www.oklink.com/manta"
	},
	start: 332890,
	logo: "ipfs://bafkreibbrwgwdcfh755dqh4ndta6tja77qbaa36bfv4pstub6prhhore7a"
},
	"204": {
	key: "204",
	name: "opBNB",
	shortName: "mainnet",
	chainId: 204,
	network: "mainnet",
	multicall: "0xcA11bde05977b3631167028862bE2a173976CA11",
	rpc: [
	],
	explorer: {
		url: "http://opbnbscan.com"
	},
	start: 512881,
	logo: "ipfs://bafkreibll4la7wqerzs7zwxjne2j7ayynbg2wlenemssoahxxj5rbt6c64"
},
	"246": {
	key: "246",
	name: "Energy Web Chain",
	shortName: "EWC",
	chainId: 246,
	network: "mainnet",
	multicall: "0x0767F26d0D568aB61A98b279C0b28a4164A6f05e",
	rpc: [
		"https://voting-rpc.carbonswap.exchange"
	],
	explorer: {
		url: "https://explorer.energyweb.org"
	},
	start: 12086501,
	logo: "ipfs://Qmai7AGHgs8NpeGeXgbMZz7pS2i4kw44qubCJYGrZW2f3a"
},
	"250": {
	key: "250",
	name: "Fantom Opera",
	shortName: "fantom",
	chainId: 250,
	network: "Mainnet",
	multicall: "0x7f6A10218264a22B4309F3896745687E712962a0",
	rpc: [
		"https://rpc.ankr.com/fantom",
		"https://rpc.ftm.tools",
		"https://rpcapi.fantom.network"
	],
	explorer: {
		url: "https://ftmscan.com"
	},
	start: 2497732,
	logo: "ipfs://QmVEgNeQDKnXygeGxfY9FywZpNGQu98ktZtRJ9bToYF6g7"
},
	"252": {
	key: "252",
	name: "Fraxtal",
	shortName: "mainnet",
	chainId: 252,
	network: "mainnet",
	multicall: "0xcA11bde05977b3631167028862bE2a173976CA11",
	rpc: [
	],
	explorer: {
		url: "https://fraxscan.com"
	},
	start: 1,
	logo: "ipfs://bafkreieflj4wq6tx7k5kq47z3xnsrdrn2xgm4bxa3uovrnndcb2vqqwlyu"
},
	"269": {
	key: "269",
	name: "High Performance Blockchain",
	shortName: "HPB",
	chainId: 269,
	network: "mainnet",
	multicall: "0x67D0f263aef2F6167FA77353695D75b582Ff4Bca",
	rpc: [
		"https://hpbnode.com"
	],
	ws: [
		"wss://ws.hpbnode.com"
	],
	explorer: {
		url: "https://hscan.org"
	},
	start: 13960096,
	logo: "ipfs://QmU7f1MyRz8rLELFfypnWZQjGbDGYgZtC9rjw47jYMYrnu"
},
	"296": {
	key: "296",
	name: "Hedera Testnet",
	shortName: "testnet",
	chainId: 296,
	network: "testnet",
	multicall: "0xADE3166b0afA89b2CDB64870D70ADeD330Eab015",
	rpc: [
	],
	explorer: {
		url: "https://hashscan.io/testnet"
	},
	start: 17561901,
	logo: "ipfs://bafkreia5gpitwgo4sspvvtwqcxosq2krrqo5dbrnvylgibvmypzotfmbuu",
	testnet: true
},
	"300": {
	key: "300",
	name: "zkSync Sepolia Testnet",
	shortName: "testnet",
	chainId: 300,
	network: "testnet",
	multicall: "0xF9cda624FBC7e059355ce98a31693d299FACd963",
	rpc: [
	],
	explorer: {
		url: "https://sepolia.explorer.zksync.dev"
	},
	start: 2292,
	logo: "ipfs://bafkreih6y7ri7h667cwxe5miisxghfheiidtbw2747y75stoxt3gp3a2yy",
	testnet: true
},
	"314": {
	key: "314",
	name: "Filecoin",
	shortName: "mainnet",
	chainId: 314,
	network: "mainnet",
	multicall: "0xcA11bde05977b3631167028862bE2a173976CA11",
	rpc: [
	],
	explorer: {
		url: "https://filfox.io"
	},
	start: 3328594,
	logo: "ipfs://bafybeibyvjfmk6aqlfdrczvth55jkmnoadtrch7ht3rdmvqmy2bfxynecm"
},
	"321": {
	key: "321",
	name: "KCC",
	shortName: "KCC",
	chainId: 321,
	network: "mainnet",
	multicall: "0xa64D6AFb48225BDA3259246cfb418c0b91de6D7a",
	rpc: [
		"https://rpc-mainnet.kcc.network"
	],
	ws: [
		"wss://rpc-ws-mainnet.kcc.network"
	],
	explorer: {
		url: "https://explorer.kcc.io"
	},
	start: 1487453,
	logo: "ipfs://QmRdzYGhFRG8QLzMJahHrw3vETE2YZ9sywQbEkenSjKEvb"
},
	"324": {
	key: "324",
	name: "zkSync Era",
	shortName: "zkSync-era",
	chainId: 324,
	network: "zkSync Era Mainnet",
	multicall: "0xF9cda624FBC7e059355ce98a31693d299FACd963",
	rpc: [
		"https://mainnet.era.zksync.io"
	],
	explorer: {
		url: "https://explorer.zksync.io"
	},
	start: 3908235,
	logo: "ipfs://bafkreih6y7ri7h667cwxe5miisxghfheiidtbw2747y75stoxt3gp3a2yy"
},
	"336": {
	key: "336",
	name: "Shiden Network",
	shortName: "Shiden",
	chainId: 336,
	network: "mainnet",
	multicall: "0x3E90A35839ff0Aa32992d33d861f24dC95BBf74d",
	rpc: [
		"https://rpc.shiden.astar.network:8545",
		"https://shiden.api.onfinality.io/public"
	],
	explorer: {
		url: "https://blockscout.com/shiden"
	},
	start: 1170016,
	logo: "ipfs://QmcqGQE4Sk73zXc3e91TUFFefKBVeaNgbxV141XkSNE4xj"
},
	"369": {
	key: "369",
	name: "Pulsechain",
	shortName: "Pulsechain",
	chainId: 369,
	network: "mainnet",
	multicall: "0xdbdd0FD8B16F0092f306392b699D7fbddaA9011B",
	rpc: [
		"https://rpc.pulsechain.com"
	],
	explorer: {
		url: "https://scan.pulsechain.com"
	},
	start: 17657774,
	logo: "ipfs://QmWUsiEWdejtHZ9B9981TYXn7Ds8C7fkB1S4h5rP3kCCZR"
},
	"416": {
	key: "416",
	name: "SX Network",
	shortName: "SX",
	chainId: 416,
	network: "mainnet",
	multicall: "0x834a005DDCF990Ba1a79f259e840e58F2D14F49a",
	rpc: [
		"https://rpc.sx.technology"
	],
	ws: [
		"wss://rpc.sx.technology/ws"
	],
	explorer: {
		url: "https://explorer.sx.technology"
	},
	start: 2680605,
	logo: "ipfs://QmSXLXqyr2H6Ja5XrmznXbWTEvF2gFaL8RXNXgyLmDHjAF"
},
	"592": {
	key: "592",
	name: "Astar Network",
	shortName: "Astar",
	chainId: 592,
	network: "mainnet",
	multicall: "0x3E90A35839ff0Aa32992d33d861f24dC95BBf74d",
	rpc: [
		"https://astar.api.onfinality.io/public",
		"https://rpc.astar.network:8545"
	],
	explorer: {
		url: "https://blockscout.com/astar"
	},
	start: 366482,
	logo: "ipfs://QmZLQVsUqHBDXutu6ywTvcYXDZG2xBstMfHkfJSzUNpZsc"
},
	"813": {
	key: "813",
	name: "Qitmeer",
	shortName: "MEER",
	chainId: 813,
	network: "mainnet",
	multicall: "0x55034b2cF530ae3A8fC1e2e4523F58496796610F",
	rpc: [
		"https://evm-dataseed1.meerscan.io",
		"https://evm-dataseed.meerscan.com",
		"https://evm-dataseed2.meerscan.io",
		"https://evm-dataseed3.meerscan.io"
	],
	explorer: {
		url: "https://evm.meerscan.io"
	},
	start: 43317,
	logo: "ipfs://QmXvum7SNVaAqAc2jNzR1NpNZN1GGvNaKWydg8a1GEDQ7y"
},
	"841": {
	key: "841",
	name: "Taraxa",
	shortName: "841",
	chainId: 841,
	network: "mainnet",
	multicall: "0xFCe7a3121B42664AaD145712e1c2Bf2e38f60AA1",
	rpc: [
		"https://rpc.mainnet.taraxa.io"
	],
	ws: [
		"wss://ws.mainnet.taraxa.io"
	],
	explorer: {
		url: "https://mainnet.explorer.taraxa.io"
	},
	start: 1515906,
	logo: "ipfs://Qmcc6ZCAGESMzZzoj5LsTVcCo2E35x3Ydk71uPJyov6Mwx"
},
	"888": {
	key: "888",
	name: "Wanchain",
	chainId: 888,
	network: "mainnet",
	multicall: "0xba5934ab3056fca1fa458d30fbb3810c3eb5145f",
	rpc: [
		"https://gwan-ssl.wandevs.org:56891"
	],
	ws: [
		"wss://api.wanchain.org:8443/ws/v3/ddd16770c68f30350a21114802d5418eafe039b722de52b488e7eee1ee2cd73f"
	],
	explorer: {
		url: "https://www.wanscan.org"
	},
	start: 11302663,
	logo: "ipfs://QmewFFN44rkxESFsHG8edaLt1znr62hjvZhGynfXqruzX3"
},
	"1001": {
	key: "1001",
	name: "Kaia Kairos Testnet",
	shortName: "kaia-kairos",
	chainId: 1001,
	network: "testnet",
	testnet: true,
	multicall: "0x40643B8Aeaaca0b87Ea1A1E596e64a0e14B1d244",
	rpc: [
		"https://archive-en-kairos.node.kaia.io"
	],
	ws: [
		"wss://archive-en-kairos.node.kaia.io/ws"
	],
	explorer: {
		url: "https://kairos.kaiascan.com"
	},
	start: 87232478,
	logo: "ipfs://bafkreifm6l67f4blcv7qwuszalwoxzptt5ad2f3t472lytr3d2hmi626ju"
},
	"1072": {
	key: "1072",
	name: "Shimmer EVM Testnet",
	shortName: "ShimmerEVM",
	chainId: 1072,
	network: "testnet",
	testnet: true,
	multicall: "0x751d21047C116413895c259f3f305e38C10B7cF6",
	rpc: [
		"https://archive.evm.testnet.shimmer.network/v1/chains/rms1pr75wa5xuepg2hew44vnr28wz5h6n6x99zptk2g68sp2wuu2karywgrztx3/evm"
	],
	explorer: {
		url: "https://explorer.evm.testnet.shimmer.network"
	},
	start: 10614,
	logo: "ipfs://bafkreihtwfwrue7klzedwx4rqlk6agklz4lbbk7owsyw6xzn6c2m4t5tgy"
},
	"1088": {
	key: "1088",
	name: "Metis",
	shortName: "metis",
	chainId: 1088,
	network: "mainnet",
	multicall: "0xc39aBB6c4451089dE48Cffb013c39d3110530e5C",
	rpc: [
		"https://andromeda.metis.io/?owner=1088"
	],
	explorer: {
		url: "https://andromeda-explorer.metis.io"
	},
	start: 451,
	logo: "ipfs://bafkreiaqr4atnjpdnk3c4vu4377ai7bzqpgaefefbl5j5imfsvr4puimtu"
},
	"1101": {
	key: "1101",
	name: "Polygon zkEVM",
	shortName: "mainnet",
	chainId: 1101,
	network: "mainnet",
	multicall: "0xcA11bde05977b3631167028862bE2a173976CA11",
	rpc: [
	],
	explorer: {
		url: "https://zkevm.polygonscan.com"
	},
	start: 57746,
	logo: "ipfs://bafkreibfiyvhqnme2vbxxfcku7qkxgjpkg6ywdkplxh4oxlkqsbznyorfm"
},
	"1116": {
	key: "1116",
	name: "Core Chain",
	shortName: "Core",
	chainId: 1116,
	network: "mainnet",
	multicall: "0x024f0041b76B598c2A0a75004F8447FaF67BD004",
	rpc: [
		"https://rpcar.coredao.org/"
	],
	explorer: {
		url: "https://scan.coredao.org"
	},
	start: 853908,
	logo: "ipfs://bafkreigjv5yb7uhlrryzib7j2f73nnwqan2tmfnwjdu26vkk365fyesoiu"
},
	"1284": {
	key: "1284",
	name: "Moonbeam",
	shortName: "GLMR",
	chainId: 1284,
	network: "mainnet",
	multicall: "0x83e3b61886770de2F64AAcaD2724ED4f08F7f36B",
	rpc: [
		"https://rpc.api.moonbeam.network"
	],
	explorer: {
		url: "https://moonscan.io"
	},
	start: 171135,
	logo: "ipfs://QmWKTEK2pj5sBBbHnMHQbWgw6euVdBrk2Ligpi2chrWASk"
},
	"1285": {
	key: "1285",
	name: "Moonriver (Kusama)",
	shortName: "Moonriver",
	chainId: 1285,
	network: "mainnet",
	multicall: "0x537004440ffFE1D4AE9F009031Fc2b0385FCA9F1",
	rpc: [
		"https://rpc.api.moonriver.moonbeam.network"
	],
	explorer: {
		url: "https://blockscout.moonriver.moonbeam.network"
	},
	start: 413539,
	logo: "ipfs://QmXtgPesL87Ejhq2Y7yxsaPYpf4RcnoTYPJWPcv6iiYhoi"
},
	"1287": {
	key: "1287",
	name: "Moonbase Alpha TestNet",
	shortName: "Moonbase",
	chainId: 1287,
	network: "testnet",
	testnet: true,
	multicall: "0xf09FD6B6FF3f41614b9d6be2166A0D07045A3A97",
	rpc: [
		"https://rpc.testnet.moonbeam.network"
	],
	explorer: {
		url: "https://moonbase-blockscout.testnet.moonbeam.network"
	},
	start: 859041,
	logo: "ipfs://QmeGbNTU2Jqwg8qLTMGW8n8HSi2VdgCncAaeGzLx6gYnD7"
},
	"1328": {
	key: "1328",
	name: "Sei atlantic testnet",
	shortName: "testnet",
	chainId: 1328,
	network: "testnet",
	multicall: "0xc454132B017b55b427f45078E335549A7124f5f7",
	rpc: [
	],
	explorer: {
		url: "https://seitrace.com"
	},
	start: 96978658,
	logo: "ipfs://bafkreiammyt7uztbztqbcqv4bydnczsh2fqmnjf6jxj4xnskzzl6sjrigq",
	testnet: true
},
	"1329": {
	key: "1329",
	name: "Sei",
	shortName: "mainnet",
	chainId: 1329,
	network: "mainnet",
	multicall: "0xe033Bed7cae4114Af84Be1e9F1CA7DEa07Dfe1Cf",
	rpc: [
	],
	explorer: {
		url: "https://seitrace.com"
	},
	start: 79164574,
	logo: "ipfs://bafkreiammyt7uztbztqbcqv4bydnczsh2fqmnjf6jxj4xnskzzl6sjrigq"
},
	"1480": {
	key: "1480",
	name: "Vana",
	shortName: "mainnet",
	chainId: 1480,
	network: "mainnet",
	multicall: "0xD8d2dFca27E8797fd779F8547166A2d3B29d360E",
	rpc: [
	],
	explorer: {
		url: "https://islander.vanascan.io"
	},
	start: 716763,
	logo: "ipfs://bafkreibotel3dmc5og5rf3tpt7l74awkene7x6q3oxtwhptt4y4rpa7vsa"
},
	"1559": {
	key: "1559",
	name: "Tenet",
	shortName: "tenet",
	chainId: 1559,
	network: "mainnet",
	multicall: "0xcCB3F00bE353950E4C08501ac8Af48765EAAa738",
	rpc: [
	],
	explorer: {
		url: "https://tenetscan.io"
	},
	start: 944415,
	logo: "ipfs://Qmc1gqjWTzNo4pyFSGtQuCu7kRSZZBUVybtTjHn2nNEEPA"
},
	"1663": {
	key: "1663",
	name: "Horizen Gobi Testnet",
	shortName: "Gobi",
	chainId: 1663,
	network: "testnet",
	testnet: true,
	multicall: "0xC743e4910Bdd4e5aBacCA38F74cdA270281C5eef",
	rpc: [
		"https://gobi-testnet.horizenlabs.io/ethv1"
	],
	explorer: {
		url: "https://gobi-explorer.horizen.io"
	},
	start: 1,
	logo: "ipfs://QmUYQdsnkUoiDiQ3WaWrtH7fsc5yQDC7kZJCHmC2qWPTPt"
},
	"2000": {
	key: "2000",
	name: "Doge Chain",
	shortName: "dogechain",
	chainId: 2000,
	network: "mainnet",
	multicall: "0x6f9D3f3932B417bd4957585D236Cbc32b32C0BDc",
	rpc: [
		"https://rpc.dogechain.dog"
	],
	explorer: {
		url: "https://explorer.dogechain.dog"
	},
	start: 877115,
	logo: "ipfs://bafkreigovfh3pinsdih777issfgaflwu2yjzroljs2642gbvwikcd3nm4i"
},
	"2109": {
	key: "2109",
	name: "Exosama Network",
	shortName: "EXN",
	chainId: 2109,
	network: "mainnet",
	multicall: "0x2feFC828e2fEfdE0C9f7740919c6A9139F886067",
	rpc: [
		"https://rpc.exosama.com"
	],
	explorer: {
		url: "https://explorer.exosama.com"
	},
	start: 94085,
	logo: "ipfs://QmaQxfwpXYTomUd24PMx5tKjosupXcm99z1jL1XLq9LWBS"
},
	"2152": {
	key: "2152",
	name: "Findora",
	shortName: "Findora",
	chainId: 2152,
	network: "mainnet",
	multicall: "0xCF7D1e21CBe9bdEF235aef06C5d8051B3d4DF0f5",
	rpc: [
		"https://archive.prod.findora.org:8545/"
	],
	explorer: {
		url: "https://evm.findorascan.io"
	},
	start: 4219343,
	logo: "ipfs://QmXkneyRB6HbHTHRLCZpZqSsawiyJY7b2kZ2V8ydvKYAgv"
},
	"2192": {
	key: "2192",
	name: "SnaxChain",
	shortName: "mainnet",
	chainId: 2192,
	network: "mainnet",
	multicall: "0xcA11bde05977b3631167028862bE2a173976CA11",
	rpc: [
	],
	explorer: {
		url: "https://explorer.snaxchain.io"
	},
	start: 1554893,
	logo: "ipfs://bafkreibzz757piho2llzkbiszpvalf5k5hpmxcwhvrmgp7vpz2vp4vj7ly"
},
	"2221": {
	key: "2221",
	name: "Kava Testnet",
	shortName: "testnet",
	chainId: 2221,
	network: "testnet",
	multicall: "0xc7193EFE367DF0C9349a1149F4E95A2A35604262",
	rpc: [
	],
	explorer: {
		url: "https://testnet.kavascan.com"
	},
	start: 6193104,
	logo: "ipfs://bafkreibpfubharx32fjqkqbfdhygwdjb2khxdg6meaasrcxsgvowos26f4",
	testnet: true
},
	"2222": {
	key: "2222",
	name: "Kava",
	shortName: "mainnet",
	chainId: 2222,
	network: "mainnet",
	multicall: "0xcA11bde05977b3631167028862bE2a173976CA11",
	rpc: [
	],
	explorer: {
		url: "https://kavascan.com"
	},
	start: 3661165,
	logo: "ipfs://bafkreibpfubharx32fjqkqbfdhygwdjb2khxdg6meaasrcxsgvowos26f4"
},
	"2400": {
	key: "2400",
	name: "TCG Verse",
	shortName: "TCGV",
	chainId: 2400,
	network: "mainnet",
	multicall: "0xceC65DEE0b5012F1b7321b2647681F997c7204FC",
	rpc: [
		"https://rpc.tcgverse.xyz"
	],
	explorer: {
		url: "https://explorer.tcgverse.xyz"
	},
	start: 57500,
	logo: "ipfs://bafkreidg4wpewve5mdxrofneqblydkrjl3oevtgpdf3fk3z3vjqam6ocoe"
},
	"2522": {
	key: "2522",
	name: "Fraxtal Testnet",
	shortName: "testnet",
	chainId: 2522,
	network: "testnet",
	multicall: "0xcA11bde05977b3631167028862bE2a173976CA11",
	rpc: [
	],
	explorer: {
		url: "https://holesky.fraxscan.com"
	},
	start: 1,
	logo: "ipfs://bafkreieflj4wq6tx7k5kq47z3xnsrdrn2xgm4bxa3uovrnndcb2vqqwlyu",
	testnet: true
},
	"3338": {
	key: "3338",
	name: "peaq",
	shortName: "mainnet",
	chainId: 3338,
	network: "mainnet",
	multicall: "0xc454132B017b55b427f45078E335549A7124f5f7",
	rpc: [
	],
	explorer: {
		url: "https://peaq.subscan.io"
	},
	start: 3525964,
	logo: "ipfs://bafkreidqkleori7pmilesz4t52iebebaqf3oflzmoz646qfuaznanb3sgm"
},
	"4162": {
	key: "4162",
	name: "SX Rollup",
	shortName: "mainnet",
	chainId: 4162,
	network: "mainnet",
	multicall: "0x46997eb05F6A6A0bD5C140ABed09Cb02CA36b98c",
	rpc: [
	],
	explorer: {
		url: "https://explorerl2.sx.technology"
	},
	start: 1847483,
	logo: "ipfs://bafkreibjkjx7evbw74e3sx65dtmcdr4g2rrbcorb2ivd6jz6yh6on6ozw4"
},
	"4200": {
	key: "4200",
	name: "Merlin",
	shortName: "merlin",
	chainId: 4200,
	network: "mainnet",
	multicall: "0x830E7E548F4D80947a40A7Cf3a2a53166a0C3980",
	rpc: [
	],
	explorer: {
		url: "https://scan.merlinchain.io"
	},
	start: 589494,
	logo: "ipfs://bafkreicew2qv3m756m7xs2nrjezinghps7rlessrqjqetvox74w4hov2xe"
},
	"4337": {
	key: "4337",
	name: "Beam",
	shortName: "Beam",
	chainId: 4337,
	network: "mainnet",
	multicall: "0x4956F15eFdc3dC16645e90Cc356eAFA65fFC65Ec",
	rpc: [
	],
	explorer: {
		url: "https://subnets.avax.network/beam"
	},
	start: 1,
	logo: "ipfs://QmaKRLxXPdeTsLx7MFLS3CJbhpSbResgoeL4fCgHB1mTsF"
},
	"4689": {
	key: "4689",
	name: "IoTeX",
	shortName: "IoTeX",
	chainId: 4689,
	network: "mainnet",
	multicall: "0x9c8B105c94282CDB0F3ecF27e3cfA96A35c07be6",
	rpc: [
		"https://babel-api.mainnet.iotex.io"
	],
	explorer: {
		url: "https://iotexscan.io"
	},
	start: 11533283,
	logo: "ipfs://QmNkr1UPcBYbvLp7d7Pk4eF3YCsHpaNkfusKZNtykL2EQC"
},
	"5000": {
	key: "5000",
	name: "Mantle",
	chainId: 5000,
	network: "mainnet",
	multicall: "0xcA11bde05977b3631167028862bE2a173976CA11",
	rpc: [
		"https://rpc.mantle.xyz"
	],
	explorer: {
		url: "https://mantlescan.xyz"
	},
	start: 304717,
	logo: "ipfs://bafkreidkucwfn4mzo2gtydrt2wogk3je5xpugom67vhi4h4comaxxjzoz4"
},
	"5555": {
	key: "5555",
	name: "Chain Verse",
	shortName: "ChainVerse",
	chainId: 5555,
	network: "ChainVerse",
	multicall: "0xcA11bde05977b3631167028862bE2a173976CA11",
	rpc: [
		"https://rpc.chainverse.info"
	],
	explorer: {
		url: "https://explorer.chainverse.info"
	},
	start: 6334180,
	logo: "ipfs://QmQyJt28h4wN3QHPXUQJQYQqGiFUD77han3zibZPzHbitk"
},
	"5611": {
	key: "5611",
	name: "opBNB Testnet",
	shortName: "testnet",
	chainId: 5611,
	network: "testnet",
	multicall: "0xcA11bde05977b3631167028862bE2a173976CA11",
	rpc: [
	],
	explorer: {
		url: "https://opbnb-testnet.bscscan.com"
	},
	start: 3705108,
	logo: "ipfs://bafkreibll4la7wqerzs7zwxjne2j7ayynbg2wlenemssoahxxj5rbt6c64",
	testnet: true
},
	"6102": {
	key: "6102",
	name: "Cascadia Testnet",
	shortName: "Cascadia",
	chainId: 6102,
	network: "testnet",
	multicall: "0x728989819bAD588F193563008E0a03E8cD6a3e4a",
	rpc: [
		"https://testnet.cascadia.foundation"
	],
	explorer: {
		url: "https://explorer.cascadia.foundation"
	},
	testnet: true,
	start: 370457,
	logo: "ipfs://QmWkhZYhReYyaa5pQXj32hEGxoRcBqarFMcfQScELmjYQj"
},
	"7332": {
	key: "7332",
	name: "Horizen EON",
	shortName: "EON",
	chainId: 7332,
	network: "mainnet",
	multicall: "0xC743e4910Bdd4e5aBacCA38F74cdA270281C5eef",
	rpc: [
	],
	explorer: {
		url: "https://eon-explorer.horizenlabs.io"
	},
	start: 85108,
	logo: "ipfs://QmUYQdsnkUoiDiQ3WaWrtH7fsc5yQDC7kZJCHmC2qWPTPt"
},
	"7341": {
	key: "7341",
	name: "Shyft",
	shortName: "Shyft",
	chainId: 7341,
	network: "mainnet",
	multicall: "0xceb10e9133D771cA93c8002Be527A465E85381a2",
	rpc: [
		"https://rpc.shyft.network"
	],
	explorer: {
		url: "https://bx.shyft.network"
	},
	start: 3673983,
	logo: "ipfs://bafkreifwxnnfk6koabzmxgcxcwlrwt6b5gijdain2gyqee77q4ajfb7fu4"
},
	"7560": {
	key: "7560",
	name: "Cyber",
	shortName: "mainnet",
	chainId: 7560,
	network: "mainnet",
	multicall: "0xcA11bde05977b3631167028862bE2a173976CA11",
	rpc: [
	],
	explorer: {
		url: "https://cyberscan.co"
	},
	start: 1731707,
	logo: "ipfs://bafkreifm2bbehoqpz4454o7gixnxfi6cgvqlxigqr3f6ipj7l2omtgfgnm"
},
	"8217": {
	key: "8217",
	name: "Kaia Mainnet",
	shortName: "kaia-mainnet",
	chainId: 8217,
	network: "mainnet",
	multicall: "0x5f5f0d1b9ff8b3dcace308e39b13b203354906e9",
	rpc: [
		"https://archive-en.node.kaia.io"
	],
	ws: [
		"wss://archive-en.node.kaia.io/ws"
	],
	explorer: {
		url: "https://kaiascan.com"
	},
	start: 91582357,
	logo: "ipfs://bafkreifm6l67f4blcv7qwuszalwoxzptt5ad2f3t472lytr3d2hmi626ju"
},
	"8453": {
	key: "8453",
	name: "Base",
	shortName: "mainnet",
	chainId: 8453,
	network: "mainnet",
	multicall: "0xca11bde05977b3631167028862be2a173976ca11",
	rpc: [
	],
	explorer: {
		url: "https://basescan.org"
	},
	start: 5022,
	logo: "ipfs://QmaxRoHpxZd8PqccAynherrMznMufG6sdmHZLihkECXmZv"
},
	"9001": {
	key: "9001",
	name: "Evmos Network",
	shortName: "Evmos",
	chainId: 9001,
	network: "mainnet",
	multicall: "0x37763d16f8dBf6F185368E0f256350cAb7E24b26",
	rpc: [
		"https://eth.bd.evmos.org:8545"
	],
	ws: [
		"wss://eth.bd.evmos.org:8546"
	],
	explorer: {
		url: "https://escan.live"
	},
	start: 13959539,
	logo: "ipfs://bafkreif4obrdoiretpozdd56seziywc6clha7wwkbldng3ovry2bpzly34"
},
	"9990": {
	key: "9990",
	name: "Agung testnet",
	shortName: "testnet",
	chainId: 9990,
	network: "testnet",
	multicall: "0xc454132B017b55b427f45078E335549A7124f5f7",
	rpc: [
	],
	explorer: {
		url: "https://agung-testnet.subscan.io"
	},
	start: 2031789,
	logo: "ipfs://bafkreidqkleori7pmilesz4t52iebebaqf3oflzmoz646qfuaznanb3sgm",
	testnet: true
},
	"10000": {
	key: "10000",
	name: "smartBCH",
	shortName: "BCH",
	chainId: 10000,
	network: "mainnet",
	multicall: "0x1b38EBAd553f218e2962Cb1C0539Abb5d6A37774",
	rpc: [
		"https://smartbch.greyh.at/"
	],
	explorer: {
		url: "https://smartbch-explorer.web.app"
	},
	start: 268248,
	logo: "ipfs://QmWG1p7om4hZ4Yi4uQvDpxg4si7qVYhtppGbcDGrhVFvMd"
},
	"10243": {
	key: "10243",
	name: "Arthera Testnet",
	shortName: "Arthera_",
	chainId: 10243,
	network: "testnet",
	testnet: true,
	multicall: "0x27c7FC597aD2E81C4c1cA1769972f79DaF042Da7",
	rpc: [
		"https://rpc-test.arthera.net"
	],
	explorer: {
		url: "https://explorer-test.arthera.net"
	},
	start: 10523,
	logo: "ipfs://QmYQp3e52KjkT4bYdAvB6ACEEpXs2D8DozsDitaADRY2Ak"
},
	"13337": {
	key: "13337",
	name: "Beam Testnet",
	shortName: "testnet",
	chainId: 13337,
	network: "testnet",
	multicall: "0x9BF49b704EE2A095b95c1f2D4EB9010510c41C9E",
	rpc: [
	],
	explorer: {
		url: "https://subnets-test.avax.network/beam"
	},
	start: 3,
	logo: "ipfs://QmaKRLxXPdeTsLx7MFLS3CJbhpSbResgoeL4fCgHB1mTsF",
	testnet: true
},
	"13371": {
	key: "13371",
	name: "Immutable zkEVM",
	shortName: "mainnet",
	chainId: 13371,
	network: "mainnet",
	multicall: "0xcA11bde05977b3631167028862bE2a173976CA11",
	rpc: [
	],
	explorer: {
		url: "https://explorer.immutable.com"
	},
	start: 3680945,
	logo: "ipfs://bafkreiepnhfv3hgexddjpyaeemxo3byhtxxit6t4zsponyczee6ddjqxwi"
},
	"13473": {
	key: "13473",
	name: "Immutable zkEVM Testnet",
	shortName: "testnet",
	chainId: 13473,
	network: "testnet",
	multicall: "0xcA11bde05977b3631167028862bE2a173976CA11",
	rpc: [
	],
	explorer: {
		url: "https://explorer.testnet.immutable.com"
	},
	start: 5307209,
	logo: "ipfs://bafkreiepnhfv3hgexddjpyaeemxo3byhtxxit6t4zsponyczee6ddjqxwi",
	testnet: true
},
	"14800": {
	key: "14800",
	name: "Vana Moksha Testnet",
	shortName: "testnet",
	chainId: 14800,
	network: "testnet",
	multicall: "0xD8d2dFca27E8797fd779F8547166A2d3B29d360E",
	rpc: [
	],
	explorer: {
		url: "https://moksha.vanascan.io"
	},
	start: 732283,
	logo: "ipfs://bafkreibotel3dmc5og5rf3tpt7l74awkene7x6q3oxtwhptt4y4rpa7vsa",
	testnet: true
},
	"16718": {
	key: "16718",
	name: "AirDAO",
	chainId: 16718,
	network: "mainnet",
	multicall: "0x25e81aC81A8B03389D78CB45faB78353aB528574",
	rpc: [
		"https://network-archive.ambrosus.io"
	],
	ws: [
		"wss://network-archive.ambrosus.io/ws"
	],
	explorer: {
		url: "https://airdao.io/explorer"
	},
	start: 22922566,
	logo: "ipfs://QmSxXjvWng3Diz4YwXDV2VqSPgMyzLYBNfkjJcr7rzkxom"
},
	"29548": {
	key: "29548",
	name: "MCH Verse",
	shortName: "mainnet",
	chainId: 29548,
	network: "mainnet",
	multicall: "0x1d39652386488CE1fE4254E105F5A42a04d43dB2",
	rpc: [
	],
	explorer: {
		url: "https://explorer.oasys.mycryptoheroes.net"
	},
	start: 27458402,
	logo: "ipfs://QmZZnwR1y6cU1sare2TQmwqkNDLXQxD4GdPrmHLmUoPtbU"
},
	"33111": {
	key: "33111",
	name: "Curtis",
	shortName: "apechain",
	chainId: 33111,
	network: "testnet",
	multicall: "0xc454132B017b55b427f45078E335549A7124f5f7",
	rpc: [
	],
	explorer: {
		url: "https://curtis.apescan.io"
	},
	start: 6661339,
	logo: "ipfs://bafkreicljxttjq2xkgfwwpii5xegirgq2ctrnsjnzelxudjj33qzq65apu",
	testnet: true
},
	"33139": {
	key: "33139",
	name: "ApeChain",
	shortName: "mainnet",
	chainId: 33139,
	network: "mainnet",
	multicall: "0xcA11bde05977b3631167028862bE2a173976CA11",
	rpc: [
	],
	explorer: {
		url: "https://apescan.io"
	},
	start: 20889,
	logo: "ipfs://bafkreielbgcox2jsw3g6pqulqb7pyjgx7czjt6ahnibihaij6lozoy53w4"
},
	"42161": {
	key: "42161",
	name: "Arbitrum One",
	chainId: 42161,
	network: "Arbitrum mainnet",
	multicall: "0x7A7443F8c577d537f1d8cD4a629d40a3148Dd7ee",
	rpc: [
		"https://rpc.ankr.com/arbitrum",
		"https://speedy-nodes-nyc.moralis.io/9e03baabdc27be2a35bdec4a/arbitrum/mainnet",
		"https://arb-mainnet.g.alchemy.com/v2/JDvtNGwnHhTltIwfnxQocKwKkCTKA1DL"
	],
	explorer: {
		url: "https://arbiscan.io"
	},
	start: 256508,
	logo: "ipfs://QmWZ5SMRfvcK8tycsDqojQaSiKedgtVkS7CkZdxPgeCVsZ"
},
	"42170": {
	key: "42170",
	name: "Arbitrum Nova",
	chainId: 42170,
	network: "Arbitrum Nova",
	multicall: "0x4E74EBd9CABff51cE9a43EFe059bA8c5A28E4A14",
	rpc: [
		"https://nova.arbitrum.io/rpc",
		"https://arbitrum-nova.public.blastapi.io"
	],
	explorer: {
		url: "https://nova.arbiscan.io"
	},
	start: 6006607,
	logo: "ipfs://bafkreie5xsqt3mrrwu7v32qpmmctibhzhgxf4emfzzddsdhdlfsa7fmplu"
},
	"42220": {
	key: "42220",
	name: "Celo",
	shortName: "Celo",
	chainId: 42220,
	network: "mainnet",
	multicall: "0xb8d0d2C1391eeB350d2Cd39EfABBaaEC297368D9",
	rpc: [
		"https://celo.snapshot.org",
		"https://forno.celo.org",
		"https://celo-mainnet--rpc.datahub.figment.io/apikey/e892a66dc36e4d2d98a5d6406d609796/"
	],
	explorer: {
		url: "https://explorer.celo.org"
	},
	start: 6599803,
	logo: "ipfs://QmS2tVJ7rdJRe1NHXAi2L86yCbUwVVrmB2mHQeNdJxvQti"
},
	"43113": {
	key: "43113",
	name: "Avalanche FUJI Testnet",
	chainId: 43113,
	network: "testnet",
	testnet: true,
	multicall: "0x984476ea55e32e785A9D8FF14329f99D74E3d2A2",
	rpc: [
		"https://api.avax-test.network/ext/bc/C/rpc"
	],
	explorer: {
		url: "https://testnet.snowtrace.io"
	},
	start: 10528153,
	logo: "ipfs://QmeS75uS7XLR8o8uUzhLRVYPX9vMFf4DXgKxQeCzyy7vM2"
},
	"43114": {
	key: "43114",
	name: "Avalanche",
	chainId: 43114,
	network: "mainnet",
	multicall: "0x7E9985aE4C8248fdB07607648406a48C76e9e7eD",
	rpc: [
		"https://nd-784-543-849.p2pify.com/aa7b29fc5fed65b34f0ee6b8de33f8c0/ext/bc/C/rpc",
		"https://rpc.ankr.com/avalanche",
		"https://api.avax.network/ext/bc/C/rpc"
	],
	explorer: {
		url: "https://snowtrace.io"
	},
	start: 536483,
	logo: "ipfs://QmeS75uS7XLR8o8uUzhLRVYPX9vMFf4DXgKxQeCzyy7vM2"
},
	"47805": {
	key: "47805",
	name: "REI Mainnet",
	chainId: 47805,
	network: "mainnet",
	multicall: "0x9eE9904815B80C39C1a27294E69a8626EAa7952d",
	rpc: [
		"https://rpc.rei.network"
	],
	explorer: {
		url: "https://scan.rei.network"
	},
	start: 1715902,
	logo: "ipfs://QmTogMDLmDgJjDjUKDHDuc2KVTVDbXf8bXJLFiVe8PRxgo"
},
	"53935": {
	key: "53935",
	name: "DFK Chain",
	chainId: 53935,
	network: "mainnet",
	multicall: "0x5b24224dC16508DAD755756639E420817DD4c99E",
	rpc: [
		"https://subnets.avax.network/defi-kingdoms/dfk-chain/rpc"
	],
	explorer: {
		url: "https://subnets.avax.network/defi-kingdoms"
	},
	start: 62,
	logo: "ipfs://QmZNkpVgPbuVbDcsi6arwH1om3456FGnwfDqYQJWUfHDEx"
},
	"57054": {
	key: "57054",
	name: "Sonic Blaze Testnet",
	shortName: "testnet",
	chainId: 57054,
	network: "testnet",
	multicall: "0xcA11bde05977b3631167028862bE2a173976CA11",
	rpc: [
	],
	explorer: {
		url: "https://testnet.sonicscan.org"
	},
	start: 60,
	logo: "ipfs://bafkreic5fffatwy2gzf6y5iymje6ijii43tz4wlxl35da36guurhibjx44",
	testnet: true
},
	"57073": {
	key: "57073",
	name: "Ink",
	shortName: "mainnet",
	chainId: 57073,
	network: "mainnet",
	multicall: "0xcA11bde05977b3631167028862bE2a173976CA11",
	rpc: [
	],
	explorer: {
		url: "https://explorer.inkonchain.com"
	},
	start: 6659154,
	logo: "ipfs://bafkreics2duafru4mw36wftcmklgrsgq6fz4lgcjctzmov34bxjzuuypju"
},
	"59141": {
	key: "59141",
	name: "Linea Sepolia",
	shortName: "testnet",
	chainId: 59141,
	network: "testnet",
	multicall: "0xcA11bde05977b3631167028862bE2a173976CA11",
	rpc: [
	],
	explorer: {
		url: "https://sepolia.lineascan.build"
	},
	start: 227427,
	logo: "ipfs://bafkreihtyzolub3sejuwc32hpdpjnt7ksowaguni2yuho3kyihhcqrtqce",
	testnet: true
},
	"59144": {
	key: "59144",
	name: "Linea",
	shortName: "linea",
	chainId: 59144,
	network: "mainnet",
	multicall: "0xcA11bde05977b3631167028862bE2a173976CA11",
	rpc: [
	],
	explorer: {
		url: "https://lineascan.build"
	},
	start: 42,
	logo: "ipfs://bafkreihtyzolub3sejuwc32hpdpjnt7ksowaguni2yuho3kyihhcqrtqce"
},
	"80001": {
	key: "80001",
	name: "Polygon Mumbai",
	chainId: 80001,
	network: "testnet",
	testnet: true,
	multicall: "0xcA11bde05977b3631167028862bE2a173976CA11",
	rpc: [
		"https://speedy-nodes-nyc.moralis.io/9e03baabdc27be2a35bdec4a/polygon/mumbai/archive",
		"https://rpc-mumbai.matic.today"
	],
	ws: [
		"wss://ws-mumbai.matic.today"
	],
	explorer: {
		url: "https://mumbai.polygonscan.com",
		apiUrl: "https://api-mumbai.polygonscan.com"
	},
	start: 12011090,
	logo: "ipfs://bafkreihgr7zy7vi5kqddybfaezwuhvssg57qluwmyan4qq7l57nr7w7wey"
},
	"80002": {
	key: "80002",
	name: "Polygon Amoy Testnet",
	shortName: "testnet",
	chainId: 80002,
	network: "testnet",
	multicall: "0xcA11bde05977b3631167028862bE2a173976CA11",
	rpc: [
	],
	explorer: {
		url: "https://amoy.polygonscan.com"
	},
	start: 3127388,
	logo: "ipfs://bafkreibfiyvhqnme2vbxxfcku7qkxgjpkg6ywdkplxh4oxlkqsbznyorfm",
	testnet: true
},
	"81457": {
	key: "81457",
	name: "Blast",
	shortName: "mainnet",
	chainId: 81457,
	network: "mainnet",
	multicall: "0xcA11bde05977b3631167028862bE2a173976CA11",
	rpc: [
	],
	explorer: {
		url: "https://blastscan.io"
	},
	start: 88189,
	logo: "ipfs://bafkreicqhrimt2zyp2kvhmbpvffxlmxovkg5vw6zkissyzibcfy45kbvrm"
},
	"84532": {
	key: "84532",
	name: "Base Sepolia",
	shortName: "testnet",
	chainId: 84532,
	network: "testnet",
	multicall: "0xcA11bde05977b3631167028862bE2a173976CA11",
	rpc: [
	],
	explorer: {
		url: "https://base-sepolia.blockscout.com"
	},
	start: 1059647,
	logo: "ipfs://QmaxRoHpxZd8PqccAynherrMznMufG6sdmHZLihkECXmZv",
	testnet: true
},
	"314159": {
	key: "314159",
	name: "Filecoin Calibration Testnet",
	shortName: "testnet",
	chainId: 314159,
	network: "testnet",
	multicall: "0xcA11bde05977b3631167028862bE2a173976CA11",
	rpc: [
	],
	explorer: {
		url: "https://calibration.filscan.io/en"
	},
	start: 1446201,
	logo: "ipfs://bafkreiffbopdjior7li3nlemzko7rjua6wd2hfh2vhdbenqbv4tfsbnzwu",
	testnet: true
},
	"686868": {
	key: "686868",
	name: "Merlin Testnet",
	shortName: "merlin",
	chainId: 686868,
	network: "testnet",
	multicall: "0x758BC6321b7c68F4986d62a4D46E83A2DCb58c80",
	rpc: [
	],
	explorer: {
		url: "https://testnet-scan.merlinchain.io"
	},
	start: 3562021,
	logo: "ipfs://bafkreicew2qv3m756m7xs2nrjezinghps7rlessrqjqetvox74w4hov2xe",
	testnet: true
},
	"713715": {
	key: "713715",
	name: "Sei EVM Devnet",
	shortName: "devnet",
	chainId: 713715,
	network: "testnet",
	multicall: "0xEe8d287B844959ADe40d718Dc23077ba920e2f07",
	rpc: [
	],
	explorer: {
		url: "https://seitrace.com"
	},
	start: 1463669,
	logo: "ipfs://bafkreiammyt7uztbztqbcqv4bydnczsh2fqmnjf6jxj4xnskzzl6sjrigq",
	testnet: true
},
	"763373": {
	key: "763373",
	name: "Ink Sepolia",
	shortName: "testnet",
	chainId: 763373,
	network: "testnet",
	multicall: "0xcA11bde05977b3631167028862bE2a173976CA11",
	rpc: [
	],
	explorer: {
		url: "https://explorer-sepolia.inkonchain.com"
	},
	start: 9701940,
	logo: "ipfs://bafkreics2duafru4mw36wftcmklgrsgq6fz4lgcjctzmov34bxjzuuypju",
	testnet: true
},
	"810180": {
	key: "810180",
	name: "zkLink Nova",
	shortName: "zlink",
	chainId: 810180,
	network: "mainnet",
	multicall: "0x825267E0fA5CAe92F98540828a54198dcB3Eaeb5",
	rpc: [
	],
	explorer: {
		url: "https://explorer.zklink.io"
	},
	start: 146055,
	logo: "ipfs://bafkreic6c3iems5235qapyhyrygha7akqrsfact2nok3y2uhljpzxrdu74"
},
	"810181": {
	key: "810181",
	name: "zkLink Nova Sepolia",
	shortName: "testnet",
	chainId: 810181,
	network: "testnet",
	multicall: "0x97148F8fDdd9A1620f72EC1Bb2932916623d9da5",
	rpc: [
	],
	explorer: {
		url: "https://sepolia.explorer.zklink.io"
	},
	start: 43723,
	logo: "ipfs://bafkreic6c3iems5235qapyhyrygha7akqrsfact2nok3y2uhljpzxrdu74",
	testnet: true
},
	"11155111": {
	key: "11155111",
	name: "Sepolia testnet",
	shortName: "Sepolia",
	chainId: 11155111,
	network: "sepolia",
	testnet: true,
	multicall: "0xcA11bde05977b3631167028862bE2a173976CA11",
	rpc: [
		"https://sepolia.infura.io/v3/d26b4fd748814fe994b05899fd89e667"
	],
	ensResolvers: [
		"0x8FADE66B79cC9f707aB26799354482EB93a5B7dD"
	],
	ensNameWrapper: "0x0635513f179D50A207757E05759CbD106d7dFcE8",
	ensSubgraph: "https://subgrapher.snapshot.org/subgraph/arbitrum/DmMXLtMZnGbQXASJ7p1jfzLUbBYnYUD9zNBTxpkjHYXV",
	explorer: {
		url: "https://sepolia.etherscan.io",
		apiUrl: "https://api-sepolia.etherscan.io"
	},
	start: 751532,
	logo: "ipfs://bafkreid7ndxh6y2ljw2jhbisodiyrhcy2udvnwqgon5wgells3kh4si5z4"
},
	"11155420": {
	key: "11155420",
	name: "OP Sepolia",
	shortName: "testnet",
	chainId: 11155420,
	network: "testnet",
	multicall: "0xcA11bde05977b3631167028862bE2a173976CA11",
	rpc: [
	],
	explorer: {
		url: "https://sepolia-optimism.etherscan.io"
	},
	start: 1620204,
	logo: "ipfs://QmfF4kwhGL8QosUXvgq2KWCmavhKBvwD6kbhs7L4p5ZAWb",
	testnet: true
},
	"111557560": {
	key: "111557560",
	name: "Cyber Testnet",
	shortName: "testnet",
	chainId: 111557560,
	network: "testnet",
	multicall: "0xffc391F0018269d4758AEA1a144772E8FB99545E",
	rpc: [
	],
	explorer: {
		url: "https://testnet.cyberscan.co"
	},
	start: 304545,
	logo: "ipfs://bafkreifm2bbehoqpz4454o7gixnxfi6cgvqlxigqr3f6ipj7l2omtgfgnm",
	testnet: true
},
	"168587773": {
	key: "168587773",
	name: "Blast Sepolia",
	shortName: "testnet",
	chainId: 168587773,
	network: "testnet",
	multicall: "0xcA11bde05977b3631167028862bE2a173976CA11",
	rpc: [
	],
	explorer: {
		url: "https://sepolia.blastexplorer.io"
	},
	start: 756690,
	logo: "ipfs://bafkreibfmkjg22cozxppzcoxswj45clvh2rqhxzax57cmmgudbtkf4dkce",
	testnet: true
},
	"245022926": {
	key: "245022926",
	name: "Neon Devnet",
	shortName: "devnet",
	chainId: 245022926,
	network: "testnet",
	multicall: "0xcA11bde05977b3631167028862bE2a173976CA11",
	rpc: [
	],
	explorer: {
		url: "https://devnet.neonscan.org"
	},
	start: 205206112,
	logo: "ipfs://QmecRPQGa4bU7tybg1sUQY48Md9rWnmhrT6WW5ueqvhg6P",
	testnet: true
},
	"1313161554": {
	key: "1313161554",
	name: "Aurora",
	shortName: "Aurora",
	chainId: 1313161554,
	network: "mainnet",
	multicall: "0x32b50c286DEFd2932a0247b8bb940b78c063F16c",
	rpc: [
		"https://mainnet.aurora.dev"
	],
	explorer: {
		url: "https://explorer.mainnet.aurora.dev"
	},
	start: 57190533,
	logo: "ipfs://QmeRhsR1UPRTQCizdhmgr2XxphXebVKU5di97uCV2UMFpa"
},
	"1666600000": {
	key: "1666600000",
	name: "Harmony",
	shortName: "HarmonyMainnet",
	chainId: 1666600000,
	network: "mainnet",
	multicall: "0x9c31392D2e0229dC4Aa250F043d46B9E82074BF8",
	rpc: [
		"https://a.api.s0.t.hmny.io"
	],
	ws: [
		"wss://ws.s0.t.hmny.io"
	],
	explorer: {
		url: "https://explorer.harmony.one"
	},
	start: 10911984,
	logo: "ipfs://QmNnGPr1CNvj12SSGzKARtUHv9FyEfE5nES73U4vBWQSJL"
},
	"1666700000": {
	key: "1666700000",
	name: "Harmony Testnet",
	shortName: "HarmonyTestnet",
	chainId: 1666700000,
	network: "testnet",
	testnet: true,
	multicall: "0x9923589503Fd205feE3d367DDFF2378f0F7dD2d4",
	rpc: [
		"https://api.s0.b.hmny.io"
	],
	ws: [
		"wss://ws.s0.b.hmny.io"
	],
	explorer: {
		url: "https://explorer.pops.one"
	},
	start: 7521509,
	logo: "ipfs://QmNnGPr1CNvj12SSGzKARtUHv9FyEfE5nES73U4vBWQSJL"
}
};

class SingleChoiceVoting {
    constructor(proposal, votes, strategies, selected) {
        this.proposal = proposal;
        this.votes = votes;
        this.strategies = strategies;
        this.selected = selected;
    }
    static isValidChoice(voteChoice, proposalChoices) {
        return (typeof voteChoice === 'number' &&
            (proposalChoices === null || proposalChoices === void 0 ? void 0 : proposalChoices[voteChoice - 1]) !== undefined);
    }
    getValidVotes() {
        return this.votes.filter((vote) => SingleChoiceVoting.isValidChoice(vote.choice, this.proposal.choices));
    }
    getScores() {
        return this.proposal.choices.map((choice, i) => {
            const votes = this.getValidVotes().filter((vote) => vote.choice === i + 1);
            const balanceSum = votes.reduce((a, b) => a + b.balance, 0);
            return balanceSum;
        });
    }
    getScoresByStrategy() {
        return this.proposal.choices.map((choice, i) => {
            const scores = this.strategies.map((strategy, sI) => {
                const votes = this.getValidVotes().filter((vote) => vote.choice === i + 1);
                const scoreSum = votes.reduce((a, b) => a + b.scores[sI], 0);
                return scoreSum;
            });
            return scores;
        });
    }
    getScoresTotal() {
        return this.votes.reduce((a, b) => a + b.balance, 0);
    }
    getChoiceString() {
        return this.proposal.choices[this.selected - 1];
    }
}

class ApprovalVoting {
    constructor(proposal, votes, strategies, selected) {
        this.proposal = proposal;
        this.votes = votes;
        this.strategies = strategies;
        this.selected = selected;
    }
    static isValidChoice(voteChoice, proposalChoices) {
        return (Array.isArray(voteChoice) &&
            // If voteChoice index is not in proposalChoices, return false
            voteChoice.every((choice) => (proposalChoices === null || proposalChoices === void 0 ? void 0 : proposalChoices[choice - 1]) !== undefined) &&
            // If any voteChoice is duplicated, return false
            voteChoice.length === new Set(voteChoice).size);
    }
    getValidVotes() {
        return this.votes.filter((vote) => ApprovalVoting.isValidChoice(vote.choice, this.proposal.choices));
    }
    getScores() {
        return this.proposal.choices.map((choice, i) => this.getValidVotes()
            .filter((vote) => vote.choice.includes(i + 1))
            .reduce((a, b) => a + b.balance, 0));
    }
    getScoresByStrategy() {
        return this.proposal.choices.map((choice, i) => this.strategies.map((strategy, sI) => this.getValidVotes()
            .filter((vote) => vote.choice.includes(i + 1))
            .reduce((a, b) => a + b.scores[sI], 0)));
    }
    getScoresTotal() {
        return this.votes.reduce((a, b) => a + b.balance, 0);
    }
    getChoiceString() {
        if (!this.selected)
            return '';
        return this.proposal.choices
            .filter((choice, i) => this.selected.includes(i + 1))
            .join(', ');
    }
}

function calcPercentageOfSum(part, wholeArray) {
    const whole = wholeArray.reduce((a, b) => a + b, 0);
    const percent = part / whole;
    return isNaN(percent) ? 0 : percent;
}
function calcSqrt(percentageWeight, votingPower) {
    return Math.sqrt(percentageWeight * votingPower);
}
function calcSquare(num) {
    return num * num;
}
function calcReducedQuadraticScores(percentages, scoresTotal) {
    // Reduce each quadratic score so that the sum of quadratic scores matches
    // the total scores.
    // This is done to unsure that features like quorum still work as expected.
    return percentages.map((p) => scoresTotal * p);
}
class QuadraticVoting {
    constructor(proposal, votes, strategies, selected) {
        this.proposal = proposal;
        this.votes = votes;
        this.strategies = strategies;
        this.selected = selected;
    }
    static isValidChoice(voteChoice, proposalChoices) {
        return (typeof voteChoice === 'object' &&
            !Array.isArray(voteChoice) &&
            voteChoice !== null &&
            // If voteChoice object keys are not in choices, return false
            Object.keys(voteChoice).every((key) => (proposalChoices === null || proposalChoices === void 0 ? void 0 : proposalChoices[Number(key) - 1]) !== undefined) &&
            // If voteChoice object is empty, return false
            Object.keys(voteChoice).length > 0 &&
            // If voteChoice object values have a negative number, return false
            Object.values(voteChoice).every((value) => typeof value === 'number' && value >= 0) &&
            // If voteChoice doesn't have any positive value, return false
            Object.values(voteChoice).some((value) => typeof value === 'number' && value > 0));
    }
    getValidVotes() {
        return this.votes.filter((vote) => QuadraticVoting.isValidChoice(vote.choice, this.proposal.choices));
    }
    getScores() {
        const validVotes = this.getValidVotes();
        const scoresTotal = this.getValidVotes().reduce((a, b) => a + b.balance, 0);
        const quadraticScores = this.proposal.choices.map((_, i) => {
            const votingPowerSqrt = validVotes
                .map((vote) => {
                const choiceWeightPercent = calcPercentageOfSum(vote.choice[i + 1], Object.values(vote.choice));
                return calcSqrt(choiceWeightPercent, vote.balance);
            })
                .reduce((a, b) => a + b, 0);
            return calcSquare(votingPowerSqrt);
        });
        const percentagesOfScores = quadraticScores.map((_, i) => calcPercentageOfSum(quadraticScores[i], quadraticScores));
        return calcReducedQuadraticScores(percentagesOfScores, scoresTotal);
    }
    getScoresByStrategy() {
        const validVotes = this.getValidVotes();
        const scoresTotal = this.getValidVotes().reduce((a, b) => a + b.balance, 0);
        const quadraticScoresByStrategy = this.proposal.choices
            .map((_, i) => this.strategies.map((_, sI) => validVotes
            .map((vote) => {
            const choiceWeightPercentByStrategy = calcPercentageOfSum(vote.choice[i + 1], Object.values(vote.choice));
            return calcSqrt(choiceWeightPercentByStrategy, vote.scores[sI]);
        })
            .reduce((a, b) => a + b, 0)))
            .map((arr) => arr.map((num) => [calcSquare(num)]));
        const reducedQuadraticScores = quadraticScoresByStrategy.map((_, i) => {
            const percentagesOfScores = this.strategies.map((_, sI) => calcPercentageOfSum(quadraticScoresByStrategy[i][sI][0], quadraticScoresByStrategy.flat(2)));
            return calcReducedQuadraticScores(percentagesOfScores, scoresTotal);
        });
        return reducedQuadraticScores;
    }
    getScoresTotal() {
        return this.votes.reduce((a, b) => a + b.balance, 0);
    }
    getChoiceString() {
        return this.proposal.choices
            .map((choice, i) => {
            if (this.selected[i + 1]) {
                const percent = calcPercentageOfSum(this.selected[i + 1], Object.values(this.selected));
                return `${Math.round(percent * 1000) / 10}% for ${choice}`;
            }
        })
            .filter((el) => el != null)
            .join(', ');
    }
}

function irv(ballots, rounds) {
    const candidates = [
        ...new Set(ballots.map((vote) => vote[0]).flat())
    ];
    const votes = Object.entries(ballots.reduce((votes, [v], i, src) => {
        const balance = src[i][1];
        votes[v[0]][0] += balance;
        const score = src[i][2];
        if (score.length > 1) {
            votes[v[0]][1] = score.map((s, sI) => s + votes[v[0]][1][sI] || s);
        }
        else
            votes[v[0]][1] = [
                votes[v[0]][1].concat(score).reduce((a, b) => a + b, 0)
            ];
        return votes;
    }, Object.assign({}, ...candidates.map((c) => ({ [c]: [0, []] })))));
    const votesWithoutScore = votes.map((vote) => [vote[0], vote[1][0]]);
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const [topCand, topCount] = votesWithoutScore.reduce(([n, m], [v, c]) => (c > m ? [v, c] : [n, m]), ['?', -Infinity]);
    const [bottomCand, bottomCount] = votesWithoutScore.reduce(([n, m], [v, c]) => (c < m ? [v, c] : [n, m]), ['?', Infinity]);
    /* eslint-enable @typescript-eslint/no-unused-vars */
    const sortedByHighest = votes.sort((a, b) => b[1][0] - a[1][0]);
    const totalPowerOfVotes = ballots
        .map((bal) => bal[1])
        .reduce((a, b) => a + b, 0);
    rounds.push({
        round: rounds.length + 1,
        sortedByHighest
    });
    return topCount > totalPowerOfVotes / 2 ||
        sortedByHighest.length < 3
        ? rounds
        : irv(ballots
            .map((ballot) => [
            ballot[0].filter((c) => c != bottomCand),
            ballot[1],
            ballot[2]
        ])
            .filter((ballot) => ballot[0].length > 0), rounds);
}
function getFinalRound(votes) {
    const rounds = irv(votes.map((vote) => [vote.choice, vote.balance, vote.scores]), []);
    const finalRound = rounds[rounds.length - 1];
    return finalRound.sortedByHighest;
}
function getScoresMethod(votes, proposal) {
    const finalRound = getFinalRound(votes);
    return proposal.choices.map((choice, i) => finalRound
        .filter((res) => Number(res[0]) === i + 1)
        .reduce((a, b) => a + b[1][0], 0));
}
class RankedChoiceVoting {
    constructor(proposal, votes, strategies, selected) {
        this.proposal = proposal;
        this.votes = votes;
        this.strategies = strategies;
        this.selected = selected;
    }
    static isValidChoice(voteChoice, proposalChoices) {
        return (Array.isArray(voteChoice) &&
            // If voteChoice index is not in choices, return false
            voteChoice.every((voteChoice) => (proposalChoices === null || proposalChoices === void 0 ? void 0 : proposalChoices[voteChoice - 1]) !== undefined) &&
            // If any voteChoice is duplicated, return false
            voteChoice.length === new Set(voteChoice).size &&
            // If voteChoice is empty, return false
            voteChoice.length > 0 &&
            // If not all proposalChoices are selected, return false
            // TODO: We should add support for pacial bailout in the future
            voteChoice.length === proposalChoices.length);
    }
    getValidVotes() {
        return this.votes.filter((vote) => RankedChoiceVoting.isValidChoice(vote.choice, this.proposal.choices));
    }
    getScores() {
        return getScoresMethod(this.getValidVotes(), this.proposal);
    }
    getScoresByStrategy() {
        const finalRound = getFinalRound(this.getValidVotes());
        return this.proposal.choices.map((choice, i) => this.strategies.map((strategy, sI) => {
            return finalRound
                .filter((res) => Number(res[0]) === i + 1)
                .reduce((a, b) => a + b[1][1][sI], 0);
        }));
    }
    getScoresTotal() {
        return this.votes.reduce((a, b) => a + b.balance, 0);
    }
    getChoiceString() {
        return this.selected
            .map((choice) => {
            if (this.proposal.choices[choice - 1])
                return this.proposal.choices[choice - 1];
        })
            .map((el, i) => `(${getNumberWithOrdinal(i + 1)}) ${el}`)
            .join(', ');
    }
}

// CopelandVoting implements ranked choice voting using Copeland's method
// This method compares each pair of choices and awards points based on pairwise victories
class CopelandVoting {
    constructor(proposal, votes, strategies, selected) {
        this.proposal = proposal;
        this.votes = votes;
        this.strategies = strategies;
        this.selected = selected;
    }
    // Validates if a vote choice is valid for the given proposal
    // Allows partial ranking (not all choices need to be ranked)
    static isValidChoice(voteChoice, proposalChoices) {
        if (!Array.isArray(voteChoice) ||
            voteChoice.length === 0 ||
            voteChoice.length > proposalChoices.length ||
            new Set(voteChoice).size !== voteChoice.length) {
            return false;
        }
        return voteChoice.every((choice) => Number.isInteger(choice) &&
            choice >= 1 &&
            choice <= proposalChoices.length);
    }
    // Returns only the valid votes
    getValidVotes() {
        return this.votes.filter((vote) => CopelandVoting.isValidChoice(vote.choice, this.proposal.choices));
    }
    // Calculates the Copeland scores for each choice
    getScores() {
        const validVotes = this.getValidVotes();
        const choicesCount = this.proposal.choices.length;
        const pairwiseComparisons = Array.from({ length: choicesCount }, () => Array(choicesCount).fill(0));
        const totalVotingPower = this.getScoresTotal();
        // Calculate pairwise comparisons
        for (const vote of validVotes) {
            for (let currentRank = 0; currentRank < vote.choice.length; currentRank++) {
                for (let nextRank = currentRank + 1; nextRank < vote.choice.length; nextRank++) {
                    const preferredChoice = vote.choice[currentRank] - 1;
                    const lowerChoice = vote.choice[nextRank] - 1;
                    pairwiseComparisons[preferredChoice][lowerChoice] += vote.balance;
                    pairwiseComparisons[lowerChoice][preferredChoice] -= vote.balance;
                }
            }
        }
        // Calculate Copeland scores
        const scores = Array(choicesCount).fill(0);
        let totalCopelandScore = 0;
        for (let choiceIndex = 0; choiceIndex < choicesCount; choiceIndex++) {
            for (let opponentIndex = 0; opponentIndex < choicesCount; opponentIndex++) {
                if (choiceIndex !== opponentIndex) {
                    const comparison = pairwiseComparisons[choiceIndex][opponentIndex];
                    if (comparison > 0) {
                        scores[choiceIndex]++;
                    }
                    else if (comparison < 0) {
                        scores[opponentIndex]++;
                    }
                    else {
                        scores[choiceIndex] += 0.5;
                        scores[opponentIndex] += 0.5;
                    }
                }
            }
        }
        // Calculate total Copeland score for normalization
        totalCopelandScore = scores.reduce((sum, score) => sum + score, 0);
        // Normalize scores to distribute voting power
        if (totalCopelandScore > 0) {
            return scores.map((score) => (score / totalCopelandScore) * totalVotingPower);
        }
        // If no clear winners, distribute power equally
        return scores.map(() => totalVotingPower / choicesCount);
    }
    // Calculates the Copeland scores for each choice, broken down by strategy
    getScoresByStrategy() {
        const validVotes = this.getValidVotes();
        const choicesCount = this.proposal.choices.length;
        const strategiesCount = this.strategies.length;
        const pairwiseComparisons = Array.from({ length: choicesCount }, () => Array.from({ length: choicesCount }, () => Array(strategiesCount).fill(0)));
        // Calculate total voting power per strategy
        const strategyTotals = Array(strategiesCount).fill(0);
        for (const vote of validVotes) {
            for (let i = 0; i < strategiesCount; i++) {
                strategyTotals[i] += vote.scores[i];
            }
        }
        // Calculate pairwise comparisons for each strategy
        for (const vote of validVotes) {
            for (let currentRank = 0; currentRank < vote.choice.length; currentRank++) {
                for (let nextRank = currentRank + 1; nextRank < vote.choice.length; nextRank++) {
                    const preferredChoice = vote.choice[currentRank] - 1;
                    const lowerChoice = vote.choice[nextRank] - 1;
                    for (let strategyIndex = 0; strategyIndex < strategiesCount; strategyIndex++) {
                        pairwiseComparisons[preferredChoice][lowerChoice][strategyIndex] +=
                            vote.scores[strategyIndex];
                        pairwiseComparisons[lowerChoice][preferredChoice][strategyIndex] -=
                            vote.scores[strategyIndex];
                    }
                }
            }
        }
        // Calculate Copeland scores for each strategy
        const scores = Array.from({ length: choicesCount }, () => Array(strategiesCount).fill(0));
        for (let choiceIndex = 0; choiceIndex < choicesCount; choiceIndex++) {
            for (let opponentIndex = 0; opponentIndex < choicesCount; opponentIndex++) {
                if (choiceIndex !== opponentIndex) {
                    for (let strategyIndex = 0; strategyIndex < strategiesCount; strategyIndex++) {
                        const comparison = pairwiseComparisons[choiceIndex][opponentIndex][strategyIndex];
                        if (comparison > 0) {
                            scores[choiceIndex][strategyIndex]++;
                        }
                        else if (comparison < 0) {
                            scores[opponentIndex][strategyIndex]++;
                        }
                        else {
                            scores[choiceIndex][strategyIndex] += 0.5;
                            scores[opponentIndex][strategyIndex] += 0.5;
                        }
                    }
                }
            }
        }
        // Normalize scores by strategy to distribute voting power
        const normalizedScores = Array.from({ length: choicesCount }, () => Array(strategiesCount).fill(0));
        for (let strategyIndex = 0; strategyIndex < strategiesCount; strategyIndex++) {
            // Calculate total Copeland score for this strategy
            let totalCopelandScore = 0;
            for (let choiceIndex = 0; choiceIndex < choicesCount; choiceIndex++) {
                totalCopelandScore += scores[choiceIndex][strategyIndex];
            }
            // Normalize scores to distribute voting power for this strategy
            if (totalCopelandScore > 0) {
                for (let choiceIndex = 0; choiceIndex < choicesCount; choiceIndex++) {
                    normalizedScores[choiceIndex][strategyIndex] =
                        (scores[choiceIndex][strategyIndex] / totalCopelandScore) *
                            strategyTotals[strategyIndex];
                }
            }
            else if (strategyTotals[strategyIndex] > 0) {
                // If no clear winners, distribute power equally for this strategy
                for (let choiceIndex = 0; choiceIndex < choicesCount; choiceIndex++) {
                    normalizedScores[choiceIndex][strategyIndex] =
                        strategyTotals[strategyIndex] / choicesCount;
                }
            }
        }
        return normalizedScores;
    }
    // Calculates the total score (sum of all valid vote balances)
    getScoresTotal() {
        return this.getValidVotes().reduce((total, vote) => total + vote.balance, 0);
    }
    // Returns a string representation of the selected choices
    getChoiceString() {
        return this.selected
            .map((choice) => this.proposal.choices[choice - 1])
            .join(', ');
    }
}

function percentageOfTotal(i, values, total) {
    const reducedTotal = total.reduce((a, b) => a + b, 0);
    const percent = (values[i] / reducedTotal) * 100;
    return isNaN(percent) ? 0 : percent;
}
function weightedPower(i, choice, balance) {
    return ((percentageOfTotal(i + 1, choice, Object.values(choice)) / 100) * balance);
}
class WeightedVoting {
    constructor(proposal, votes, strategies, selected) {
        this.proposal = proposal;
        this.votes = votes;
        this.strategies = strategies;
        this.selected = selected;
    }
    static isValidChoice(voteChoice, proposalChoices) {
        return (typeof voteChoice === 'object' &&
            !Array.isArray(voteChoice) &&
            voteChoice !== null &&
            // If voteChoice object keys are not in choices, return false
            Object.keys(voteChoice).every((key) => (proposalChoices === null || proposalChoices === void 0 ? void 0 : proposalChoices[Number(key) - 1]) !== undefined) &&
            // If voteChoice object is empty, return false
            Object.keys(voteChoice).length > 0 &&
            // If voteChoice object values have a negative number, return false
            Object.values(voteChoice).every((value) => typeof value === 'number' && value >= 0) &&
            // If voteChoice doesn't have any positive value, return false
            Object.values(voteChoice).some((value) => typeof value === 'number' && value > 0));
    }
    getValidVotes() {
        return this.votes.filter((vote) => WeightedVoting.isValidChoice(vote.choice, this.proposal.choices));
    }
    getScores() {
        const results = this.proposal.choices.map((choice, i) => this.getValidVotes()
            .map((vote) => weightedPower(i, vote.choice, vote.balance))
            .reduce((a, b) => a + b, 0));
        const validScoresTotal = this.getValidVotes().reduce((a, b) => a + b.balance, 0);
        return results
            .map((res, i) => percentageOfTotal(i, results, results))
            .map((p) => (validScoresTotal / 100) * p);
    }
    getScoresByStrategy() {
        const results = this.proposal.choices
            .map((choice, i) => this.strategies.map((strategy, sI) => this.getValidVotes()
            .map((vote) => weightedPower(i, vote.choice, vote.scores[sI]))
            .reduce((a, b) => a + b, 0)))
            .map((arr) => arr.map((pwr) => [pwr]));
        const validScoresTotal = this.getValidVotes().reduce((a, b) => a + b.balance, 0);
        return results.map((res, i) => this.strategies
            .map((strategy, sI) => percentageOfTotal(0, results[i][sI], results.flat(2)))
            .map((p) => [(validScoresTotal / 100) * p])
            .flat());
    }
    getScoresTotal() {
        return this.votes.reduce((a, b) => a + b.balance, 0);
    }
    getChoiceString() {
        return this.proposal.choices
            .map((choice, i) => {
            if (this.selected[i + 1]) {
                return `${Math.round(percentageOfTotal(i + 1, this.selected, Object.values(this.selected)) * 10) / 10}% for ${choice}`;
            }
        })
            .filter((el) => el != null)
            .join(', ');
    }
}

var voting = {
    'single-choice': SingleChoiceVoting,
    approval: ApprovalVoting,
    quadratic: QuadraticVoting,
    'ranked-choice': RankedChoiceVoting,
    copeland: CopelandVoting,
    weighted: WeightedVoting,
    basic: SingleChoiceVoting
};

var delegationSubgraphs = {
	"1": "https://subgrapher.snapshot.org/delegation/1",
	"10": "https://subgrapher.snapshot.org/delegation/10",
	"56": "https://subgrapher.snapshot.org/delegation/56",
	"100": "https://subgrapher.snapshot.org/delegation/100",
	"137": "https://subgrapher.snapshot.org/delegation/137",
	"146": "https://subgrapher.snapshot.org/delegation/146",
	"250": "https://subgrapher.snapshot.org/delegation/250",
	"5000": "https://subgrapher.snapshot.org/delegation/5000",
	"8453": "https://subgrapher.snapshot.org/delegation/8453",
	"42161": "https://subgrapher.snapshot.org/delegation/42161",
	"59144": "https://subgrapher.snapshot.org/delegation/59144",
	"81457": "https://subgrapher.snapshot.org/delegation/81457",
	"84532": "https://subgrapher.snapshot.org/delegation/84532",
	"11155111": "https://subgrapher.snapshot.org/delegation/11155111"
};

const SNAPSHOT_SUBGRAPH_URL = delegationSubgraphs;
const PAGE_SIZE = 1000;
function getDelegatesBySpace(network_1, space_1) {
    return __awaiter(this, arguments, void 0, function* (network, space, snapshot = 'latest', options = {}) {
        const subgraphUrl = options.subgraphUrl || SNAPSHOT_SUBGRAPH_URL[network];
        if (!subgraphUrl) {
            return Promise.reject(`Delegation subgraph not available for network ${network}`);
        }
        let pivot = 0;
        const result = new Map();
        const spaceIn = space ? buildSpaceIn(space) : null;
        while (true) {
            const newResults = yield fetchData({
                url: subgraphUrl,
                spaces: spaceIn,
                pivot,
                snapshot
            });
            if (checkAllDuplicates(newResults)) {
                throw new Error('Unable to paginate delegation');
            }
            newResults.forEach((delegation) => {
                concatUniqueDelegation(result, delegation);
                pivot = delegation.timestamp;
            });
            if (newResults.length < PAGE_SIZE)
                break;
        }
        return [...result.values()];
    });
}
function checkAllDuplicates(delegations) {
    return (delegations.length === PAGE_SIZE &&
        delegations[0].timestamp === delegations[delegations.length - 1].timestamp);
}
function delegationKey(delegation) {
    return `${delegation.delegator}-${delegation.delegate}-${delegation.space}`;
}
function concatUniqueDelegation(result, delegation) {
    const key = delegationKey(delegation);
    if (!result.has(key)) {
        result.set(key, delegation);
    }
}
function buildSpaceIn(space) {
    const spaces = ['', space];
    if (space.includes('.eth'))
        spaces.push(space.replace('.eth', ''));
    return spaces;
}
function fetchData(_a) {
    return __awaiter(this, arguments, void 0, function* ({ url, spaces, pivot, snapshot }) {
        const params = {
            delegations: {
                __args: {
                    where: {
                        timestamp_gte: pivot
                    },
                    first: PAGE_SIZE,
                    skip: 0,
                    orderBy: 'timestamp',
                    orderDirection: 'asc'
                },
                delegator: true,
                space: true,
                delegate: true,
                timestamp: true
            }
        };
        if (snapshot !== 'latest') {
            params.delegations.__args.block = { number: snapshot };
        }
        if (spaces !== null) {
            params.delegations.__args.where.space_in = spaces;
        }
        return (yield subgraphRequest(url, params)).delegations || [];
    });
}

const MUTED_ERRORS = [
    // mute error from coinbase, when the subdomain is not found
    // most other resolvers just return an empty address
    'response not found during CCIP fetch',
    // mute error from missing offchain resolver (mostly for sepolia)
    'UNSUPPORTED_OPERATION'
];
const ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
const ENS_ABI = [
    'function text(bytes32 node, string calldata key) external view returns (string memory)',
    'function resolver(bytes32 node) view returns (address)' // ENS registry ABI
];
const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000';
const STARKNET_NETWORKS = {
    '0x534e5f4d41494e': {
        name: 'Starknet',
        testnet: false
    },
    '0x534e5f5345504f4c4941': {
        name: 'Starknet Sepolia',
        testnet: true
    }
};
const scoreApiHeaders = {
    Accept: 'application/json',
    'Content-Type': 'application/json'
};
const DEFAULT_SCORE_API_URL = 'https://score.snapshot.org';
function formatScoreAPIUrl(url = DEFAULT_SCORE_API_URL, options = {
    path: ''
}) {
    const scoreURL = new URL(url);
    if (options.path)
        scoreURL.pathname = options.path;
    const apiKey = scoreURL.searchParams.get('apiKey');
    let headers = Object.assign({}, scoreApiHeaders);
    if (apiKey) {
        scoreURL.searchParams.delete('apiKey');
        headers = Object.assign(Object.assign({}, scoreApiHeaders), { 'X-API-KEY': apiKey });
    }
    return {
        url: scoreURL.toString(),
        headers
    };
}
function parseScoreAPIResponse(res) {
    return __awaiter(this, void 0, void 0, function* () {
        let data = yield res.text();
        try {
            data = JSON.parse(data);
        }
        catch (e) {
            return Promise.reject({
                code: res.status || 500,
                message: 'Failed to parse response from score API',
                data
            });
        }
        if (data.error)
            return Promise.reject(data.error);
        return data;
    });
}
const ajv = new Ajv({
    allErrors: true,
    allowUnionTypes: true,
    $data: true,
    passContext: true
});
// @ts-ignore
addFormats(ajv);
addErrors(ajv);
ajv.addFormat('address', {
    validate: (value) => {
        try {
            return value === getAddress(value);
        }
        catch (e) {
            return false;
        }
    }
});
ajv.addFormat('evmAddress', {
    validate: (value) => {
        try {
            getAddress(value);
            return true;
        }
        catch (e) {
            return false;
        }
    }
});
ajv.addFormat('starknetAddress', {
    validate: (value) => {
        try {
            return validateAndParseAddress(value) === value;
        }
        catch (e) {
            return false;
        }
    }
});
ajv.addFormat('long', {
    validate: () => true
});
ajv.addFormat('lowercase', {
    validate: (value) => value === value.toLowerCase()
});
ajv.addFormat('color', {
    validate: (value) => {
        if (!value)
            return false;
        return !!value.match(/^#[0-9A-F]{6}$/);
    }
});
ajv.addFormat('ethValue', {
    validate: (value) => {
        if (!value.match(/^([0-9]|[1-9][0-9]+)(\.[0-9]+)?$/))
            return false;
        try {
            parseUnits(value, 18);
            return true;
        }
        catch (_a) {
            return false;
        }
    }
});
const networksIds = Object.keys(networks);
const mainnetNetworkIds = Object.keys(networks).filter((id) => !networks[id].testnet);
ajv.addKeyword({
    keyword: 'snapshotNetwork',
    validate: function (schema, data) {
        // @ts-ignore
        const snapshotEnv = this.snapshotEnv || 'default';
        if (snapshotEnv === 'mainnet')
            return mainnetNetworkIds.includes(data);
        return networksIds.includes(data);
    },
    error: {
        message: 'network not allowed'
    }
});
ajv.addKeyword({
    keyword: 'starknetNetwork',
    validate: function (schema, data) {
        // @ts-ignore
        const snapshotEnv = this.snapshotEnv || 'default';
        if (snapshotEnv === 'mainnet') {
            return Object.keys(STARKNET_NETWORKS)
                .filter((id) => !STARKNET_NETWORKS[id].testnet)
                .includes(data);
        }
        return Object.keys(STARKNET_NETWORKS).includes(data);
    },
    error: {
        message: 'network not allowed'
    }
});
// Custom URL format to allow empty string values
// https://github.com/snapshot-labs/snapshot.js/pull/541/files
ajv.addFormat('customUrl', {
    type: 'string',
    validate: (str) => {
        if (!str.length)
            return true;
        return (str.startsWith('http://') ||
            str.startsWith('https://') ||
            str.startsWith('ipfs://') ||
            str.startsWith('ipns://') ||
            str.startsWith('snapshot://'));
    }
});
ajv.addFormat('domain', {
    validate: (value) => {
        if (!value)
            return false;
        return !!value.match(/^(https:\/\/)?([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}(\/)?$/);
    }
});
function getDomainType(domain) {
    const isEns = domain.endsWith('.eth');
    const tokens = domain.split('.');
    if (tokens.length === 1)
        return 'tld';
    else if (tokens.length === 2 && !isEns)
        return 'other-tld';
    else if (tokens.length > 2)
        return 'subdomain';
    else if (isEns)
        return 'ens';
    else
        throw new Error('Invalid domain');
}
// see https://docs.ens.domains/registry/dns#gasless-import
function getDNSOwner(domain) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const response = yield fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=TXT`, {
            headers: {
                accept: 'application/dns-json'
            }
        });
        const data = yield response.json();
        // Error list: https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml#dns-parameters-6
        if (data.Status === 3)
            return EMPTY_ADDRESS;
        if (data.Status !== 0)
            throw new Error('Failed to fetch DNS Owner');
        const ownerRecord = (_a = data.Answer) === null || _a === void 0 ? void 0 : _a.find((record) => record.data.includes('ENS1'));
        if (!ownerRecord)
            return EMPTY_ADDRESS;
        return getAddress(ownerRecord.data.replace(new RegExp('"', 'g'), '').split(' ').pop());
    });
}
function call(provider, abi, call, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const contract = new Contract$1(call[0], abi, provider);
        try {
            const params = call[2] || [];
            return yield contract[call[1]](...params, options || {});
        }
        catch (e) {
            return Promise.reject(e);
        }
    });
}
function multicall(network, provider, abi, calls, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const multicallAbi = [
            'function aggregate(tuple(address target, bytes callData)[] calls) view returns (uint256 blockNumber, bytes[] returnData)'
        ];
        const multicallAddress = (options === null || options === void 0 ? void 0 : options.multicallAddress) || networks[network].multicall;
        const multi = new Contract$1(multicallAddress, multicallAbi, provider);
        const itf = new Interface(abi);
        try {
            const max = (options === null || options === void 0 ? void 0 : options.limit) || 500;
            if (options === null || options === void 0 ? void 0 : options.limit)
                delete options.limit;
            const pages = Math.ceil(calls.length / max);
            const promises = [];
            Array.from(Array(pages)).forEach((x, i) => {
                const callsInPage = calls.slice(max * i, max * (i + 1));
                promises.push(multi.aggregate(callsInPage.map((call) => [
                    call[0].toLowerCase(),
                    itf.encodeFunctionData(call[1], call[2])
                ]), options || {}));
            });
            let results = yield Promise.all(promises);
            results = results.reduce((prev, [, res]) => prev.concat(res), []);
            return results.map((call, i) => itf.decodeFunctionResult(calls[i][1], call));
        }
        catch (e) {
            return Promise.reject(e);
        }
    });
}
function subgraphRequest(url_1, query_1) {
    return __awaiter(this, arguments, void 0, function* (url, query, options = {}) {
        const body = { query: jsonToGraphQLQuery({ query }) };
        if (options.variables)
            body.variables = options.variables;
        const res = yield fetch(url, {
            method: 'POST',
            headers: Object.assign({ Accept: 'application/json', 'Content-Type': 'application/json' }, options === null || options === void 0 ? void 0 : options.headers),
            body: JSON.stringify(body)
        });
        let responseData = yield res.text();
        try {
            responseData = JSON.parse(responseData);
        }
        catch (e) {
            throw new Error(`Errors found in subgraphRequest: URL: ${url}, Status: ${res.status}, Response: ${responseData.substring(0, 400)}`);
        }
        if (responseData.errors) {
            throw new Error(`Errors found in subgraphRequest: URL: ${url}, Status: ${res.status},  Response: ${JSON.stringify(responseData.errors).substring(0, 400)}`);
        }
        const { data } = responseData;
        return data || {};
    });
}
function getUrl(uri, gateway = gateways[0]) {
    const ipfsGateway = `https://${gateway}`;
    if (!uri)
        return null;
    if (!uri.startsWith('ipfs://') &&
        !uri.startsWith('ipns://') &&
        !uri.startsWith('https://') &&
        !uri.startsWith('http://'))
        return `${ipfsGateway}/ipfs/${uri}`;
    const uriScheme = uri.split('://')[0];
    if (uriScheme === 'ipfs')
        return uri.replace('ipfs://', `${ipfsGateway}/ipfs/`);
    if (uriScheme === 'ipns')
        return uri.replace('ipns://', `${ipfsGateway}/ipns/`);
    return uri;
}
function getJSON(uri_1) {
    return __awaiter(this, arguments, void 0, function* (uri, options = {}) {
        const url = getUrl(uri, options.gateways);
        return fetch(url).then((res) => res.json());
    });
}
function ipfsGet(gateway_1, ipfsHash_1) {
    return __awaiter(this, arguments, void 0, function* (gateway, ipfsHash, protocolType = 'ipfs') {
        const url = `https://${gateway}/${protocolType}/${ipfsHash}`;
        return fetch(url).then((res) => res.json());
    });
}
function sendTransaction(web3_1, contractAddress_1, abi_1, action_1, params_1) {
    return __awaiter(this, arguments, void 0, function* (web3, contractAddress, abi, action, params, overrides = {}) {
        const signer = web3.getSigner();
        const contract = new Contract$1(contractAddress, abi, web3);
        const contractWithSigner = contract.connect(signer);
        // overrides.gasLimit = 12e6;
        return yield contractWithSigner[action](...params, overrides);
    });
}
function getScores(space_1, strategies_1, network_1, addresses_1) {
    return __awaiter(this, arguments, void 0, function* (space, strategies, network, addresses, snapshot = 'latest', scoreApiUrl = DEFAULT_SCORE_API_URL, options = {}) {
        if (!Array.isArray(addresses)) {
            return inputError('addresses should be an array of addresses');
        }
        if (addresses.length === 0) {
            return inputError('addresses can not be empty');
        }
        const invalidAddress = addresses.find((address) => !isValidAddress(address));
        if (invalidAddress) {
            return inputError(`Invalid address: ${invalidAddress}`);
        }
        if (!isValidNetwork(network)) {
            return inputError(`Invalid network: ${network}`);
        }
        const invalidStrategy = strategies.find((strategy) => strategy.network && !isValidNetwork(strategy.network));
        if (invalidStrategy) {
            return inputError(`Invalid network (${invalidStrategy.network}) in strategy ${invalidStrategy.name}`);
        }
        if (!isValidSnapshot(snapshot, network)) {
            return inputError(`Snapshot (${snapshot}) must be 'latest' or greater than network start block (${networks[network].start})`);
        }
        const urlObject = new URL(scoreApiUrl);
        urlObject.pathname = '/api/scores';
        const { url, headers } = formatScoreAPIUrl(scoreApiUrl, {
            path: '/api/scores'
        });
        try {
            const params = {
                space,
                network,
                snapshot,
                strategies,
                addresses
            };
            const res = yield fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify({ params })
            });
            const response = yield parseScoreAPIResponse(res);
            return options.returnValue === 'all'
                ? response.result
                : response.result[options.returnValue || 'scores'];
        }
        catch (e) {
            if (e.errno) {
                return Promise.reject({ code: e.errno, message: e.toString(), data: '' });
            }
            return Promise.reject(e);
        }
    });
}
function getVp(address, network, strategies, snapshot, space, delegation, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { url, headers } = formatScoreAPIUrl(options === null || options === void 0 ? void 0 : options.url);
        if (!isValidAddress(address)) {
            return inputError(`Invalid voter address: ${address}`);
        }
        if (!isValidNetwork(network)) {
            return inputError(`Invalid network: ${network}`);
        }
        const invalidStrategy = strategies.find((strategy) => strategy.network && !isValidNetwork(strategy.network));
        if (invalidStrategy) {
            return inputError(`Invalid network (${invalidStrategy.network}) in strategy ${invalidStrategy.name}`);
        }
        if (!isValidSnapshot(snapshot, network)) {
            return inputError(`Snapshot (${snapshot}) must be 'latest' or greater than network start block (${networks[network].start})`);
        }
        const init = {
            method: 'POST',
            headers,
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'get_vp',
                params: {
                    address,
                    network,
                    strategies,
                    snapshot,
                    space,
                    delegation
                }
            })
        };
        try {
            const res = yield fetch(url, init);
            const response = yield parseScoreAPIResponse(res);
            return response.result;
        }
        catch (e) {
            if (e.errno) {
                return Promise.reject({ code: e.errno, message: e.toString(), data: '' });
            }
            return Promise.reject(e);
        }
    });
}
function validate(validation, author, space, network, snapshot, params, options) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!isValidAddress(author)) {
            return inputError(`Invalid author: ${author}`);
        }
        if (!isValidNetwork(network)) {
            return inputError(`Invalid network: ${network}`);
        }
        if (!isValidSnapshot(snapshot, network)) {
            return inputError(`Snapshot (${snapshot}) must be 'latest' or greater than network start block (${networks[network].start})`);
        }
        if (!options)
            options = {};
        const { url, headers } = formatScoreAPIUrl(options.url);
        const init = {
            method: 'POST',
            headers,
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'validate',
                params: {
                    validation,
                    author,
                    space,
                    network,
                    snapshot,
                    params
                }
            })
        };
        try {
            const res = yield fetch(url, init);
            const response = yield parseScoreAPIResponse(res);
            return response.result;
        }
        catch (e) {
            if (e.errno) {
                return Promise.reject({ code: e.errno, message: e.toString(), data: '' });
            }
            return Promise.reject(e);
        }
    });
}
function validateSchema(schema, data, options = {
    snapshotEnv: 'default',
    spaceType: 'default'
}) {
    const ajvValidate = ajv.compile(schema);
    const valid = ajvValidate.call(options, data);
    return valid ? valid : ajvValidate.errors;
}
function getEnsTextRecord(ens_1, record_1) {
    return __awaiter(this, arguments, void 0, function* (ens, record, network = '1', options = {}) {
        var _a, _b;
        const { ensResolvers = ((_a = networks[network]) === null || _a === void 0 ? void 0 : _a.ensResolvers) ||
            networks['1'].ensResolvers, broviderUrl } = options, multicallOptions = __rest(options, ["ensResolvers", "broviderUrl"]);
        let ensHash;
        try {
            ensHash = namehash(ensNormalize(ens));
        }
        catch (e) {
            return null;
        }
        const provider = getProvider(network, { broviderUrl });
        const calls = [
            [ENS_REGISTRY, 'resolver', [ensHash]], // Query for resolver from registry
            ...ensResolvers.map((address) => [
                address,
                'text',
                [ensHash, record]
            ]) // Query for text record from each resolver
        ];
        const [[resolverAddress], ...textRecords] = yield multicall(network, provider, ENS_ABI, calls, multicallOptions);
        const resolverIndex = ensResolvers.indexOf(resolverAddress);
        return resolverIndex !== -1 ? (_b = textRecords[resolverIndex]) === null || _b === void 0 ? void 0 : _b[0] : null;
    });
}
function getSpaceUri(id_1) {
    return __awaiter(this, arguments, void 0, function* (id, network = '1', options = {}) {
        try {
            return yield getEnsTextRecord(id, 'snapshot', network, options);
        }
        catch (e) {
            console.log(e);
            return null;
        }
    });
}
function getEnsOwner(ens_1) {
    return __awaiter(this, arguments, void 0, function* (ens, network = '1', options = {}) {
        var _a, _b;
        if (!((_b = (_a = networks[network]) === null || _a === void 0 ? void 0 : _a.ensResolvers) === null || _b === void 0 ? void 0 : _b.length)) {
            throw new Error('Network not supported');
        }
        const domainType = getDomainType(ens);
        const provider = getProvider(network, options);
        const ensRegistry = new Contract$1(ENS_REGISTRY, ['function owner(bytes32) view returns (address)'], provider);
        let ensHash;
        try {
            ensHash = namehash(ensNormalize(ens));
        }
        catch (e) {
            return EMPTY_ADDRESS;
        }
        const ensNameWrapper = options.ensNameWrapper || networks[network].ensNameWrapper;
        let owner = yield ensRegistry.owner(ensHash);
        // If owner is the ENSNameWrapper contract, resolve the owner of the name
        if (owner === ensNameWrapper) {
            const ensNameWrapperContract = new Contract$1(ensNameWrapper, ['function ownerOf(uint256) view returns (address)'], provider);
            owner = yield ensNameWrapperContract.ownerOf(ensHash);
        }
        if (owner === EMPTY_ADDRESS && domainType === 'other-tld') {
            const resolvedAddress = yield provider.resolveName(ens);
            // Filter out domains with valid TXT records, but not imported
            if (resolvedAddress) {
                owner = yield getDNSOwner(ens);
            }
        }
        if (owner === EMPTY_ADDRESS && domainType === 'subdomain') {
            try {
                owner = yield provider.resolveName(ens);
            }
            catch (e) {
                if (MUTED_ERRORS.every((error) => !e.message.includes(error))) {
                    throw e;
                }
                owner = EMPTY_ADDRESS;
            }
        }
        return owner || EMPTY_ADDRESS;
    });
}
function getSpaceController(id_1) {
    return __awaiter(this, arguments, void 0, function* (id, network = '1', options = {}) {
        const spaceUri = yield getSpaceUri(id, network, options);
        if (spaceUri) {
            let isUriAddress = isAddress(spaceUri);
            if (isUriAddress)
                return spaceUri;
            const uriParts = spaceUri.split('/');
            const position = uriParts.includes('testnet') ? 5 : 4;
            const address = uriParts[position];
            isUriAddress = isAddress(address);
            if (isUriAddress)
                return address;
        }
        return yield getEnsOwner(id, network, options);
    });
}
function clone(item) {
    return JSON.parse(JSON.stringify(item));
}
function sleep(time) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => {
            setTimeout(resolve, time);
        });
    });
}
function getNumberWithOrdinal(n) {
    const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
function isValidNetwork(network) {
    return !!networks[network];
}
function isValidAddress(address) {
    return isAddress(address) && address !== EMPTY_ADDRESS;
}
function isValidSnapshot(snapshot, network) {
    return (snapshot === 'latest' ||
        (typeof snapshot === 'number' && snapshot >= networks[network].start));
}
function isStarknetAddress(address) {
    if (!address)
        return false;
    try {
        validateAndParseAddress(address);
        return true;
    }
    catch (e) {
        return false;
    }
}
function isEvmAddress(address) {
    return isAddress(address);
}
function getFormattedAddress(address, format) {
    if (format === 'evm' && isEvmAddress(address))
        return getAddress(address);
    if (format === 'starknet' && isStarknetAddress(address))
        return validateAndParseAddress(address);
    throw new Error(`Invalid address: ${address}`);
}
function inputError(message) {
    return Promise.reject(new Error(message));
}
var utils = {
    call,
    multicall,
    subgraphRequest,
    ipfsGet,
    getUrl,
    getJSON,
    sendTransaction,
    getScores,
    getVp,
    validateSchema,
    getEnsTextRecord,
    getSpaceUri,
    getEnsOwner,
    getSpaceController,
    getDelegatesBySpace,
    clone,
    sleep,
    getNumberWithOrdinal,
    voting,
    getProvider,
    signMessage,
    getBlockNumber,
    Multicaller,
    getSnapshots,
    getHash: getHash$2,
    verify: verify$2,
    validate,
    isStarknetAddress,
    isEvmAddress,
    getFormattedAddress,
    SNAPSHOT_SUBGRAPH_URL
};

var index = {
    Client: Client,
    Client712: Client,
    schemas,
    utils
};

export default index;
