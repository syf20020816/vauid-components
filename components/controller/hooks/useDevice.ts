//! 使用webrtc api 获取设备列表 ，包括麦克风和摄像头

import { useEffect, useState } from "react";

export interface UseDeviceProps {
  deviceKind: MediaDeviceKind;
}

export const useDevice = ({ deviceKind }: UseDeviceProps) => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  const fetchDevices = async () => {
    try {
      // 先请求权限，确保能获取到设备 label
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: deviceKind === "audioinput",
        video: deviceKind === "videoinput",
      });
      // 获取后立即停止 track，避免占用设备
      stream.getTracks().forEach((track) => track.stop());

      const allDevices = await navigator.mediaDevices.enumerateDevices();
      setDevices(allDevices.filter((device) => device.kind === deviceKind));
    } catch {
      // 权限被拒绝时，仍然尝试获取设备列表（可能没有 label）
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      setDevices(allDevices.filter((device) => device.kind === deviceKind));
    }
  };

  useEffect(() => {
    // Synchronize external system (browser device list) with React state
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDevices();

    // 监听设备插拔事件
    const handleDeviceChange = () => {
      fetchDevices();
    };

    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener(
        "devicechange",
        handleDeviceChange,
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceKind]);

  return {
    devices,
    setDevices,
  };
};
