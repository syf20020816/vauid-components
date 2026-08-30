import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { Engine } from "../../layout/engine";
import type { RoomCtx } from "./types";

/**
 * # RoomCtx - 房间上下文
 * 只维护房间级的布局引擎与使用者放入的额外数据（extra），
 * 不关心具体音视频厂商，连接/参与者等业务状态由使用方自行管理。
 */
export const ROOM_CTX = createContext<RoomCtx | null>(null);

export interface RoomCtxProviderProps {
  /** 使用者需要放入上下文的额外数据（子组件可通过 useRoomCtx 读取） */
  extra?: RoomCtx["extra"];
  children?: ReactNode;
}

/**
 * # RoomCtxProvider - 房间上下文提供者
 * 创建并持有唯一的布局引擎实例，卸载时销毁。
 * extra 可能是内联对象（每次渲染新引用），用 ref 固定，避免 context value 抖动。
 */
export const RoomCtxProvider = ({
  extra,
  children,
}: RoomCtxProviderProps) => {
  const layout = useMemo(() => new Engine(), []);
  const extraRef = useRef(extra);
  extraRef.current = extra;

  useEffect(() => {
    return () => {
      layout.destroy();
    };
  }, [layout]);

  const value = useMemo<RoomCtx>(() => {
    return {
      layout,
      get extra() {
        return extraRef.current;
      },
    };
  }, [layout]);

  return <ROOM_CTX.Provider value={value}>{children}</ROOM_CTX.Provider>;
};

/**
 * # useRoomCtx - 获取房间上下文
 * 必须在 <RoomCtxProvider> 内使用；未在 Provider 内时返回 null 并输出警告。
 */
export const useRoomCtx = (): RoomCtx | null => {
  const ctx = useContext(ROOM_CTX);
  if (!ctx) {
    console.warn("[vauid] useRoomCtx 必须在 <RoomCtxProvider> 内使用");
  }
  return ctx;
};

export type { RoomCtx } from "./types";
