"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller } from "vauid-components/controller";
import { RoomHeader } from "vauid-components/room";
import { ParticipantNum } from "vauid-components/participant/num";
import { Layout } from "vauid-components/layout";
import { useEngine } from "vauid-components/layout/hooks/useEngine";
import type { LayoutEntity, LayoutNode } from "vauid-components/layout/types";
import {
  Room,
  RoomEvent,
  Track,
  type RemoteParticipant,
} from "../../lib/livekit";

export interface RoomPageProps {
  room: Room;
  roomName: string;
  /** 退出房间回调（断开连接后触发） */
  onLeave?: () => void;
}

/** 本地参与者在布局中的实体 id */
const LOCAL_ID = "local";

/**
 * 房间页面：使用组件库 Layout 引擎渲染本地 + 远端视频网格
 * 控制栏使用 vauid-components 的 Controller（音视频开关/退出）与 ParticipantNum（人数）
 */
export const RoomPage = ({ room, roomName, onLeave }: RoomPageProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [remotes, setRemotes] = useState<RemoteParticipant[]>([]);
  const [micOn, setMicOn] = useState(room.localParticipant.isMicrophoneEnabled);
  const [camOn, setCamOn] = useState(room.localParticipant.isCameraEnabled);
  const videoRefs = useRef(new Map<string, HTMLVideoElement>());

  // 初始只有本地参与者，远端参与者通过 engine.addEntity/delEntity 动态增删
  const entities = useMemo<LayoutEntity[]>(
    () => [{ id: LOCAL_ID, label: "Me" }],
    [],
  );
  const { nodes, engine } = useEngine({ container: containerRef, entities });

  const syncLocal = useCallback(() => {
    setMicOn(room.localParticipant.isMicrophoneEnabled);
    setCamOn(room.localParticipant.isCameraEnabled);
  }, [room]);

  const syncRemotes = useCallback(() => {
    setRemotes(Array.from(room.remoteParticipants.values()));
  }, [room]);

  // 将实体的摄像头 track 挂载到对应的 video 元素
  const attachTrack = useCallback(
    (id: string) => {
      const el = videoRefs.current.get(id);
      if (!el) return;
      const pub =
        id === LOCAL_ID
          ? room.localParticipant.getTrackPublication(Track.Source.Camera)
          : room.remoteParticipants
              .get(id)
              ?.getTrackPublication(Track.Source.Camera);
      if (pub?.track) {
        pub.track.attach(el);
      }
    },
    [room],
  );

  // 订阅事件：远端参与者/轨道变化、本地轨道变化
  useEffect(() => {
    const onParticipantConnected = (participant: RemoteParticipant) => {
      syncRemotes();
      engine.current?.addEntity({
        id: participant.identity,
        label: participant.name || participant.identity,
      });
    };

    const onParticipantDisconnected = (participant: RemoteParticipant) => {
      syncRemotes();
      engine.current?.delEntity(participant.identity);
    };

    const onTrackSubscribed = (
      _t: unknown,
      _pub: unknown,
      participant: RemoteParticipant,
    ) => {
      syncRemotes();
      requestAnimationFrame(() => attachTrack(participant.identity));
    };

    const onLocalTrackPublished = () => attachTrack(LOCAL_ID);

    room
      .on(RoomEvent.ParticipantConnected, onParticipantConnected)
      .on(RoomEvent.ParticipantDisconnected, onParticipantDisconnected)
      .on(RoomEvent.TrackSubscribed, onTrackSubscribed)
      .on(RoomEvent.TrackUnsubscribed, syncRemotes)
      .on(RoomEvent.LocalTrackPublished, onLocalTrackPublished)
      .on(RoomEvent.LocalTrackUnpublished, syncLocal);

    // 补发已存在的远端参与者（加入前就在房间里的）
    room.remoteParticipants.forEach((participant) => {
      engine.current?.addEntity({
        id: participant.identity,
        label: participant.name || participant.identity,
      });
    });
    syncRemotes();

    return () => {
      room.off(RoomEvent.ParticipantConnected, onParticipantConnected);
      room.off(RoomEvent.ParticipantDisconnected, onParticipantDisconnected);
      room.off(RoomEvent.TrackSubscribed, onTrackSubscribed);
      room.off(RoomEvent.TrackUnsubscribed, syncRemotes);
      room.off(RoomEvent.LocalTrackPublished, onLocalTrackPublished);
      room.off(RoomEvent.LocalTrackUnpublished, syncLocal);
    };
  }, [room, syncRemotes, syncLocal, attachTrack, engine]);

  const setVideoRef = (id: string) => (el: HTMLVideoElement | null) => {
    if (el) {
      videoRefs.current.set(id, el);
      requestAnimationFrame(() => attachTrack(id));
    } else {
      videoRefs.current.delete(id);
    }
  };

  const handleLeave = async () => {
    room.localParticipant.setDisconnected();
    onLeave?.();
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        background: "#1f1f1f",
        color: "#fff",
      }}
    >
      <RoomHeader roomName={roomName} />
      <Layout
        ref={containerRef}
        nodes={nodes}
        tileStyle={() => ({
          borderRadius: 12,
          overflow: "hidden",
          background: "#1a1a2e",
        })}
        renderEntity={(node: LayoutNode) => (
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
            }}
          >
            <video
              ref={setVideoRef(node.entity.id)}
              autoPlay
              playsInline
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
            <span style={labelStyle}>{node.entity.label}</span>
          </div>
        )}
      />
      {/* 底部控制栏：使用组件库 Controller，音视频按钮直接控制 LiveKit 轨道 */}
      <Controller
        onLeave={handleLeave}
        position="center"
        participant={{
          num: {
            children: <ParticipantNum count={remotes.length + 1} />,
          },
        }}
      />
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  position: "absolute",
  bottom: 8,
  left: 8,
  fontSize: 12,
  color: "#fff",
  background: "rgba(0,0,0,.5)",
  padding: "2px 8px",
  borderRadius: 8,
};
