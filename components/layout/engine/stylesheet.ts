import type { LayoutEntity, LayoutNode, LayoutStyleProperties, StyleOptions } from "../types";

const LAYOUT_GAP = 8;

/**
 * ## 实体样式表
 * 用于设置实体的样式信息，包括位置、尺寸、层级等
 */
export class EntityStyleSheet<Entity extends LayoutEntity = LayoutEntity> {
  build(node: LayoutNode<Entity>, options?: StyleOptions): LayoutStyleProperties {
    const { width, height, x, y, zIndex, hidden } = node;
    const {
      enableFlip = true,
      transitionDuration = 200,
      transitionEasing = "cubic-bezier(0.2, 0.8, 0.2, 1)",
      animationOpen = true,
      animation,
    } = options ?? {};

    // 是否可见当前页面
    const isVisible = !hidden;
    const hiddenOffsetX = Math.max(width + LAYOUT_GAP * 2, 64);
    const hiddenOffsetY = Math.max(height + LAYOUT_GAP * 2, 64);
    const translateX = x ?? hiddenOffsetX;
    const translateY = y ?? hiddenOffsetY;
    const scale = Number(isVisible);

    // 构建 transition 字符串
    let transition: string;
    if (!animationOpen) {
      transition = "none";
    } else if (animation) {
      // 用户自定义动画
      transition = animation;
    } else if (enableFlip) {
      // 翻转模式：只过渡 opacity
      transition = `opacity ${transitionDuration}ms ${transitionEasing}`;
    } else {
      // 正常模式：过渡所有属性
      transition = [
        `transform ${transitionDuration}ms ${transitionEasing}`,
        `width ${transitionDuration}ms ${transitionEasing}`,
        `height ${transitionDuration}ms ${transitionEasing}`,
        `opacity ${transitionDuration}ms ${transitionEasing}`,
      ].join(", ");
    }

    return {
      position: "absolute",
      top: 0,
      left: 0,
      width: width ?? Math.max(width * 0.18, 80),
      height: height ?? Math.max(height * 0.18, 60),
      transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`,
      transformOrigin: "top left",
      opacity: Number(isVisible),
      zIndex: zIndex ?? 0,
      pointerEvents: isVisible ? "auto" : "none",
      transition,
      willChange: "transform, width, height, opacity",
    };
  }
}
