import type { CSSProperties } from "react";
import { mergeClassNames } from "../../std/util";

export const useIcon = () => {
  const onClassName = mergeClassNames("participant-name__status--active")();
  const offClassName = mergeClassNames("participant-name__status--inactive")();
  const iconSize: CSSProperties = {
    width: 16,
    height: 16,
  };
  return {
    onClassName,
    offClassName,
    iconSize,
  };
};
