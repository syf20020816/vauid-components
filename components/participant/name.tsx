import { type CSSProperties, type HTMLAttributes } from "react";
import { Icon } from "../svg";
import { mergeClassNames } from "../std/util";
import "./index.scss";
import type { Device } from "../std/media";

export interface ParticipantNameProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  audioEnabled?: boolean;
  videoEnabled?: boolean;
  screenShare?: boolean;
  device?: Device;
}

const iconSize: CSSProperties = {
  width: 16,
  height: 16,
};

/**
 * ## ParticipantName
 * - 显示参与者的姓名和状态图标
 * - 根据参与者的设备类型显示不同的图标
 * - 如果没有指定设备类型，默认根据音频和视频状态显示图标
 * ### 显示说明
 * [a: on/off, v: on/off, s: on/off]
 * - a: 音频状态图标
 * - v: 视频状态图标
 * - s: 屏幕分享状态图标
 * ### 显示规则
 * #### device传入
 * 如果传入了设备类型，根据设备类型显示图标
 * #### 未传入设备类型
 * 如果没有传入设备类型，默认根据音频和视频状态显示图标
 * - `[a: off, v: off, s: off] -> micOff`
 * - `[a: off, v: on, s: off] -> camera`
 * - `[a: on, v: off, s: off] -> microphone`
 * - `[a: on, v: on, s: off] -> camera`
 * - `[a: off, v: off, s: on] -> screenShare`
 * - `[a: on, v: on, s: on] -> screenShare`
 * - `[a: off, v: off, s: on] -> screenShare`
 * - `[a: on, v: off, s: on] -> screenShare`
 * */
export const ParticipantName = ({
  name,
  audioEnabled,
  videoEnabled,
  screenShare,
  device,
  className,
  ...props
}: ParticipantNameProps) => {
  let icon: React.ReactNode;
  let active: boolean;

  if (device === "microphone") {
    active = !!audioEnabled;
    icon = active ? (
      <Icon.Microphone style={iconSize} />
    ) : (
      <Icon.MicOff style={iconSize} />
    );
  } else if (device === "camera") {
    active = !!videoEnabled;
    icon = active ? (
      <Icon.Camera style={iconSize} />
    ) : (
      <Icon.CameraOff style={iconSize} />
    );
  } else if (device === "screenShare") {
    active = !!screenShare;
    icon = <Icon.ScreenShare style={iconSize} />;
  } else {
    // No device fixed — follow priority: s > v > a
    if (screenShare) {
      active = true;
      icon = <Icon.ScreenShare style={iconSize} />;
    } else if (videoEnabled) {
      active = true;
      icon = <Icon.Camera style={iconSize} />;
    } else if (audioEnabled) {
      active = true;
      icon = <Icon.Microphone style={iconSize} />;
    } else {
      active = false;
      icon = <Icon.MicOff style={iconSize} />;
    }
  }

  return (
    <div className={mergeClassNames("participant-name")(className)} {...props}>
      <span
        className={mergeClassNames("participant-name__status")(
          active
            ? "participant-name__status--active"
            : "participant-name__status--inactive",
        )}
      >
        {icon}
      </span>
      <span>{name}</span>
    </div>
  );
};
