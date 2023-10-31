import { jsonToGraphQLQuery } from 'json-to-graphql-query';

export async function subgraphRequest(url: string, query, options: any = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...options?.headers
    },
    body: JSON.stringify({ query: jsonToGraphQLQuery({ query }) })
  });
  let responseData: any = await res.text();
  try {
    responseData = JSON.parse(responseData);
  } catch (e) {
    throw new Error(
      `Errors found in subgraphRequest: URL: ${url}, Status: ${
        res.status
      }, Response: ${responseData.substring(0, 400)}`
    );
  }
  if (responseData.errors) {
    throw new Error(
      `Errors found in subgraphRequest: URL: ${url}, Status: ${
        res.status
      },  Response: ${JSON.stringify(responseData.errors).substring(0, 400)}`
    );
  }
  const { data } = responseData;
  return data || {};
}
