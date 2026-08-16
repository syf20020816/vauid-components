"use client";

import { useState } from "react";
import { PrejoinPage } from "./pages/prejoin";
import { RoomPage } from "./pages/room";
import type { JoinResult } from "../lib/livekit";

/**
 * 测试项目主页：
 * 未加入时展示 Prejoin（输入房间名 → 连接 LiveKit 房间）
 * 加入后展示房间页面（本地/远端视频 + 控制栏）
 */
export default function Home() {
  const [joined, setJoined] = useState<JoinResult | null>(null);

  if (!joined) {
    return (
      <PrejoinPage
        onJoined={(result) => setJoined(result)}
      />
    );
  }

  return (
    <RoomPage
      room={joined.room}
      roomName={joined.roomName}
      onLeave={() => setJoined(null)}
    />
  );
}
