const BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
export function int2char(n: number) {
  return BI_RM.charAt(n);
}
//#region BIT_OPERATIONS
// (public) this & a
export function op_and(x: number, y: number) {
  return x & y;
}
// (public) this | a
export function op_or(x: number, y: number) {
  return x | y;
}
// (public) this ^ a
export function op_xor(x: number, y: number) {
  return x ^ y;
}
// (public) this & ~a
export function op_andnot(x: number, y: number) {
  return x & ~y;
}
// return index of lowest 1-bit in x, x < 2^31
export function lbit(x: number) {
  if (x == 0) {
    return -1;
  }
  let r = 0;
  if ((x & 0xffff) == 0) {
    x >>= 16;
    r += 16;
  }
  if ((x & 0xff) == 0) {
    x >>= 8;
    r += 8;
  }
  if ((x & 0xf) == 0) {
    x >>= 4;
    r += 4;
  }
  if ((x & 3) == 0) {
    x >>= 2;
    r += 2;
  }
  if ((x & 1) == 0) {
    ++r;
  }
  return r;
}
// return number of 1 bits in x
export function cbit(x: number) {
  let r = 0;
  while (x != 0) {
    x &= x - 1;
    ++r;
  }
  return r;
}

/**
 * Extracts the bytes from an array beginning at index start, and continuing until
 * index end-1 or the end of the array is reached. Pass -1 for end if you want to
 * parse till the end of the array.
 */
export function subarray(o: string | any[] | Uint8Array, start: number, end = -1) {
  // o may be a normal array of bytes, or it could be a JSON encoded Uint8Array
  let len = o.length;
  if (len == null) {
    len = Object.keys(o).length;
  }

  const result = [];
  for (let i = start; (end == -1 || i < end) && i < len; i++) {
    result.push(o[i]);
  }
  return result;
}
