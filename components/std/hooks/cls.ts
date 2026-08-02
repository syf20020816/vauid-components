import { mergeClassNames } from "../util";

export const useCls = (preview: string | string[], className?: string) => {
  const cls = mergeClassNames(preview)(className);
  const clsPreview = typeof preview === "string" ? preview : preview[0];
  const vcls = (suffix: string, isDown = false) =>
    mergeClassNames(`${clsPreview}${isDown ? "__" : "-"}${suffix}`)();

  return {
    cls,
    vcls,
  };
};
