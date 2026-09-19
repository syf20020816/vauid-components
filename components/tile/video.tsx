import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type VideoHTMLAttributes,
  useEffect,
} from "react";

import "./index.scss";
import { useCls } from "../std/hooks/cls";
import type { FnReturn } from "vauid-components/std";

export interface VideoTileProps extends VideoHTMLAttributes<HTMLVideoElement> {
  screenShare?: boolean;
  /** 元素挂载后触发，用于将媒体源挂载到该元素（如厂商 track.attach(el)） */
  bind?: (el: HTMLVideoElement) => FnReturn<void>;
  /** 元素卸载前触发，入参为 bind 时传入的同一元素（如 track.detach(el)） */
  unbind?: (el: HTMLVideoElement) => FnReturn<void>;
}

export const VideoTile = forwardRef<HTMLVideoElement, VideoTileProps>(
  ({ screenShare, className, bind, unbind, ...props }, ref) => {
    const { cls } = useCls(
      ["video-tile", screenShare && "screen-share"],
      className,
    );
    const videoRef = useRef<HTMLVideoElement>(null);

    useImperativeHandle(ref, () => videoRef.current!);

    useEffect(() => {
      // setup 时捕获元素；unmount 时 ref.current 已被 React 置 null，
      // cleanup 必须复用此闭包变量才能拿到元素
      const el = videoRef.current;
      if (!el) return;
      bind?.(el);
      return () => {
        if (unbind) void unbind(el);
      };
    }, [bind, unbind]);

    return (
      <video
        className={cls}
        ref={videoRef}
        autoPlay
        playsInline
        muted
        {...props}
      />
    );
  },
);

VideoTile.displayName = "VideoTile";
