import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { DeviceTrigger } from "./device";
import { LeaveButton, type LeaveButtonAttr } from "./leave";
import { useCls } from "../std/hooks/cls";
import "./index.scss";
import type { Option } from "../trigger/types";
import type { TriggerProps } from "../trigger";
import type { UseScreenShareProps } from "./hooks/useScreenShare";
import { ParticipantNum } from "../participant/num";

export interface ControllerProps
  extends LeaveButtonAttr, HTMLAttributes<HTMLElement> {
  other?: ReactNode;
  position?: "start" | "end" | "center";
  showMore?: boolean;
  moreOptions?: Option[];
  audio?: {
    show?: boolean;
    props?: TriggerProps;
    children?: ReactNode;
  };
  video?: {
    show?: boolean;
    props?: TriggerProps;
    children?: ReactNode;
  };
  screenShare?: {
    show?: boolean;
    props?: UseScreenShareProps;
    children?: ReactNode;
  };
}

export interface ControllerComponent extends React.ForwardRefExoticComponent<
  ControllerProps & React.RefAttributes<HTMLElement>
> {
  Leave: typeof LeaveButton;
  Device: typeof DeviceTrigger;
}

/**
 * # Controller - 控制器组件
 * 用于控制房间的一些操作，默认包含：
 * 1. 麦克风选择
 * 2. 摄像头选择
 * 3. 屏幕共享
 * 4. 更多
 * 5. 退出房间按钮
 * @param param0
 * @returns
 */
export const Controller = forwardRef<HTMLElement, ControllerProps>(
  (
    {
      onLeave,
      onBeforeLeave,
      onAfterLeave,
      other,
      position,
      showMore = true,
      moreOptions = [],
      audio,
      video,
      screenShare,
      ...props
    }: ControllerProps,
    ref,
  ) => {
    const { cls } = useCls("controller", props.className);
    const { cls: devicesCls } = useCls("devices");
    const showAudio = audio?.show ?? true;
    const showVideo = video?.show ?? true;
    const showScreenShare = screenShare?.show ?? true;

    return (
      <footer className={cls} ref={ref} {...props}>
        <ParticipantNum count={0} />
        <div
          className={devicesCls}
          style={{
            justifyContent: position,
          }}
        >
          {showAudio &&
            (audio?.children ?? <DeviceTrigger.Audio {...audio?.props} />)}
          {showVideo &&
            (video?.children ?? <DeviceTrigger.Video {...video?.props} />)}
          {showScreenShare &&
            (screenShare?.children ?? (
              <DeviceTrigger.ScreenShare {...screenShare?.props} />
            ))}
          {showMore && moreOptions.length > 0 && (
            <DeviceTrigger.More options={moreOptions} />
          )}
          {other}
        </div>
        <LeaveButton
          onClick={onLeave}
          onBeforeLeave={onBeforeLeave}
          onAfterLeave={onAfterLeave}
        />
        {other}
      </footer>
    );
  },
) as ControllerComponent;

Controller.Leave = LeaveButton;
Controller.Device = DeviceTrigger;
