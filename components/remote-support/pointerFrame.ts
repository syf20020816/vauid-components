//! 远程指针帧编解码与节流（12.2，不经 Yjs 的瞬时控制流）
//! move 帧：定长二进制 [x: f32 LE][y: f32 LE][buttons: u8]，坐标 0-1 归一化，
//!          unreliable + latest-wins（每帧最多发一帧，可丢帧低延迟）
//! action 帧：JSON 负载 { kind, button, x, y, deltaX?, deltaY? }，reliable 低频可靠事件
//! 本文件纯 TS 无 React，可被 node 环境测试；collab 基座不感知该业务帧格式

/** move 帧负载（二进制定长 9 字节） */
export interface PointerMoveFrame {
  /** 0-1 归一化横坐标（相对 capture 区域 rect） */
  x: number;
  /** 0-1 归一化纵坐标 */
  y: number;
  /** PointerEvent.buttons 位掩码（按下键位状态随 move 帧携带） */
  buttons: number;
}

/** move 帧字节数：f32 * 2 + u8 */
export const POINTER_MOVE_FRAME_BYTES = 9;

/** move 帧编码（decodePointerMove 的逆操作）：f32 小端 + u8，坐标按调用方已归一化的值直写 */
export const encodePointerMove = (frame: PointerMoveFrame): Uint8Array => {
  const bytes = new Uint8Array(POINTER_MOVE_FRAME_BYTES);
  const view = new DataView(bytes.buffer);
  view.setFloat32(0, frame.x, true);
  view.setFloat32(4, frame.y, true);
  bytes[8] = frame.buttons & 0xff;
  return bytes;
};

/** move 帧解码（encodePointerMove 的逆操作）；字节流不完整视为协议错误抛出 */
export const decodePointerMove = (bytes: Uint8Array): PointerMoveFrame => {
  if (bytes.byteLength < POINTER_MOVE_FRAME_BYTES) {
    throw new Error("[remote-support] pointer move 帧不完整：至少 9 字节");
  }
  // DataView 带偏移量构造：容忍传输层给出的 subarray 视图
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { x: view.getFloat32(0, true), y: view.getFloat32(4, true), buttons: bytes[8] };
};

/** 可靠指针动作类型（leave：指针离开 capture 区域，显示端据此隐藏光标） */
export type PointerActionKind = "click" | "down" | "up" | "wheel" | "leave";

/** action 帧负载（JSON 安全值，走 reliable 通道） */
export interface PointerAction {
  kind: PointerActionKind;
  /** PointerEvent.button（-1 表示无键，leave 用） */
  button: number;
  /** 0-1 归一化坐标 */
  x: number;
  y: number;
  /** wheel 专用：滚动增量 */
  deltaX?: number;
  deltaY?: number;
}

/** 合法 action kind 集合（解码校验用） */
const ACTION_KINDS: ReadonlySet<string> = new Set<string>([
  "click",
  "down",
  "up",
  "wheel",
  "leave",
]);

/** action 帧编码：产出 JSON 安全负载（省略未设置的 delta 字段，保持负载精简） */
export const encodePointerAction = (action: PointerAction): Record<string, unknown> => {
  const payload: Record<string, unknown> = {
    kind: action.kind,
    button: action.button,
    x: action.x,
    y: action.y,
  };
  if (action.deltaX !== undefined) payload.deltaX = action.deltaX;
  if (action.deltaY !== undefined) payload.deltaY = action.deltaY;
  return payload;
};

/** action 帧解码：格式不合法返回 null（显示端静默丢弃脏帧，不做协议级报错） */
export const decodePointerAction = (payload: unknown): PointerAction | null => {
  if (typeof payload !== "object" || payload === null) return null;
  const raw = payload as Record<string, unknown>;
  if (typeof raw.kind !== "string" || !ACTION_KINDS.has(raw.kind)) return null;
  if (typeof raw.button !== "number" || typeof raw.x !== "number" || typeof raw.y !== "number") {
    return null;
  }
  const action: PointerAction = { kind: raw.kind as PointerActionKind, button: raw.button, x: raw.x, y: raw.y };
  if (typeof raw.deltaX === "number") action.deltaX = raw.deltaX;
  if (typeof raw.deltaY === "number") action.deltaY = raw.deltaY;
  return action;
};

/**
 * 事件坐标 → 相对基准 rect 的 0-1 归一化坐标
 * 各端显示尺寸不同，指针统一以归一化坐标传输（与白板协作光标同构）
 */
export const normalizePoint = (
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
): { x: number; y: number } => ({
  x: rect.width > 0 ? (clientX - rect.left) / rect.width : 0,
  y: rect.height > 0 ? (clientY - rect.top) / rect.height : 0,
});

/** 帧调度器抽象：浏览器用 rAF 实现，测试注入手动调度器（node 环境无 rAF） */
export interface FrameScheduler {
  /** 排一个回调，返回句柄 */
  schedule(cb: () => void): number;
  /** 按句柄取消（幂等） */
  cancel(handle: number): void;
}

/** 浏览器默认调度器：requestAnimationFrame 对齐渲染帧 */
export const createRafScheduler = (): FrameScheduler => ({
  schedule: (cb) => requestAnimationFrame(cb),
  cancel: (handle) => cancelAnimationFrame(handle),
});

/** createMoveThrottle 返回句柄 */
export interface MoveThrottle {
  /** 提交一帧：同帧内多次调用只保留最新值（latest-wins） */
  move(frame: PointerMoveFrame): void;
  /** 取消未 flush 的任务并清空暂存（卸载时调用） */
  cancel(): void;
}

/**
 * # createMoveThrottle - move 帧 latest-wins 节流
 * 每个渲染帧最多 flush 一次，flush 的永远是最新帧（中间帧直接覆盖丢弃），
 * 与远程桌面「只发最新值」的业界做法一致；调度器可注入（测试 / SSR 环境）。
 */
export const createMoveThrottle = (
  flush: (frame: PointerMoveFrame) => void,
  scheduler: FrameScheduler,
): MoveThrottle => {
  let pending: PointerMoveFrame | null = null;
  let handle: number | null = null;
  const flushPending = () => {
    handle = null;
    const frame = pending;
    pending = null;
    if (frame) flush(frame);
  };
  return {
    move(frame) {
      pending = frame;
      if (handle === null) {
        handle = scheduler.schedule(flushPending);
      }
    },
    cancel() {
      if (handle !== null) {
        scheduler.cancel(handle);
        handle = null;
      }
      pending = null;
    },
  };
};
