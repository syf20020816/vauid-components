import type { HTMLAttributes, ReactNode } from "react";
import { useCls } from "../../std/hooks/cls";
import { RaiseHand } from "../../status/raise";
import { Focus } from "../../status/focus";
import { FullScreen } from "../../status/fullScreen";
import { NetworkStatus } from "../../status/network";
import { ParticipantName } from "../../participant/name";
import type { LayoutNode } from "../../layout/types";

type FloatPosition = "leftTop" | "leftBottom" | "rightTop" | "rightBottom";

/**
 * ## TileFloat
 * 悬浮层组件，用于显示悬浮元素，例如用户名称，用户状态，布局切换按钮等
 * - 分为上下左右四个方向 leftTop, leftBottom, rightTop, rightBottom
 * - 提供默认组件效果
 * ### 默认效果
 * - 左上角：显示举手图标
 * - 左下角：显示用户名称（取自 node.entity.label）
 * - 右上角：显示布局切换按钮（聚焦 / 全屏），聚焦按钮状态取自 node.isFocus
 * - 右下角：显示用户状态（网络信号）
 */
const renderDefault = (
  position: FloatPosition,
  node?: LayoutNode,
): ReactNode => {
  switch (position) {
    case "leftTop":
      return <RaiseHand />;
    case "leftBottom":
      return <ParticipantName name={node?.entity.label ?? "用户名"} />;
    case "rightTop":
      return (
        <>
          <Focus focused={node?.isFocus} />
          <FullScreen />
        </>
      );
    case "rightBottom":
      return <NetworkStatus />;
  }
};

export interface TileFloatProps extends HTMLAttributes<HTMLDivElement> {
  position: FloatPosition;
  /** 布局节点信息，用于驱动默认组件的展示（名称、聚焦状态等） */
  node?: LayoutNode;
}

export const TileFloat = ({
  position,
  node,
  children,
  className,
  ...props
}: TileFloatProps) => {
  const { cls } = useCls(["tile-float", `tile-float--${position}`], className);

  return (
    <div className={cls} {...props}>
      {children ?? renderDefault(position, node)}
    </div>
  );
};
