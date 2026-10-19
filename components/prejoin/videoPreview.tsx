import { type HTMLAttributes, type RefObject } from "react";
import { ParticipantPlaceholder } from "vauid-components/participant/placeholder";
import { useCls } from "vauid-components/std/hooks/cls";

export interface VideoPreviewProps extends HTMLAttributes<HTMLVideoElement> {
  playerRef: RefObject<HTMLVideoElement>;
  ref: RefObject<HTMLDivElement>;
  showPlaceholder?: boolean;
}

/**
 * 视频预览组件，在加入房间前展示本地视频预览
 * 事实上，这个组件仅仅做简单的包装处理，具有以下功能：
 * - 视频预览：展示本地视频流预览
 * - 占位符：无流时展示占位符（考虑到性能使用display进行切换）
 * 如果你希望简单的开关本地视频并自定义，你应该使用hooks中的`useVideoPreview`
 */
export const VideoPreview = ({
  ref,
  playerRef,
  className,
  showPlaceholder = true,
}: VideoPreviewProps) => {
  const { cls, vcls } = useCls("preview-video", className);

  return (
    <div className={cls} ref={ref}>
      <video className={vcls("player")} ref={playerRef}></video>
      {/* 占位符：无流时展示 */}
      <ParticipantPlaceholder
        className={vcls("placeholder")}
        style={{
          display: showPlaceholder ? "unset" : "none",
        }}
      />
    </div>
  );
};
