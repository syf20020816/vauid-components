export const mergeClassNames = (bases: (string | false | null | undefined)[] | string) => {
  const nextClassName = (other?: string) => {
    const basesStr = Array.isArray(bases)
      ? bases.filter(Boolean).map((i) => `vauid-${i}`).join(" ")
      : `vauid-${bases}`;
    return `${basesStr}${other ? ` ${other}` : ""}`;
  };

  return nextClassName;
};
