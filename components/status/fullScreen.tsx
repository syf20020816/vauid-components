import { Tooltip } from "./tooltip";
import { Icon } from "../svg";
import { Button } from "../button/index";
import type { FnReturn } from "../std";

export interface FullScreenProps {
  fullScreen?: boolean;
  onClick?: () => FnReturn<void>;
}

export const FullScreen = ({ fullScreen, onClick }: FullScreenProps) => {
  return (
    <Tooltip content={fullScreen ? "退出全屏" : "全屏"}>
      <Button
        size="small"
        className="vauid-status-button"
        onClick={onClick}
        icon={
          fullScreen ? (
            <Icon.FullScreenExit width={14} height={14} />
          ) : (
            <Icon.FullScreen width={14} height={14} />
          )
        }
      ></Button>
    </Tooltip>
  );
};
