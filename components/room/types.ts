/**
 * # Room 抽象层
 * 定义与音视频厂商无关的 Room 适配器契约。
 * 布局/上下文/组合组件只依赖此接口，不感知具体厂商（LiveKit/声网/腾讯云等）。
 * 厂商通过实现 RoomAdapter 接入，见 `plugins/livekit.ts`。
 */

/** 参与者最小抽象 */
export interface RoomParticipant {
  identity: string;
  name?: string;
  isLocal: boolean;
}

/** 连接参数（适配器自行决定如何使用） */
export interface ConnectOptions {
  url: string;
  token: string;
  roomName?: string;
}

/** 抽象事件名（映射各厂商 Room 事件的最小公共子集） */
export const RoomEvents = {
  ParticipantConnected: "participantConnected",
  ParticipantDisconnected: "participantDisconnected",
  TrackSubscribed: "trackSubscribed",
  TrackUnsubscribed: "trackUnsubscribed",
  LocalTrackPublished: "localTrackPublished",
  LocalTrackUnpublished: "localTrackUnpublished",
} as const;

export type RoomEventName = (typeof RoomEvents)[keyof typeof RoomEvents];

/** 事件 → 回调签名映射 */
export interface RoomEventMap {
  participantConnected: (participant: RoomParticipant) => void;
  participantDisconnected: (participant: RoomParticipant) => void;
  /** 远端某参与者订阅到新轨道（目前约定为摄像头轨道） */
  trackSubscribed: (participant: RoomParticipant) => void;
  trackUnsubscribed: (participant: RoomParticipant) => void;
  /** 本地发布了新轨道（如开启摄像头） */
  localTrackPublished: () => void;
  localTrackUnpublished: () => void;
}

/**
 * # RoomAdapter - 房间适配器契约
 * 上下文层通过该接口获取房间实例并订阅状态变化，
 * 组合组件通过该接口渲染参与者视频与控制设备。
 */
export interface RoomAdapter {
  /** 厂商标识，如 "livekit" */
  readonly kind: string;

  connect(options?: ConnectOptions): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;

  getLocalParticipant(): RoomParticipant;
  getRemoteParticipants(): RoomParticipant[];

  isMicrophoneEnabled(): boolean;
  isCameraEnabled(): boolean;
  setMicrophoneEnabled(enabled: boolean): Promise<void>;
  setCameraEnabled(enabled: boolean): Promise<void>;

  /** 将某参与者的摄像头 track 挂载到 video 元素（无 track 时忽略） */
  attachCameraTrack(identity: string, element: HTMLVideoElement): void;
  /** 从 video 元素卸载摄像头 track */
  detachCameraTrack(identity: string, element: HTMLVideoElement): void;

  on<K extends RoomEventName>(event: K, handler: RoomEventMap[K]): void;
  off<K extends RoomEventName>(event: K, handler: RoomEventMap[K]): void;
}
