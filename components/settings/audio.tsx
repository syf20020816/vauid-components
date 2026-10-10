import { useEffect, useState } from "react";
import { Checkbox } from "../checkbox";
import { Select } from "../select";
import { Slider } from "../slider";
import { DeviceSlider, DeviceTrigger } from "../controller/device";
import { SettingsRow } from "./row";
import type { SettingsSectionProps } from "./types";

/** 枚举扬声器（audiooutput）设备，监听设备插拔 */
const useSpeakerDevices = () => {
  const [speakers, setSpeakers] = useState<MediaDeviceInfo[]>([]);
  useEffect(() => {
    let disposed = false;
    const list = async () => {
      try {
        const all = await navigator.mediaDevices.enumerateDevices();
        if (!disposed) {
          setSpeakers(all.filter((d) => d.kind === "audiooutput"));
        }
      } catch {
        // 权限不可用时保持空列表
      }
    };
    void list();
    navigator.mediaDevices?.addEventListener("devicechange", list);
    return () => {
      disposed = true;
      navigator.mediaDevices?.removeEventListener("devicechange", list);
    };
  }, []);
  return speakers;
};

/** 音频设置：麦克风 / 扬声器 / 音量 / 增强项 */
export const AudioSettings = ({ settings, update }: SettingsSectionProps) => {
  const speakers = useSpeakerDevices();
  const speakerOptions = speakers.map((d) => ({
    label: d.label || "默认扬声器",
    value: d.deviceId,
  }));

  return (
    <div className="vauid-settings-section">
      <SettingsRow label="麦克风">
        <DeviceTrigger.Audio showLabel />
      </SettingsRow>
      <SettingsRow label="输入音量">
        <DeviceSlider.Microphone
          defaultValue={settings.micVolume}
          onChange={(v) => update("micVolume", v)}
        />
      </SettingsRow>
      <SettingsRow label="扬声器">
        <Select
          style={{ minWidth: 180 }}
          placeholder="默认扬声器"
          options={speakerOptions}
          value={settings.speakerId}
          onChange={(v) => update("speakerId", String(v))}
        />
      </SettingsRow>
      <SettingsRow label="输出音量">
        <Slider
          min={0}
          max={100}
          value={settings.speakerVolume}
          onChange={(v) => update("speakerVolume", v)}
          style={{ width: 180 }}
        />
      </SettingsRow>
      <SettingsRow label="音频增强">
        <Checkbox
          label="噪声消除"
          checked={settings.noiseSuppression}
          onChange={(v) => update("noiseSuppression", v)}
        />
        <Checkbox
          label="自动调节"
          checked={settings.autoAdjust}
          onChange={(v) => update("autoAdjust", v)}
        />
      </SettingsRow>
      <SettingsRow label="音量增强">
        <Slider
          min={0}
          max={100}
          value={settings.gainEnhancement}
          onChange={(v) => update("gainEnhancement", v)}
          style={{ width: 180 }}
        />
        <span className="vauid-settings-row-tip">
          {settings.gainEnhancement === 0 ? "不增强" : `+${settings.gainEnhancement}%`}
        </span>
      </SettingsRow>
    </div>
  );
};
