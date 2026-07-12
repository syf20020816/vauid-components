import { Tooltip } from "./tooltip";
import { Icon } from "../svg";

export interface FocusProps {
  focused?: boolean;
  onClick?: () => void;
}

export const Focus = ({ focused, onClick }: FocusProps) => {
  return (
    <Tooltip content={focused ? "取消聚焦" : "聚焦视图"}>
      <button className="vauid-status-button" onClick={onClick}>
        <Icon.Focus width={18} height={18} />
      </button>
    </Tooltip>
  );
};
