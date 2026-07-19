import { Tooltip } from "./tooltip";
import { Icon } from "../svg";
import { Button } from "../button";
import { mergeClassNames } from "../std/util";
import type { FnReturn } from "../std";

export interface FocusProps {
  focused?: boolean;
  onClick?: () => FnReturn<void>;
}

export const Focus = ({ focused, onClick }: FocusProps) => {
  return (
    <Tooltip content={focused ? "取消聚焦" : "聚焦视图"}>
      <Button
        size="small"
        className={mergeClassNames("status-button")()}
        onClick={onClick}
        icon={<Icon.Focus width={14} height={14} />}
      ></Button>
    </Tooltip>
  );
};
