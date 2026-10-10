import { useCallback, useState } from "react";

/** 性能模式 */
export type PerformanceMode = "standard" | "powerSaving" | "audioOnly";

/** 设置面板状态（localStorage 持久化，key: vauid-settings） */
export interface SettingsState {
  // 常规
  /** 会议开始通知 */
  notifyMeetingStart: boolean;
  /** 参会者进出提醒 */
  notifyParticipantChange: boolean;
  /** 性能模式 */
  performanceMode: PerformanceMode;
  /** 语言 */
  lang: string;
  // 音频
  /** 输入音量（输入增益 0-100） */
  micVolume: number;
  /** 扬声器设备 ID */
  speakerId: string;
  /** 输出音量（0-100） */
  speakerVolume: number;
  /** 噪声消除（getUserMedia noiseSuppression） */
  noiseSuppression: boolean;
  /** 自动调节（getUserMedia autoGainControl） */
  autoAdjust: boolean;
  /** 音量增强（0-100，0 表示不增强） */
  gainEnhancement: number;
  // 视频
  /** 加入会议自动开启摄像头 */
  autoStartCamera: boolean;
  /** 视频镜像 */
  mirror: boolean;
  /** 布局单页人数（1-9，联动 engine.setPageSize） */
  pageSize: number;
}

export const DEFAULT_SETTINGS: SettingsState = {
  notifyMeetingStart: true,
  notifyParticipantChange: true,
  performanceMode: "standard",
  lang: "zh-CN",
  micVolume: 100,
  speakerId: "",
  speakerVolume: 100,
  noiseSuppression: true,
  autoAdjust: true,
  gainEnhancement: 0,
  autoStartCamera: false,
  mirror: false,
  pageSize: 6,
};

const STORAGE_KEY = "vauid-settings";

/** 设置分区组件共享 props */
export interface SettingsSectionProps {
  settings: SettingsState;
  /** 更新单个设置项（自动持久化） */
  update: <K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K],
  ) => void;
}

/**
 * # useSettings - 设置状态
 * SettingsPanel 内部使用；也可独立用于消费设置值（如 mirror 决定视频镜像）。
 */
export const useSettings = () => {
  const [settings, setSettings] = useState<SettingsState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const update = useCallback(
    <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // 存储不可用时静默降级为内存态
        }
        return next;
      });
    },
    [],
  );

  return { settings, update };
};
