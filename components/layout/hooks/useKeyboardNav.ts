import { useEffect, useRef } from "react";
import { useRoomCtx } from "../../std/ctx/hooks";
import type { Engine } from "../engine";
import type { ShortcutAction, ShortcutBindings } from "../shortcut";
import { matchEvent } from "../shortcut";

export interface UseKeyboardNavOptions {
  /** 键位绑定表；空数组的 action 视为禁用该动作 */
  bindings: ShortcutBindings;
  /** 是否启用监听，默认 true */
  enabled?: boolean;
}

function dispatchAction(engine: Engine, action: ShortcutAction) {
  switch (action) {
    case "pagePrev":
      engine.prevPage();
      break;
    case "pageNext":
      engine.nextPage();
      break;
    case "focusNext":
      engine.focusNext();
      break;
    case "focusPrev":
      engine.focusPrev();
      break;
    case "toggleLayout":
      engine.cycleLayoutMode();
      break;
  }
}

/** 输入控件内按键直通，不触发导航 */
function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return (
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.tagName === "SELECT" ||
    el.isContentEditable === true
  );
}

/**
 * # useKeyboardNav - 键盘导航
 * window keydown 监听：matchEvent 命中绑定键位后 preventDefault 并分发引擎动作。
 * 引擎取自 RoomCtx（须在 RoomCtxProvider 内使用）。
 *
 * 供 MeetingRoom 默认挂载，也可独立使用；绑定为空数组即禁用对应动作。
 */
export function useKeyboardNav({
  bindings,
  enabled = true,
}: UseKeyboardNavOptions) {
  const { layout: engine } = useRoomCtx() ?? {};
  // 绑定表经 ref 读取，键位变更不触发监听重挂
  const bindingsRef = useRef(bindings);

  useEffect(() => {
    bindingsRef.current = bindings;
  }, [bindings]);

  useEffect(() => {
    if (!enabled || !engine) return;
    const onKeyDown = (ev: KeyboardEvent) => {
      if (isEditableTarget(ev.target)) return;
      const current = bindingsRef.current;
      for (const action of Object.keys(current) as ShortcutAction[]) {
        for (const binding of current[action]) {
          if (!matchEvent(ev, binding)) continue;
          ev.preventDefault();
          dispatchAction(engine, action);
          return;
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, engine]);
}
