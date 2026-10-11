import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { Areas, type LayoutNode, type LayoutNodes } from "../types";

/** 长按时长（ms），按住超过该时间进入拖拽态 */
const LONG_PRESS_MS = 250;
/** 长按等待期内位移超过该值（px）判定为普通滑动，取消拖拽 */
const MOVE_CANCEL_PX = 6;

export interface TileDragSortOptions {
  /** 是否启用（未启用时不绑定任何指针事件） */
  enabled: boolean;
  /** 松手提交：dragId 移动到目标 tile 的视觉索引 */
  onDrop?: (dragId: string, toIndex: number) => void;
  /** 当前节点表，用于把目标 tile id 换算为视觉索引 */
  nodes: LayoutNodes;
}

/** 绑定到 Tile 的指针事件 props（未启用的 Tile 返回空对象） */
export interface TilePointerProps {
  onPointerDown?: (ev: ReactPointerEvent<HTMLDivElement>) => void;
  style?: CSSProperties;
}

/**
 * # useTileDragSort - Tile 长按拖拽排序状态机
 *
 * 流程：pointerdown 记录起点并启动 250ms 长按定时器（等待期内位移超阈值取消）→
 * 进入拖拽态（指针捕获 + 屏蔽 contextmenu）→ pointermove 经
 * elementFromPoint + closest('[data-layout-entity-id]') 定位目标 tile →
 * pointerup 提交 onDrop(dragId, 目标视觉索引) 并清理。
 *
 * 返回值：draggingId / targetId 驱动渲染反馈（源 tile 半透明、目标 tile 指示器），
 * tileProps 供每个 Grid 可见 Tile 绑定指针事件。
 * 所有拖拽状态在事件处理器内经 ref 读写，渲染期不写 ref。
 */
export function useTileDragSort({
  enabled,
  onDrop,
  nodes,
}: TileDragSortOptions) {
  // 拖拽反馈走 state 驱动渲染；事件处理器内的实时值走 ref，避免陈旧闭包
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const draggingRef = useRef(false);
  const dragIdRef = useRef<string | null>(null);
  const targetIdRef = useRef<string | null>(null);
  const pressRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    timer: number;
  } | null>(null);
  const nodesRef = useRef(nodes);
  const onDropRef = useRef(onDrop);
  const handlersRef = useRef<{
    move: (ev: PointerEvent) => void;
    up: () => void;
    menu: (ev: MouseEvent) => void;
  } | null>(null);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    onDropRef.current = onDrop;
  }, [onDrop]);

  /** 拖拽/长按期间屏蔽右键菜单（部分平台长按会触发 contextmenu） */
  const onContextMenuBlock = useCallback((ev: MouseEvent) => {
    if (draggingRef.current || pressRef.current) ev.preventDefault();
  }, []);

  const onWindowMove = useCallback((ev: PointerEvent) => {
    if (!draggingRef.current) {
      const press = pressRef.current;
      if (!press) return;
      // 长按等待期内位移超阈值：判定为普通滑动，取消本次拖拽
      if (
        Math.hypot(ev.clientX - press.startX, ev.clientY - press.startY) >
        MOVE_CANCEL_PX
      ) {
        window.clearTimeout(press.timer);
        pressRef.current = null;
      }
      return;
    }
    // 拖拽态：命中测试定位目标 tile（悬停源 tile 视为无目标）
    const el = document.elementFromPoint(ev.clientX, ev.clientY);
    const hit = el?.closest("[data-layout-entity-id]");
    const id = hit?.getAttribute("data-layout-entity-id") ?? null;
    const next = id && id !== dragIdRef.current ? id : null;
    if (next !== targetIdRef.current) {
      targetIdRef.current = next;
      setTargetId(next);
    }
  }, []);

  const removeListeners = useCallback(() => {
    const handlers = handlersRef.current;
    if (!handlers) return;
    handlersRef.current = null;
    window.removeEventListener("pointermove", handlers.move);
    window.removeEventListener("pointerup", handlers.up);
    window.removeEventListener("pointercancel", handlers.up);
    window.removeEventListener("contextmenu", handlers.menu);
  }, []);

  /** 提交换位并结束拖拽 */
  const commitAndEnd = useCallback(() => {
    const dragId = dragIdRef.current;
    const droppedOn = targetIdRef.current;
    if (dragId && droppedOn) {
      const visible = Array.from(nodesRef.current.values()).filter(
        (n) => n.area === Areas.Grid && !n.hidden,
      );
      const toIndex = visible.findIndex((n) => n.entity.id === droppedOn);
      if (toIndex >= 0) onDropRef.current?.(dragId, toIndex);
    }
    removeListeners();
    draggingRef.current = false;
    dragIdRef.current = null;
    targetIdRef.current = null;
    pressRef.current = null;
    setDraggingId(null);
    setTargetId(null);
  }, [removeListeners]);

  const onWindowUp = useCallback(() => {
    if (!draggingRef.current) {
      // 长按触发前的松手：取消定时器，视为普通点击
      const press = pressRef.current;
      if (press) window.clearTimeout(press.timer);
      pressRef.current = null;
      removeListeners();
      return;
    }
    commitAndEnd();
  }, [commitAndEnd, removeListeners]);

  const attachListeners = useCallback(() => {
    if (handlersRef.current) return;
    const handlers = {
      move: onWindowMove,
      up: onWindowUp,
      menu: onContextMenuBlock,
    };
    handlersRef.current = handlers;
    window.addEventListener("pointermove", handlers.move);
    window.addEventListener("pointerup", handlers.up);
    window.addEventListener("pointercancel", handlers.up);
    window.addEventListener("contextmenu", handlers.menu);
  }, [onContextMenuBlock, onWindowMove, onWindowUp]);

  const beginPress = useCallback(
    (id: string, ev: ReactPointerEvent<HTMLDivElement>) => {
      if (
        !enabled ||
        ev.button !== 0 ||
        draggingRef.current ||
        pressRef.current
      ) {
        return;
      }
      // 指针捕获：后续 move/up 即使移出 tile 也持续送达
      try {
        ev.currentTarget.setPointerCapture(ev.pointerId);
      } catch {
        // 指针已释放等场景忽略
      }
      const timer = window.setTimeout(() => {
        pressRef.current = null;
        draggingRef.current = true;
        dragIdRef.current = id;
        targetIdRef.current = null;
        setDraggingId(id);
        setTargetId(null);
      }, LONG_PRESS_MS);
      pressRef.current = {
        id,
        startX: ev.clientX,
        startY: ev.clientY,
        timer,
      };
      // 挂载即监听：等待期内负责取消判定，激活后负责定位目标
      attachListeners();
    },
    [attachListeners, enabled],
  );

  // 卸载兜底清理（拖拽中途卸载时移除 window 监听）
  useEffect(
    () => () => {
      const press = pressRef.current;
      if (press) window.clearTimeout(press.timer);
      pressRef.current = null;
      removeListeners();
    },
    [removeListeners],
  );

  const tileProps = useCallback(
    (node: LayoutNode): TilePointerProps => {
      // 仅 Grid 布局的可见 Tile 支持拖拽
      if (!enabled || node.area !== Areas.Grid || node.hidden) return {};
      return {
        onPointerDown: (ev) => beginPress(node.entity.id, ev),
        // 触摸设备上禁用默认手势，避免长按拖拽被滚动打断
        style: { touchAction: "none" },
      };
    },
    [beginPress, enabled],
  );

  return { draggingId, targetId, tileProps };
}
