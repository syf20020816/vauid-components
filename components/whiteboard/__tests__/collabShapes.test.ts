//! 白板协作数据层单测
//! 运行：npx vitest run components/whiteboard/__tests__/collabShapes.test.ts
//! 覆盖：helper 增删改、id 唯一性、双 Y.Doc 形状同步（原生 encodeStateAsUpdate/applyUpdate
//!       模拟传输，不经 collab 桥——桥已另有测试）、UndoManager 撤销/重做、归一化坐标

import { describe, expect, it } from "vitest";
import * as Y from "yjs";
import {
  SHAPES_KEY,
  addShape,
  clearShapes,
  createShapeId,
  createShapeUndoManager,
  cursorColor,
  normalizePointer,
  removeShape,
  snapshotShapes,
  updateShape,
} from "../collabShapes";
import type { PenShape, RectShape, WhiteboardShape } from "../types";

/** 模拟桥的远端 apply origin（协作桥用内部 Symbol 标记远端事务，撤销栈据此过滤） */
const REMOTE_ORIGIN = Symbol("test-remote");

/** 双 doc 直连：一端事务产生的 update 以远端 origin apply 到对端（等价协作桥的回环防护语义） */
const connectDocs = (a: Y.Doc, b: Y.Doc): void => {
  a.on("update", (update) => Y.applyUpdate(b, update, REMOTE_ORIGIN));
  b.on("update", (update) => Y.applyUpdate(a, update, REMOTE_ORIGIN));
};

const pen = (id: string, points: number[]): PenShape => ({
  id,
  type: "pen",
  penType: "pen",
  color: "#fff",
  size: 4,
  points,
});

const rect = (id: string): RectShape => ({
  id,
  type: "rect",
  color: "#fff",
  size: 4,
  x: 0,
  y: 0,
  width: 10,
  height: 10,
});

describe("collabShapes / id", () => {
  it("批量生成唯一，且保持既有前缀格式", () => {
    const ids = Array.from({ length: 1000 }, () => createShapeId());
    expect(new Set(ids).size).toBe(1000);
    expect(ids[0].startsWith("vauid-wb-")).toBe(true);
  });
});

describe("collabShapes / helpers", () => {
  it("add / remove / clear 按 id 操作 Y.Array", () => {
    const doc = new Y.Doc();
    const yShapes = doc.getArray<WhiteboardShape>(SHAPES_KEY);
    addShape(yShapes, pen("a", [0, 0, 1, 1]));
    addShape(yShapes, rect("b"));
    expect(yShapes.length).toBe(2);

    removeShape(yShapes, "a");
    expect(yShapes.length).toBe(1);
    expect(snapshotShapes(yShapes)[0].id).toBe("b");

    // 不存在的 id：忽略不抛错
    removeShape(yShapes, "nope");
    expect(yShapes.length).toBe(1);

    clearShapes(yShapes);
    expect(yShapes.length).toBe(0);
    clearShapes(yShapes); // 空数组重复清空安全
  });

  it("updateShape 按 id 定位替换，返回同引用时跳过写入", () => {
    const doc = new Y.Doc();
    const yShapes = doc.getArray<WhiteboardShape>(SHAPES_KEY);
    addShape(yShapes, pen("a", [0, 0]));
    addShape(yShapes, pen("b", [1, 1]));

    let updates = 0;
    yShapes.observe(() => {
      updates++;
    });

    updateShape(yShapes, "a", (s) =>
      s.type === "pen" ? { ...s, points: [...s.points, 2, 2] } : s,
    );
    const shapes = snapshotShapes(yShapes);
    expect(shapes[0]).toEqual(pen("a", [0, 0, 2, 2]));
    expect(shapes[1]).toEqual(pen("b", [1, 1])); // 其他形状不受影响

    // 同引用：不产生事务，不触发 observe
    const before = updates;
    updateShape(yShapes, "a", (s) => s);
    expect(updates).toBe(before);

    // 不存在的 id：忽略
    updateShape(yShapes, "nope", (s) => s);
    expect(updates).toBe(before);
  });
});

describe("collabShapes / 双端同步", () => {
  it("A 端 add/update/remove 经 update 流同步到 B 端，读到的数组一致", () => {
    const docA = new Y.Doc();
    const docB = new Y.Doc();
    connectDocs(docA, docB);
    const shapesA = docA.getArray<WhiteboardShape>(SHAPES_KEY);
    const shapesB = docB.getArray<WhiteboardShape>(SHAPES_KEY);

    addShape(shapesA, pen("a", [0, 0, 1, 1]));
    expect(snapshotShapes(shapesB)).toEqual(snapshotShapes(shapesA));

    updateShape(shapesA, "a", (s) =>
      s.type === "pen" ? { ...s, points: [...s.points, 5, 5] } : s,
    );
    expect(snapshotShapes(shapesB)).toEqual([pen("a", [0, 0, 1, 1, 5, 5])]);

    addShape(shapesA, rect("b"));
    removeShape(shapesA, "a");
    expect(snapshotShapes(shapesB)).toEqual([rect("b")]);

    // B 端反向操作同样可达 A 端
    removeShape(shapesB, "b");
    expect(shapesA.length).toBe(0);
  });

  it("离线并发写入，全量状态互通后两端收敛一致", () => {
    const docC = new Y.Doc();
    const docD = new Y.Doc();
    addShape(docC.getArray<WhiteboardShape>(SHAPES_KEY), pen("c", [1]));
    addShape(docD.getArray<WhiteboardShape>(SHAPES_KEY), pen("d", [2]));

    Y.applyUpdate(docC, Y.encodeStateAsUpdate(docD), REMOTE_ORIGIN);
    Y.applyUpdate(docD, Y.encodeStateAsUpdate(docC), REMOTE_ORIGIN);

    const jsonC = JSON.stringify(docC.getArray<WhiteboardShape>(SHAPES_KEY).toJSON());
    const jsonD = JSON.stringify(docD.getArray<WhiteboardShape>(SHAPES_KEY).toJSON());
    expect(jsonC).toBe(jsonD);
    expect(JSON.parse(jsonC)).toHaveLength(2);
  });
});

describe("collabShapes / UndoManager", () => {
  it("add 两形状 → undo 回退一项 → redo 恢复", () => {
    const doc = new Y.Doc();
    const yShapes = doc.getArray<WhiteboardShape>(SHAPES_KEY);
    // captureTimeout: 0 使两次写入各自成为独立撤销项（默认 500ms 会合并为一次）
    const um = createShapeUndoManager(yShapes, 0);

    addShape(yShapes, pen("a", [0, 0]));
    addShape(yShapes, pen("b", [1, 1]));
    expect(yShapes.length).toBe(2);

    um.undo();
    expect(yShapes.length).toBe(1);

    um.redo();
    expect(yShapes.length).toBe(2);
  });

  it("一笔画内的连续更新（add + 多次 update）合并为一个撤销项", () => {
    const doc = new Y.Doc();
    const yShapes = doc.getArray<WhiteboardShape>(SHAPES_KEY);
    const um = createShapeUndoManager(yShapes); // 默认 captureTimeout：同步连续写入合并

    addShape(yShapes, pen("a", [0, 0]));
    updateShape(yShapes, "a", (s) =>
      s.type === "pen" ? { ...s, points: [...s.points, 1, 1] } : s,
    );
    updateShape(yShapes, "a", (s) =>
      s.type === "pen" ? { ...s, points: [...s.points, 2, 2] } : s,
    );
    um.undo();
    expect(yShapes.length).toBe(0); // 整笔一起回退
  });

  it("远端事务不进入本端撤销栈：undo 只回退本端操作", () => {
    const docA = new Y.Doc();
    const docB = new Y.Doc();
    connectDocs(docA, docB);
    const shapesA = docA.getArray<WhiteboardShape>(SHAPES_KEY);
    const um = createShapeUndoManager(shapesA);

    addShape(shapesA, pen("a", [0, 0])); // 本端
    addShape(docB.getArray<WhiteboardShape>(SHAPES_KEY), pen("b", [1, 1])); // 远端（以 REMOTE_ORIGIN apply 到 A）
    expect(shapesA.length).toBe(2);
    expect(um.undoStack.length).toBe(1); // 远端写入未被跟踪

    um.undo();
    expect(shapesA.length).toBe(1);
    expect(snapshotShapes(shapesA)[0].id).toBe("b");
  });

  it("clear 可撤销：清空后 undo 恢复全部形状", () => {
    const doc = new Y.Doc();
    const yShapes = doc.getArray<WhiteboardShape>(SHAPES_KEY);
    const um = createShapeUndoManager(yShapes, 0);
    addShape(yShapes, pen("a", [0, 0]));
    addShape(yShapes, pen("b", [1, 1]));

    clearShapes(yShapes);
    expect(yShapes.length).toBe(0);

    um.undo();
    expect(yShapes.length).toBe(2);
  });
});

describe("collabShapes / 光标", () => {
  it("normalizePointer：像素坐标 → 0-1 归一化，零尺寸容器防护", () => {
    const rectBase = { left: 100, top: 50, width: 200, height: 100 };
    expect(normalizePointer(200, 100, rectBase)).toEqual({ x: 0.5, y: 0.5 });
    expect(normalizePointer(100, 50, rectBase)).toEqual({ x: 0, y: 0 });
    expect(normalizePointer(300, 150, rectBase)).toEqual({ x: 1, y: 1 });
    expect(normalizePointer(0, 0, { left: 0, top: 0, width: 0, height: 0 })).toEqual({
      x: 0,
      y: 0,
    });
  });

  it("cursorColor：clientID 确定性取色且落在调色板内", () => {
    expect(cursorColor(0)).toBe(cursorColor(0));
    expect(cursorColor(1)).not.toBe(cursorColor(0));
    expect(cursorColor(999)).toBe(cursorColor(999 % 6));
  });
});
