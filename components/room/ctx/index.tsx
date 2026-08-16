import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import type { ConnectOptions, RoomAdapter } from "../types";

export interface RoomProviderProps {
  /** 房间适配器实例（如 new LiveKitAdapter(room)） */
  adapter: RoomAdapter;
  /** 未连接时自动 connect 所需参数；已连接的适配器可不传 */
  connectOptions?: ConnectOptions;
  children?: ReactNode;
}

/**
 * # RoomCtx - 房间上下文
 * 向子组件提供 RoomAdapter 实例。
 * 挂载时连接房间（幂等），卸载时断开连接并清理资源。
 */
const RoomCtx = createContext<RoomAdapter | null>(null);

export const RoomProvider = ({
  adapter,
  connectOptions,
  children,
}: RoomProviderProps) => {
  const ctxValue = useMemo(() => adapter, [adapter]);
  // connectOptions 可能是内联对象（每次渲染新引用），用 ref 固定，避免触发重连
  const connectOptionsRef = useRef(connectOptions);
  connectOptionsRef.current = connectOptions;

  // 生命周期：挂载连接、卸载断开（均容错，不影响渲染）
  useEffect(() => {
    adapter.connect(connectOptionsRef.current).catch((err) => {
      console.error("[vauid] RoomProvider connect 失败：", err);
    });
    return () => {
      adapter.disconnect().catch((err) => {
        console.error("[vauid] RoomProvider disconnect 失败：", err);
      });
    };
  }, [adapter]);

  return <RoomCtx.Provider value={ctxValue}>{children}</RoomCtx.Provider>;
};

/**
 * # useRoomCtx - 获取房间适配器
 * 必须在 <RoomProvider> 内使用；未在 Provider 内时返回 null 并输出警告。
 */
export const useRoomCtx = <A extends RoomAdapter = RoomAdapter>(): A | null => {
  const ctx = useContext(RoomCtx);
  if (!ctx) {
    console.warn("[vauid] useRoomCtx 必须在 <RoomProvider> 内使用");
  }
  return ctx as A | null;
};
