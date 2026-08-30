import { useContext } from "react";
import { ROOM_CTX } from "./context";

/**
 * # useRoomCtx - 获取房间上下文
 * 必须在 <RoomCtxProvider> 内使用；未在 Provider 内时返回 null 并输出警告。
 */
export const useRoomCtx = () => {
  const ctx = useContext(ROOM_CTX);
  if (!ctx) {
    console.warn("[vauid] useRoomCtx 必须在 <RoomCtxProvider> 内使用");
  }
  return ctx;
};
