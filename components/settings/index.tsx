import { useState, type CSSProperties } from "react";
import { useCls } from "../std/hooks/cls";
import { useSettings } from "./hooks/useSettings";
import { NormalSettings } from "./normal";
import { AudioSettings } from "./audio";
import { VideoSettings } from "./video";
import { SystemSettings } from "./system";
import type { LoadStats, NetworkStats, AudioStats, VideoStats } from "./cards";
import "./index.scss";

export type SettingsTab = "general" | "audio" | "video" | "system";

const TABS: { key: SettingsTab; label: string }[] = [
  { key: "general", label: "常规" },
  { key: "audio", label: "音频" },
  { key: "video", label: "视频" },
  { key: "system", label: "系统" },
];

export interface SettingsPanelProps {
  /** 受控当前分区 */
  tab?: SettingsTab;
  /** 非受控默认分区 */
  defaultTab?: SettingsTab;
  /** 分区切换回调 */
  onTabChange?: (tab: SettingsTab) => void;
  /** 负载统计（不传则系统分区内部用 performance API 采样兜底） */
  load?: LoadStats;
  /** 网络统计（RTCStats 驱动） */
  network?: NetworkStats;
  /** 音频统计（RTCStats 驱动） */
  audio?: AudioStats;
  /** 视频统计（RTCStats 驱动） */
  video?: VideoStats;
  className?: string;
  style?: CSSProperties;
}

/**
 * # SettingsPanel - 设置面板
 * 常规 / 音频 / 视频 / 系统四分区；设置项经 useSettings 自动 localStorage 持久化。
 */
export const SettingsPanel = ({
  tab,
  defaultTab = "general",
  onTabChange,
  load,
  network,
  audio,
  video,
  className,
  style,
}: SettingsPanelProps) => {
  const [innerTab, setInnerTab] = useState<SettingsTab>(defaultTab);
  const current = tab ?? innerTab;
  const { settings, update } = useSettings();
  const { cls, vcls } = useCls("settings", className);

  return (
    <div className={cls} style={style}>
      <div className={vcls("nav")}>
        {TABS.map((item) => (
          <div
            key={item.key}
            className={
              item.key === current
                ? `${vcls("nav-item")} vauid-settings-nav-item--active`
                : vcls("nav-item")
            }
            onClick={() => {
              if (item.key === current) return;
              setInnerTab(item.key);
              onTabChange?.(item.key);
            }}
          >
            {item.label}
          </div>
        ))}
      </div>
      <div className={vcls("content")}>
        {current === "general" && (
          <NormalSettings settings={settings} update={update} />
        )}
        {current === "audio" && (
          <AudioSettings settings={settings} update={update} />
        )}
        {current === "video" && (
          <VideoSettings settings={settings} update={update} />
        )}
        {current === "system" && (
          <SystemSettings load={load} network={network} audio={audio} video={video} />
        )}
      </div>
    </div>
  );
};

SettingsPanel.displayName = "SettingsPanel";
