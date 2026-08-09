import type { CSSProperties } from "react";
import { useCls } from "../../std/hooks/cls";

export const useIcon = () => {
  const { vcls } = useCls("participant-name");
  const onClassName = vcls("status--active", true);
  const offClassName = vcls("status--inactive", true);
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
