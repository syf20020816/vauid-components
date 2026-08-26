import { type HTMLAttributes, type RefObject } from "react";
import { useCls } from "vauid-components/std/hooks/cls";

export interface VideoPreviewProps extends HTMLAttributes<HTMLVideoElement> {
  ref: RefObject<HTMLVideoElement>;
}

/**
 * 视频预览组件，在加入房间前展示本地视频预览
 * 事实上，这个组件仅仅做了样式处理，没有任何其他功能，如果你希望简单的开关本地视频并自定义，你应该使用hooks中的`useVideoPreview`
 */
export const VideoPreview = ({ ref, className }: VideoPreviewProps) => {
  const { cls } = useCls("preview-video", className);

  return <video className={cls} ref={ref}></video>;
};
