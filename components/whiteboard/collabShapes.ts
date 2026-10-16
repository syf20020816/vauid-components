//! 白板协作数据层（10.3c）
//! Y.Array<WhiteboardShape> 的增删改 helper + React 订阅 hook + 协作光标逻辑
//! 形状仍是纯 JSON（WhiteboardShape，不依赖 Konva / Y 类型），以「整对象 delete+insert」方式更新，
//! 定位一律按 shape.id（下标会因并发插入漂移，不可靠）
//! 本文件无组件导出（fast-refresh），可被纯 node 环境测试

import { useEffect, useMemo, useState, type RefObject } from "react";
import * as Y from "yjs";
import type { Awareness } from "y-protocols/awareness";
import type { WhiteboardShape } from "./types";

/** Y.Doc 内形状数组的固定 key（本地/协作两模式的模型一致：Y.Array<WhiteboardShape>） */
export const SHAPES_KEY = "shapes";

/** 形状 id 生成（本地/协作统一走这里，保证两种模式模型一致；仅在事件回调中调用，不在渲染期） */
let shapeIdSeq = 0;
export const createShapeId = (): string =>
  `vauid-wb-${++shapeIdSeq}-${Math.random().toString(36).slice(2, 8)}`;

/** 把 Y.Array 转成普通数组快照（元素为存储中的纯 JSON 形状，引用只读约定，不可原地修改） */
export const snapshotShapes = (
  yShapes: Y.Array<WhiteboardShape> | null | undefined,
): WhiteboardShape[] => (yShapes ? yShapes.toArray() : []);

/** 按 id 定位形状下标（找不到返回 -1） */
export const indexOfShape = (
  yShapes: Y.Array<WhiteboardShape>,
  id: string,
): number => yShapes.toArray().findIndex((s) => s.id === id);

/** 追加一个形状（触发 observe → 本端 React 订阅与远端同步） */
export const addShape = (
  yShapes: Y.Array<WhiteboardShape>,
  shape: WhiteboardShape,
): void => {
  yShapes.push([shape]);
};

/** 删除指定 id 的形状；不存在则忽略 */
export const removeShape = (
  yShapes: Y.Array<WhiteboardShape>,
  id: string,
): void => {
  const index = indexOfShape(yShapes, id);
  if (index < 0) return;
  yShapes.delete(index, 1);
};

/**
 * 更新指定 id 的形状：updater 收到存储中的形状（纯 JSON），返回新对象；
 * 返回同引用视为无变化，跳过写入。updater 必须纯（不可原地修改入参，会污染 Yjs 存储的共享引用）。
 * delete+insert 包在同一 transact 内：UndoManager 记为单项，网络层合并为一次 update
 */
export const updateShape = (
  yShapes: Y.Array<WhiteboardShape>,
  id: string,
  updater: (shape: WhiteboardShape) => WhiteboardShape,
): void => {
  const index = indexOfShape(yShapes, id);
  if (index < 0) return;
  const prev = yShapes.get(index);
  const next = updater(prev);
  if (next === prev) return;
  yShapes.doc?.transact(() => {
    yShapes.delete(index, 1);
    yShapes.insert(index, [next]);
  });
};

/** 清空全部形状（协作模式语义 = 删除全部，可被 UndoManager 撤销） */
export const clearShapes = (yShapes: Y.Array<WhiteboardShape>): void => {
  if (yShapes.length === 0) return;
  yShapes.delete(0, yShapes.length);
};

/**
 * 创建协作模式的撤销管理器：只跟踪形状数组上的本端事务（默认 trackedOrigins 为 null），
 * 远端经桥 apply 的数据（REMOTE_ORIGIN）不会进入撤销栈；一笔画内的连续更新
 * （add + 多次 update）在 captureTimeout 时间窗内合并为一个撤销项，
 * 等价本地模式「每笔一个历史快照」的语义
 */
export const createShapeUndoManager = (
  yShapes: Y.Array<WhiteboardShape>,
  captureTimeout = 500,
): Y.UndoManager =>
  new Y.UndoManager(yShapes, { captureTimeout });

/** useYShapes 返回句柄：渲染快照 + 变更操作 + 撤销管理器 */
export interface YShapesHandle {
  /** 渲染用快照（Y.Array 每次变更后的普通数组） */
  shapes: WhiteboardShape[];
  add(shape: WhiteboardShape): void;
  remove(id: string): void;
  update(id: string, updater: (shape: WhiteboardShape) => WhiteboardShape): void;
  clear(): void;
  /** 协作模式撤销/重做（调 undo()/redo() 后形状快照经 observe 回流） */
  undoManager: Y.UndoManager;
}

/**
 * # useYShapes - 订阅 Y.Array<WhiteboardShape> → 转出普通数组给渲染
 * yShapes 为 null（本地模式）时返回 null，不做任何订阅；
 * 快照经 observeDeep 回调触发 setState，形状的增删改一律通过返回的操作方法写入 Y.Array
 */
export const useYShapes = (
  yShapes: Y.Array<WhiteboardShape> | null | undefined,
): YShapesHandle | null => {
  const [shapes, setShapes] = useState<WhiteboardShape[]>(() =>
    snapshotShapes(yShapes),
  );

  useEffect(() => {
    if (!yShapes) return;
    // 挂载快照由 useState 惰性初始化提供（collab 引用约定稳定，此处只负责订阅）
    const handler = () => setShapes(snapshotShapes(yShapes));
    yShapes.observeDeep(handler);
    return () => {
      yShapes.unobserveDeep(handler);
    };
  }, [yShapes]);

  // 生命周期与使用方持有的 doc 绑定（组件卸载不销毁；StrictMode 双调用仅多一个闲置实例）
  const undoManager = useMemo(
    () => (yShapes ? createShapeUndoManager(yShapes) : null),
    [yShapes],
  );

  return useMemo(() => {
    if (!yShapes || !undoManager) return null;
    return {
      shapes,
      add: (shape) => {
        addShape(yShapes, shape);
      },
      remove: (id) => {
        removeShape(yShapes, id);
      },
      update: (id, updater) => {
        updateShape(yShapes, id, updater);
      },
      clear: () => {
        clearShapes(yShapes);
      },
      undoManager,
    };
  }, [yShapes, undoManager, shapes]);
};

/** 远端光标（渲染用） */
export interface RemoteCursor {
  /** awareness clientID（React key / 取色种子） */
  clientId: number;
  /** 0-1 归一化坐标（相对白板容器，与像素尺寸解耦） */
  x: number;
  y: number;
  /** 远端用户名（缺省不显示名牌） */
  name?: string;
}

/** 远端光标调色板（按 clientID 确定性取色，同一用户在各端颜色一致） */
export const CURSOR_COLORS = [
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
] as const;

/** 远端光标颜色：clientID 对调色板取模 */
export const cursorColor = (clientId: number): string =>
  CURSOR_COLORS[clientId % CURSOR_COLORS.length];

/**
 * 指针事件坐标 → 相对容器的 0-1 归一化坐标
 * 协作光标统一用归一化坐标广播（各端白板尺寸不同，像素坐标不可直接映射）
 */
export const normalizePointer = (
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
): { x: number; y: number } => ({
  x: rect.width > 0 ? (clientX - rect.left) / rect.width : 0,
  y: rect.height > 0 ? (clientY - rect.top) / rect.height : 0,
});

/** 本端光标上报节流间隔（pointermove 高频触发，~20Hz 足够光标流畅） */
const CURSOR_THROTTLE_MS = 50;

/** useCollabCursors 入参 */
export interface CollabCursorOptions {
  /** 协作 awareness（不传则无光标同步，本 hook 不做任何事） */
  awareness?: Awareness | null;
  /** 本端用户名（随光标广播，显示在远端名牌上；缺省不广播 name 字段） */
  name?: string;
  /** 白板容器 ref（pointermove 监听目标 + 归一化基准） */
  containerRef: RefObject<HTMLDivElement | null>;
}

/**
 * # useCollabCursors - 协作光标：本端上报 + 远端状态
 * 本端：容器 pointermove → 0-1 归一化 → awareness.setLocalStateField("cursor", ...)
 * 远端：订阅 awareness change，过滤本端后转出渲染快照
 * 卸载时仅清理本端 cursor 字段（awareness 实例生命周期归使用方管理）
 */
export const useCollabCursors = ({
  awareness,
  name,
  containerRef,
}: CollabCursorOptions): RemoteCursor[] => {
  const [remoteCursors, setRemoteCursors] = useState<RemoteCursor[]>([]);

  // 远端光标：awareness 变化（本地或远端）后全量重算，过滤掉本端 clientID
  useEffect(() => {
    if (!awareness) return;
    const collect = () => {
      const cursors: RemoteCursor[] = [];
      for (const [clientId, state] of Array.from(awareness.getStates())) {
        if (clientId === awareness.clientID) continue;
        const cursor = (state as { cursor?: { x: number; y: number; name?: string } | null })
          .cursor;
        if (!cursor) continue;
        cursors.push({ clientId, x: cursor.x, y: cursor.y, name: cursor.name });
      }
      setRemoteCursors(cursors);
    };
    collect();
    awareness.on("change", collect);
    return () => {
      awareness.off("change", collect);
      awareness.setLocalStateField("cursor", null);
    };
  }, [awareness]);

  // 本端光标上报：挂在白板容器上（Stage 收缩只读时仍可看到光标移动）
  useEffect(() => {
    if (!awareness) return;
    const el = containerRef.current;
    if (!el) return;
    let lastSentAt = 0;
    const onMove = (e: PointerEvent) => {
      const now = Date.now();
      if (now - lastSentAt < CURSOR_THROTTLE_MS) return;
      lastSentAt = now;
      const { x, y } = normalizePointer(e.clientX, e.clientY, el.getBoundingClientRect());
      awareness.setLocalStateField("cursor", name ? { x, y, name } : { x, y });
    };
    el.addEventListener("pointermove", onMove);
    return () => {
      el.removeEventListener("pointermove", onMove);
    };
  }, [awareness, name, containerRef]);

  return remoteCursors;
};
