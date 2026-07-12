import { type HTMLAttributes, type ReactNode } from "react";
import { Avatar } from "./avatar";
import { Icon } from "../svg";
import { mergeClassNames } from "../std/util";
import "./index.scss";

export interface ParticipantItemProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  avatarSrc?: string;
  extra?: ReactNode;
  audioEnabled?: boolean;
  videoEnabled?: boolean;
  avatarSize?: number;
}

export const ParticipantItem = ({
  name,
  avatarSrc,
  extra,
  audioEnabled,
  videoEnabled,
  avatarSize = 36,
  className,
  ...props
}: ParticipantItemProps) => {
  return (
    <div
      className={mergeClassNames("participant-item")(className)}
      {...props}
    >
      <div className={mergeClassNames("participant-item__left")()}>
        <Avatar name={name} size={avatarSize} src={avatarSrc} />
      </div>

      <div className={mergeClassNames("participant-item__center")()}>
        <span className={mergeClassNames("participant-item__name")()}>
          {name}
        </span>
        {extra && (
          <span className={mergeClassNames("participant-item__extra")()}>
            {extra}
          </span>
        )}
      </div>

      <div className={mergeClassNames("participant-item__right")()}>
        <span style={{ color: audioEnabled ? "var(--vauid-color-success)" : undefined }}>
          {audioEnabled ? <Icon.Microphone width={14} height={14} /> : <Icon.MicOff width={14} height={14} />}
        </span>
        <span style={{ color: videoEnabled ? "var(--vauid-color-success)" : undefined }}>
          {videoEnabled ? <Icon.Camera width={14} height={14} /> : <Icon.CameraOff width={14} height={14} />}
        </span>
      </div>
    </div>
  );
};
