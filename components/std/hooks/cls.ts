import { mergeClassNames } from "../util";

export const useCls = (preview: string | string[], className?: string) => {
  const cls = mergeClassNames(preview)(className);
  const clsPreview = typeof preview === "string" ? preview : preview[0];
  const vcls = (suffix: string) => mergeClassNames(`${clsPreview}-${suffix}`)();

  return {
    cls,
    vcls,
  };
};
