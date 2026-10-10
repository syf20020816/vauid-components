import { useEffect, useState } from "react";
import { LoadCard, NetworkCard, AudioStatsCard, VideoStatsCard } from "./cards";
import type { LoadStats, AudioStats, NetworkStats, VideoStats } from "./cards";

/** 浏览器不暴露进程级 CPU 占用，仅在支持的内核（Chromium）读取堆内存 */
const sampleLoad = (): LoadStats => {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const perf = performance as Performance & {
    memory?: { usedJSHeapSize: number };
  };
  return {
    cpuCores: nav.hardwareConcurrency,
    memoryTotal: nav.deviceMemory,
    appCpu: undefined,
    appMemory: perf.memory
      ? Math.round(perf.memory.usedJSHeapSize / 1024 / 1024)
      : undefined,
  };
};

/** 负载统计采样：2s 间隔轮询 performance API（内部兜底，外部可传 load 覆盖） */
const useLoadStats = (intervalMs = 2000) => {
  const [stats, setStats] = useState<LoadStats>(sampleLoad);
  useEffect(() => {
    const timer = window.setInterval(() => setStats(sampleLoad()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);
  return stats;
};

export interface SystemSettingsProps {
  /** 负载统计（不传则内部用 performance API 采样兜底） */
  load?: LoadStats;
  /** 网络统计（RTCStats 驱动） */
  network?: NetworkStats;
  /** 音频统计（RTCStats 驱动） */
  audio?: AudioStats;
  /** 视频统计（RTCStats 驱动） */
  video?: VideoStats;
}

/** 系统分区：负载 / 网络 / 音频 / 视频四类统计卡片 */
export const SystemSettings = ({
  load,
  network,
  audio,
  video,
}: SystemSettingsProps) => {
  const fallbackLoad = useLoadStats();

  return (
    <div className="vauid-settings-section">
      <div className="vauid-settings-card-grid">
        <LoadCard stats={load ?? fallbackLoad} />
        <NetworkCard stats={network} />
        <AudioStatsCard stats={audio} />
        <VideoStatsCard stats={video} />
      </div>
    </div>
  );
};
