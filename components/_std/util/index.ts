export const mergeClassNames = (bases: string[] | string) => {
  const nextClassName = (other?: string) => {
    const basesStr = Array.isArray(bases)
      ? bases.map((i) => `vauid-${i}`).join(" ")
      : `vauid-${bases}`;
    return `${basesStr}${other ? ` ${other}` : ""}`;
  };

  return nextClassName;
};
