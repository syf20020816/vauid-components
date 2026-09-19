"use client";

import { useCallback, useEffect, useState } from "react";
import { MeetingRoom } from "vauid-components/room";
import { TileWrap } from "vauid-components/tile/wrap";
import { VideoTile } from "vauid-components/tile/video";
import type { LayoutEntity, LayoutNode } from "vauid-components/layout/types";
import { Room, RoomEvent, Track } from "../../lib/livekit";

export interface RoomPageProps {
  room: Room;
  roomName: string;
  /** 退出房间回调（断开连接后触发） */
  onLeave?: () => void;
}

/** livekit 参与者 → 布局实体 */
const toEntity = (identity: string, name?: string): LayoutEntity => ({
  id: identity,
  label: name || identity,
});

/** 查找参与者的摄像头 track */
const getCameraTrack = (room: Room, identity: string) => {
  const participant =
    identity === room.localParticipant.identity
      ? room.localParticipant
      : room.remoteParticipants.get(identity);
  return participant?.getTrackPublication(Track.Source.Camera)?.track;
};

/** 参与者视频瓦片：TileWrap 悬浮层（名称等） + VideoTile 承载摄像头 track */
const ParticipantVideo = ({
  room,
  node,
  subscribeTick,
}: {
  room: Room;
  node: LayoutNode;
  /** 订阅版本号：变化时触发重新 attach（远端 track 订阅完成后由页面层递增） */
  subscribeTick: number;
}) => {
  const identity = node.entity.id;

  const bind = useCallback(
    (el: HTMLVideoElement) => {
      getCameraTrack(room, identity)?.attach(el);
    },
    // subscribeTick 仅作依赖：远端 track 订阅完成后改变 bind 身份，触发 VideoTile 重新 attach
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [room, identity, subscribeTick],
  );

  const unbind = useCallback(
    (el: HTMLVideoElement) => {
      getCameraTrack(room, identity)?.detach(el);
    },
    [room, identity],
  );

  return (
    <TileWrap node={node}>
      <VideoTile bind={bind} unbind={unbind} />
    </TileWrap>
  );
};

/**
 * 房间页面：组件级使用 MeetingRoom
 * - 参与者订阅由页面层直接对接 livekit（组件库不感知厂商）
 * - entities 驱动布局，renderEntity 自定义视频渲染
 * - 退出时由 page 层（onLeave）断开连接
 */
export const RoomPage = ({ room, roomName, onLeave }: RoomPageProps) => {
  const [entities, setEntities] = useState<LayoutEntity[]>(() => [
    toEntity(room.localParticipant.identity, room.localParticipant.name || "Me"),
  ]);
  // 订阅版本号：远端 track 订阅完成后递增，触发对应瓦片重新 bind（attach）
  const [subscribeTick, setSubscribeTick] = useState(0);

  // 订阅参与者增删，同步 entities（含已在房间的远端参与者）
  // 注意：不在此处 disconnect —— room 由 page 层创建，连接生命周期归 page 层管理；
  // 否则 dev StrictMode 的 effect 双调用会在挂载后立刻断开连接，导致视频冻结
  useEffect(() => {
    const sync = () => {
      setEntities([
        toEntity(
          room.localParticipant.identity,
          room.localParticipant.name || "Me",
        ),
        ...Array.from(room.remoteParticipants.values()).map((p) =>
          toEntity(p.identity, p.name),
        ),
      ]);
    };
    sync();
    const onSubscribed = () => setSubscribeTick((t) => t + 1);
    room.on(RoomEvent.ParticipantConnected, sync);
    room.on(RoomEvent.ParticipantDisconnected, sync);
    room.on(RoomEvent.TrackSubscribed, onSubscribed);
    return () => {
      room.off(RoomEvent.ParticipantConnected, sync);
      room.off(RoomEvent.ParticipantDisconnected, sync);
      room.off(RoomEvent.TrackSubscribed, onSubscribed);
    };
  }, [room]);

  const renderEntity = (node: LayoutNode) => (
    <ParticipantVideo room={room} node={node} subscribeTick={subscribeTick} />
  );

  return (
    <MeetingRoom
      entities={entities}
      roomName={roomName}
      controller={{ onLeave }}
      renderEntity={renderEntity}
    />
  );
};
