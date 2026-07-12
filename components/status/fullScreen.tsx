import { Tooltip } from "./tooltip";
import { Icon } from "../svg";

export interface FullScreenProps {
  fullScreen?: boolean;
  onClick?: () => void;
}

export const FullScreen = ({ fullScreen, onClick }: FullScreenProps) => {
  return (
    <Tooltip content={fullScreen ? "退出全屏" : "全屏"}>
      <button className="vauid-status-button" onClick={onClick}>
        {fullScreen ? (
          <Icon.FullScreenExit width={18} height={18} />
        ) : (
          <Icon.FullScreen width={18} height={18} />
        )}
      </button>
    </Tooltip>
  );
};
