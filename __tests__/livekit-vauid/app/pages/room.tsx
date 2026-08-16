"use client";

import { useMemo } from "react";
import { MeetingRoom } from "vauid-components/room";
import { LiveKitAdapter } from "vauid-components/room/plugins/livekit";
import type { Room } from "../../lib/livekit";

export interface RoomPageProps {
  room: Room;
  roomName: string;
  /** 退出房间回调（断开连接后触发） */
  onLeave?: () => void;
}

/**
 * 房间页面：直接使用组件库 MeetingRoom 组合
 * - 视频网格/控制栏/参与者管理由 MeetingRoom + RoomAdapter 统一封装
 * - 退出时由 RoomProvider 卸载清理（adapter.disconnect）触发断开
 */
export const RoomPage = ({ room, roomName, onLeave }: RoomPageProps) => {
  const adapter = useMemo(() => new LiveKitAdapter(room), [room]);

  return (
    <MeetingRoom
      adapter={adapter}
      roomName={roomName}
      controller={{ onLeave }}
    />
  );
};
