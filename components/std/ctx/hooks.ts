import { useCallback, useContext, useSyncExternalStore } from "react";
import { ROOM_CTX } from "./context";
import { DeviceTypes, LifeTimes } from "../../layout/types";

/** 视口回退判定的默认断点，与引擎 DEFAULT_MOBILE_BREAKPOINT 一致 */
const FALLBACK_MOBILE_BREAKPOINT = 768;

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

/**
 * # useRoomCtxLayout - 获取房间布局的响应式状态
 *
 * 引擎是命令式对象，渲染期直读 getState() 只能拿到快照且不会触发重渲染，
 * 因此通过 useSyncExternalStore 订阅引擎事件（onResize / onUpdate），
 * 在 deviceType 等状态变化时驱动组件重渲染。
 *
 * deviceType 判定来源：
 * - 引擎已 init（有布局容器）：以容器宽度为准（引擎内自动同步）
 * - 引擎未 init（无布局场景，如单独使用 Controller）：回退按视口宽度判定
 */
export const useRoomCtxLayout = () => {
  const layout = useRoomCtx()?.layout;

  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!layout) return () => {};
      const handler = () => onChange();
      layout.on(LifeTimes.onResize, handler);
      layout.on(LifeTimes.onUpdate, handler);
      // 覆盖引擎未 init 阶段的视口宽度变化；引擎 init 后快照不变，useSyncExternalStore 会自动跳过
      window.addEventListener("resize", handler);
      return () => {
        layout.off(LifeTimes.onResize, handler);
        layout.off(LifeTimes.onUpdate, handler);
        window.removeEventListener("resize", handler);
      };
    },
    [layout],
  );

  const getSnapshot = useCallback(() => {
    const state = layout?.getState();
    if (!state) return undefined;
    // 引擎尚未绑定容器（width/height 均为 0）：回退用视口宽度判定
    if (!state.width && !state.height) {
      const breakpoint = state.mobileBreakpoint ?? FALLBACK_MOBILE_BREAKPOINT;
      return window.innerWidth < breakpoint
        ? DeviceTypes.Mobile
        : DeviceTypes.Desktop;
    }
    return state.deviceType;
  }, [layout]);

  const deviceType = useSyncExternalStore(subscribe, getSnapshot);

  return {
    deviceType,
  };
};
