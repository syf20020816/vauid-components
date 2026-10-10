import type { ReactNode } from "react";
import { useCls } from "../std/hooks/cls";

// ── 统计数据类型（使用方从 RTCStats / performance API 取值传入） ──

/** 负载统计 */
export interface LoadStats {
  /** CPU 核数 */
  cpuCores?: number;
  /** 设备内存（GB） */
  memoryTotal?: number;
  /** 本应用 CPU 占用（%） */
  appCpu?: number;
  /** 本应用内存占用（MB） */
  appMemory?: number;
}

/** 网络统计 */
export interface NetworkStats {
  /** 带宽（kbps） */
  bandwidth?: number;
  /** 丢包率（%） */
  lossRate?: number;
  /** 抖动（ms） */
  jitter?: number;
  /** 延迟（ms） */
  rtt?: number;
  /** 网络类型（如 wifi / cellular） */
  networkType?: string;
}

/** 音频统计 */
export interface AudioStats {
  /** 码率（kbps） */
  bitrate?: number;
  /** 输入音量（0-100） */
  inputVolume?: number;
  /** 输出音量（0-100） */
  outputVolume?: number;
}

/** 视频统计 */
export interface VideoStats {
  /** 分辨率（如 1280×720） */
  resolution?: string;
  /** 帧率（fps） */
  frameRate?: number;
  /** 码率（kbps） */
  bitrate?: number;
}

// ── StatCard ──────────────────────────────────────────────────

export interface StatCardProps {
  /** 卡片标题 */
  title: ReactNode;
  /** 标题前图标 */
  icon?: ReactNode;
  /** 统计项，value 为 undefined 时显示 "-" */
  items: { label: ReactNode; value?: ReactNode }[];
  className?: string;
  style?: React.CSSProperties;
}

/** 统计卡片：标题 + 多行 label/value，settings 系统分区使用 */
export const StatCard = ({ title, icon, items, className, style }: StatCardProps) => {
  const { cls, vcls } = useCls("stat-card", className);
  return (
    <div className={cls} style={style}>
      <div className={vcls("title")}>
        {icon}
        {title}
      </div>
      <div className={vcls("body")}>
        {items.map((item) => (
          <div key={String(item.label)} className={vcls("item")}>
            <span className={vcls("item-label")}>{item.label}</span>
            <span className={vcls("item-value")}>
              {item.value ?? "-"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── 四类预设卡片（单位在卡片内格式化，stats 缺项显示 "-"） ──

/** 预设卡片对外 props：title / items 由卡片内置，仅需传 stats 等样式项 */
export type PresetCardProps = Omit<StatCardProps, "title" | "items">;

/** 负载卡片：CPU 核数 / 设备内存 / 应用 CPU / 应用内存 */
export const LoadCard = ({ stats, ...props }: PresetCardProps & { stats?: LoadStats }) => (
  <StatCard
    {...props}
    title="负载"
    items={[
      { label: "CPU 核数", value: stats?.cpuCores },
      { label: "设备内存", value: stats?.memoryTotal != null ? `${stats.memoryTotal} GB` : undefined },
      { label: "应用 CPU", value: stats?.appCpu != null ? `${stats.appCpu}%` : undefined },
      { label: "应用内存", value: stats?.appMemory != null ? `${stats.appMemory} MB` : undefined },
    ]}
  />
);

/** 网络卡片：带宽 / 丢包率 / 抖动 / 延迟 / 网络类型 */
export const NetworkCard = ({ stats, ...props }: PresetCardProps & { stats?: NetworkStats }) => (
  <StatCard
    {...props}
    title="网络状态"
    items={[
      { label: "带宽", value: stats?.bandwidth != null ? `${stats.bandwidth} kbps` : undefined },
      { label: "丢包率", value: stats?.lossRate != null ? `${stats.lossRate}%` : undefined },
      { label: "抖动", value: stats?.jitter != null ? `${stats.jitter} ms` : undefined },
      { label: "延迟", value: stats?.rtt != null ? `${stats.rtt} ms` : undefined },
      { label: "网络类型", value: stats?.networkType },
    ]}
  />
);

/** 音频卡片：码率 / 输入音量 / 输出音量 */
export const AudioStatsCard = ({ stats, ...props }: PresetCardProps & { stats?: AudioStats }) => (
  <StatCard
    {...props}
    title="音频"
    items={[
      { label: "码率", value: stats?.bitrate != null ? `${stats.bitrate} kbps` : undefined },
      { label: "输入音量", value: stats?.inputVolume },
      { label: "输出音量", value: stats?.outputVolume },
    ]}
  />
);

/** 视频卡片：分辨率 / 帧率 / 码率 */
export const VideoStatsCard = ({ stats, ...props }: PresetCardProps & { stats?: VideoStats }) => (
  <StatCard
    {...props}
    title="视频"
    items={[
      { label: "分辨率", value: stats?.resolution },
      { label: "帧率", value: stats?.frameRate != null ? `${stats.frameRate} fps` : undefined },
      { label: "码率", value: stats?.bitrate != null ? `${stats.bitrate} kbps` : undefined },
    ]}
  />
);
