import type { HTMLAttributes, ReactNode } from "react";
import { useCls } from "../../std/hooks/cls";
import { TileFloat } from "./float";

export interface TileWrapProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  float?: {
    leftTop?: ReactNode;
    leftBottom?: ReactNode;
    rightTop?: ReactNode;
    rightBottom?: ReactNode;
  };
}
/**
 * ## TileWrap
 * 统一Tile的包裹组件，设计分为3层：
 * 1. children：最底层表示Tile真正的内容，例如Video，Audio
 * 2. 特效层：用于显示一些交互效果，例如鼠标映射，点击效果，举手效果，屏幕分享时的类似白板的效果
 * 3. 悬浮层：用于显示悬浮元素，例如用户名称，用户状态，布局切换按钮等
 */
export const TileWrap = ({
  children,
  className,
  onClick,
  float,
  ...props
}: TileWrapProps) => {
  const { cls } = useCls("tile-wrap", className);
  return (
    <div className={cls} onClick={onClick} {...props}>
      {float?.leftTop ?? <TileFloat position="leftTop" />}
      {float?.leftBottom ?? <TileFloat position="leftBottom" />}
      {float?.rightTop ?? <TileFloat position="rightTop" />}
      {float?.rightBottom ?? <TileFloat position="rightBottom" />}
      {children}
    </div>
  );
};
