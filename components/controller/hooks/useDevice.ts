//! 使用webrtc api 获取设备列表 ，包括麦克风和摄像头

import { useEffect, useRef, useState } from "react";

export interface UseDeviceProps {
  deviceKind: MediaDeviceKind;
}

export const useDevice = ({ deviceKind }: UseDeviceProps) => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  // 设备是否正在使用
  const [inUsed, setInUsed] = useState(false);
  // 当前打开的媒体流，closeDevice / 卸载时需要停止其 track
  const streamRef = useRef<MediaStream | null>(null);

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

  // 打开麦克风/摄像头：调用 getUserMedia 获取真实媒体流
  const start = async () => {
    // 已有打开的流先释放，避免重复占用设备
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: deviceKind === "audioinput",
        video: deviceKind === "videoinput",
      });
      streamRef.current = stream;
      setInUsed(true);
      return stream;
    } catch (err) {
      setInUsed(false);
      throw err;
    }
  };

  // 关闭麦克风/摄像头：停止当前流的所有 track
  const stop = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setInUsed(false);
  };

  // 组件卸载时释放设备，避免 track 泄漏
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  return {
    devices,
    setDevices,
    inUsed,
    start,
    stop,
  };
};
