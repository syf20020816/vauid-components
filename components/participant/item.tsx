import { type HTMLAttributes, type ReactNode } from "react";
import { Avatar } from "./avatar";
import { Role, type RoleType } from "./role";
import { Icon } from "../svg";
import { mergeClassNames } from "../std/util";
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
  return (
    <div className={mergeClassNames("participant-item")(className)} {...props}>
      <div className={mergeClassNames("participant-item__left")()}>
        <Avatar name={name} size={avatarSize} src={avatarSrc} />
      </div>

      <div className={mergeClassNames("participant-item__center")()}>
        <div className={mergeClassNames("participant-item__name-row")()}>
          <span className={mergeClassNames("participant-item__name")()}>
            {name}
          </span>
          {role && <Role role={role} />}
        </div>
        {extra && (
          <span className={mergeClassNames("participant-item__extra")()}>
            {extra}
          </span>
        )}
      </div>

      <div className={mergeClassNames("participant-item__right")()}>
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
