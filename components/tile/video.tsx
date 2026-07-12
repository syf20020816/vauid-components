import {
  forwardRef,
  type VideoHTMLAttributes,
  type RefObject,
} from "react";
import { mergeClassNames } from "../std/util";
import "./index.scss";

export interface VideoTileProps extends VideoHTMLAttributes<HTMLVideoElement> {
  label?: string;
  screenShare?: boolean;
}

export const VideoTile = forwardRef<HTMLVideoElement, VideoTileProps>(
  ({ label, screenShare, className, ...props }, ref) => {
    const classNames = mergeClassNames(
      "video-tile",
      screenShare && "video-tile--screen-share",
    )(className);

    return (
      <div className={classNames}>
        <video
          ref={ref as RefObject<HTMLVideoElement | null>}
          autoPlay
          playsInline
          muted
          {...props}
        />
        {label && (
          <div className={mergeClassNames("video-tile__label")()}>
            {label}
          </div>
        )}
      </div>
    );
  },
);

VideoTile.displayName = "VideoTile";
