"use client";

import { useState } from "react";
import { Prejoin, type PrejoinProps } from "vauid-components/prejoin";
import {
  connectRoom,
  enableCamera,
  enableMicrophone,
  type JoinResult,
} from "../../lib/livekit";

export interface PrejoinPageProps {
  /** 加入成功回调 */
  onJoined?: (result: JoinResult) => void;
  /** 透传给 Prejoin 组件的 props */
  prejoinProps?: Omit<PrejoinProps, "onJoin" | "joining">;
}

/**
 * Prejoin 页面：输入房间名 → 获取 token → 连接 LiveKit 房间 → 发布本地音视频
 */
export const PrejoinPage = ({ onJoined, prejoinProps }: PrejoinPageProps) => {
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string>();

  const handleJoin = async (roomName: string) => {
    setJoining(true);
    setError(undefined);
    try {
      // 每次加入生成一个临时身份
      const identity = `user-${Math.random().toString(36).slice(2, 10)}`;
      const result = await connectRoom(roomName, identity, "Me");
      // 默认发布摄像头与麦克风
      await enableCamera(result.room);
      await enableMicrophone(result.room);
      onJoined?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setJoining(false);
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
      }}
    >
      <Prejoin onJoin={handleJoin} joining={joining} {...prejoinProps} />
      {error && (
        <p
          style={{
            color: "var(--vauid-color-error)",
            textAlign: "center",
            marginTop: 12,
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
};
