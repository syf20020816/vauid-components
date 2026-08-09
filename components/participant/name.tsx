import type { HTMLAttributes } from "react";
import { Icon } from "../svg";
import { useCls } from "../std/hooks/cls";
import "./index.scss";
import type { Device } from "../std/media";
import { useIcon } from "./hooks/icon";

export interface ParticipantNameProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  audioEnabled?: boolean;
  videoEnabled?: boolean;
  screenShare?: boolean;
  device?: Device;
}

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
  const { onClassName, offClassName, iconSize } = useIcon();
  const { cls, vcls } = useCls("participant-name", className);

  if (device === "microphone") {
    icon = audioEnabled ? (
      <Icon.Microphone style={iconSize} className={onClassName} />
    ) : (
      <Icon.MicOff style={iconSize} className={offClassName} />
    );
  } else if (device === "camera") {
    icon = videoEnabled ? (
      <Icon.Camera style={iconSize} className={onClassName} />
    ) : (
      <Icon.CameraOff style={iconSize} className={offClassName} />
    );
  } else if (device === "screenShare") {
    icon = <Icon.ScreenShare style={iconSize} className={onClassName} />;
  } else {
    // No device fixed — follow priority: s > v > a
    if (screenShare) {
      icon = <Icon.ScreenShare style={iconSize} className={onClassName} />;
    } else if (videoEnabled) {
      icon = <Icon.Camera style={iconSize} className={onClassName} />;
    } else if (audioEnabled) {
      icon = <Icon.Microphone style={iconSize} className={onClassName} />;
    } else {
      icon = <Icon.MicOff style={iconSize} className={offClassName} />;
    }
  }

  return (
    <div className={cls} {...props}>
      <span className={vcls("status", true)}>
        {icon}
      </span>
      <span>{name}</span>
    </div>
  );
};
