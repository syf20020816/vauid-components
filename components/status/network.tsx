import { type CSSProperties, type HTMLAttributes } from "react";
import { StatusTag } from "./tooltip";
import { Icon } from "../svg";
import { useCls } from "../std/hooks/cls";
import { useState, useEffect } from "react";
import "./index.scss";

// ─── Network Status ────────────────────────────────────────────

export interface NetworkStatusProps extends HTMLAttributes<HTMLDivElement> {
  /** 0-4 的信号强度，不传则使用浏览器 API 获取 */
  rtt?: number;
}

function getSignalLevel(rtt: number): number {
  if (rtt <= 50) return 4;
  if (rtt <= 100) return 3;
  if (rtt <= 200) return 2;
  if (rtt <= 400) return 1;
  return 0;
}

const SIGNAL_COLORS = [
  "var(--vauid-color-success)",
  "var(--vauid-color-error)",
  "var(--vauid-color-warning)",
  "var(--vauid-color-warning)",
];

const SignalIcon = ({ level }: { level: number }) => {
  const color = SIGNAL_COLORS[Math.min(level, 4)] ?? SIGNAL_COLORS[0];
  const iconProps = {
    style: {
      position: "absolute",
      inset: 0,
      color,
    } as CSSProperties,
    height: 16,
    width: 16,
  };

  const icon = (() => {
    if (level >= 4) return <Icon.SignalHigh {...iconProps} />;
    if (level >= 3) return <Icon.SignalMedium {...iconProps} />;
    if (level >= 2) return <Icon.SignalLow {...iconProps} />;
    return <Icon.SignalZero {...iconProps} />;
  })();

  return (
    <span
      style={{
        position: "relative",
        display: "inline-flex",
        width: 16,
        height: 16,
      }}
    >
      <Icon.SignalHigh
        {...iconProps}
        style={{ ...iconProps.style, color: "rgba(255,255,255,0.4)" }}
      />
      {icon}
    </span>
  );
};

const LevelLabel = ["极差", "较差", "一般", "良好", "优秀"];

export const NetworkStatus = ({
  rtt,
  className,
  ...props
}: NetworkStatusProps) => {
  const { cls, vcls } = useCls("network-status", className);
  const [internalRtt, setInternalRtt] = useState<number>(0);
  const currentRtt = rtt ?? internalRtt;

  useEffect(() => {
    if (rtt !== undefined) return;
    const id = setInterval(async () => {
      if ("connection" in navigator) {
        const conn: { rtt?: number } = (
          navigator as { connection?: { rtt?: number } }
        ).connection;
        if (conn?.rtt !== undefined && conn?.rtt >= 0) {
          setInternalRtt(conn.rtt);
        }
      }
    }, 3000);
    return () => clearInterval(id);
  }, [rtt]);

  const level = getSignalLevel(currentRtt);

  return (
    <StatusTag
      className={cls}
      icon={<SignalIcon level={level} />}
      {...props}
    >
      <span className={vcls("label", true)}>
        {LevelLabel[level]}
      </span>
    </StatusTag>
  );
};

// ─── Network Speed (Upload / Download) ─────────────────────────

export interface NetworkSpeedProps extends HTMLAttributes<HTMLDivElement> {
  /** 速率 byte/s，不传则使用浏览器 API 实时测量 */
  speed?: number;
  type: "upload" | "download";
}

function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec >= 1_000_000) {
    return `${(bytesPerSec / 1_000_000).toFixed(1)} MB/s`;
  }
  if (bytesPerSec >= 1_000) {
    return `${(bytesPerSec / 1_000).toFixed(0)} KB/s`;
  }
  return `${bytesPerSec.toFixed(0)} B/s`;
}

/**
 * 使用 Resource Timing API 估算下行速率
 * 选取最近完成的资源，取其 transferSize / duration
 */
function estimateDownloadSpeed(): number {
  const entries = performance.getEntriesByType(
    "resource",
  ) as PerformanceResourceTiming[];
  if (entries.length === 0) return 0;
  // 取最后一个完成的资源
  const last = entries[entries.length - 1];
  if (last.duration <= 0 || last.transferSize <= 0) return 0;
  return Math.round(last.transferSize / (last.duration / 1000));
}

export const NetworkUpload = (props: Omit<NetworkSpeedProps, "type">) => (
  <NetworkSpeed {...props} type="upload" />
);

export const NetworkDownload = (props: Omit<NetworkSpeedProps, "type">) => (
  <NetworkSpeed {...props} type="download" />
);

export const NetworkSpeed = ({
  speed,
  type,
  className,
  ...props
}: NetworkSpeedProps) => {
  const { cls } = useCls("network-speed", className);
  const { cls: labelCls } = useCls("network-status__label");
  const [internalSpeed, setInternalSpeed] = useState<number>(0);
  const currentSpeed = speed ?? internalSpeed;

  useEffect(() => {
    if (speed !== undefined) return;

    if (type === "download") {
      // Estimate download speed from resource timing
      const id = setInterval(() => {
        const est = estimateDownloadSpeed();
        if (est > 0) setInternalSpeed(est);
      }, 3000);
      return () => clearInterval(id);
    }

    // Upload speed estimation via navigator.connection (downlink ≈ upload in many cases)
    const id = setInterval(() => {
      if ("connection" in navigator) {
        const conn: { downlink?: number } = (
          navigator as { connection?: { downlink?: number } }
        ).connection;
        if (conn?.downlink) {
          // downlink is in Mb/s, convert to bytes/s as rough estimate
          setInternalSpeed(Math.round((conn.downlink * 1_000_000) / 8));
        }
      }
    }, 3000);
    return () => clearInterval(id);
  }, [speed, type]);

  return (
    <StatusTag
      className={cls}
      icon={
        type === "upload" ? (
          <Icon.Upload width={16} height={16} />
        ) : (
          <Icon.Download width={16} height={16} />
        )
      }
      {...props}
    >
      <span className={labelCls}>
        {formatSpeed(currentSpeed)}
      </span>
    </StatusTag>
  );
};
