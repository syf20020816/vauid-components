
import { useCallback, useState } from "react";
import { DEFAULT_SETTINGS, type SettingsState } from "../types";
import { DEFAULT_SHORTCUTS } from "../../layout/shortcut";

const STORAGE_KEY = "vauid-settings";
/**
 * # useSettings - 设置状态
 * SettingsPanel 内部使用；也可独立用于消费设置值（如 mirror 决定视频镜像）。
 */
export const useSettings = () => {
  const [settings, setSettings] = useState<SettingsState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_SETTINGS;
      const stored = JSON.parse(raw) as Partial<SettingsState>;
      return {
        ...DEFAULT_SETTINGS,
        ...stored,
        // 嵌套对象深合并：老版本存储缺失 shortcuts 或缺单项时逐 action 兜底
        shortcuts: { ...DEFAULT_SHORTCUTS, ...(stored.shortcuts ?? {}) },
      };
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
