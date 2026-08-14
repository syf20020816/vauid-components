import { useEffect, useRef, useState } from "react";
import { useCls } from "../std/hooks/cls";
import { Button } from "../button";
import { Icon } from "../svg";
import { Slider, type SliderProps } from "../slider";
import { Trigger, type TriggerProps } from "../trigger";
import { useDevice } from "./hooks/useDevice";
import {
  useScreenShare,
  type UseScreenShareProps,
} from "./hooks/useScreenShare";

export interface DeviceTriggerComponent extends React.FC<TriggerProps> {
  Audio: React.FC<TriggerProps>;
  Video: React.FC<TriggerProps>;
  ScreenShare: React.FC<UseScreenShareProps>;
  More: React.FC<TriggerProps>;
}

const svgProps = {
  height: 16,
  width: 16,
};

const DeviceTriggerAudio = (props: TriggerProps) => {
  const { devices, stop, start, inUsed } = useDevice({
    deviceKind: "audioinput",
  });
  const options = devices.map((device) => ({
    label: device.label,
    value: device.deviceId,
  }));

  return (
    <Trigger
      prefix={
        inUsed ? (
          <Icon.Microphone {...svgProps} />
        ) : (
          <Icon.MicrophoneOff
            {...svgProps}
            style={{
              color: "var(--vauid-color-error)",
            }}
          />
        )
      }
      options={[...options, ...(props.options ?? [])]}
      onClick={() => {
        if (inUsed) {
          stop();
        } else {
          start();
        }
      }}
      {...props}
    />
  );
};

const DeviceTriggerVideo = (props: TriggerProps) => {
  const { devices, stop, start, inUsed } = useDevice({
    deviceKind: "videoinput",
  });
  const options = devices.map((device) => ({
    label: device.label,
    value: device.deviceId,
  }));

  return (
    <Trigger
      prefix={
        inUsed ? (
          <Icon.Camera {...svgProps} />
        ) : (
          <Icon.CameraOff
            {...svgProps}
            style={{
              color: "var(--vauid-color-error)",
            }}
          />
        )
      }
      options={[...options, ...(props.options ?? [])]}
      onClick={() => {
        if (inUsed) {
          stop();
        } else {
          start();
        }
      }}
      {...props}
    />
  );
};

const DeviceScreenShare = (props: UseScreenShareProps) => {
  const { share, sharing, stop } = useScreenShare(props);
  const { cls } = useCls(["screenShare", sharing && "active"]);
  return (
    <Button
      className={cls}
      onClick={() => {
        if (sharing) {
          stop();
        } else {
          share();
        }
      }}
      icon={<Icon.ScreenShare {...svgProps} />}
    >
      {sharing ? "Stop Sharing" : "Share Screen"}
    </Button>
  );
};

const DeviceTriggerMore = (props: TriggerProps) => {
  return <Trigger options={props.options} placeholder="More" />;
};

export const DeviceTrigger = (({ options }: TriggerProps) => {
  return <Trigger options={options} showLabel={false} />;
}) as DeviceTriggerComponent;

DeviceTrigger.Audio = DeviceTriggerAudio;
DeviceTrigger.Video = DeviceTriggerVideo;
DeviceTrigger.ScreenShare = DeviceScreenShare;
DeviceTrigger.More = DeviceTriggerMore;

// ── DeviceSlider ──────────────────────────────────────────────

export interface DeviceSliderComponent extends React.FC<SliderProps> {
  Microphone: React.FC<SliderProps>;
}

/**
 * 麦克风音量滑块
 * - 启动麦克风流后，通过 Web Audio GainNode 实时调节音量（0~100）
 * - 卸载时自动停止麦克风流并释放 AudioContext
 */
const DeviceSliderMicrophone = (props: SliderProps) => {
  const { inUsed, start, stop, streamRef } = useDevice({
    deviceKind: "audioinput",
  });
  const {cls} = useCls("device-slider");
  const [volume, setVolume] = useState(props.defaultValue ?? 100);
  const gainRef = useRef<GainNode | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);

  // 挂载即启动麦克风，卸载时停止
  useEffect(() => {
    start();
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 流就绪后建立音频图：source → gain
  useEffect(() => {
    if (!inUsed || !streamRef.current || gainRef.current) return;
    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(streamRef.current);
    const gain = ctx.createGain();
    gain.gain.value = volume / 100;
    source.connect(gain);
    ctxRef.current = ctx;
    gainRef.current = gain;

    return () => {
      source.disconnect();
      gain.disconnect();
      ctx.close();
      ctxRef.current = null;
      gainRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inUsed]);

  // 受控模式下外部 value 变化时同步 gain
  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.value = volume / 100;
    }
  }, [volume]);

  const handleChange = (v: number) => {
    setVolume(v);
    if (gainRef.current) {
      gainRef.current.gain.value = v / 100;
    }
    props.onChange?.(v);
  };

  return (
    <div className={cls}>
      <Icon.Volume {...svgProps} />
      <Slider
        min={0}
        max={100}
        value={volume}
        onChange={handleChange}
        style={{ width: 120 }}
        {...props}
      />
    </div>
  );
};

export const DeviceSlider = ((props: SliderProps) => {
  return <Slider {...props} />;
}) as DeviceSliderComponent;

DeviceSlider.Microphone = DeviceSliderMicrophone;
