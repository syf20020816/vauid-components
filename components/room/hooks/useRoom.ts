import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import {
  RoomEvents,
  type RoomAdapter,
  type RoomParticipant,
} from "../types";

export interface UseRoomResult {
  /** 远端参与者列表 */
  remotes: RoomParticipant[];
  /** 本地参与者 id */
  localIdentity: string;
  micOn: boolean;
  camOn: boolean;
  /** video 元素注册表：identity → element */
  videoRefs: MutableRefObject<Map<string, HTMLVideoElement>>;
  /** 注册/注销某参与者的 video 元素（自动挂载已就绪的摄像头 track） */
  setVideoRef: (identity: string) => (el: HTMLVideoElement | null) => void;
  toggleMicrophone: () => void;
  toggleCamera: () => void;
}

/**
 * # useRoom - 房间状态管理
 * 订阅 RoomAdapter 事件，同步参与者列表与麦克风/摄像头状态，
 * 并负责把各参与者的摄像头 track 挂载到对应 video 元素。
 */
export const useRoom = (adapter: RoomAdapter): UseRoomResult => {
  const [remotes, setRemotes] = useState<RoomParticipant[]>(() =>
    adapter.getRemoteParticipants(),
  );
  const [micOn, setMicOn] = useState(() => adapter.isMicrophoneEnabled());
  const [camOn, setCamOn] = useState(() => adapter.isCameraEnabled());
  const videoRefs = useRef(new Map<string, HTMLVideoElement>());

  const localIdentity = useMemo(
    () => adapter.getLocalParticipant().identity,
    [adapter],
  );

  const syncRemotes = useCallback(() => {
    setRemotes(adapter.getRemoteParticipants());
  }, [adapter]);

  const syncDevices = useCallback(() => {
    setMicOn(adapter.isMicrophoneEnabled());
    setCamOn(adapter.isCameraEnabled());
  }, [adapter]);

  // 将某参与者的摄像头 track 挂载到已注册的 video 元素
  const attachTrack = useCallback(
    (identity: string) => {
      const el = videoRefs.current.get(identity);
      if (el) {
        adapter.attachCameraTrack(identity, el);
      }
    },
    [adapter],
  );

  // 订阅房间事件
  useEffect(() => {
    const onTrackSubscribed = (participant: RoomParticipant) => {
      syncRemotes();
      // 等待新实体渲染出 video 元素后再挂载 track
      requestAnimationFrame(() => attachTrack(participant.identity));
    };

    adapter.on(RoomEvents.ParticipantConnected, syncRemotes);
    adapter.on(RoomEvents.ParticipantDisconnected, syncRemotes);
    adapter.on(RoomEvents.TrackSubscribed, onTrackSubscribed);
    adapter.on(RoomEvents.TrackUnsubscribed, syncRemotes);
    adapter.on(RoomEvents.LocalTrackPublished, syncDevices);
    adapter.on(RoomEvents.LocalTrackUnpublished, syncDevices);

    return () => {
      adapter.off(RoomEvents.ParticipantConnected, syncRemotes);
      adapter.off(RoomEvents.ParticipantDisconnected, syncRemotes);
      adapter.off(RoomEvents.TrackSubscribed, onTrackSubscribed);
      adapter.off(RoomEvents.TrackUnsubscribed, syncRemotes);
      adapter.off(RoomEvents.LocalTrackPublished, syncDevices);
      adapter.off(RoomEvents.LocalTrackUnpublished, syncDevices);
    };
  }, [adapter, syncRemotes, syncDevices, attachTrack]);

  const setVideoRef = (identity: string) => (el: HTMLVideoElement | null) => {
    if (el) {
      videoRefs.current.set(identity, el);
      requestAnimationFrame(() => attachTrack(identity));
    } else {
      videoRefs.current.delete(identity);
    }
  };

  const toggleMicrophone = useCallback(() => {
    adapter
      .setMicrophoneEnabled(!adapter.isMicrophoneEnabled())
      .catch(() => undefined);
  }, [adapter]);

  const toggleCamera = useCallback(() => {
    adapter
      .setCameraEnabled(!adapter.isCameraEnabled())
      .catch(() => undefined);
  }, [adapter]);

  return {
    remotes,
    localIdentity,
    micOn,
    camOn,
    videoRefs,
    setVideoRef,
    toggleMicrophone,
    toggleCamera,
  };
};
