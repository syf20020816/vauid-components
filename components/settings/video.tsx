import { useRoomCtx } from "../std/ctx/hooks";
import { Checkbox } from "../checkbox";
import { Slider } from "../slider";
import { DeviceTrigger } from "../controller/device";
import { SettingsRow } from "./row";
import type { SettingsSectionProps } from "./types";

/** 视频设置：摄像头 / 自动开启 / 镜像 / 布局单页人数 */
export const VideoSettings = ({ settings, update }: SettingsSectionProps) => {
  const { layout } = useRoomCtx() ?? {};

  return (
    <div className="vauid-settings-section">
      <SettingsRow label="摄像头">
        <DeviceTrigger.Video showLabel />
      </SettingsRow>
      <SettingsRow label="自动开启">
        <Checkbox
          label="加入会议自动开启摄像头"
          checked={settings.autoStartCamera}
          onChange={(v) => update("autoStartCamera", v)}
        />
      </SettingsRow>
      <SettingsRow label="视频镜像">
        <Checkbox
          label="镜像我的画面"
          checked={settings.mirror}
          onChange={(v) => update("mirror", v)}
        />
      </SettingsRow>
      <SettingsRow label="布局单页人数">
        <Slider
          min={1}
          max={9}
          value={settings.pageSize}
          onChange={(v) => {
            update("pageSize", v);
            // 联动布局引擎，实时生效
            layout?.setPageSize(v);
          }}
          style={{ width: 180 }}
        />
        <span className="vauid-settings-row-tip">{settings.pageSize} 人/页</span>
      </SettingsRow>
    </div>
  );
};
