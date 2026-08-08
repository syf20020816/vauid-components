import type { HTMLAttributes, ReactNode } from "react";
import { useCls } from "../../std/hooks/cls";
import { RaiseHand, type RaiseHandProps } from "../../status/raise";
import { Focus, type FocusProps } from "../../status/focus";
import { FullScreen, type FullScreenProps } from "../../status/fullScreen";
import { NetworkStatus, type NetworkStatusProps } from "../../status/network";
import {
  ParticipantName,
  type ParticipantNameProps,
} from "../../participant/name";
import type { LayoutNode } from "../../layout/types";

type FloatPosition = "leftTop" | "leftBottom" | "rightTop" | "rightBottom";

/**
 * ## TileFloat
 * 悬浮层组件，用于显示悬浮元素，例如用户名称，用户状态，布局切换按钮等
 * - 分为上下左右四个方向 leftTop, leftBottom, rightTop, rightBottom
 * - 提供默认组件效果，可通过 `children` 自定义内容，通过 `props` 传递默认组件的 props
 * ### 默认效果
 * - 左上角：显示举手图标
 * - 左下角：显示用户名称（取自 node.entity.label）
 * - 右上角：显示布局切换按钮（聚焦 / 全屏），聚焦按钮状态取自 node.isFocus
 * - 右下角：显示用户状态（网络信号）
 */
export interface TileFloatProps extends HTMLAttributes<HTMLDivElement> {
  /** 布局节点信息，用于驱动默认组件的展示（名称、聚焦状态等） */
  node?: LayoutNode;
  /** 悬浮位置 */
  position: FloatPosition;
  /** 是否显示（leftTop / leftBottom / rightBottom 使用），默认 true */
  show?: boolean;
  /** 自定义内容，优先于默认组件 */
  children?: ReactNode;
  /** 默认组件的 props（leftTop / leftBottom / rightBottom 使用） */
  props?: RaiseHandProps | ParticipantNameProps | NetworkStatusProps;
  /** rightTop 专用：focus 按钮配置，show 省略时默认显示 */
  focus?: { show?: boolean; children?: ReactNode; props?: FocusProps };
  /** rightTop 专用：fullScreen 按钮配置，show 省略时默认显示 */
  fullScreen?: { show?: boolean; children?: ReactNode; props?: FullScreenProps };
}

export const TileFloat = ({
  node,
  position,
  show = true,
  children,
  props,
  focus,
  fullScreen,
  className,
  ...rest
}: TileFloatProps) => {
  const { cls } = useCls(["tile-float", `tile-float--${position}`], className);

  // rightTop：渲染 focus + fullScreen 两个子组件
  // show 未传（undefined）时默认为 true（显示）
  if (position === "rightTop") {
    const focusShow = focus?.show ?? true;
    const fullScreenShow = fullScreen?.show ?? true;
    if (!focusShow && !fullScreenShow) return null;

    return (
      <div className={cls} {...rest}>
        {focusShow &&
          (focus?.children ?? <Focus focused={node?.isFocus} {...focus?.props} />)}
        {fullScreenShow &&
          (fullScreen?.children ?? <FullScreen {...fullScreen?.props} />)}
      </div>
    );
  }

  // 其他位置：单组件
  if (!show) return null;

  let content: ReactNode;
  if (children) {
    content = children;
  } else {
    switch (position) {
      case "leftTop":
        content = <RaiseHand {...(props as RaiseHandProps)} />;
        break;
      case "leftBottom": {
        const nameProps = props as ParticipantNameProps | undefined;
        content = (
          <ParticipantName
            {...nameProps}
            name={nameProps?.name ?? node?.entity.label ?? "用户名"}
          />
        );
        break;
      }
      case "rightBottom":
        content = <NetworkStatus {...(props as NetworkStatusProps)} />;
        break;
    }
  }

  return (
    <div className={cls} {...rest}>
      {content}
    </div>
  );
};
