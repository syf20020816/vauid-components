import { useState, type HTMLAttributes, type ReactNode } from "react";
import logoIcon from "../../public/favicon.svg";
import "./index.scss";
import { During } from "../status/during";
import { useCls } from "../std/hooks/cls";
import { Thumbnail } from "../layout/thumbnail";

export interface RoomHeaderProps extends HTMLAttributes<HTMLDivElement> {
  logo?: ReactNode;
  roomName?: string;
  status?: ReactNode;
  description?: ReactNode;
  extra?: ReactNode;
}

export const RoomHeader = ({
  logo,
  roomName,
  status,
  description,
  extra,
  className,
  ...props
}: RoomHeaderProps) => {
  const { cls, vcls } = useCls("room-header", className);
  const roomDesc = `vauid - meeting`;
  const [roomStartTime] = useState(() => Date.now());
  

  return (
    <div {...props} className={cls}>
      <div className={vcls("content")}>
        {logo ? logo : <img className="logo-icon" src={logoIcon} alt="Vauid" />}
        <div className={vcls("room-info")}>
          <div className={vcls("room-info-name")}>
            <span className={vcls("room-name")}>{roomName} </span>
            <span>{status}</span>
          </div>
          {description ? (
            description
          ) : (
            <p className={vcls("room-desc")}>{roomDesc}</p>
          )}
        </div>
      </div>

      {extra ? (
        extra
      ) : (
        <div className={vcls("extra")}>
          <During roomStartTime={roomStartTime} />
          <Thumbnail />
        </div>
      )}
    </div>
  );
};
