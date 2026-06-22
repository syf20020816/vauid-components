import { Toggle, type ToggleProps } from "../toggle";
import { useDevice } from "./hooks/useDevice";

export interface DeviceToggleComponent extends React.FC<ToggleProps> {
  Audio: React.FC<ToggleProps>;
  Video: React.FC<ToggleProps>;
}

const DeviceToggleAudio = (props: ToggleProps) => {
  const {devices} = useDevice({ deviceKind: "audioinput" });
  const options = devices.map((device) => ({
    label: device.label,
    value: device.deviceId,
  }));

  return <Toggle options={[...options, ...(props.options ?? [])]} {...props} />;
};

const DeviceToggleVideo = (props: ToggleProps) => {
  const {devices} = useDevice({ deviceKind: "videoinput" });
  const options = devices.map((device) => ({
    label: device.label,
    value: device.deviceId,
  }));

  return <Toggle options={[...options, ...(props.options ?? [])]} {...props} />;
};

export const DeviceToggle = (({ options }: ToggleProps) => {
  return <Toggle options={options} />;
}) as DeviceToggleComponent;

DeviceToggle.Audio = DeviceToggleAudio;
DeviceToggle.Video = DeviceToggleVideo;
