"use client";

import { useEffect, useRef, useState } from "react";
import { MeetingRoom } from "vauid-components/room";
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

/** 参与者视频瓦片：将摄像头 track 挂载到 video 元素 */
const ParticipantVideo = ({
  room,
  identity,
  label,
}: {
  room: Room;
  identity: string;
  label?: string;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const participant =
      identity === room.localParticipant.identity
        ? room.localParticipant
        : room.remoteParticipants.get(identity);
    const track = participant?.getTrackPublication(Track.Source.Camera)?.track;
    if (track) {
      track.attach(el);
    }
    return () => {
      track?.detach(el);
    };
  }, [room, identity]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
      {label && (
        <span
          style={{
            position: "absolute",
            bottom: 8,
            left: 8,
            fontSize: 12,
            color: "#fff",
            background: "rgba(0,0,0,.5)",
            padding: "2px 8px",
            borderRadius: 8,
          }}
        >
          {label}
        </span>
      )}
    </div>
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
    <ParticipantVideo
      room={room}
      identity={node.entity.id}
      label={node.entity.label}
    />
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
