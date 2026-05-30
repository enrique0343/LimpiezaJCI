/** Tiny className joiner (avoids a clsx dependency for the v1 kit). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
