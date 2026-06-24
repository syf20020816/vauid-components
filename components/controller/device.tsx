import { mergeClassNames } from "../_std/util";
import { Button } from "../button";
import { Icon } from "../svg";
import { Toggle, type ToggleProps } from "../toggle";
import { useDevice } from "./hooks/useDevice";
import {
  useScreenShare,
  type UseScreenShareProps,
} from "./hooks/useScreenShare";

export interface DeviceToggleComponent extends React.FC<ToggleProps> {
  Audio: React.FC<ToggleProps>;
  Video: React.FC<ToggleProps>;
  ScreenShare: React.FC<UseScreenShareProps>;
}

const svgProps = {
  height: 16,
  width: 16,
};

const DeviceToggleAudio = (props: ToggleProps) => {
  const { devices } = useDevice({ deviceKind: "audioinput" });
  const options = devices.map((device) => ({
    label: device.label,
    value: device.deviceId,
  }));

  return (
    <Toggle
      prefix={<Icon.Microphone {...svgProps} />}
      options={[...options, ...(props.options ?? [])]}
      {...props}
    />
  );
};

const DeviceToggleVideo = (props: ToggleProps) => {
  const { devices } = useDevice({ deviceKind: "videoinput" });
  const options = devices.map((device) => ({
    label: device.label,
    value: device.deviceId,
  }));

  return (
    <Toggle
      prefix={<Icon.Camera {...svgProps} />}
      options={[...options, ...(props.options ?? [])]}
      {...props}
    />
  );
};

const DeviceScreenShare = (props: UseScreenShareProps) => {
  const { share, sharing, stop } = useScreenShare(props);
  return (
    <Button
      className={sharing && mergeClassNames("screenShare")()}
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

export const DeviceToggle = (({ options }: ToggleProps) => {
  return <Toggle options={options} />;
}) as DeviceToggleComponent;

DeviceToggle.Audio = DeviceToggleAudio;
DeviceToggle.Video = DeviceToggleVideo;
DeviceToggle.ScreenShare = DeviceScreenShare;
