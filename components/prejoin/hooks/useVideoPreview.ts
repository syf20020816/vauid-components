import { useRef, useState } from "react";
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
 */
export const useVideoPreview = () => {
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  /**
   * 播放视频
   * @param stream 视频流（每次设备开关都会产生新流，以传入的为准）
   */
  const play = (stream?: Nullable<MediaStream>) => {
    const el = videoRef.current;
    if (!el || !stream) {
      return;
    }
    setLoading(true);
    el.srcObject = stream;
    el.play()
      .catch(() =>
        console.error(
          "Vauid: cannot play video, see: useVideoPreview play() function",
        ),
      )
      .finally(() => setLoading(false));
  };
  /**
   * 暂停视频
   */
  const pause = () => {
    const el = videoRef.current;
    if (!el) {
      return;
    }
    el.pause();
    el.srcObject = null;
  };
  /**
   * 清除视频流（停止当前挂在 video 上的流的所有轨道）
   */
  const clear = () => {
    const el = videoRef.current;
    if (el?.srcObject instanceof MediaStream) {
      el.srcObject.getTracks().forEach((track) => track.stop());
    }
    pause();
  };

  return {
    videoRef,
    loading,
    play,
    pause,
    clear,
    setLoading,
  };
};
