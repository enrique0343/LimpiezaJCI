// Minimal GS1 parser for DataMatrix payloads used at room entry/exit and for
// supply capture (spec §3.2 updated to DataMatrix, §3.3 GS1 traceability).
//
// Supports two input shapes from a scanner (camera or keyboard-wedge):
//  - Human-readable with parenthesised Application Identifiers: "(01)07501234567890(10)A2026-114"
//  - Raw GS1 element strings with FNC1 group separators (ASCII 29, \x1d).
// Also passes through a plain room anchor code (e.g. "LJCI-201") untouched.
//
// AIs handled: 01 GTIN, 10 lot, 17 expiry (YYMMDD), 414 location GLN,
// 254 location extension. Unknown AIs are ignored, not fatal.

export interface Gs1Parsed {
  /** The whole payload, trimmed. */
  raw: string;
  gtin?: string;
  lot?: string;
  /** Expiry as YYMMDD, as encoded. */
  expiry?: string;
  /** Location global number (AI 414) — used as the room anchor. */
  gln?: string;
  /** True when no GS1 AI was found (treat `raw` as a plain anchor code). */
  plain: boolean;
}

const GS = "\u001d"; // FNC1 / group separator

// Fixed-length AIs we read (value length after the AI). Variable-length AIs
// (10 lot, 254 ext) run until the next GS or end of string.
const FIXED: Record<string, number> = {
  "01": 14, // GTIN
  "17": 6, // expiry YYMMDD
  "414": 13, // GLN
};
const VARIABLE = new Set(["10", "254", "21"]); // lot, loc ext, serial

function assign(out: Gs1Parsed, ai: string, value: string) {
  if (ai === "01") out.gtin = value;
  else if (ai === "10") out.lot = value;
  else if (ai === "17") out.expiry = value;
  else if (ai === "414") out.gln = value;
}

function parseParenthesised(raw: string): Gs1Parsed {
  const out: Gs1Parsed = { raw, plain: true };
  const re = /\((\d{2,4})\)([^(]*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    out.plain = false;
    assign(out, m[1], m[2].trim());
  }
  return out;
}

function parseElementString(raw: string): Gs1Parsed {
  const out: Gs1Parsed = { raw, plain: true };
  let i = 0;
  const s = raw;
  while (i < s.length) {
    if (s[i] === GS) {
      i++;
      continue;
    }
    // Match the longest known AI prefix (2–4 digits).
    const ai =
      s.slice(i, i + 3) in FIXED || VARIABLE.has(s.slice(i, i + 3))
        ? s.slice(i, i + 3)
        : s.slice(i, i + 2);
    if (!/^\d{2,4}$/.test(ai)) break; // not a GS1 element string
    i += ai.length;
    let value: string;
    if (FIXED[ai] !== undefined) {
      value = s.slice(i, i + FIXED[ai]);
      i += FIXED[ai];
    } else {
      const next = s.indexOf(GS, i);
      const end = next === -1 ? s.length : next;
      value = s.slice(i, end);
      i = end;
    }
    out.plain = false;
    assign(out, ai, value);
  }
  return out;
}

/** Parse a scanned DataMatrix payload. Never throws. */
export function parseGs1(raw: string): Gs1Parsed {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return { raw: "", plain: true };
  if (trimmed.includes("(")) return parseParenthesised(trimmed);
  if (/^\d{2}/.test(trimmed)) {
    const parsed = parseElementString(trimmed);
    if (!parsed.plain) return parsed;
  }
  return { raw: trimmed, plain: true };
}

/** Build a human-readable GS1 string for a supply (for demo DataMatrix codes). */
export function gs1Supply(gtin: string, lot: string): string {
  return `(01)${gtin}(10)${lot}`;
}
