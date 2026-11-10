// Kashida stretching engine per FONT_RULES.md — pure functions, no DOM access,
// so the algorithm stays testable and separate from rendering (Rule 4).

const KASHIDA = "\u0640";

// Joining types as codes: U = non-joining, D = joins both sides,
// R = joins right side only, C = kashida (joins both sides).
const U = 0;
const D = 1;
const R = 2;
const C = 3;

const D_LETTERS = new Set([
  "\u0626","\u0628","\u062A","\u062B","\u062C","\u062D","\u062E","\u0633",
  "\u0634","\u0635","\u0636","\u0637","\u0638","\u0639","\u063A","\u0641",
  "\u0642","\u0643","\u0644","\u0645","\u0646","\u0647","\u064A","\u067E",
  "\u0686","\u06A9","\u06AF","\u06CC",
]);
const R_LETTERS = new Set([
  "\u0622","\u0623","\u0624","\u0625","\u0627","\u0629","\u062F","\u0630",
  "\u0631","\u0632","\u0648","\u0649","\u0698",
]);

function joiningType(c) {
  if (c === KASHIDA) return C;
  if (D_LETTERS.has(c)) return D;
  if (R_LETTERS.has(c)) return R;
  return U;
}

export function lettersJoin(left, right) {
  const a = joiningType(left);
  const b = joiningType(right);
  return (a === D || a === C) && (b === D || b === R || b === C);
}

// Insert one kashida after each of the first `count` gap positions.
// `gaps` holds the index AFTER the left character of each valid join,
// in ascending order, so slicing at those indexes inserts in one pass.
function insertKashidas(text, gaps, count) {
  if (count <= 0) return text;
  let out = "";
  let from = 0;
  for (let g = 0; g < count; g++) {
    out += text.slice(from, gaps[g]) + KASHIDA;
    from = gaps[g];
  }
  return out + text.slice(from);
}

// Stretch `text` to `ratio` x its measured width, one kashida per valid gap,
// gaps filled in order, stopping at target. Already-stretched text is untouched.
//
// Width grows monotonically as gaps are filled, so the smallest prefix that
// reaches the target is found by binary search — O(log n) measurements instead
// of one per gap.
export function stretch(text, measure, ratio = 1.25) {
  if (text.includes(KASHIDA)) return text;
  const baseWidth = measure(text);
  const target = Math.round(baseWidth * ratio);
  if (target <= 0 || baseWidth >= target) return text;

  // Joining types computed once; "L" never occurs so left-join = {D, C}.
  const types = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) types[i] = joiningType(text[i]);

  const gaps = [];
  for (let i = 0; i + 1 < text.length; i++) {
    const a = types[i];
    const b = types[i + 1];
    if ((a === D || a === C) && (b === D || b === R || b === C)) gaps.push(i + 1);
  }
  if (gaps.length === 0) return text;

  let lo = 1;
  let hi = gaps.length;
  let best = gaps.length;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (measure(insertKashidas(text, gaps, mid)) >= target) {
      best = mid;
      hi = mid - 1;
    } else {
      lo = mid + 1;
    }
  }
  return insertKashidas(text, gaps, best);
}
