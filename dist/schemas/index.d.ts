declare const _default: {
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
export default _default;
