import type { HTMLAttributes, ReactNode } from "react";
import { useCls } from "../../std/hooks/cls";
import { TileFloat } from "./float";
import type { LayoutNode } from "../../layout/types";
import type { RaiseHandProps } from "../../status/raise";
import type { ParticipantNameProps } from "../../participant/name";
import type { FocusProps } from "../../status/focus";
import type { FullScreenProps } from "../../status/fullScreen";
import type { NetworkStatusProps } from "../../status/network";

export interface TileWrapProps extends HTMLAttributes<HTMLDivElement> {
  /** 布局节点信息，驱动悬浮层默认组件的展示（名称、聚焦状态等） */
  node: LayoutNode;
  children: ReactNode;
  float?: {
    leftTop?: {
      show?: boolean;
      children?: ReactNode;
      props?: RaiseHandProps;
    };
    leftBottom?: {
      show?: boolean;
      children?: ReactNode;
      props?: ParticipantNameProps;
    };
    rightTop?: {
      focus?: {
        show?: boolean;
        children?: ReactNode;
        props?: FocusProps;
      };
      fullScreen?: {
        show?: boolean;
        children?: ReactNode;
        props?: FullScreenProps;
      };
    };
    rightBottom?: {
      show?: boolean;
      children?: ReactNode;
      props?: NetworkStatusProps;
    };
  };
}
/**
 * ## TileWrap
 * 统一Tile的包裹组件，设计分为3层：
 * 1. children：最底层表示Tile真正的内容，例如Video，Audio
 * 2. 特效层：用于显示一些交互效果，例如鼠标映射，点击效果，举手效果，屏幕分享时的类似白板的效果
 * 3. 悬浮层：用于显示悬浮元素，例如用户名称，用户状态，布局切换按钮等
 *
 * 通过 `node` 接收布局引擎输出的 LayoutNode，悬浮层的默认组件会基于它展示：
 * - 左下角用户名称取自 `node.entity.label`
 * - 右上角聚焦按钮状态取自 `node.isFocus`
 *
 * 通过 `float` 可以独立控制每个角落的显隐、自定义内容和默认组件 props：
 * ```tsx
 * <TileWrap node={node} float={{ leftTop: { show: false } }}>
 *   <VideoTile />
 * </TileWrap>
 * ```
 */
export const TileWrap = ({
  node,
  children,
  className,
  onClick,
  float,
  ...props
}: TileWrapProps) => {
  const { cls } = useCls("tile-wrap", className);
  const { leftTop, leftBottom, rightTop, rightBottom } = float ?? {};

  return (
    <div className={cls} onClick={onClick} {...props}>
      <TileFloat
        position="leftTop"
        node={node}
        show={leftTop?.show ?? true}
        children={leftTop?.children}
        props={leftTop?.props}
      />
      <TileFloat
        position="leftBottom"
        node={node}
        show={leftBottom?.show ?? true}
        children={leftBottom?.children}
        props={leftBottom?.props}
      />
      <TileFloat
        position="rightTop"
        node={node}
        focus={rightTop?.focus}
        fullScreen={rightTop?.fullScreen}
      />
      <TileFloat
        position="rightBottom"
        node={node}
        show={rightBottom?.show ?? true}
        children={rightBottom?.children}
        props={rightBottom?.props}
      />
      {children}
    </div>
  );
};
