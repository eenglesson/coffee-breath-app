/**
 * Capitalises a person’s full name following common Western‑style rules:
 *   • First letter of every word to upper‑case
 *   • Preserves hyphenated given names (“Anne‑Marie”)
 *   • Handles O’Connor, D’Angelo, McDonald, MacIntyre, etc.
 */
export function formatName(raw: string | null | undefined): string {
  if (!raw) return '';

  // lower‑case everything first to standardise
  return raw
    .toLowerCase()
    .split(/\s+/) // split on whitespace
    .map((word) => {
      // handle hyphenated parts individually
      return word
        .split('-')
        .map((part) => {
          // O’Connor / D’Angelo
          if (/^[od]'.{1,}$/.test(part)) {
            return (
              part.charAt(0).toUpperCase() +
              part.charAt(1) +
              part.charAt(2).toUpperCase() +
              part.slice(3)
            );
          }
          // McDonald / MacIntyre
          if (/^mc[a-z]/.test(part)) {
            return 'Mc' + part.charAt(2).toUpperCase() + part.slice(3);
          }
          if (/^mac[a-z]/.test(part)) {
            return 'Mac' + part.charAt(3).toUpperCase() + part.slice(4);
          }
          // default: plain capitalisation
          return part.charAt(0).toUpperCase() + part.slice(1);
        })
        .join('-'); // re‑join hyphenated pieces
    })
    .join(' ');
}
