import { createContext } from "react";
import type { RoomCtx } from "./types";

/**
 * # RoomCtx - 房间上下文
 * 只维护房间级的布局引擎与使用者放入的额外数据（extra），
 * 不关心具体音视频厂商，连接/参与者等业务状态由使用方自行管理。
 */
export const ROOM_CTX = createContext<RoomCtx | null>(null);
