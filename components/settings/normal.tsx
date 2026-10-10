import { Checkbox } from "../checkbox";
import { Select } from "../select";
import { LangSelect } from "./langSelect";
import { SettingsRow } from "./row";
import type {
  PerformanceMode,
  SettingsSectionProps,
} from "./types";

const PERFORMANCE_OPTIONS: {
  label: string;
  value: PerformanceMode;
}[] = [
  { label: "标准", value: "standard" },
  { label: "节能", value: "powerSaving" },
  { label: "仅音频", value: "audioOnly" },
];

/** 常规设置：通知 / 性能模式 / 语言 */
export const NormalSettings = ({ settings, update }: SettingsSectionProps) => {
  return (
    <div className="vauid-settings-section">
      <SettingsRow label="通知">
        <Checkbox
          label="会议开始通知"
          checked={settings.notifyMeetingStart}
          onChange={(v) => update("notifyMeetingStart", v)}
        />
        <Checkbox
          label="参会者进出提醒"
          checked={settings.notifyParticipantChange}
          onChange={(v) => update("notifyParticipantChange", v)}
        />
      </SettingsRow>
      <SettingsRow label="性能模式">
        <Select
          options={PERFORMANCE_OPTIONS}
          value={settings.performanceMode}
          onChange={(v) => update("performanceMode", v as PerformanceMode)}
        />
      </SettingsRow>
      <SettingsRow label="语言">
        <LangSelect
          value={settings.lang}
          onChange={(lang) => update("lang", lang)}
        />
      </SettingsRow>
    </div>
  );
};
