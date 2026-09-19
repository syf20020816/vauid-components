import { type RefObject, useRef, useState } from "react";

export interface UseScreenShareProps {
  /** 共享画面挂载的 video 元素 ref（React 19 下 ref 初始值可为 null） */
  element?: RefObject<HTMLVideoElement | null>;
  option?: DisplayMediaStreamOptions;
}

export const useScreenShare = ({ element, option }: UseScreenShareProps) => {
  const [sharing, setSharing] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const mediaOption = option ?? {
    video: true,
    audio: true,
  };

  // 清空视频元素画面，避免共享结束后残留最后一帧
  // （与 share() 一致用 Object.assign：React Compiler 会把 el.srcObject = x 误判为修改 hook 参数）
  const clearVideo = () => {
    const el = element?.current;
    if (el) {
      Object.assign(el, { srcObject: null });
    }
  };

  const share = async () => {
    const stream = await navigator.mediaDevices.getDisplayMedia(mediaOption);

    if (stream) {
      stream.getTracks().forEach((track) => {
        track.enabled = true;
        // 仅浏览器原生「停止共享」等外部结束会触发 ended；
        // 程序调用 track.stop() 按规范不触发，由 stop() 自行清理
        track.addEventListener("ended", () => {
          streamRef.current = null;
          clearVideo();
          setSharing(false);
        });
      });
      const videoEl = element?.current;
      if (videoEl) {
        Object.assign(videoEl, { srcObject: stream });
      }
      setSharing(true);
      streamRef.current = stream;
    }
  };

  const stop = () => {
    if (streamRef.current) {
      // 必须 track.stop() 真正结束 capture 会话，浏览器的原生共享条才会消失；
      // 仅 enabled = false 只是禁用 track，采集仍在进行
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setSharing(false);
    }
    clearVideo();
  };

  return {
    share,
    sharing,
    stop,
  };
};
