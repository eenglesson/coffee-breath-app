export interface FormatNameOptions {
  capitalizeLastLetter?: boolean;
}

export function formatName(
  raw: string | null | undefined,
  options: FormatNameOptions = {}
): string {
  if (!raw) return '';

  const { capitalizeLastLetter = false } = options;

  // Lower-case everything first to standardize
  return raw
    .toLowerCase()
    .split(/\s+/) // Split on whitespace
    .map((word) => {
      // Handle hyphenated parts individually
      return word
        .split('-')
        .map((part) => {
          // O’Connor / D’Angelo
          if (/^[od]'.{1,}$/.test(part)) {
            const formatted =
              part.charAt(0).toUpperCase() +
              part.charAt(1) +
              part.charAt(2).toUpperCase() +
              part.slice(3);
            return capitalizeLastLetter
              ? formatted.slice(0, -1) + formatted.slice(-1).toUpperCase()
              : formatted;
          }
          // McDonald / MacIntyre
          if (/^mc[a-z]/.test(part)) {
            const formatted =
              'Mc' + part.charAt(2).toUpperCase() + part.slice(3);
            return capitalizeLastLetter
              ? formatted.slice(0, -1) + formatted.slice(-1).toUpperCase()
              : formatted;
          }
          if (/^mac[a-z]/.test(part)) {
            const formatted =
              'Mac' + part.charAt(3).toUpperCase() + part.slice(4);
            return capitalizeLastLetter
              ? formatted.slice(0, -1) + formatted.slice(-1).toUpperCase()
              : formatted;
          }
          // Default: plain capitalization
          const formatted = part.charAt(0).toUpperCase() + part.slice(1);
          return capitalizeLastLetter
            ? formatted.slice(0, -1) + formatted.slice(-1).toUpperCase()
            : formatted;
        })
        .join('-'); // Re-join hyphenated pieces
    })
    .join(' ');
}
