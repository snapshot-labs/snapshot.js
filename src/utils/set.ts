// Minimal replacement for the standalone `lodash.set` package, which is
// permanently affected by GHSA-p6mc-m468-83gw (prototype pollution): 4.3.2 is
// both its latest and its last published version, so no patched release exists.
//
// Behaviour follows `lodash@4.17.21`, where the same flaw was fixed: `a.b`,
// `a[0]`, `a['b']` and array paths all resolve identically, missing containers
// are created as arrays when the next key is an array index and as plain
// objects otherwise, existing containers are reused as-is, and keys that would
// reach `Object.prototype` leave the assignment unperformed.

export type Path = string | number | number[] | string[];

// Matches a bare key (`a`), a bracketed index (`[0]`), or a bracketed quoted
// key (`['a.b']`), capturing the index and the unquoted key separately. The
// trailing lookahead yields the empty key of accessors like `a..b` and `a[].b`.
const RE_PROP_NAME =
  /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
const RE_ESCAPE_CHAR = /\\(\\)?/g;

// A path is a single key (rather than a deep path) when it is a plain word, or
// contains no `.`/`[]` accessor at all, or already exists on the target.
const RE_IS_PLAIN_PROP = /^\w*$/;
const RE_IS_DEEP_PROP = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/;

// Keys that resolve to `Object.prototype` and therefore must never be walked
// into or assigned to.
const FORBIDDEN_KEYS = ['__proto__', 'constructor', 'prototype'];

// Mirrors lodash's `isIndex`: a non-negative integer without leading zeros.
const RE_IS_INDEX = /^(?:0|[1-9]\d*)$/;

function isIndex(value: string | number): boolean {
  return (
    (typeof value === 'number' || RE_IS_INDEX.test(value)) &&
    Number(value) > -1 &&
    Number(value) % 1 === 0 &&
    Number(value) < Number.MAX_SAFE_INTEGER
  );
}

function isObject(value: any): boolean {
  return (
    value != null && (typeof value === 'object' || typeof value === 'function')
  );
}

function stringToPath(value: string): string[] {
  const result: string[] = [];

  // A leading dot denotes an empty first key, e.g. `.a` -> ['', 'a'].
  if (value.charCodeAt(0) === 46) result.push('');

  value.replace(RE_PROP_NAME, (match, index, quote, quotedKey) => {
    result.push(
      quote ? quotedKey.replace(RE_ESCAPE_CHAR, '$1') : index || match
    );
    return match;
  });

  return result;
}

function isKey(value: string, object: any): boolean {
  if (RE_IS_PLAIN_PROP.test(value) || !RE_IS_DEEP_PROP.test(value)) return true;

  return object != null && value in Object(object);
}

function castPath(path: Path, object: any): string[] {
  if (Array.isArray(path)) return path.map((key) => String(key));
  if (typeof path === 'number') return [String(path)];

  return isKey(path, object) ? [path] : stringToPath(path);
}

/**
 * Sets `value` at `path` of `object`, creating any missing intermediate
 * containers. Paths containing `__proto__`, `constructor` or `prototype` are
 * ignored, leaving the assignment unperformed.
 */
export default function set(object: any, path: Path, value: any): any {
  if (!isObject(object)) return object;

  const keys = castPath(path, object);
  const lastIndex = keys.length - 1;
  let nested = object;

  for (let index = 0; index <= lastIndex && nested != null; index++) {
    const key = keys[index];

    if (FORBIDDEN_KEYS.includes(key)) return object;

    if (index === lastIndex) {
      nested[key] = value;
    } else {
      // Reuse whatever is already there, otherwise create a container matching
      // the shape implied by the next key.
      if (!isObject(nested[key])) {
        nested[key] = isIndex(keys[index + 1]) ? [] : {};
      }
      nested = nested[key];
    }
  }

  return object;
}
