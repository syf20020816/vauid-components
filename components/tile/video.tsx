import { forwardRef, type VideoHTMLAttributes, type RefObject } from "react";

import "./index.scss";
import { useCls } from "../std/hooks/cls";

export interface VideoTileProps extends VideoHTMLAttributes<HTMLVideoElement> {
  screenShare?: boolean;
}

export const VideoTile = forwardRef<HTMLVideoElement, VideoTileProps>(
  ({ screenShare, className, ...props }, ref) => {
    const { cls } = useCls(
      ["video-tile", screenShare && "screen-share"],
      className,
    );

    return (
      <video
        className={cls}
        ref={ref as RefObject<HTMLVideoElement | null>}
        autoPlay
        playsInline
        muted
        {...props}
      />
    );
  },
);

VideoTile.displayName = "VideoTile";
