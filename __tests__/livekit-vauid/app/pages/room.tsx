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
const ParticipantVideo = ({ room, node }: { room: Room; node: LayoutNode }) => {
  const identity = node.entity.id;

  const bind = useCallback(
    (el: HTMLVideoElement) => {
      getCameraTrack(room, identity)?.attach(el);
    },
    [room, identity],
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
 * - 退出时卸载 RoomPage → cleanup 断开连接
 */
export const RoomPage = ({ room, roomName, onLeave }: RoomPageProps) => {
  const [entities, setEntities] = useState<LayoutEntity[]>(() => [
    toEntity(room.localParticipant.identity, room.localParticipant.name || "Me"),
  ]);

  // 订阅参与者增删，同步 entities（含已在房间的远端参与者）
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
    room.on(RoomEvent.ParticipantConnected, sync);
    room.on(RoomEvent.ParticipantDisconnected, sync);
    return () => {
      room.off(RoomEvent.ParticipantConnected, sync);
      room.off(RoomEvent.ParticipantDisconnected, sync);
      room.disconnect();
    };
  }, [room]);

  const renderEntity = (node: LayoutNode) => (
    <ParticipantVideo room={room} node={node} />
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
