import { type HTMLAttributes, type ReactNode } from "react";
import { Avatar } from "./avatar";
import { Role, type RoleType } from "./role";
import { Icon } from "../svg";
import { useCls } from "../std/hooks/cls";
import "./index.scss";
import { useIcon } from "./hooks/icon";

export interface ParticipantItemProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  avatarSrc?: string;
  role?: RoleType;
  extra?: ReactNode;
  audioEnabled?: boolean;
  videoEnabled?: boolean;
  avatarSize?: number;
}

export const ParticipantItem = ({
  name,
  avatarSrc,
  role,
  extra,
  audioEnabled,
  videoEnabled,
  avatarSize = 36,
  className,
  ...props
}: ParticipantItemProps) => {
  const { onClassName, offClassName, iconSize } = useIcon();
  const { cls, vcls } = useCls("participant-item", className);
  return (
    <div className={cls} {...props}>
      <div className={vcls("left", true)}>
        <Avatar name={name} size={avatarSize} src={avatarSrc} />
      </div>

      <div className={vcls("center", true)}>
        <div className={vcls("name-row", true)}>
          <span className={vcls("name", true)}>
            {name}
          </span>
          {role && <Role role={role} />}
        </div>
        {extra && (
          <span className={vcls("extra", true)}>
            {extra}
          </span>
        )}
      </div>

      <div className={vcls("right", true)}>
        {audioEnabled ? (
          <Icon.Microphone style={iconSize} className={onClassName} />
        ) : (
          <Icon.MicOff style={iconSize} className={offClassName} />
        )}
        {videoEnabled ? (
          <Icon.Camera style={iconSize} className={onClassName} />
        ) : (
          <Icon.CameraOff style={iconSize} className={offClassName} />
        )}
      </div>
    </div>
  );
};
