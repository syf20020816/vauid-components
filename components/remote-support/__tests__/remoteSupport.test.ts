//! 远程支持单测
//! 运行：npx vitest run components/remote-support/__tests__/remoteSupport.test.ts
//! 覆盖：Pointer move 帧编解码 roundtrip（含边界与 f32 精度）、action JSON payload roundtrip、
//!       latest-wins 节流（注入调度器，node 环境无 rAF）、归一化（含零尺寸防护）、
//!       Pointer 帧经 CollabTransport 传输还原、Annotation 双 Y.Doc 同步、UndoManager、橡皮命中检测
//! 只测纯逻辑（无 DOM / React 渲染），直接 import 纯模块（不经 barrel，避免拉入组件文件）

import { describe, expect, it } from "vitest";
import * as Y from "yjs";
import {
  ANNOTATIONS_KEY,
  addAnnotation,
  advanceAnnotation,
  clearAnnotations,
  createAnnotationId,
  createAnnotationUndoManager,
  distToSegment,
  hitTestAnnotation,
  removeAnnotation,
  snapshotAnnotations,
  updateAnnotation,
  type Annotation,
} from "../annotationShapes";
import {
  createMoveThrottle,
  decodePointerAction,
  decodePointerMove,
  encodePointerAction,
  encodePointerMove,
  normalizePoint,
  type FrameScheduler,
  type PointerAction,
  type PointerMoveFrame,
} from "../pointerFrame";
import {
  CollabMessageTypes,
  createMemoryTransportPair,
  type CollabEnvelope,
} from "../../collab";

describe("pointerFrame / move 帧", () => {
  it("二进制 roundtrip：x/y/buttons 保真（f32 精确值）", () => {
    const frame: PointerMoveFrame = { x: 0.5, y: 0.25, buttons: 3 };
    expect(decodePointerMove(encodePointerMove(frame))).toEqual(frame);
  });

  it("边界值 0 / 1 与 buttons=0", () => {
    const frame: PointerMoveFrame = { x: 0, y: 1, buttons: 0 };
    expect(decodePointerMove(encodePointerMove(frame))).toEqual(frame);
    expect(decodePointerMove(encodePointerMove({ x: 1, y: 0, buttons: 255 }))).toEqual({
      x: 1,
      y: 0,
      buttons: 255,
    });
  });

  it("任意坐标按 f32 精度还原（误差 < 1e-6）", () => {
    const frame: PointerMoveFrame = { x: 0.123456, y: 0.987654, buttons: 1 };
    const decoded = decodePointerMove(encodePointerMove(frame));
    expect(decoded.x).toBeCloseTo(frame.x, 6);
    expect(decoded.y).toBeCloseTo(frame.y, 6);
    expect(decoded.buttons).toBe(1);
  });

  it("帧长固定 9 字节；不完整字节流解码抛错", () => {
    expect(encodePointerMove({ x: 0, y: 0, buttons: 0 }).byteLength).toBe(9);
    expect(() => decodePointerMove(new Uint8Array(8))).toThrow();
  });
});

describe("pointerFrame / action 帧", () => {
  it("JSON payload roundtrip：含 delta 的 wheel", () => {
    const action: PointerAction = {
      kind: "wheel",
      button: 0,
      x: 0.5,
      y: 0.5,
      deltaX: 10,
      deltaY: -20,
    };
    expect(decodePointerAction(encodePointerAction(action))).toEqual(action);
  });

  it("JSON payload roundtrip：无 delta 的 click（字段省略）", () => {
    const action: PointerAction = { kind: "click", button: 2, x: 0, y: 1 };
    const decoded = decodePointerAction(encodePointerAction(action));
    expect(decoded).toEqual(action);
    expect(decoded && "deltaX" in decoded).toBe(false);
  });

  it("非法负载返回 null（显示端静默丢弃）", () => {
    expect(decodePointerAction(null)).toBeNull();
    expect(decodePointerAction("boom")).toBeNull();
    expect(decodePointerAction({ kind: "boom", button: 0, x: 0, y: 0 })).toBeNull();
    expect(decodePointerAction({ kind: "click", button: "0", x: 0, y: 0 })).toBeNull();
    expect(decodePointerAction({ kind: "click", button: 0, x: 0 })).toBeNull();
  });
});

describe("pointerFrame / latest-wins 节流", () => {
  /** 测试用调度器：手动 flush，替代 node 环境不可用的 rAF */
  const createFakeScheduler = () => {
    let seq = 0;
    const pending = new Map<number, () => void>();
    const scheduler: FrameScheduler = {
      schedule: (cb) => {
        seq += 1;
        pending.set(seq, cb);
        return seq;
      },
      cancel: (handle) => {
        pending.delete(handle);
      },
    };
    return {
      scheduler,
      pendingCount: () => pending.size,
      flushAll: () => {
        // 真实调度器执行即出队：先取快照再清空，避免陈旧句柄混入 pendingCount
        const callbacks = Array.from(pending.values());
        pending.clear();
        for (const cb of callbacks) cb();
      },
    };
  };

  it("同帧内多次 move 只 flush 最新一帧（一次调度）", () => {
    const fake = createFakeScheduler();
    const flushed: PointerMoveFrame[] = [];
    const throttle = createMoveThrottle((frame) => flushed.push(frame), fake.scheduler);

    throttle.move({ x: 0.1, y: 0.1, buttons: 0 });
    throttle.move({ x: 0.2, y: 0.2, buttons: 1 });
    throttle.move({ x: 0.3, y: 0.3, buttons: 2 });
    expect(fake.pendingCount()).toBe(1);

    fake.flushAll();
    expect(flushed).toEqual([{ x: 0.3, y: 0.3, buttons: 2 }]);

    // flush 后再次 move 会重新排队
    throttle.move({ x: 0.4, y: 0.4, buttons: 0 });
    expect(fake.pendingCount()).toBe(1);
    fake.flushAll();
    expect(flushed).toEqual([
      { x: 0.3, y: 0.3, buttons: 2 },
      { x: 0.4, y: 0.4, buttons: 0 },
    ]);
  });

  it("cancel 取消未 flush 的任务并清空暂存", () => {
    const fake = createFakeScheduler();
    const flushed: PointerMoveFrame[] = [];
    const throttle = createMoveThrottle((frame) => flushed.push(frame), fake.scheduler);

    throttle.move({ x: 0.5, y: 0.5, buttons: 0 });
    throttle.cancel();
    expect(fake.pendingCount()).toBe(0);
    fake.flushAll();
    expect(flushed).toEqual([]);
  });
});

describe("pointerFrame / 归一化", () => {
  it("像素坐标 → 0-1，含边界与中点", () => {
    const rect = { left: 100, top: 50, width: 200, height: 100 };
    expect(normalizePoint(200, 100, rect)).toEqual({ x: 0.5, y: 0.5 });
    expect(normalizePoint(100, 50, rect)).toEqual({ x: 0, y: 0 });
    expect(normalizePoint(300, 150, rect)).toEqual({ x: 1, y: 1 });
  });

  it("零尺寸容器防护：返回原点不产生 NaN", () => {
    expect(normalizePoint(50, 50, { left: 0, top: 0, width: 0, height: 0 })).toEqual({
      x: 0,
      y: 0,
    });
  });
});

describe("pointerFrame / 经 CollabTransport 传输", () => {
  it("move 二进制帧与 action JSON 帧经内存通道均可还原（按 t === Pointer 过滤）", () => {
    const [tx, rx] = createMemoryTransportPair();
    const frames: PointerMoveFrame[] = [];
    const actions: PointerAction[] = [];
    const ignored: CollabEnvelope[] = [];
    rx.onMessage((envelope) => {
      if (envelope.t !== CollabMessageTypes.Pointer) {
        ignored.push(envelope);
        return;
      }
      if (envelope.payload instanceof Uint8Array) {
        frames.push(decodePointerMove(envelope.payload));
        return;
      }
      const action = decodePointerAction(envelope.payload);
      if (action) actions.push(action);
    });

    // 模拟 capture 端：move 走 unreliable，click 走 reliable
    tx.send(
      {
        v: 1,
        t: CollabMessageTypes.Pointer,
        seq: 0,
        ts: 0,
        payload: encodePointerMove({ x: 0.5, y: 0.25, buttons: 1 }),
      },
      { reliable: false },
    );
    tx.send(
      {
        v: 1,
        t: CollabMessageTypes.Pointer,
        seq: 1,
        ts: 0,
        payload: encodePointerAction({ kind: "click", button: 0, x: 0.5, y: 0.25 }),
      },
      { reliable: true },
    );
    // 其他消息类型不被指针层消费
    tx.send({ v: 1, t: CollabMessageTypes.Room, seq: 2, ts: 0, payload: null });

    expect(frames).toEqual([{ x: 0.5, y: 0.25, buttons: 1 }]);
    expect(actions).toEqual([{ kind: "click", button: 0, x: 0.5, y: 0.25 }]);
    expect(ignored).toHaveLength(1);
  });
});

/** 模拟桥的远端 apply origin（协作桥用内部 Symbol 标记远端事务，撤销栈据此过滤） */
const REMOTE_ORIGIN = Symbol("test-remote");

/** 双 doc 直连：一端事务产生的 update 以远端 origin apply 到对端（等价协作桥语义） */
const connectDocs = (a: Y.Doc, b: Y.Doc): void => {
  a.on("update", (update) => Y.applyUpdate(b, update, REMOTE_ORIGIN));
  b.on("update", (update) => Y.applyUpdate(a, update, REMOTE_ORIGIN));
};

const pen = (id: string, points: Array<{ x: number; y: number }>): Annotation => ({
  id,
  type: "pen",
  points,
  color: "#ff4d4f",
  size: 3,
});

const rect = (id: string): Annotation => ({
  id,
  type: "rect",
  points: [
    { x: 0.1, y: 0.1 },
    { x: 0.5, y: 0.6 },
  ],
  color: "#ff4d4f",
  size: 3,
});

describe("annotationShapes / helper", () => {
  it("id 批量唯一且保持 vauid-rs- 前缀", () => {
    const ids = Array.from({ length: 1000 }, () => createAnnotationId());
    expect(new Set(ids).size).toBe(1000);
    expect(ids[0].startsWith("vauid-rs-")).toBe(true);
  });

  it("add / remove / clear 按 id 操作 Y.Array，不存在的 id 忽略", () => {
    const doc = new Y.Doc();
    const yAnnotations = doc.getArray<Annotation>(ANNOTATIONS_KEY);
    addAnnotation(yAnnotations, pen("a", [{ x: 0, y: 0 }, { x: 1, y: 1 }]));
    addAnnotation(yAnnotations, rect("b"));
    expect(yAnnotations.length).toBe(2);

    removeAnnotation(yAnnotations, "a");
    expect(yAnnotations.length).toBe(1);
    expect(snapshotAnnotations(yAnnotations)[0].id).toBe("b");

    removeAnnotation(yAnnotations, "nope");
    expect(yAnnotations.length).toBe(1);

    clearAnnotations(yAnnotations);
    expect(yAnnotations.length).toBe(0);
    clearAnnotations(yAnnotations); // 空数组重复清空安全
  });

  it("updateAnnotation 按 id 定位整对象替换（transact delete+insert），同引用跳过", () => {
    const doc = new Y.Doc();
    const yAnnotations = doc.getArray<Annotation>(ANNOTATIONS_KEY);
    addAnnotation(yAnnotations, pen("a", [{ x: 0, y: 0 }]));
    addAnnotation(yAnnotations, pen("b", [{ x: 1, y: 1 }]));

    let updates = 0;
    yAnnotations.observe(() => {
      updates++;
    });

    updateAnnotation(yAnnotations, "a", (a) => ({ ...a, points: [...a.points, { x: 0.5, y: 0.5 }] }));
    const snapshot = snapshotAnnotations(yAnnotations);
    expect(snapshot[0].points).toEqual([{ x: 0, y: 0 }, { x: 0.5, y: 0.5 }]);
    expect(snapshot[1].id).toBe("b"); // 其他标注不受影响

    // 同引用：不产生事务
    const before = updates;
    updateAnnotation(yAnnotations, "a", (a) => a);
    expect(updates).toBe(before);

    // 不存在的 id：忽略
    updateAnnotation(yAnnotations, "nope", (a) => a);
    expect(updates).toBe(before);
  });
});

describe("annotationShapes / 双端同步", () => {
  it("A 端 add/update/remove 经 update 流同步到 B 端，读到的数组一致", () => {
    const docA = new Y.Doc();
    const docB = new Y.Doc();
    connectDocs(docA, docB);
    const annotationsA = docA.getArray<Annotation>(ANNOTATIONS_KEY);
    const annotationsB = docB.getArray<Annotation>(ANNOTATIONS_KEY);

    addAnnotation(annotationsA, pen("a", [{ x: 0, y: 0 }, { x: 1, y: 1 }]));
    expect(snapshotAnnotations(annotationsB)).toEqual(snapshotAnnotations(annotationsA));

    updateAnnotation(annotationsA, "a", (a) => ({ ...a, points: [...a.points, { x: 0.5, y: 0.5 }] }));
    expect(snapshotAnnotations(annotationsB)[0].points).toHaveLength(3);

    addAnnotation(annotationsA, rect("b"));
    removeAnnotation(annotationsA, "a");
    expect(snapshotAnnotations(annotationsB)).toEqual([rect("b")]);

    // B 端反向操作同样可达 A 端
    removeAnnotation(annotationsB, "b");
    expect(annotationsA.length).toBe(0);
  });

  it("离线并发写入，全量状态互通后两端收敛一致", () => {
    const docC = new Y.Doc();
    const docD = new Y.Doc();
    addAnnotation(docC.getArray<Annotation>(ANNOTATIONS_KEY), pen("c", [{ x: 0.1, y: 0.1 }]));
    addAnnotation(docD.getArray<Annotation>(ANNOTATIONS_KEY), pen("d", [{ x: 0.2, y: 0.2 }]));

    Y.applyUpdate(docC, Y.encodeStateAsUpdate(docD), REMOTE_ORIGIN);
    Y.applyUpdate(docD, Y.encodeStateAsUpdate(docC), REMOTE_ORIGIN);

    const jsonC = JSON.stringify(docC.getArray<Annotation>(ANNOTATIONS_KEY).toJSON());
    const jsonD = JSON.stringify(docD.getArray<Annotation>(ANNOTATIONS_KEY).toJSON());
    expect(jsonC).toBe(jsonD);
    expect(JSON.parse(jsonC)).toHaveLength(2);
  });
});

describe("annotationShapes / UndoManager", () => {
  it("add 两条 → undo 回退一条 → redo 恢复", () => {
    const doc = new Y.Doc();
    const yAnnotations = doc.getArray<Annotation>(ANNOTATIONS_KEY);
    // captureTimeout: 0 使两次写入各自成为独立撤销项（默认 500ms 会合并为一次）
    const undoManager = createAnnotationUndoManager(yAnnotations, 0);

    addAnnotation(yAnnotations, pen("a", [{ x: 0, y: 0 }]));
    addAnnotation(yAnnotations, pen("b", [{ x: 1, y: 1 }]));
    expect(yAnnotations.length).toBe(2);

    undoManager.undo();
    expect(yAnnotations.length).toBe(1);

    undoManager.redo();
    expect(yAnnotations.length).toBe(2);
  });

  it("一笔标注内的 add + 多次 update 合并为一个撤销项", () => {
    const doc = new Y.Doc();
    const yAnnotations = doc.getArray<Annotation>(ANNOTATIONS_KEY);
    const undoManager = createAnnotationUndoManager(yAnnotations); // 默认 captureTimeout：同步连续写入合并

    addAnnotation(yAnnotations, pen("a", [{ x: 0, y: 0 }]));
    updateAnnotation(yAnnotations, "a", (a) => ({ ...a, points: [...a.points, { x: 0.5, y: 0.5 }] }));
    updateAnnotation(yAnnotations, "a", (a) => ({ ...a, points: [...a.points, { x: 1, y: 1 }] }));
    expect(yAnnotations.length).toBe(1);

    undoManager.undo();
    expect(yAnnotations.length).toBe(0); // 整笔一起回退

    undoManager.redo();
    expect(yAnnotations.length).toBe(1);
    expect(snapshotAnnotations(yAnnotations)[0].points).toHaveLength(3);
  });

  it("clear 可撤销：清空后 undo 恢复全部标注", () => {
    const doc = new Y.Doc();
    const yAnnotations = doc.getArray<Annotation>(ANNOTATIONS_KEY);
    // captureTimeout: 0 使 clear 独立于 add 成为单独撤销项
    const undoManager = createAnnotationUndoManager(yAnnotations, 0);
    addAnnotation(yAnnotations, pen("a", [{ x: 0, y: 0 }]));
    addAnnotation(yAnnotations, pen("b", [{ x: 1, y: 1 }]));

    clearAnnotations(yAnnotations);
    expect(yAnnotations.length).toBe(0);

    undoManager.undo();
    expect(yAnnotations.length).toBe(2);
  });
});

describe("annotationShapes / 橡皮命中检测", () => {
  const tolerance = 0.02;

  it("pen：命中相邻采样点连线附近；远离不命中；单点为圆点", () => {
    const stroke: Annotation = {
      id: "p",
      type: "pen",
      points: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ],
      color: "#ff4d4f",
      size: 3,
    };
    expect(hitTestAnnotation(stroke, { x: 0.5, y: 0.01 }, tolerance)).toBe(true);
    expect(hitTestAnnotation(stroke, { x: 0.5, y: 0.05 }, tolerance)).toBe(false);

    const dot: Annotation = { ...stroke, points: [{ x: 0.5, y: 0.5 }] };
    expect(hitTestAnnotation(dot, { x: 0.505, y: 0.5 }, tolerance)).toBe(true);
    expect(hitTestAnnotation(dot, { x: 0.6, y: 0.5 }, tolerance)).toBe(false);
  });

  it("rect：命中轮廓边；内部空心处不命中", () => {
    const box = rect("r");
    expect(hitTestAnnotation(box, { x: 0.3, y: 0.1 }, tolerance)).toBe(true); // 上边
    expect(hitTestAnnotation(box, { x: 0.5, y: 0.6 }, tolerance)).toBe(true); // 角点附近
    expect(hitTestAnnotation(box, { x: 0.3, y: 0.35 }, tolerance)).toBe(false); // 内部
  });

  it("arrow：命中起终点连线；空 points 恒不命中", () => {
    const arrow: Annotation = {
      id: "a",
      type: "arrow",
      points: [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ],
      color: "#ff4d4f",
      size: 3,
    };
    expect(hitTestAnnotation(arrow, { x: 0.25, y: 0.25 }, tolerance)).toBe(true);
    expect(hitTestAnnotation(arrow, { x: 0.75, y: 0.25 }, tolerance)).toBe(false);
    expect(hitTestAnnotation({ ...arrow, points: [] }, { x: 0.25, y: 0.25 }, tolerance)).toBe(false);
  });

  it("ellipse：命中轮廓；内部空心与圆心不命中", () => {
    // 对角点 (0.2,0.1)-(0.8,0.5)：中心 (0.5,0.3)，半轴 rx 0.3 / ry 0.2
    const ellipse: Annotation = {
      id: "e",
      type: "ellipse",
      points: [
        { x: 0.2, y: 0.1 },
        { x: 0.8, y: 0.5 },
      ],
      color: "#ff4d4f",
      size: 3,
    };
    expect(hitTestAnnotation(ellipse, { x: 0.8, y: 0.3 }, tolerance)).toBe(true); // 右顶点
    expect(hitTestAnnotation(ellipse, { x: 0.5, y: 0.5 }, tolerance)).toBe(true); // 下顶点
    expect(hitTestAnnotation(ellipse, { x: 0.5, y: 0.49 }, tolerance)).toBe(true); // 轮廓内侧附近
    expect(hitTestAnnotation(ellipse, { x: 0.5, y: 0.3 }, tolerance)).toBe(false); // 圆心
    expect(hitTestAnnotation(ellipse, { x: 0.5, y: 0.44 }, tolerance)).toBe(false); // 内部空心
  });

  it("ellipse：单轴退化（成线段）按线段距离命中", () => {
    // rx 为 0：退化为竖直线段 (0.3,0.1)-(0.3,0.5)
    const flat: Annotation = {
      id: "f",
      type: "ellipse",
      points: [
        { x: 0.3, y: 0.1 },
        { x: 0.3, y: 0.5 },
      ],
      color: "#ff4d4f",
      size: 3,
    };
    expect(hitTestAnnotation(flat, { x: 0.31, y: 0.4 }, tolerance)).toBe(true);
    expect(hitTestAnnotation(flat, { x: 0.4, y: 0.3 }, tolerance)).toBe(false);
  });

  it("advanceAnnotation：pen 追加轨迹点；ellipse 尾点跟随首点固定", () => {
    const stroke: Annotation = {
      id: "p",
      type: "pen",
      points: [{ x: 0.1, y: 0.1 }],
      color: "#ff4d4f",
      size: 3,
    };
    expect(advanceAnnotation(stroke, { x: 0.2, y: 0.2 }).points).toEqual([
      { x: 0.1, y: 0.1 },
      { x: 0.2, y: 0.2 },
    ]);

    const ellipse: Annotation = {
      id: "e",
      type: "ellipse",
      points: [
        { x: 0.1, y: 0.1 },
        { x: 0.2, y: 0.2 },
      ],
      color: "#ff4d4f",
      size: 3,
    };
    expect(advanceAnnotation(ellipse, { x: 0.5, y: 0.4 }).points).toEqual([
      { x: 0.1, y: 0.1 },
      { x: 0.5, y: 0.4 },
    ]);
  });

  it("distToSegment：零长度线段退化为点距；投影截断到线段范围", () => {
    expect(distToSegment(1, 1, 2, 2, 2, 2)).toBe(Math.SQRT2);
    // 垂足落在线段外：取端点距离
    expect(distToSegment(0, 0, 1, 0, 3, 0)).toBe(1);
    // 垂足落在线段内：法向距离
    expect(distToSegment(2, 1, 1, 0, 3, 0)).toBe(1);
  });
});
