import {
  Room,
  RoomEvent,
  Track,
  type LocalTrack,
  type RemoteTrack,
  type RemoteParticipant,
  type TrackPublication,
} from "livekit-client";

export interface JoinResult {
  room: Room;
  roomName: string;
}

export interface TokenResponse {
  token: string;
  url?: string;
}

/** 请求服务端生成 LiveKit token */
export const getToken = async (roomName: string, identity: string, name?: string): Promise<TokenResponse> => {
  const params = new URLSearchParams({ room: roomName, identity });
  if (name) params.set("name", name);
  const res = await fetch(`/api/token?${params}`);
  if (!res.ok) {
    throw new Error(`获取 token 失败: ${res.status} ${res.statusText}`);
  }
  return res.json();
};

/** 连接房间：获取 token → new Room() → connect */
export const connectRoom = async (
  roomName: string,
  identity: string,
  name?: string,
): Promise<JoinResult> => {
  const { token, url } = await getToken(roomName, identity, name);
  if (!url) {
    throw new Error("LIVEKIT_URL 未配置");
  }

  const room = new Room({ adaptiveStream: true, dynacast: true });
  await room.connect(url, token);
  return { room, roomName };
};

/** 打开本地摄像头（返回是否成功） */
export const enableCamera = async (room: Room, enabled = true): Promise<boolean> => {
  try {
    await room.localParticipant.setCameraEnabled(enabled);
    return true;
  } catch {
    return false;
  }
};

/** 打开本地麦克风 */
export const enableMicrophone = async (room: Room, enabled = true): Promise<boolean> => {
  try {
    await room.localParticipant.setMicrophoneEnabled(enabled);
    return true;
  } catch {
    return false;
  }
};

/** 将远端媒体 track 挂载到 video/audio 元素上 */
export const attachTrack = (
  track: LocalTrack | RemoteTrack,
  element: HTMLVideoElement | HTMLAudioElement,
) => {
  track.attach(element);
};

/** 卸载远端媒体 track */
export const detachTrack = (track: LocalTrack | RemoteTrack) => {
  track.detach();
};

export { Room, RoomEvent, Track };
export type { RemoteParticipant, TrackPublication };
