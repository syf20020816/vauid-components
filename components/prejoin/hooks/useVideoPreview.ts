import { useCallback, useRef, useState } from "react";
import type { Nullable } from "vauid-components/std";

/**
 * 视频本地预览Hook
 * 用于在组件中实现视频本地预览功能
 * @returns：
 * - videoRef：视频元素引用
 * - play：播放视频
 * - pause：暂停视频
 * - clear：清除视频流
 * - loading：视频加载状态
 * - setLoading：设置视频加载状态
 * - streaming：是否正在播放视频流（无流时为 false，用于占位符等渲染判断）
 */
export const useVideoPreview = () => {
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  /**
   * 暂停视频
   */
  const pause = useCallback(() => {
    setStreaming(false);
    const el = videoRef.current;
    if (!el) {
      return;
    }
    el.pause();
    el.srcObject = null;
  }, []);
  /**
   * 播放视频
   * @param src 视频流（每次设备开关都会产生新流，以传入的为准）
   */
  const play = useCallback(async (src?: Nullable<MediaStream>) => {
    const el = videoRef.current;
    if (!el || !src) {
      throw new Error(
        `Vauid::useVideoPreview: videoRef or stream is null\nElement: ${el}\nStream: ${src}`,
      );
    }
    setLoading(true);
    setStreaming(true);
    el.srcObject = src;
    try {
      await el.play();
    } catch (e) {
      console.error(
        `Vauid::useVideoPreview: cannot play video, see: useVideoPreview play() function\n${e}`,
      );
    }
    setLoading(false);
  }, []);
  /**
   * 清除视频流（停止当前挂在 video 上的流的全部轨道）
   */
  const clear = useCallback(() => {
    // 必须先于 pause 取流：pause 会清空 srcObject
    const el = videoRef.current;
    if (el?.srcObject instanceof MediaStream) {
      el.srcObject.getTracks().forEach((track) => track.stop());
    }
    pause();
  }, [pause]);

  return {
    videoRef,
    loading,
    streaming,
    showPlaceholder: !streaming,
    play,
    pause,
    clear,
    setLoading,
  };
};
