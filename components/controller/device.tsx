import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type FC,
  type ForwardRefExoticComponent,
  type MouseEvent,
  type RefAttributes,
} from "react";
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
import type { FnReturn, Nullable } from "vauid-components/std";

export interface DeviceTriggerComponent extends FC<TriggerProps> {
  Audio: FC<TriggerProps>;
  /** forwardRef 组件：可接收 ref 以获取设备流（如媒体预览） */
  Video: ForwardRefExoticComponent<
    DeviceTriggerProps & RefAttributes<DeviceVideoTriggerExports>
  >;
  ScreenShare: FC<UseScreenShareProps>;
  More: FC<TriggerProps>;
}

const svgProps = {
  height: 16,
  width: 16,
};

const DeviceTriggerAudio = ({ onClick, ...props }: DeviceTriggerProps) => {
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
      onClick={async (e) => {
        if (inUsed) {
          stop();
          onClick?.(e, false);
        } else {
          await start();
          onClick?.(e, true);
        }
      }}
      {...props}
    />
  );
};

export interface DeviceVideoTriggerExports {
  mediaSrc?: Nullable<MediaStream>;
  // setSrcObject: (srcObject?: MediaStream) => void;
}

const DeviceTriggerVideo = forwardRef<
  DeviceVideoTriggerExports,
  DeviceTriggerProps
>(({ onClick, ...props }: DeviceTriggerProps, ref) => {
  const { devices, stop, start, inUsed, streamRef } = useDevice({
    deviceKind: "videoinput",
  });
  const options = devices.map((device) => ({
    label: device.label,
    value: device.deviceId,
  }));

  useImperativeHandle(ref, () => ({
    // 用 getter 实时暴露当前流：start() 异步完成后 streamRef 已更新，读取始终为最新值
    get mediaSrc() {
      return streamRef.current;
    },
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
      onClick={async (e) => {
        if (inUsed) {
          stop();
          onClick?.(e, false);
        } else {
          // 等待 getUserMedia 完成后再通知，保证消费方读取到最新流
          await start();
          onClick?.(e, true);
        }
      }}
      {...props}
    />
  );
});

const DeviceScreenShare = ({
  onClick,
  ...props
}: UseScreenShareProps & {
  onClick?: (e: MouseEvent<HTMLElement>, sharing: boolean) => FnReturn<void>;
}) => {
  const { share, sharing, stop } = useScreenShare(props);
  const { cls } = useCls(["screenShare", sharing && "active"]);
  return (
    <Button
      className={cls}
      onClick={(e) => {
        if (sharing) {
          stop();
        } else {
          share();
        }
        onClick?.(e, sharing);
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

export interface DeviceTriggerProps extends Omit<TriggerProps, "onClick"> {
  onClick?: (e: MouseEvent<HTMLElement>, open: boolean) => FnReturn<void>;
}

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
  const { cls } = useCls("device-slider");
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
