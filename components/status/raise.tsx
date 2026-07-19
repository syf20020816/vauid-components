import type { CSSProperties } from "react";
import { Tooltip } from "./tooltip";
import { Icon } from "../svg";
import { Button } from "../button/index";
import { DEFAULT_COLORS } from "../style/global";
import type { FnReturn } from "../std";

export interface RaiseHandProps {
  raised?: boolean;
  onClick?: () => FnReturn<void>;
}

export const RaiseHand = ({ raised, onClick }: RaiseHandProps) => {
  const iconStyle: CSSProperties = {
    width: 14,
    height: 14,
    color: raised ? DEFAULT_COLORS.warning.main : undefined,
    transition: "color 0.15s ease",
  };

  return (
    <Tooltip content={raised ? "放下手" : "举手"}>
      <Button
        size="small"
        className="vauid-status-button"
        onClick={onClick}
        icon={<Icon.Hand style={iconStyle} />}
      ></Button>
    </Tooltip>
  );
};
