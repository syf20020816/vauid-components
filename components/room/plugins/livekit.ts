/**
 * # LiveKitAdapter - LiveKit 房间适配器
 * 实现 RoomAdapter 抽象契约，将 livekit-client 的 Room 实例转译为组件库统一的房间接口。
 *
 * 设计说明：
 * - 仅 `import type` 引入 livekit-client 类型（构建期被擦除），运行时全部通过
 *   livekit Room 实例的方法/事件工作，因此**主 bundle 不包含 livekit-client**，
 *   消费者需自行安装 livekit-client（peerDependency）。
 * - 构造入参为外部已创建（可已连接）的 Room 实例；connect 在未连接时可基于
 *   ConnectOptions 惰性连接，disconnect 由上下文层在卸载时调用。
 */
import {
  RoomEvent,
  type LocalParticipant,
  type RemoteParticipant,
  type Room,
  type Track,
  type TrackPublication,
} from "livekit-client";
import {
  RoomEvents,
  type ConnectOptions,
  type RoomAdapter,
  type RoomEventMap,
  type RoomEventName,
  type RoomParticipant,
} from "../types";

/** livekit Track.Source.Camera 的字符串值（避免运行时依赖枚举） */
const CAMERA_SOURCE = "camera" as Track.Source;

/** 抽象事件 → livekit 事件名（RoomEvent 枚举在 livekit 2.x 中为运行时值枚举） */
const LIVEKIT_EVENTS: Record<RoomEventName, RoomEvent> = {
  [RoomEvents.ParticipantConnected]: RoomEvent.ParticipantConnected,
  [RoomEvents.ParticipantDisconnected]: RoomEvent.ParticipantDisconnected,
  [RoomEvents.TrackSubscribed]: RoomEvent.TrackSubscribed,
  [RoomEvents.TrackUnsubscribed]: RoomEvent.TrackUnsubscribed,
  [RoomEvents.LocalTrackPublished]: RoomEvent.LocalTrackPublished,
  [RoomEvents.LocalTrackUnpublished]: RoomEvent.LocalTrackUnpublished,
};

const toParticipant = (
  participant: RemoteParticipant | LocalParticipant,
  isLocal: boolean,
): RoomParticipant => ({
  identity: participant.identity,
  name: participant.name || participant.identity,
  isLocal,
});

export class LiveKitAdapter implements RoomAdapter {
  readonly kind = "livekit";

  /** 底层 livekit Room 实例 */
  private readonly room: Room;

  /** 抽象事件 → 已注册 handler 集合 */
  private handlers = new Map<RoomEventName, Set<(payload: unknown) => void>>();
  /** 抽象事件 → 已挂到 livekit room 的监听器 */
  private listeners = new Map<RoomEventName, (...args: unknown[]) => void>();

  constructor(room: Room) {
    this.room = room;
  }

  /** 暴露底层 livekit Room 实例，便于混合开发（vauid 组件 + livekit 原生 API） */
  get livekitRoom(): Room {
    return this.room;
  }

  isConnected(): boolean {
    return this.room.state === "connected";
  }

  async connect(options?: ConnectOptions): Promise<void> {
    // 幂等：已连接或连接中直接返回
    if (this.room.state === "connected" || this.room.state === "connecting") {
      return;
    }
    if (!options) {
      throw new Error(
        "LiveKitAdapter 未连接且未提供 ConnectOptions，请先 room.connect(url, token) 或传入 connectOptions",
      );
    }
    await this.room.connect(options.url, options.token);
  }

  async disconnect(): Promise<void> {
    this.room.disconnect();
  }

  getLocalParticipant(): RoomParticipant {
    return toParticipant(this.room.localParticipant, true);
  }

  getRemoteParticipants(): RoomParticipant[] {
    return Array.from(this.room.remoteParticipants.values()).map((p) =>
      toParticipant(p, false),
    );
  }

  isMicrophoneEnabled(): boolean {
    return this.room.localParticipant.isMicrophoneEnabled;
  }

  isCameraEnabled(): boolean {
    return this.room.localParticipant.isCameraEnabled;
  }

  async setMicrophoneEnabled(enabled: boolean): Promise<void> {
    await this.room.localParticipant.setMicrophoneEnabled(enabled);
  }

  async setCameraEnabled(enabled: boolean): Promise<void> {
    await this.room.localParticipant.setCameraEnabled(enabled);
  }

  attachCameraTrack(identity: string, element: HTMLVideoElement): void {
    this.getTrackPublication(identity)?.track?.attach(element);
  }

  detachCameraTrack(identity: string, element: HTMLVideoElement): void {
    this.getTrackPublication(identity)?.track?.detach(element);
  }

  on<K extends RoomEventName>(event: K, handler: RoomEventMap[K]): void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
      this.ensureListener(event);
    }
    set.add(handler as (payload: unknown) => void);
  }

  off<K extends RoomEventName>(event: K, handler: RoomEventMap[K]): void {
    const set = this.handlers.get(event);
    if (!set) return;
    set.delete(handler as (payload: unknown) => void);
    if (set.size === 0) {
      this.removeListener(event);
      this.handlers.delete(event);
    }
  }

  /** 确保 livekit 监听器已挂载（首次注册该事件时调用） */
  private ensureListener(event: RoomEventName): void {
    if (this.listeners.has(event)) return;
    const listener = this.createListener(event);
    this.listeners.set(event, listener);
    this.room.on(LIVEKIT_EVENTS[event], listener);
  }

  private removeListener(event: RoomEventName): void {
    const listener = this.listeners.get(event);
    if (!listener) return;
    this.room.off(LIVEKIT_EVENTS[event], listener);
    this.listeners.delete(event);
  }

  /** 将 livekit 事件参数转译为抽象事件载荷并分发 */
  private createListener(event: RoomEventName): (...args: unknown[]) => void {
    return (...args: unknown[]) => {
      let payload: unknown;
      switch (event) {
        case RoomEvents.ParticipantConnected:
        case RoomEvents.ParticipantDisconnected:
          payload = toParticipant(args[0] as RemoteParticipant, false);
          break;
        case RoomEvents.TrackSubscribed:
        case RoomEvents.TrackUnsubscribed:
          payload = toParticipant(args[2] as RemoteParticipant, false);
          break;
        case RoomEvents.LocalTrackPublished:
        case RoomEvents.LocalTrackUnpublished:
          payload = toParticipant(args[1] as LocalParticipant, true);
          break;
      }
      this.handlers.get(event)?.forEach((handler) => handler(payload));
    };
  }

  private getTrackPublication(identity: string): TrackPublication | undefined {
    const participant =
      identity === this.room.localParticipant.identity
        ? this.room.localParticipant
        : this.room.remoteParticipants.get(identity);
    return participant?.getTrackPublication(CAMERA_SOURCE);
  }
}
