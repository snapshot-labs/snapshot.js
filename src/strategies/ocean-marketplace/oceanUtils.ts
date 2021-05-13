export function verifyResultsLength(
  result: number,
  expectedResults: number,
  type: string
): void {
  result === expectedResults
    ? console.log(`>>> SUCCESS: ${type} match expected results - length`)
    : console.error(
        `>>> ERROR: ${type} do not match expected results - length`
      );
}

export function verifyResults(
  result: string,
  expectedResults: string,
  type: string
): void {
  result === expectedResults
    ? console.log(`>>> SUCCESS: ${type} match expected results`)
    : console.error(`>>> ERROR: ${type} do not match expected results`);
}
