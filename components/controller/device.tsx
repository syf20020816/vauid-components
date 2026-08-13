import { useCls } from "../std/hooks/cls";
import { Button } from "../button";
import { Icon } from "../svg";
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
  const { devices, stop, start, inUsed } = useDevice({ deviceKind: "videoinput" });
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
          <Icon.CameraOff {...svgProps} style={{
            color: "var(--vauid-color-error)",
          }} />
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
