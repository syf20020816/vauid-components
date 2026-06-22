import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { DeviceToggle } from "./device";
import { LeaveButton, type LeaveButtonAttr } from "./leave";
import { mergeClassNames } from "../_std/util";
import "./index.scss";

export interface ControllerProps
  extends LeaveButtonAttr, HTMLAttributes<HTMLElement> {
  other?: ReactNode;
}

export interface ControllerComponent extends React.ForwardRefExoticComponent<
  ControllerProps & React.RefAttributes<HTMLElement>
> {
  Leave: typeof LeaveButton;
  Device: typeof DeviceToggle;
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
    { onLeave, onBeforeLeave, onAfterLeave, other, ...props }: ControllerProps,
    ref,
  ) => {
    const className = mergeClassNames("controller")(props.className);
    return (
      <footer className={className} ref={ref} {...props}>
        <div className={mergeClassNames("devices")()}>
          <DeviceToggle.Audio />
          <DeviceToggle.Video />
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
Controller.Device = DeviceToggle;
