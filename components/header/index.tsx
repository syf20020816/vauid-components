import { useState, type HTMLAttributes, type ReactNode } from "react";
import logoIcon from "../../public/favicon.svg";
import "./index.scss";
import { During } from "../status/during";
import { useCls } from "../std/hooks/cls";
import { Button } from "../button";
import { Link } from "lucide-react";
import { ParticipantNum } from "../participant/num";

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
  const copyInvite = () => {
    navigator.clipboard.writeText(window.location.href);
  };

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
           <ParticipantNum count={0} />
          <During roomStartTime={roomStartTime} />
          <Button onClick={copyInvite} icon={<Link height={16} width={16} />}>
            Copy Invite
          </Button>
        </div>
      )}
    </div>
  );
};
