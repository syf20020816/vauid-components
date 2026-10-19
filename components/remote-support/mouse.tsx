//! MouseMapper 远程指针映射（12.2，不经 Yjs）
//! capture：捕获本端指针 → 0-1 归一化 → move 走二进制帧（reliable=false，rAF 对齐 latest-wins
//!          节流 ~60Hz）；click/down/up/wheel/leave 低频动作走 JSON 帧（reliable=true）
//! display：渲染远端光标——60Hz move 帧用 ref 直改 transform（不经 React 渲染，state 只承载
//!          name 等低频信息）；可靠动作经 onAction 回调交给使用方决定是否真实执行
//! Pointer 帧直走 CollabTransport 的 Pointer envelope，不经 Yjs（瞬时动作非共享状态，需可丢帧）

import { useEffect, useRef } from "react";
import {
  CollabMessageTypes,
  createSeq,
  type CollabEnvelope,
  type CollabTransport,
} from "../collab";
import { useCls } from "../std/hooks/cls";
import {
  POINTER_MOVE_FRAME_BYTES,
  createMoveThrottle,
  createRafScheduler,
  decodePointerAction,
  decodePointerMove,
  encodePointerAction,
  encodePointerMove,
  normalizePoint,
  type PointerAction,
  type PointerActionKind,
  type PointerMoveFrame,
} from "./pointerFrame";
import "./index.scss";

/** display 端远端光标颜色（单一 capture 对端，固定高可见度色） */
const POINTER_CURSOR_COLOR = "#f59e0b";

export interface MouseMapperProps {
  transport: CollabTransport;
  /**
   * capture：在自身区域捕获指针事件并外发；display：显示远端指针 + 接收可靠动作回调
   */
  role: "capture" | "display";
  /** display 模式：可靠指针动作回调（使用方决定是否真实执行，组件库不注入输入） */
  onAction?: (action: PointerAction) => void;
  /** display 模式：远端指针名牌文字（capture 端名字） */
  name?: string;
  className?: string;
}

/**
 * # MouseMapper - 远程指针映射（双角色单组件）
 * 根元素 absolute inset-0 且两种角色都不拦截指针（pointer-events: none）：
 * - capture 的事件监听挂在父容器上冒泡捕获，归一化基准是自身 rect（getBoundingClientRect
 *   在事件时实时读取，resize 天然跟随），并按自身边界过滤越界事件——这样标注层等上层
 *   元素的事件同样被映射，远程指针映射与本地标注输入可在同一容器并存；
 * - display 纯视觉叠加，光标位置直改 DOM transform，不走 React 渲染路径
 */
export const MouseMapper = ({ transport, role, onAction, name, className }: MouseMapperProps) => {
  const { cls, vcls } = useCls("mouse-mapper", className);
  const rootRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  // 容器 CSS 尺寸（归一化 → 像素换算用；ResizeObserver 跟踪，避免每帧读布局）
  const sizeRef = useRef({ width: 0, height: 0 });
  // 最近一帧（resize 后按新尺寸重新换算位置）
  const lastFrameRef = useRef<PointerMoveFrame | null>(null);
  // onAction 走 ref：回调身份变化不触发 transport 重订阅
  const onActionRef = useRef(onAction);
  useEffect(() => {
    onActionRef.current = onAction;
  }, [onAction]);

  /** 把一帧直接写到光标 DOM（60Hz 路径，React 不参与） */
  const applyFrame = (frame: PointerMoveFrame) => {
    const el = cursorRef.current;
    if (!el) return;
    const { width, height } = sizeRef.current;
    el.style.transform = `translate(${frame.x * width}px, ${frame.y * height}px)`;
    el.style.opacity = "1";
  };

  // display 模式：容器尺寸跟踪 + transport 订阅
  useEffect(() => {
    if (role !== "display") return;
    const el = rootRef.current;
    if (!el) return;
    const updateSize = () => {
      sizeRef.current = { width: el.clientWidth, height: el.clientHeight };
      const last = lastFrameRef.current;
      if (last) applyFrame(last);
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, [role]);

  useEffect(() => {
    if (role !== "display") return;
    const off = transport.onMessage((envelope) => {
      if (envelope.t !== CollabMessageTypes.Pointer) return;
      const payload = envelope.payload;
      if (payload instanceof Uint8Array) {
        // 二进制 move 帧：字节残缺直接忽略（unreliable 通道的脏帧不值得报错）
        if (payload.byteLength < POINTER_MOVE_FRAME_BYTES) return;
        const frame = decodePointerMove(payload);
        lastFrameRef.current = frame;
        applyFrame(frame);
        return;
      }
      // JSON action 帧：格式不合法丢弃；leave 隐藏光标，其余动作同步光标位置
      const action = decodePointerAction(payload);
      if (!action) return;
      if (action.kind === "leave") {
        lastFrameRef.current = null;
        const el = cursorRef.current;
        if (el) el.style.opacity = "0";
      } else {
        const frame = { x: action.x, y: action.y, buttons: 0 };
        lastFrameRef.current = frame;
        applyFrame(frame);
      }
      onActionRef.current?.(action);
    });
    return off;
  }, [role, transport]);

  // capture 模式：父容器冒泡捕获（自身 pointer-events: none 不拦截上层标注元素）
  useEffect(() => {
    if (role !== "capture") return;
    const root = rootRef.current;
    const host = root?.parentElement ?? root;
    if (!root || !host) return;
    const nextSeq = createSeq();
    const send = (payload: CollabEnvelope["payload"], reliable: boolean) => {
      try {
        transport.send(
          { v: 1, t: CollabMessageTypes.Pointer, seq: nextSeq(), ts: Date.now(), payload },
          { reliable },
        );
      } catch {
        // 通道已关闭等瞬态错误：卸载竞态下静默，不向事件回调抛错
      }
    };
    // move：unreliable 二进制帧 + rAF 对齐 latest-wins（每渲染帧最多一帧）
    const throttle = createMoveThrottle(
      (frame) => send(encodePointerMove(frame), false),
      createRafScheduler(),
    );
    let inside = false;
    let lastPoint = { x: 0, y: 0 };
    const inBounds = (e: MouseEvent) => {
      const rect = root.getBoundingClientRect();
      return (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      );
    };
    const sendLeave = () => {
      if (!inside) return;
      inside = false;
      send(encodePointerAction({ kind: "leave", button: -1, x: lastPoint.x, y: lastPoint.y }), true);
    };
    const sendAction = (kind: PointerActionKind, e: MouseEvent, extra?: { deltaX?: number; deltaY?: number }) => {
      e.preventDefault();
      lastPoint = normalizePoint(e.clientX, e.clientY, root.getBoundingClientRect());
      inside = true;
      send(
        encodePointerAction({ kind, button: e.button, x: lastPoint.x, y: lastPoint.y, ...extra }),
        true,
      );
    };
    const onMove = (e: PointerEvent) => {
      if (!inBounds(e)) {
        sendLeave();
        return;
      }
      inside = true;
      e.preventDefault();
      lastPoint = normalizePoint(e.clientX, e.clientY, root.getBoundingClientRect());
      throttle.move({ ...lastPoint, buttons: e.buttons });
    };
    const onDown = (e: PointerEvent) => {
      if (!inBounds(e)) return;
      sendAction("down", e);
    };
    const onUp = (e: PointerEvent) => {
      if (!inBounds(e)) return;
      sendAction("up", e);
    };
    const onClick = (e: MouseEvent) => {
      if (!inBounds(e)) return;
      sendAction("click", e);
    };
    const onWheel = (e: WheelEvent) => {
      if (!inBounds(e)) return;
      // wheel 需非被动监听才能 preventDefault（阻止本地视图滚动，滚动发往远端）
      sendAction("wheel", e, { deltaX: e.deltaX, deltaY: e.deltaY });
    };
    const onLeave = () => sendLeave();
    const onContextMenu = (e: MouseEvent) => {
      if (inBounds(e)) e.preventDefault();
    };

    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerdown", onDown);
    host.addEventListener("pointerup", onUp);
    host.addEventListener("click", onClick);
    host.addEventListener("wheel", onWheel, { passive: false });
    host.addEventListener("pointerleave", onLeave);
    host.addEventListener("contextmenu", onContextMenu);
    return () => {
      throttle.cancel();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerdown", onDown);
      host.removeEventListener("pointerup", onUp);
      host.removeEventListener("click", onClick);
      host.removeEventListener("wheel", onWheel);
      host.removeEventListener("pointerleave", onLeave);
      host.removeEventListener("contextmenu", onContextMenu);
    };
  }, [role, transport]);

  return (
    <div ref={rootRef} className={cls}>
      {role === "display" ? (
        <div ref={cursorRef} className={vcls("cursor")} style={{ opacity: 0 }}>
          {/* 箭头点：与白板远程光标同款三角形 */}
          <svg width="12" height="16" viewBox="0 0 12 16" aria-hidden="true">
            <polygon
              points="0,0 0,14 10,9"
              fill={POINTER_CURSOR_COLOR}
              stroke="#ffffff"
              strokeWidth="1"
            />
          </svg>
          {name ? <span className={vcls("cursor-name")}>{name}</span> : null}
        </div>
      ) : null}
    </div>
  );
};
