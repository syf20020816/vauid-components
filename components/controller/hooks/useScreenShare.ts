import { type RefObject, useRef, useState } from "react";

export interface UseScreenShareProps {
  element?: RefObject<HTMLVideoElement>;
  option?: DisplayMediaStreamOptions;
}

export const useScreenShare = ({ element, option }: UseScreenShareProps) => {
  const [sharing, setSharing] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const mediaOption = option ?? {
    video: true,
    audio: true,
  };

  const share = async () => {
    const stream = await navigator.mediaDevices.getDisplayMedia(mediaOption);

    if (stream) {
      stream.getTracks().forEach((track) => (track.enabled = true));
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
      streamRef.current.getTracks().forEach((track) => (track.enabled = false));
      streamRef.current = null;
      setSharing(false);
    }
    if (element.current) {
      Object.assign(element.current, { srcObject: null });
    }
  };

  return {
    share,
    sharing,
    stop,
  };
};
