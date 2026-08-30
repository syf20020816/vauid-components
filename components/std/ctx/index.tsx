import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { Engine } from "../../layout/engine";
import { ROOM_CTX } from "./context";
import type { RoomCtx } from "./types";

export interface RoomCtxProviderProps {
  /** 使用者需要放入上下文的额外数据（子组件可通过 useRoomCtx 读取） */
  extra?: RoomCtx["extra"];
  children?: ReactNode;
}

/**
 * # RoomCtxProvider - 房间上下文提供者
 * 创建并持有唯一的布局引擎实例，卸载时销毁。
 * extra 通过 effect 同步到 ref（React Compiler 禁止渲染期写 ref），getter 读取最新值。
 *
 * context 与 useRoomCtx 分别位于 context.ts / hooks.ts（Fast Refresh 要求组件文件只导出组件）。
 */
export const RoomCtxProvider = ({
  extra,
  children,
}: RoomCtxProviderProps) => {
  const layout = useMemo(() => new Engine(), []);
  const extraRef = useRef(extra);

  // extra 可能是内联对象（每次渲染新引用），用 ref 固定供 getter 读取，避免 context value 抖动
  useEffect(() => {
    extraRef.current = extra;
  }, [extra]);

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
